// ─── InvoiceCreateAndUpdateForm.tsx ──────────────────────────────────────────
// Misc / Other invoice form — discount applied on sub-total (pre-VAT).

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    FormGroup,
    Input,
    Button,
    Card,
    CardBody,
    CardTitle,
    CardHeader,
    Badge,
    CardActions,
    Spinner,
    Textarea,
    Modal,
    ModalHeader,
    ModalTitle,
    ModalBody,
    ModalFooter,
} from '../../../../../components/bootstrap';
import {
    INVOICE_TO_TYPE,
    INVOICE_CATEGORY,
    INVOICE_TYPE,
    FUND_SOURCE_TYPE,
    DISCOUNT_TYPE,
} from '../../../../../common/constant';
import {
    priceFormat,
    getFundTypes,
    generateUid,
    getResidentInvoiceAddress,
    getResidetByAllAvilableFundList,
    mergeArrayOfObjectUniqueByKey,
    showAlert,
    getActiveFundDetails,
} from '../../../../../helpers/helpers';
import { invoiceModel }          from '../../../../../common/model/invoice';
import moment                    from 'moment';
import { useQuery }              from '@tanstack/react-query';
import { updateCreditWallet }    from '../../../../../common/api/creditWalet';
import { createInvoice, updateInvoice } from '../../../../../common/api/invoice';
import { getAllDiscounts }        from '../../../../../common/api/discount';
import SimpleReactValidator       from 'simple-react-validator';
import { useRefetchQueryList, useUpdateQueryListById } from '../../../../../hooks';
import { getColorNameWithIndex }  from '../../../../../common/data/enumColors';
import { getAllResidentWithInvoice, updateResidentFields } from '../../../../../common/api/resident';
import { useMasterData }         from '../../../../../contexts/mastersContext';
import {
    DateTimePicker,
    ResidentProfileCard,
    SearchableSelect,
} from '../../../../../components/common';
import { CreditWalletApplayCard } from '../../../resident/component';
import {
    ICreditApply,
    IInvoiceItem,
    IInvoiceModel,
    IResidentModel,
} from '../../../../../common/interface';
import { QUERY_KEY }             from '../../../../../common/constant';
import { IDiscountMaster, IInvoiceDiscount } from '../../../../../common/interface/invoice/invoiceform';
import { calcDiscountAmount } from '../../../../../helpers/invoice/invoiceform.helpers';
import { DiscountApplyCard } from '../../../resident/component/discountapplycard';



// ─── Helpers ──────────────────────────────────────────────────────────────────

const getVatAmount = (amount: number, vatRate: number): number => {
    try {
        return +((amount * vatRate) / (100 + vatRate)).toFixed(2);
    } catch {
        return 0;
    }
};

const emptyMiscItem = (): IInvoiceItem => ({
    id             : generateUid(),
    category       : INVOICE_CATEGORY.MISC,
    description    : '',
    miscellaneousId: '',
    qty            : 1,
    weekPrice      : 0,
    amount         : 0,
    vatId          : '',
    vatRate        : 0,
    vatAmount      : 0,
    period         : { from: '', to: '' },
});

const emptyFormData = () => ({
    ...invoiceModel,
    items   : [emptyMiscItem()],
    discounts: [] as IInvoiceDiscount[],
    notes   : '',
});

// ─── Component ────────────────────────────────────────────────────────────────

export const InvoiceCreateAndUpdateForm = ({
    isOpen,
    toggle,
    invoiceList       = [],
    invoiceEditObject = null,
}: any) => {
    const [creditWalletAddInvoice, setCreditWalletAddInvoice] = useState<any[]>([]);
    const [creditWalletInput,      setCreditWalletInput]      = useState<any[]>([]);
    const [formData,               setFormData]               = useState<any>(emptyFormData());
    const [isLoadingForm,          setIsLoadingForm]          = useState(false);
    const [isSubmitted,            setIsSubmitted]            = useState(false);

    const validator = useRef(new SimpleReactValidator({ className: 'text-danger' }));

    const {
        miscellaneousList = [],
        localAuthorityList = [],
        vatList            = [],
        localICBList       = [],
        fNCDetails         = {},
        dueDateList        = [],
        isLoading: isMasterLoading,
    } = useMasterData();

    // ── Discount master ───────────────────────────────────────────────────────
    const {
        data: discountList = [] as IDiscountMaster[],
        isLoading: isDiscountLoading,
    } = useQuery<IDiscountMaster[]>({
        queryKey : [QUERY_KEY.DISCOUNT_LIST],
        queryFn  : getAllDiscounts,
        staleTime: 5 * 60 * 1000,
    });

    // ── Resident list ─────────────────────────────────────────────────────────
    const {
        data: residentListWithInvoice = [],
        isLoading: isResidentListLoading,
    } = useQuery({
        queryKey: ['residentListWithInvoice'],
        queryFn : getAllResidentWithInvoice,
    });

    const updateInvoiceListByCompanyList  = useUpdateQueryListById<any>(['invoiceListByCompany']);
    const updateResidentListWithInvoice   = useUpdateQueryListById<any>(['residentListWithInvoice']);
        const reFetchInvoiceListOfResident = useRefetchQueryList<any>(["invoiceList", formData.residentId]);

    // ── Populate on edit / reset on close ────────────────────────────────────
    useEffect(() => {
        if (!isOpen) {
            setFormData(emptyFormData());
            setCreditWalletAddInvoice([]);
            setCreditWalletInput([]);
            setIsSubmitted(false);
            return;
        }
        if (invoiceEditObject) {
            setFormData({
                ...invoiceEditObject,
                discounts: (invoiceEditObject.discounts ?? []) as IInvoiceDiscount[],
            });
        }
    }, [invoiceEditObject, isOpen]);

    // ── Reset fundTypeId when invoiceTo changes ───────────────────────────────
    useEffect(() => {
        setFormData((prev: any) => ({ ...prev, fundTypeId: '' }));
        validator.current.purgeFields();
    }, [formData.invoiceTo]);

    // ── Derived resident + address ────────────────────────────────────────────
    const selectedResidentData: IResidentModel | any = useMemo(
        () => residentListWithInvoice.find((r: any) => r.id === formData.residentId) ?? null,
        [residentListWithInvoice, formData.residentId]
    );

    const invoiceAddress: any = useMemo(
        () => getResidentInvoiceAddress(
            selectedResidentData,
            +formData?.invoiceTo,
            formData?.fundTypeId,
            { localAuthorityList, localICBList, fNCDetails }
        ),
        [selectedResidentData, formData.invoiceTo, formData.fundTypeId, localAuthorityList, localICBList, fNCDetails]
    );

    // ── Available invoice-to options ──────────────────────────────────────────
    const resdientAvialbleInvoiceToList: any[] = useMemo(() => {
        if (!formData.residentId) return [];
        return getResidetByAllAvilableFundList(selectedResidentData) ?? [];
    }, [formData.residentId, residentListWithInvoice]);

    // ── Fund list per invoiceTo ───────────────────────────────────────────────
    const invoiceToFundList: any[] = useMemo(() => {
        const invoiceTo:any = Number(formData.invoiceTo);
        if (!invoiceTo) return [];

        const fundInfo: any = resdientAvialbleInvoiceToList?.find((fund: any) => {
            const val = fund?.value;
            if (Array.isArray(val)) return val.includes(invoiceTo);
            if (typeof val === 'string')
                return val.split(',').map((s: string) => Number(s.trim())).includes(invoiceTo);
            return val === invoiceTo;
        });

        const ids: string[] = Array.isArray(fundInfo?.fundTypeIds) ? fundInfo.fundTypeIds : [];
        if (!ids.length) return [];

        const sourceList =
            invoiceTo === INVOICE_TO_TYPE.CHC
                ? localICBList
                : [INVOICE_TO_TYPE.LA, INVOICE_TO_TYPE.THIRD_PARTY_TOPUP].includes(invoiceTo)
                    ? localAuthorityList
                    : [];

        return ids.map((id) => (sourceList as any[]).find((item: any) => item?.id === id)).filter(Boolean);
    }, [formData.invoiceTo, resdientAvialbleInvoiceToList, localICBList, localAuthorityList]);

    // ── Deposit invoice guard ─────────────────────────────────────────────────
    const isDepositeInvoice = useMemo(
        () => !!formData?.items?.find((item: any) => item?.miscellaneousId === 'D1001'),
        [formData.items]
    );

    const canAddItem = formData.items.every(
        (item: any) =>
            item.miscellaneousId?.trim() &&
            item.period?.from?.trim() &&
            item.description?.trim() &&
            item.vatId?.trim() &&
            Number(item.amount) > 0
    );

    // ── Computed totals ───────────────────────────────────────────────────────
    // ✅ CHANGED: discount is now applied on subTotal (pre-VAT), then VAT is re-added to get balanceDue
    const totals = useMemo(() => {
        const gross    = formData.items.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
        const vatTotal = formData.items.reduce((s: number, i: any) => s + getVatAmount(Number(i.amount), Number(i.vatRate)), 0);
        const subTotal  = +(gross - vatTotal).toFixed(2);
        const discTotal = (formData.discounts ?? []).reduce((s: number, d: IInvoiceDiscount) => s + (Number(d.amount) || 0), 0);

        // Discounted sub total (ex VAT)
        const discountedSubTotal = +Math.max(subTotal - discTotal, 0).toFixed(2);

        // Re-apply VAT proportionally on the discounted sub total
        const discountRatio  = subTotal > 0 ? discountedSubTotal / subTotal : 1;
        const discountedVat  = +(vatTotal * discountRatio).toFixed(2);

        // Balance Due = discounted sub total + VAT recalculated on discounted amount
        const balanceDue = +(discountedSubTotal + discountedVat).toFixed(2);

        return {
            gross            : +gross.toFixed(2),
            vatTotal         : +vatTotal.toFixed(2),
            subTotal,
            discTotal        : +discTotal.toFixed(2),
            discountedSubTotal,
            discountedVat,
            balanceDue,
        };
    }, [formData.items, formData.discounts]);

    // ─────────────────────────────────────────────────────────────────────────
    // FIELD CHANGE
    // ─────────────────────────────────────────────────────────────────────────

    const handleChange = (e: any) => {
        const { id, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [id]: id === 'invoiceTo' ? Number(value) : value,
            ...(id === 'residentId' && { invoiceTo: '', fundTypeId: '' }),
            ...(id === 'invoiceTo'  && { fundTypeId: '' }),
        }));
    };

    // ─────────────────────────────────────────────────────────────────────────
    // MISC ITEM HANDLERS
    // ─────────────────────────────────────────────────────────────────────────

    const handleAddMiscellaneous = () => {
        setFormData((prev: any) => ({ ...prev, items: [...prev.items, emptyMiscItem()] }));
    };

    const handleMiscellaneousChange = (itemId: string, field: string, value: any) => {
        setFormData((prev: any) => {
            const items = prev.items.map((item: any) => {
                if (item.id !== itemId || item.category !== INVOICE_CATEGORY.MISC) return item;

                let u = { ...item };

                if (field === 'amount') {
                    u.amount = +(Number(value) || 0);
                } else if (['weekPrice', 'qty'].includes(field)) {
                    u[field] = Number(value) || 0;
                } else if (field === 'vatId') {
                    const vat  = vatList.find((v: any) => v.id === value);
                    u.vatId    = value;
                    u.vatRate  = Number(vat?.rate || 0);
                    u.vatAmount = getVatAmount(u.amount, u.vatRate);
                } else if (typeof value === 'object' && !Array.isArray(value)) {
                    u[field] = { ...u[field], ...value };
                } else {
                    u[field] = value;
                }

                return u;
            });

            // ✅ CHANGED: recalc % discounts using subTotal (pre-VAT) as the base
            const grossAmt = items.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
            const vatAmt   = items.reduce((s: number, i: any) => s + getVatAmount(Number(i.amount), Number(i.vatRate)), 0);
            const newBase  = +(grossAmt - vatAmt).toFixed(2); // pre-VAT base for discount recalculation

            const discounts = (prev.discounts ?? []).map((d: IInvoiceDiscount) => {
                const master = (discountList as IDiscountMaster[]).find(m => m.id === d.discountId);
                return master ? { ...d, amount: calcDiscountAmount(master, newBase) } : d;
            });

            return { ...prev, items, discounts };
        });
    };

    const handleDeleteMiscellaneous = (itemId: string) => {
        setFormData((prev: any) => ({
            ...prev,
            items: prev.items.filter(
                (item: any) => !(item.id === itemId && item.category === INVOICE_CATEGORY.MISC)
            ),
        }));
        validator.current.purgeFields();
    };

    // ─────────────────────────────────────────────────────────────────────────
    // DISCOUNT HANDLERS
    // ─────────────────────────────────────────────────────────────────────────

    const handleApplyDiscount = (discount: IInvoiceDiscount) => {
        setFormData((prev: any) => {
            const discounts = [...(prev.discounts ?? []), discount];
            const discTotal = discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
            // ✅ CHANGED: balance = (subTotal - discount) + VAT
            const discountedSubTotal = Math.max(totals.subTotal - discTotal, 0);
            const discountRatio      = totals.subTotal > 0 ? discountedSubTotal / totals.subTotal : 1;
            const discountedVat      = +(totals.vatTotal * discountRatio).toFixed(2);
            return {
                ...prev,
                discounts,
                balanceDue: +(discountedSubTotal + discountedVat).toFixed(2),
            };
        });
    };

    const handleRemoveDiscount = (discountId: string) => {
        setFormData((prev: any) => {
            const discounts = (prev.discounts ?? []).filter((d: IInvoiceDiscount) => d.discountId !== discountId);
            const discTotal = discounts.reduce((s: number, d: IInvoiceDiscount) => s + (Number(d.amount) || 0), 0);
            // ✅ CHANGED: balance = (subTotal - discount) + VAT
            const discountedSubTotal = Math.max(totals.subTotal - discTotal, 0);
            const discountRatio      = totals.subTotal > 0 ? discountedSubTotal / totals.subTotal : 1;
            const discountedVat      = +(totals.vatTotal * discountRatio).toFixed(2);
            return {
                ...prev,
                discounts,
                balanceDue: +(discountedSubTotal + discountedVat).toFixed(2),
            };
        });
    };

    // ─────────────────────────────────────────────────────────────────────────
    // CREDIT WALLET HANDLERS
    // ─────────────────────────────────────────────────────────────────────────

    const handleCreditWalletInputChange = (
        id: string, value: string, creditTo: number, code: string, fundTypeId: string
    ) => {
        setCreditWalletInput(prev =>
            prev.some((x: any) => x.id === id)
                ? prev.map((x: any) => x.id === id ? { ...x, amount: Number(value), creditTo, code } : x)
                : [...prev, { id, amount: Number(value), creditTo, code }]
        );
    };

    const handleApplyWallet = (id: string, code: string) => {
        const entry = creditWalletInput.find((x: any) => x.id === id);
        if (!entry) return;

        const creditApplied = (creditWalletAddInvoice ?? []).reduce(
            (s: number, { amount = 0 }: any) => s + Number(amount), 0
        );
        const invoiceAmount = (formData.items ?? []).reduce(
            (s: number, { amount = 0 }: any) => s + Number(amount), 0
        );

        if (creditApplied + Number(entry?.amount || 0) > invoiceAmount) {
            showAlert({
                title: 'Credit Limit Exceeded',
                text : `Total credit cannot exceed invoice amount (${priceFormat(invoiceAmount)}).`,
                icon : 'warning',
            });
            return;
        }

        setCreditWalletAddInvoice(prev => [...prev, entry]);
        setCreditWalletInput([]);
        validator.current.purgeFields();
    };

    const handleRemoveCredit = (i: number) => {
        setCreditWalletAddInvoice(prev => prev.filter((_: any, idx: number) => idx !== i));
    };

    // ── Credit wallet computed ────────────────────────────────────────────────
    const updatedWallets = useMemo(() => {
        if (!selectedResidentData?.creditWallets) return [];

        const withInvoices = selectedResidentData.creditWallets.map((wallet: any) => {
            const used  = (creditWalletAddInvoice ?? [])
                .filter(({ id }: any) => id === wallet.id)
                .reduce((s: number, { amount = 0 }: any) => s + Number(amount), 0);
            const avail = (wallet?.creditApply ?? []).reduce(
                (s: number, { amount }: any) => s + Number(amount || 0), 0
            );
            return {
                ...wallet,
                creditAmountUsed: wallet.creditAmount - avail - used,
            };
        });

        const grouped = withInvoices.reduce((acc: Record<string, any[]>, wallet: any) => {
            const creditTo   = Number(wallet.creditTo);
            const fundTypeId = String(wallet.fundTypeId);
            if (Number(formData.invoiceTo) !== creditTo || String(formData.fundTypeId) !== fundTypeId)
                return acc;
            const key = `${creditTo}|${fundTypeId}`;
            acc[key]  = [...(acc[key] ?? []), wallet];
            return acc;
        }, {});

        return Object.entries(grouped).map(([key, wallets]) => {
            const [creditTo, fundTypeId] = key.split('|');
            return { creditTo: Number(creditTo), fundTypeId, wallets: wallets as any[] };
        });
    }, [selectedResidentData, creditWalletAddInvoice, formData.invoiceTo, formData.fundTypeId]);

    // ─────────────────────────────────────────────────────────────────────────
    // SUBMIT
    // ─────────────────────────────────────────────────────────────────────────

    const handleFormSubmit = async () => {
        try {
            setIsSubmitted(true);
            if (!validator.current.allValid()) {
                validator.current.showMessages();
                return;
            }

            const { id, invoiceTo, dueDay, code, invoiceDate } = formData;
            const residentData: any = residentListWithInvoice?.find(
                ({ id: rid }: any) => rid === formData.residentId
            );

            // Deposit guard
            if (
                residentData?.depositInvoiceId &&
                !id &&
                isDepositeInvoice &&
                formData?.invoiceTo === INVOICE_TO_TYPE.PRIVATE
            ) {
                showAlert({
                    icon : 'info',
                    title: 'Deposit Invoice Already Exists',
                    text : 'A deposit invoice has already been generated for this resident.',
                    confirmButtonText: 'OK',
                });
                return;
            }

            const { fundSource, fundType, incontStatus, fncStatus } = getFundTypes(residentData) || {};

            // Credit apply
            const creditApply = creditWalletAddInvoice
                .filter(({ creditTo }: any) => +creditTo === +invoiceTo)
                .map(({ id, amount }: any) => ({
                    id            : generateUid(),
                    creditWalletId: id,
                    amount        : Number(amount) || 0,
                }));

            // Recalculate items with vatAmount
            let subTotal = 0;
            let vatTotal = 0;
            const cleanedItems = formData.items.map((item: IInvoiceItem) => {
                const vatAmount = getVatAmount(item.amount, item.vatRate);
                const netAmount = item.amount - vatAmount;
                subTotal += netAmount;
                vatTotal += vatAmount;
                return { ...item, vatAmount, netAmount };
            });
            const totalPrice = +(subTotal + vatTotal).toFixed(2);

            // ✅ CHANGED: Discount totals — applied on subTotal (pre-VAT), VAT re-added to get balanceDue
            const discounts  = (formData.discounts ?? []) as IInvoiceDiscount[];
            const discTotal  = discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
            const discountedSubTotal = Math.max(subTotal - discTotal, 0);
            const discountRatio      = subTotal > 0 ? discountedSubTotal / subTotal : 1;
            const discountedVat      = +(vatTotal * discountRatio).toFixed(2);
            const balanceDue         = +(discountedSubTotal + discountedVat).toFixed(2);

            const reqData: IInvoiceModel = {
                ...formData,
                items      : cleanedItems,
                type       : isDepositeInvoice ? INVOICE_TYPE.DEPOSIT : INVOICE_TYPE.OTHER,
                sDate      : moment(invoiceDate).format('YYYY-MM-DD'),
                eDate      : moment(invoiceDate).format('YYYY-MM-DD'),
                dueDay,
                code       : id ? code : '',
                creditApply,
                roomId     : residentData?.roomId,
                bedId      : residentData?.bedId,
                // fundSource,
                // fncStatus,
                // incontStatus,
                // fundType,
                residentId : residentData?.id,
                subTotal   : +subTotal.toFixed(2),
                vatTotal   : +vatTotal.toFixed(2),
                totalPrice,
                // ── Discount fields ──────────────────────────────────────────
                discounts  : discounts.map(d => ({
                    discountId: d.discountId,
                    code      : d.code,
                    name      : d.name,
                    type      : d.type,
                    value     : d.value,
                    amount    : d.amount,
                })),
                balanceDue,
                notes      : formData.notes ?? '',
            };

            const invoiceAddress: any = getResidentInvoiceAddress(
                residentData, +formData?.invoiceTo, formData?.fundTypeId,
                { localAuthorityList, localICBList, fNCDetails }
            );

            setIsLoadingForm(true);

            const res = id
                ? await updateInvoice(id, reqData)
                : await createInvoice(reqData, invoiceAddress?.shortName);

            updateInvoiceListByCompanyList({ ...res, residentData });
            reFetchInvoiceListOfResident.forceRefetch()

            // Deposit id update
            const activeFund = getActiveFundDetails(residentData?.fundDetails);
            if (
                activeFund?.fundSource === FUND_SOURCE_TYPE.PRIVATE &&
                !id &&
                isDepositeInvoice &&
                formData.invoiceTo === INVOICE_TO_TYPE.PRIVATE
            ) {
                await updateResidentFields(residentData.id, { depositInvoiceId: res?.id || '' });
                updateResidentListWithInvoice({ ...residentData, depositInvoiceId: res?.id || '' });
            }

            if (!res?.id || creditApply.length === 0) { toggle(); return; }

            // Credit wallet updates
            const walletPromises = (residentData?.creditWallets ?? []).map((wallet: any) => {
                const appliedCredits: ICreditApply[] = creditApply
                    .filter(({ creditWalletId }: any) => creditWalletId === wallet.id)
                    .map(({ id, amount }: any) => ({ invoiceId: res.id, id, amount: Number(amount) }));
                if (!appliedCredits.length) return null;
                return updateCreditWallet(wallet.id, {
                    ...wallet,
                    creditAmount: wallet.creditAmount,
                    creditApply : wallet.id
                        ? mergeArrayOfObjectUniqueByKey(wallet.creditApply, creditApply)
                        : [],
                });
            }).filter(Boolean);

            await Promise.all(walletPromises);
            toggle();
        } catch (err) {
            console.error('Error generating invoice:', err);
        } finally {
            setIsLoadingForm(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    const needsFundTypeId = [
        INVOICE_TO_TYPE.LA,
        INVOICE_TO_TYPE.CHC,
        INVOICE_TO_TYPE.THIRD_PARTY_TOPUP,
    ].includes(formData.invoiceTo);

    return (
        <Modal setIsOpen={() => {}} isOpen={isOpen} fullScreen titleId="transfer-modal" id="invoiceUpdate">
            <ModalHeader setIsOpen={toggle}>
                <ModalTitle id="transfer-modal">Misc Invoice / Others</ModalTitle>
            </ModalHeader>

            <ModalBody>
                {isMasterLoading ? <Spinner /> : (
                    <>
                        {/* ── Header fields ─────────────────────────────────── */}
                        <div className="row g-3">
                            {/* Resident */}
                            <div className="col-3">
                                <FormGroup id="residentId" label="Resident Name">
                                    <SearchableSelect
                                        isValid={validator.current.fieldValid('Select resident')}
                                        isTouched={isSubmitted}
                                        invalidFeedback={validator.current.message('Select resident', formData.residentId, 'required')}
                                        name="residentId"
                                        id="residentId"
                                        value={formData.residentId}
                                        onChange={handleChange}
                                        isLoading={isResidentListLoading}
                                        options={residentListWithInvoice}
                                        placeholder="Select Resident"
                                        labelKey="personal.name"
                                        valueKey="id"
                                        renderLabel={(r: any, i: number) => (
                                            <ResidentProfileCard resident={r} colorIndex={getColorNameWithIndex(i)} isNavigate={false}/>
                                        )}
                                    />
                                </FormGroup>
                            </div>

                            {/* Invoice date */}
                            <div className="col-3">
                                <DateTimePicker
                                    id="invoiceDate"
                                    label="Invoice Raised Date"
                                    minDate={selectedResidentData?.admission?.admissionDate}
                                    value={formData.invoiceDate}
                                    onChange={handleChange}
                                    isValid={validator.current.fieldValid('Invoice Raised Date')}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message('Invoice Raised Date', formData.invoiceDate, 'required')}
                                />
                            </div>

                            {/* Due day */}
                            <div className="col-3">
                                <FormGroup id="dueDay" label="Invoice Due Day">
                                    <SearchableSelect
                                        placeholder="Select Invoice Due Day"
                                        value={formData.dueDay}
                                        id="dueDay"
                                        onChange={handleChange}
                                        isValid={validator.current.fieldValid('Due Day')}
                                        isTouched={isSubmitted}
                                        invalidFeedback={validator.current.message('Due Day', formData.dueDay, 'required')}
                                        isLoading={isMasterLoading}
                                        options={dueDateList}
                                        labelKey="name"
                                        valueKey="day"
                                    />
                                </FormGroup>
                            </div>

                            {/* Invoice to */}
                            <div className="col-3">
                                <FormGroup id="invoiceTo" label="Invoice To">
                                    <SearchableSelect
                                        id="invoiceTo"
                                        value={formData.invoiceTo}
                                        onChange={handleChange}
                                        isValid={validator.current.fieldValid('Invoice To')}
                                        isTouched={isSubmitted}
                                        invalidFeedback={validator.current.message('Invoice To', formData.invoiceTo, 'required')}
                                        options={resdientAvialbleInvoiceToList}
                                        placeholder="Select Invoice To"
                                    />
                                </FormGroup>
                            </div>

                            {/* Fund type (conditional) */}
                            {needsFundTypeId && (
                                <div className="col-3">
                                    <FormGroup id="fundTypeId" label="Fund Name">
                                        <SearchableSelect
                                            isValid={invoiceToFundList?.length > 0 ? validator.current.fieldValid('fundTypeId') : true}
                                            isTouched={isSubmitted}
                                            invalidFeedback={invoiceToFundList?.length > 0 ? validator.current.message('fundTypeId', formData.fundTypeId, 'required') : ''}
                                            id="fundTypeId"
                                            name="fundTypeId"
                                            value={formData.fundTypeId ?? ''}
                                            onChange={handleChange}
                                            disabled={!formData.invoiceTo}
                                            options={invoiceToFundList}
                                            labelKey="name"
                                            valueKey="id"
                                            placeholder="Select Fund Name"
                                        />
                                    </FormGroup>
                                </div>
                            )}

                            {/* Notes */}
                            <div className="col-3">
                                <FormGroup id="notes" label="Notes">
                                    <Textarea
                                        rows={3}
                                        id="notes"
                                        placeholder="Enter Notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </div>
                        </div>

                        {/* ── Items table ──────────────────────────────────── */}
                        <div className="row mt-4">
                            <div className="col-12">
                                <Card shadow="none" className="border">
                                    <CardHeader>
                                        <CardTitle>
                                            <Badge isLight color="success" className="px-3 py-3" borderSize={2}>
                                                Others {invoiceAddress?.shortName}
                                            </Badge>
                                        </CardTitle>
                                        <CardActions>
                                            <Button
                                                isLight
                                                icon="Add"
                                                color="dark"
                                                isDisable={isDepositeInvoice || !canAddItem}
                                                onClick={handleAddMiscellaneous}
                                            >
                                                Add Miscellaneous
                                            </Button>
                                        </CardActions>
                                    </CardHeader>

                                    <CardBody>
                                        <div className="table-responsive" style={{overflow: 'visible'}}>
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Miscellaneous</th>
                                                        <th className="wpx-250">Start Date</th>
                                                        <th className="wpx-250">End Date</th>
                                                        <th className="wpx-350">Description</th>
                                                        <th>VAT</th>
                                                        <th className="text-end wpx-150">Amount</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {formData.items.map((item: any, i: number) => {
                                                        const isInvoiceReady = !!invoiceAddress?.shortName;
                                                        const label          = `Miscellaneous ${invoiceAddress?.shortName ?? ''} ${i}`;

                                                        return (
                                                            <tr key={item.id} className="align-middle">
                                                                {/* Miscellaneous select */}
                                                                <td className="wpx-212">
                                                                    <SearchableSelect
                                                                        isValid={isInvoiceReady && validator.current.fieldValid(label)}
                                                                        isTouched={isSubmitted && isInvoiceReady}
                                                                        invalidFeedback={isInvoiceReady ? validator.current.message(label, item.miscellaneousId, 'required') : ''}
                                                                        onChange={(e: any) => handleMiscellaneousChange(item.id, 'miscellaneousId', e.target.value)}
                                                                        name="miscellaneousId"
                                                                        value={item.miscellaneousId}
                                                                        isLoading={isMasterLoading}
                                                                        options={
                                                                            selectedResidentData?.depositInvoiceId
                                                                                ? miscellaneousList?.filter((m: any) => m.code !== 'D1001')
                                                                                : miscellaneousList
                                                                        }
                                                                        placeholder="Select Miscellaneous"
                                                                        labelKey="name"
                                                                        valueKey="id"
                                                                    />
                                                                </td>

                                                                {/* Start date */}
                                                                <td>
                                                                    <DateTimePicker
                                                                        value={item.period?.from || ''}
                                                                        onChange={(e: any) => handleMiscellaneousChange(item.id, 'period', { ...item.period, from: e.target.value })}
                                                                        minDate={selectedResidentData?.admission?.admissionDate}
                                                                        isValid={validator.current.fieldValid('Date' + i)}
                                                                        isTouched={isSubmitted}
                                                                        invalidFeedback={validator.current.message('Date-' + i, item.period?.from, 'required')}
                                                                    />
                                                                </td>

                                                                {/* End date */}
                                                                <td>
                                                                    <DateTimePicker
                                                                        value={item.period?.to || ''}
                                                                        onChange={(e: any) => handleMiscellaneousChange(item.id, 'period', { ...item.period, to: e.target.value })}
                                                                        minDate={selectedResidentData?.admission?.admissionDate}
                                                                    />
                                                                </td>

                                                                {/* Description */}
                                                                <td>
                                                                    <Textarea
                                                                        value={item.description || ''}
                                                                        onChange={(e: any) => handleMiscellaneousChange(item.id, 'description', e.target.value)}
                                                                        className="shadow-none"
                                                                        isValid={validator.current.fieldValid('description' + i)}
                                                                        isTouched={isSubmitted}
                                                                        invalidFeedback={validator.current.message('description -' + i, item.description, 'required')}
                                                                    />
                                                                </td>

                                                                {/* VAT */}
                                                                <td>
                                                                    <SearchableSelect
                                                                        isValid={validator.current.fieldValid('vat Rate')}
                                                                        isTouched={isSubmitted}
                                                                        invalidFeedback={validator.current.message('vat Rate', item.vatId, 'required')}
                                                                        name="vatId"
                                                                        value={item.vatId ?? ''}
                                                                        onChange={(e: any) => handleMiscellaneousChange(item.id, 'vatId', e.target.value)}
                                                                        disabled={!item.miscellaneousId}
                                                                        labelKey="rate"
                                                                        options={vatList}
                                                                        valueKey="id"
                                                                        renderLabel={(vat: any) => `${Number(vat.rate).toFixed(1)}% - ${vat.name}`}
                                                                        placeholder="Select VAT Rate"
                                                                    />
                                                                </td>

                                                                {/* Amount */}
                                                                <td>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.amount}
                                                                        onChange={(e: any) => handleMiscellaneousChange(item.id, 'amount', e.target.value)}
                                                                        className="shadow-none wpx-150 text-end"
                                                                        placeholder="Enter Amount"
                                                                        isValid={validator.current.fieldValid('amount' + i)}
                                                                        isTouched={isSubmitted}
                                                                        invalidFeedback={validator.current.message('amount-' + i, item.amount, 'required')}
                                                                    />
                                                                    <small className="text-muted">Enter Amount inc VAT</small>
                                                                </td>

                                                                {/* Delete */}
                                                                <td>
                                                                    <Button
                                                                        isLight
                                                                        icon="Delete"
                                                                        color="danger"
                                                                        isDisable={formData.items.length <= 1}
                                                                        onClick={() => handleDeleteMiscellaneous(item.id)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}

                                                    {/* Credit wallet applied rows */}
                                                    {creditWalletAddInvoice?.map((data: any, idx: number) => (
                                                        <tr key={idx} className="align-middle">
                                                            <td className="strong text-success" colSpan={3}>
                                                                Credit applied from invoice {data.code}
                                                            </td>
                                                            <td colSpan={2} className="text-end">
                                                                −{priceFormat(data.amount)}
                                                            </td>
                                                            <td></td>
                                                            <td>
                                                                <Button
                                                                    isLight color="danger" icon="Delete" size="sm"
                                                                    onClick={() => handleRemoveCredit(idx)}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* ── Totals summary ────────────────── */}
                                        <table className="table w-50 float-end table-borderless mb-0">
                                            <tbody>
                                                {/* Sub Total (ex VAT) */}
                                                <tr>
                                                    <td className="text-end text-muted py-1">Sub Total (ex VAT)</td>
                                                    <td className="text-end fw-semibold py-1" style={{ minWidth: 120 }}>
                                                        {priceFormat(totals.subTotal)}
                                                    </td>
                                                </tr>

                                                {/* Discount + Discounted Sub Total — shown only when discount applied */}
                                                {totals.discTotal > 0 && (
                                                    <>
                                                        <tr>
                                                            <td className="text-end text-success py-1">
                                                                Discount
                                                                <small className="text-muted ms-1">(on Sub Total)</small>
                                                            </td>
                                                            <td className="text-end text-success fw-semibold py-1">
                                                                −{priceFormat(totals.discTotal)}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-end text-muted py-1">Discounted Sub Total (ex VAT)</td>
                                                            <td className="text-end fw-semibold py-1">
                                                                {priceFormat(Math.max(totals.subTotal - totals.discTotal, 0))}
                                                            </td>
                                                        </tr>
                                                    </>
                                                )}

                                                {/* VAT Total — shows discounted VAT when discount applied */}
                                                <tr>
                                                    <td className="text-end text-muted py-1">VAT Total</td>
                                                    <td className="text-end fw-semibold py-1">
                                                        {priceFormat(totals.discTotal > 0 ? totals.discountedVat : totals.vatTotal)}
                                                    </td>
                                                </tr>

                                                {/* Total (inc VAT) — shows original gross; when discount applied shows discounted total */}
                                                <tr className="border-top">
                                                    <td className="text-end text-muted py-1">Total (inc VAT)</td>
                                                    <td className="text-end fw-semibold py-1">
                                                        {priceFormat(totals.discTotal > 0 ? totals.balanceDue : totals.gross)}
                                                    </td>
                                                </tr>

                                                {/* Balance Due — always shown */}
                                                <tr className="border-top">
                                                    <td className="text-end py-2">
                                                        <span className="fw-bold fs-6">Balance Due</span>
                                                    </td>
                                                    <td className="text-end py-2">
                                                        <span className="fw-bold fs-6 text-info">
                                                            {priceFormat(totals.balanceDue)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* ── Discount section ──────────────── */}
                                        {/* ✅ CHANGED: invoiceBase now uses subTotal (pre-VAT) instead of gross */}
                                        <div style={{ clear: 'both' }}>
                                            <DiscountApplyCard
                                                discountList={discountList}
                                                isLoading={isDiscountLoading}
                                                appliedDiscounts={formData.discounts ?? []}
                                                invoiceBase={totals.subTotal}
                                                onApply={handleApplyDiscount}
                                                onRemove={handleRemoveDiscount}
                                            />
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </div>

                        {/* ── Credit wallet ─────────────────────────────────── */}
                        <div className="row mt-4">
                            <div className="col-12">
                                <CreditWalletApplayCard
                                    applayWalletList={creditWalletInput}
                                    invoiceTo={formData.invoiceTo}
                                    updatedWalletList={updatedWallets}
                                    onChange={handleCreditWalletInputChange}
                                    onApply={handleApplyWallet}
                                />
                            </div>
                        </div>
                    </>
                )}
            </ModalBody>

            <ModalFooter>
                <div className="row">
                    <div className="col-12 text-end">
                        <Button color="danger" className="me-2" isDisable={isLoadingForm} onClick={toggle}>
                            Cancel
                        </Button>
                        <Button
                            color="info"
                            isLoading={isLoadingForm}
                            isDisable={isLoadingForm}
                            onClick={handleFormSubmit}
                        >
                            {formData?.id ? 'Update' : 'Generate'}
                        </Button>
                    </div>
                </div>
            </ModalFooter>
        </Modal>
    );
};