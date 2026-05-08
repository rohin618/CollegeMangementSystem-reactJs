import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Button, FormGroup, Modal, ModalBody, ModalHeader, ModalTitle,
    Input, Card, CardBody, Checks, Alert,
} from '../../../../../components/bootstrap';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { getAllResidentWithInvoice } from '../../../../../common/api/resident';
import { createInvoice, getAllInvoicesList, updateInvoice } from '../../../../../common/api/invoice';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import { DateTimePicker, ResidentProfileCard, SearchableSelect } from '../../../../../components/common';
import { creditWaletModel } from '../../../../../common/model/creditWalet';
import SimpleReactValidator from 'simple-react-validator';
import { PAYMENT_METHOD_LIST, INVOICE_TO_TYPE_LIST, CREDIT_TO_TYPE_LIST } from '../../../../../common/data/option';
import {
    generateUid, getLabelByValue, getResidentInvoiceAddress,
    getResidetByAllAvilableFundList, mergeArrayOfObjectUniqueByKey, priceFormat,
} from '../../../../../helpers/helpers';
import { CREDIT_TO, CREDIT_TYPE, FUND_SOURCE_TYPE, INVOICE_STATUS, INVOICE_TO_TYPE } from '../../../../../common/constant';
import moment from 'moment';
import { createCreditWallet, updateCreditWallet } from '../../../../../common/api/creditWalet';
import { useRefetchQueryList, useUpdateQueryListById } from '../../../../../hooks';
import { ICreditApply, ICreditWalletModel, IinvoiceCreditApply, IResidentModel } from '../../../../../common/interface';
import { IInvoiceDiscount } from '../../../../../common/interface/invoice';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface InvoicePayment {
    invoiceId: string;
    value: number;
    id?: string;
}

interface Props {
    isOpen?: boolean;
    residentData?: any | null;
    detailInvoiceInfo?: any | null;
    toggle?: () => void;
    advanceEditObject?: any;
    isFromApplyCredit?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers — ✅ discount applied pre-VAT
// ---------------------------------------------------------------------------

function getInvoiceDiscountTotal(invoice: any): number {
    const discounts: IInvoiceDiscount[] = invoice?.discounts ?? [];
    return discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
}

/**
 * ✅ Effective total for an invoice — discount applied pre-VAT.
 *
 * Priority:
 *  1. Use stored balanceDue (= discountedSubTotal + discountedVAT, pre-payment)
 *  2. Recalculate from subTotal/vatTotal proportionally
 *  3. Legacy fallback: totalPrice − discountTotal
 */
function getEffectiveTotal(invoice: any): number {
    if (invoice?.balanceDue != null && Number(invoice.balanceDue) > 0) {
        // ✅ balanceDue stored pre-payment — most accurate
        return Number(invoice.balanceDue);
    }

    const subTotal = Number(invoice?.subTotal || 0);
    const vatTotal = Number(invoice?.vatTotal || 0);
    const totalPrice = Number(invoice?.totalPrice || 0);
    const discTotal = getInvoiceDiscountTotal(invoice);

    if (subTotal > 0 && discTotal > 0) {
        // ✅ Apply discount on subTotal (ex VAT), recalc VAT proportionally
        const discountedSubTotal = Math.max(subTotal - discTotal, 0);
        const discountRatio = discountedSubTotal / subTotal;
        const discountedVat = +(vatTotal * discountRatio).toFixed(2);
        return +(discountedSubTotal + discountedVat).toFixed(2);
    }

    // Legacy fallback
    return Math.max(totalPrice - discTotal, 0);
}

/**
 * ✅ Amount still owed on an invoice — discount applied pre-VAT.
 * effectiveTotal (post-discount) minus credits and payments.
 */
function calcNeedToPay(invoice: any): number {
    const credits = (invoice.creditApply ?? []).reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
    const paid = (invoice.payedInfo ?? []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    return Math.max(getEffectiveTotal(invoice) - credits - paid, 0);
}

/** Distribute `amount` across invoices in order, respecting each invoice's open balance */
function buildDistributed(invoices: any[], amount: number, getNeedToPay: (inv: any) => number): InvoicePayment[] {
    let remaining = amount;
    return invoices.reduce<InvoicePayment[]>((acc, invoice) => {
        if (remaining <= 0) return acc;
        const applied = Math.min(remaining, getNeedToPay(invoice));
        if (applied > 0) {
            acc.push({ invoiceId: invoice.id, value: +applied.toFixed(2) });
            remaining -= applied;
        }
        return acc;
    }, []);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const AdvanceCreditForm: React.FC<Props> = ({
    isOpen = false,
    advanceEditObject = null,
    isFromApplyCredit = false,
    toggle = () => { },
}) => {
    const [formData, setFormData] = useState<ICreditWalletModel>({ ...creditWaletModel });
    const [isLoadingForm, setIsLoadingForm] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [invoicePayment, setInvoicePayment] = useState<InvoicePayment[]>([]);

    const validator = useRef(new SimpleReactValidator({ className: 'text-danger' }));

    const { miscellaneousList, fNCDetails, bankList, localAuthorityList, localICBList } = useMasterData();

    // -----------------------------------------------------------------------
    // Queries
    // -----------------------------------------------------------------------
    const { data: residentListWithInvoice = [], isLoading: isResidentListLoading } = useQuery({
        queryKey: ['residentListWithInvoice'],
        queryFn: getAllResidentWithInvoice,
    });

    const invoiceReq = useMemo(() => ({
        residentId: formData.residentId ?? '',
        statuses: [INVOICE_STATUS.PENDING, INVOICE_STATUS.PARTIAL],
        invoiceTo: +formData.creditTo,
        fundTypeId: formData.fundTypeId,
    }), [formData.residentId, formData.creditTo, formData.fundTypeId]);

    const {
        data: invoiceList = [],
        isLoading: isInvoiceListLoading,
        refetch: fetchInvoices,
    } = useQuery({
        queryKey: ['invoiceUpdateList', invoiceReq],
        queryFn: () => getAllInvoicesList(invoiceReq),
        enabled: false,
    });

    // -----------------------------------------------------------------------
    // Cache helpers
    // -----------------------------------------------------------------------
    const refetchCreditWalletListByCompanyId = useRefetchQueryList<any>(['creditWalletListByCompanyId', { isGroupByResident: true }]);
    const refetchInvoiceHistoryListByComapany = useRefetchQueryList<any>(['invoiceHistoryListByComapany']);
    const refetchResidentInvoiceList = useRefetchQueryList<any>(['invoiceList', formData.residentId]);



    // -----------------------------------------------------------------------
    // Derived state
    // -----------------------------------------------------------------------
    const selectedResident: IResidentModel | any = useMemo(
        () => residentListWithInvoice.find((r: any) => r.id === formData.residentId) ?? null,
        [residentListWithInvoice, formData.residentId],
    );

    const resdientAvialbleCreditToList: any[] = useMemo(
        () => (formData.residentId ? getResidetByAllAvilableFundList(selectedResident) ?? [] : []),
        [formData.residentId, selectedResident],
    );

    const creditToAginesFunfList: any[] = useMemo(() => {
        const creditTo = Number(formData.creditTo);
        if (!creditTo) return [];

        const fundInfo = resdientAvialbleCreditToList.find((fund: any) => {
            const val = fund?.value;
            if (Array.isArray(val)) return val.includes(creditTo);
            if (typeof val === 'string') return val.split(',').map((s: string) => Number(s.trim())).includes(creditTo);
            return val === creditTo;
        });

        const ids: string[] = Array.isArray(fundInfo?.fundTypeIds) ? fundInfo.fundTypeIds : [];
        if (!ids.length) return [];

        const sourceList =
            creditTo === INVOICE_TO_TYPE.CHC ? localICBList :
                creditTo === INVOICE_TO_TYPE.LA || creditTo === INVOICE_TO_TYPE.THIRD_PARTY_TOPUP ? localAuthorityList : [];

        return ids.map((id) => (sourceList as any[]).find((item) => item?.id === id)).filter(Boolean);
    }, [formData.creditTo, resdientAvialbleCreditToList, localICBList, localAuthorityList]);

    const getNeedToPay = useCallback((invoice: any) => calcNeedToPay(invoice), []);

    const totalInvoicePaid = useMemo(
        () => invoicePayment.reduce((sum, p) => sum + Number(p.value || 0), 0).toFixed(2),
        [invoicePayment],
    );

    // ✅ overallResidentBalance uses calcNeedToPay (discount-aware)
    const overallResidentBalance = useMemo(
        () => invoiceList.reduce((total: number, inv: any) => total + calcNeedToPay(inv), 0).toFixed(2),
        [invoiceList],
    );

    // -----------------------------------------------------------------------
    // Effects
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (advanceEditObject && isOpen) setFormData({ ...advanceEditObject });
    }, [advanceEditObject, isOpen]);

    useEffect(() => {
        if (!isOpen || !formData?.id || !invoiceList.length) return;
        const payInfo = invoiceList.flatMap((inv: any) =>
            (inv.creditApply ?? [])
                .filter((c: any) => c.creditWalletId === formData.id)
                .map((c: any) => ({ value: c.amount, invoiceId: inv.id, id: c?.id })),
        );
        setInvoicePayment(payInfo);
    }, [invoiceList, isOpen, formData?.id]);

    // useEffect(() => {
    //     setFormData((prev: any) => ({ ...prev, fundTypeId: '' }));
    //     validator.current.purgeFields();
    // }, [formData.creditTo]);

    useEffect(() => {
        if (!isOpen) {
            setFormData({ ...creditWaletModel });
            validator.current.hideMessages();
            setIsSubmitted(false);
            setInvoicePayment([]);
        }
    }, [isOpen]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleChangeInput = (event: any) => {
        const { name, value } = event.target;
        setFormData((prev: any) => ({ ...prev, [name]: value, ...(name === 'creditTo' ? { fundTypeId: '' } : {}), }));

        if (name === 'creditAmount') {
            const numeric = Number(value);
            if (numeric > 0 && invoiceList.length) {
                setInvoicePayment(buildDistributed(invoiceList, numeric, getNeedToPay));
            }
        }
    };

    const handleChangeReceivedPayment = useCallback(
        (invoiceId: string, inputValue: number) => {
            setInvoicePayment((prev) => {
                const allocatedElsewhere = prev
                    .filter((p) => p.invoiceId !== invoiceId)
                    .reduce((sum, p) => sum + Number(p.value || 0), 0);

                const remaining = Number(formData?.creditAmount || 0) - allocatedElsewhere;
                const invoice = invoiceList.find((inv: any) => inv.id === invoiceId);
                if (!invoice) return prev;

                // ✅ cap against discount-aware open balance
                const limited = Math.min(inputValue, remaining, getNeedToPay(invoice));
                const exists = prev.some((p) => p.invoiceId === invoiceId);

                return exists
                    ? prev.map((p) => (p.invoiceId === invoiceId ? { ...p, value: limited } : p))
                    : [...prev, { invoiceId, value: limited }];
            });
        },
        [invoiceList, formData?.creditAmount, getNeedToPay],
    );

    const handleCheckChange = (invoiceId: string) =>
        setInvoicePayment((prev) => prev.filter((p) => p.invoiceId !== invoiceId));

    const handleFindInvoice = async () => {
        setIsSubmitted(true);
        const needsFundType = +formData.creditTo === CREDIT_TO.CHC || +formData.creditTo === CREDIT_TO.LA;
        if (!formData.residentId || !formData.creditTo || (needsFundType && !formData.fundTypeId)) return;
        try {
            setIsLoadingForm(true);
            setInvoicePayment([]);
            await fetchInvoices();
        } finally {
            setIsLoadingForm(false);
        }
    };

    // -----------------------------------------------------------------------
    // Submit
    // -----------------------------------------------------------------------
    const handleFormSubmit = async () => {
        debugger
        setIsSubmitted(true);
        if (!validator.current.allValid()) {
            validator.current.showMessages();
            return;
        }

        const paymentId = generateUid();
        const creditAmount = Number(formData.creditAmount || 0);
        const applied = invoicePayment.filter((x) => x.value > 0);
        const totalUsed = applied.reduce((sum, x) => sum + Number(x.value || 0), 0);
        const balanceAmount = +(creditAmount - totalUsed).toFixed(2);

        const creditApply: ICreditApply[] = applied.map((inv) => ({
            invoiceId: inv.invoiceId,
            id: inv.id ?? generateUid(),
            amount: inv.value ?? 0,
        }));

        setIsLoadingForm(true);
        try {
            if (creditApply?.length > 0) {
                const reqCreditWallet: ICreditWalletModel = {
                    ...creditWaletModel,
                    ...formData,
                    // type: CREDIT_TYPE.ADVANCE_CREDIT,
                    paymentRefId: formData.id ? formData.paymentRefId : paymentId,
                    creditApply: formData.id
                        ? (mergeArrayOfObjectUniqueByKey(formData.creditApply, creditApply) as ICreditApply[])
                        : [],
                    creditAmount: formData.id ? Number(formData.creditAmount || 0) : balanceAmount,
                };

                const creditNotesAddress: any = getResidentInvoiceAddress(
                    selectedResident, +formData.creditTo, reqCreditWallet.fundTypeId,
                    { localAuthorityList, localICBList, fNCDetails },
                );

                const savedWallet = await (
                    reqCreditWallet.id
                        ? updateCreditWallet(reqCreditWallet.id, reqCreditWallet)
                        : createCreditWallet(reqCreditWallet, creditNotesAddress.shortName)
                );

                const updatedCreditWallets = reqCreditWallet.id
                    ? (selectedResident?.creditWallets ?? []).map((w: any) => (w.id === savedWallet.id ? savedWallet : w))
                    : [savedWallet, ...(selectedResident?.creditWallets ?? [])];

                refetchCreditWalletListByCompanyId.forceRefetch()
            }

            await submitInvoice(paymentId, creditApply);
        } catch (err) {
            console.error('Error while updating wallet', err);
        } finally {
            setIsLoadingForm(false);
        }
    };

    const submitInvoice = async (paymentId: string, appliedAmounts: ICreditApply[]) => {
        try {
            const creditApply: IinvoiceCreditApply[] = appliedAmounts.map((inv) => ({
                creditWalletId: formData.id,
                amount: inv.amount,
                id: inv.id,
            }));

            const updateJobs = invoiceList
                .filter((invoice: any) => appliedAmounts.some((x) => x.invoiceId === invoice.id))
                .map(async (invoice: any) => {
                    const payInfo = appliedAmounts.find((x) => x.invoiceId === invoice.id)!;

                    const payments = [...(invoice.payedInfo ?? [])];
                    if (!formData.id) {
                        const paymentDetail = {
                            id: paymentId,
                            amount: Number(payInfo.amount) || 0,
                            date: formData.date,
                            refNo: formData.refNo,
                            paymentMethod: formData.paymentMethod,
                            bankId: formData.bankId,
                        };
                        const first = payments[0];
                        const isPlaceholder = first && !first.date && !first.refNo && !first.paymentRef && !Number(first.amount);
                        if (isPlaceholder) payments[0] = paymentDetail;
                        else payments.push(paymentDetail);
                    }

                    const invoiceAddress: any = getResidentInvoiceAddress(
                        selectedResident, +formData.creditTo, invoice.fundTypeId,
                        { localAuthorityList, localICBList, fNCDetails },
                    );

                    const reqBody = {
                        ...invoice,
                        creditApply: formData.id
                            ? mergeArrayOfObjectUniqueByKey(formData.creditApply, creditApply)
                            : creditApply,
                        payedInfo: payments,
                    };

                    return invoice?.id
                        ? updateInvoice(invoice.id, reqBody)
                        : createInvoice(reqBody, invoiceAddress.shortName);
                });

            await Promise.all(updateJobs);

            validator.current.hideMessages();
            refetchInvoiceHistoryListByComapany?.forceRefetch();
            refetchResidentInvoiceList?.forceRefetch();
            setIsSubmitted(false);
            toggle();
        } catch (err) {
            console.error('Error while updating invoices', err);
        }
    };

    // -----------------------------------------------------------------------
    // Render helpers
    // -----------------------------------------------------------------------
    const hasMismatch = !(+totalInvoicePaid === +formData.creditAmount) || (+formData.creditAmount - +overallResidentBalance) > 0;

    const fundList = formData.creditTo === INVOICE_TO_TYPE.LA ? localAuthorityList : localICBList;



    interface CreditObject {
        creditTo: number;
        nameOfLa?: string;
        nameIbc?: string;
        fundTypeId?: string;
    }

    function filterResidentsByCredit(residents: any[], credit: any): any[] {
        if (!credit?.creditTo) return residents;

        const filtered = residents.filter((resident) => {
            const matchedFund = resident.fundDetails?.find((fund: any) => {

                // Map creditTo (INVOICE_TO_TYPE) → FUND_SOURCE_TYPE
                const fundSourceMap: Record<number, number> = {
                    [INVOICE_TO_TYPE.PRIVATE]: FUND_SOURCE_TYPE.PRIVATE,
                    [INVOICE_TO_TYPE.LA]: FUND_SOURCE_TYPE.LOCAL_AUTHORITY,
                    [INVOICE_TO_TYPE.THIRD_PARTY_TOPUP]: FUND_SOURCE_TYPE.LOCAL_AUTHORITY,
                    [INVOICE_TO_TYPE.CHC]: FUND_SOURCE_TYPE.CHC,
                };

                const expectedFundSource = fundSourceMap[Number(credit.creditTo)];
                if (!expectedFundSource) return false;

                // Step 1: fundSource must match mapped value
                if (Number(fund.fundSource) !== expectedFundSource) return false;

                // Step 2: Additional checks based on fund source type
                switch (expectedFundSource) {
                    case FUND_SOURCE_TYPE.LOCAL_AUTHORITY:
                        // If fundTypeId selected, match it; otherwise just fundSource match is enough
                        if (credit.fundTypeId) {
                            return fund.nameOfLa === credit.fundTypeId || fund.fundType === credit.fundTypeId;
                        }
                        return true;

                    case FUND_SOURCE_TYPE.CHC:
                        if (credit.fundTypeId) {
                            return fund.nameIbc === credit.fundTypeId || fund.fundType === credit.fundTypeId;
                        }
                        return true;

                    case FUND_SOURCE_TYPE.PRIVATE:
                        return true;

                    default:
                        return false;
                }
            });

            return !!matchedFund;
        });

        return filtered.length > 0 ? filtered : residents;
    }
    return (
        <Modal setIsOpen={toggle} isOpen={isOpen} fullScreen titleId="transfer-modal">
            <ModalHeader setIsOpen={toggle}>
                <ModalTitle id="transfer-modal">Add Payment</ModalTitle>
            </ModalHeader>

            <ModalBody>
                {/* ── Row 1: Resident / Credit To / Fund / Find ── */}
                <div className="row">
                    <div className="col-3">
                        <FormGroup id="residentId" label="Resident Name">
                            <SearchableSelect
                                isValid={validator.current.fieldValid('Select resident')}
                                isTouched={isSubmitted}
                                invalidFeedback={validator.current.message('Select resident', formData.residentId, 'required')}
                                name="residentId" id="residentId"
                                value={formData.residentId}
                                onChange={handleChangeInput}
                                isLoading={isResidentListLoading}
                                options={filterResidentsByCredit(residentListWithInvoice, formData)}
                                placeholder="Select Resident"
                                labelKey="personal.name" valueKey="id"
                                disabled={!!(isResidentListLoading || isFromApplyCredit && formData.residentId && advanceEditObject?.residentId)}
                                renderLabel={(r: any, i: number) => (
                                    <ResidentProfileCard resident={r} colorIndex={getColorNameWithIndex(i)} isNavigate={false} />
                                )}
                            />
                        </FormGroup>
                    </div>

                    <div className="col-3">
                        <FormGroup id="creditTo" label="Credit To">
                            <SearchableSelect
                                isValid={validator.current.fieldValid('credit To')}
                                isTouched={isSubmitted}
                                invalidFeedback={validator.current.message('credit To', formData.creditTo, 'required')}
                                name="creditTo" id="creditTo"
                                value={formData.creditTo}
                                onChange={handleChangeInput}
                                disabled={!formData.residentId || isResidentListLoading || isFromApplyCredit}
                                options={formData.residentId ? resdientAvialbleCreditToList : CREDIT_TO_TYPE_LIST}
                                placeholder="Select Credit To"
                            />
                        </FormGroup>
                    </div>
                    <div className="col-3">
                        <FormGroup id="fundTypeId" label="Fund Name">
                            <SearchableSelect
                                isValid={creditToAginesFunfList.length > 0 ? validator.current.fieldValid('fundTypeId') : true}
                                isTouched={isSubmitted}
                                invalidFeedback={creditToAginesFunfList.length > 0
                                    ? validator.current.message('fundTypeId', formData.fundTypeId, 'required') : ''}
                                name="fundTypeId" id="fundTypeId"
                                value={String(formData.fundTypeId ?? '')}
                                onChange={handleChangeInput}
                                disabled={!formData.creditTo || isFromApplyCredit}
                                placeholder="Select Fund Name"
                                options={formData.residentId ? creditToAginesFunfList : fundList}
                                valueKey="id" labelKey="name"
                            />
                        </FormGroup>
                    </div>

                    <div className="col-3">
                        <div className="row">
                            <div className="col-6">
                                <Button icon="Search" color="info" isLight className="mt-4"
                                    isLoading={isInvoiceListLoading} isDisable={isLoadingForm}
                                    onClick={handleFindInvoice}>
                                    Find Invoice
                                </Button>
                            </div>
                            <div className="col-6 text-end">
                                <h5 className="h5">Amount Received</h5>
                                <h2 className="fw-bold fs-3 mb-0">{priceFormat(Number(formData.creditAmount || 0))}</h2>
                                <h5 className="h5 mt-3">Customer Balance</h5>
                                <span className="fs-4">{priceFormat(overallResidentBalance)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Row 2: Payment Details ── */}
                <div className="row mb-4">
                    <div className="col-3">
                        <DateTimePicker
                            id="date" label="Payment Date" name="date"
                            maxDate={moment().format('YYYY-MM-DD')}
                            minDate={selectedResident?.admission?.admissionDate || ''}
                            value={formData.date}
                            onChange={handleChangeInput}
                            isValid={validator.current.fieldValid('Payment Date')}
                            isTouched={isSubmitted}
                            invalidFeedback={validator.current.message('Payment Date', formData.date, 'required')}
                            disabled={isFromApplyCredit}
                        />
                    </div>
                </div>

                <div className="row">
                    <div className="col-3">
                        <FormGroup id="paymentMethod" label="Payment Method">
                            <SearchableSelect
                                placeholder="Select Payment Method"
                                value={formData.paymentMethod} id="paymentMethod" name="paymentMethod"
                                onChange={handleChangeInput}
                                isValid={formData.type === CREDIT_TYPE.ADJUSTMENT_CREDIT || validator.current.fieldValid('Payment Method')}
                                isTouched={isSubmitted}
                                invalidFeedback={formData.type !== CREDIT_TYPE.ADJUSTMENT_CREDIT && validator.current.message('Payment Method', formData.paymentMethod, 'required')}
                                disabled={isFromApplyCredit}
                                options={PAYMENT_METHOD_LIST}
                            />
                        </FormGroup>
                    </div>

                    <div className="col-3">
                        <FormGroup id="refNo" label="Reference No.">
                            <Input type="text" name="refNo" value={formData.refNo} onChange={handleChangeInput} />
                        </FormGroup>
                    </div>

                    <div className="col-3">
                        <FormGroup id="bankId" label="Deposit To">
                            <SearchableSelect
                                placeholder="Select Deposit To"
                                value={formData.bankId} id="bankId" name="bankId"
                                disabled={isFromApplyCredit}
                                onChange={handleChangeInput}
                                isValid={formData.type === CREDIT_TYPE.ADJUSTMENT_CREDIT || validator.current.fieldValid('Deposit To')}
                                isTouched={isSubmitted}
                                invalidFeedback={formData.type !== CREDIT_TYPE.ADJUSTMENT_CREDIT && validator.current.message('Deposit To', formData.bankId, 'required')}
                                options={bankList} labelKey="bankName" valueKey="id"
                            />
                        </FormGroup>
                    </div>

                    <div className="col-3">
                        <FormGroup id="creditAmount" label="Amount Received">
                            <Input
                                type="number"
                                value={formData.creditAmount}
                                disabled={isFromApplyCredit}
                                name="creditAmount"
                                onChange={handleChangeInput}
                                isValid={validator.current.fieldValid('Amount Received')}
                                isTouched={!!formData.creditAmount}
                                invalidFeedback={validator.current.message('Amount Received', formData.creditAmount, 'required|numeric|min:0.1,num')}
                            />
                        </FormGroup>
                    </div>
                </div>

                {/* ── Outstanding Transactions Table ── */}
                <div className="row mt-5">
                    <div className="col-md-12 mb-4">
                        <h1>Outstanding Transaction</h1>
                    </div>

                    <div className="col-md-12">
                        {isInvoiceListLoading ? (
                            <div className="d-flex justify-content-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading invoices…</span>
                                </div>
                            </div>
                        ) : invoiceList.length === 0 ? (
                            <p className="text-center text-muted py-3">No pending or partial invoices found.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-modern table-hover mb-5">
                                    <thead>
                                        <tr>
                                            <th>Invoice No</th>
                                            <th>Invoice Date</th>
                                            <th>Invoice Period</th>
                                            <th>Fund Type</th>
                                            <th>Original Amount</th>
                                            {/* ✅ Discount column */}
                                            <th className="text-success">Discount</th>
                                            <th>Open Balance</th>
                                            <th>Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoiceList.map((invoice: any, i: number) => {
                                            const payment = invoicePayment.find((p) => p.invoiceId === invoice.id);
                                            const value = payment?.value ?? 0;
                                            const needToPay = getNeedToPay(invoice);
                                            const discTotal = getInvoiceDiscountTotal(invoice);
                                            const isChecked = Boolean(value);
                                            const isDisabled = !isChecked && +totalInvoicePaid >= +formData.creditAmount;

                                            return (
                                                <tr key={invoice.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                                <div className="ratio ratio-1x1 me-3" style={{ width: 40 }}>
                                                                    <Checks
                                                                        className="invoice-check mx-auto mt-2"
                                                                        disabled={!isChecked}
                                                                        onChange={() => isChecked && handleCheckChange(invoice.id)}
                                                                        checked={isChecked}
                                                                        color="success"
                                                                        ariaLabel="Select Invoice"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <div className="fs-6 fw-bold">{invoice?.residentData?.personal?.name}</div>
                                                                <div className="text-muted"><small>{invoice.code}</small></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{invoice.invoiceDate ? moment(invoice.invoiceDate).format('DD MMM YYYY') : ''}</td>
                                                    <td>{moment(invoice.sDate).format('DD MMM YYYY')} To {moment(invoice.eDate).format('DD MMM YYYY')}</td>
                                                    <td>{getLabelByValue(INVOICE_TO_TYPE_LIST, invoice?.invoiceTo) || '-'}</td>
                                                    <td>{priceFormat(invoice.totalPrice)}</td>
                                                    {/* ✅ Discount cell — pre-VAT discount */}
                                                    <td className="text-success">
                                                        {discTotal > 0 ? (
                                                            <span title={(invoice.discounts ?? [])
                                                                .map((d: IInvoiceDiscount) => `${d.code}: −${priceFormat(d.amount)}`)
                                                                .join('\n')}>
                                                                −{priceFormat(discTotal)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">—</span>
                                                        )}
                                                    </td>
                                                    {/* ✅ Open balance = discount-aware needToPay minus current payment input */}
                                                    <td>{priceFormat(Math.max(needToPay - value, 0))}</td>
                                                    <td>
                                                        <Input
                                                            type="number"
                                                            value={value}
                                                            disabled={isDisabled}
                                                            isValid={validator.current.fieldValid(`Payment-${i}`)}
                                                            isTouched={!!value}
                                                            invalidFeedback={validator.current.message(`Payment-${i}`, value, 'required|numeric|min:0,num')}
                                                            onChange={(e: any) => handleChangeReceivedPayment(invoice.id, Number(e.target.value) || 0)}
                                                            min={0}
                                                            max={needToPay}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Footer: Mismatch Alert + Actions ── */}
                {formData.creditAmount ? (
                    <div className="row sticky-bottom position-absolute w-100">
                        <div className="col-12 text-end">
                            <Card>
                                <CardBody>
                                    <div className="row">
                                        <div className="col-8 text-end">
                                            {hasMismatch && (
                                                <Alert icon="error" className="py-0 mb-0" isLight color="danger">
                                                    Resolved amount is £{totalInvoicePaid}, but you entered £{Number(formData.creditAmount).toFixed(2)}.
                                                    The remaining £{Math.abs(+formData.creditAmount - +totalInvoicePaid).toFixed(2)} will be saved to credit balance.
                                                </Alert>
                                            )}
                                        </div>
                                        <div className="col-4 text-end">
                                            <Button color="danger" className="me-2" isDisable={isLoadingForm} onClick={toggle}>
                                                Cancel
                                            </Button>
                                            <Button
                                                color="info"
                                                isLoading={isLoadingForm}
                                                isDisable={isLoadingForm || Number(totalInvoicePaid) > Number(formData.creditAmount)}
                                                onClick={handleFormSubmit}
                                            >
                                                Update
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                ) : null}
            </ModalBody>
        </Modal>
    );
};