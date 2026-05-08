// ─── InvoiceUpdateModal.tsx ───────────────────────────────────────────────────
// Payment receipt modal. Discounts are already applied on the invoice at
// generation time (IInvoiceModel.discounts[]). This form reads them for
// accurate balance calculations — it does NOT let users add new discounts.
// ✅ Discount applied pre-VAT: balanceDue = (discountedSubTotal + discountedVAT)

import {
    FormGroup,
    Input,
    Modal,
    ModalBody,
    ModalHeader,
    ModalTitle,
    Checks,
    Button,
    CardBody,
    Card,
    Alert,
} from "../../../../../components/bootstrap";
import { INVOICE_TO_TYPE_LIST, PAYMENT_METHOD_LIST } from "../../../../../common/data/option";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllInvoicesList, updateInvoice } from "../../../../../common/api/invoice";
import {
    generateUid,
    getInvoiceOpenBalance,
    getLabelByValue,
    getResidentInvoiceAddress,
    priceFormat,
    showAlert,
} from "../../../../../helpers/helpers";
import {
    CREDIT_TYPE,
    INVOICE_STATUS,
    INVOICE_TO_TYPE,
    PAYMENT_METHOD_TYPE,
} from "../../../../../common/constant";
import SimpleReactValidator from "simple-react-validator";
import moment from "moment";
import {
    useMultiSearch,
    useRefetchQueryList,
    useUpdateQueryListById,
} from "../../../../../hooks";
import { creditWaletModel } from "../../../../../common/model/creditWalet";
import { createCreditWallet } from "../../../../../common/api/creditWalet";
import { ResidentCreditAvialbleList } from "./creditCheck";
import { useMasterData } from "../../../../../contexts/mastersContext";
import showNotification from "../../../../../components/extras/showNotification";
import { ICreditWalletModel } from "../../../../../common/interface";
import { DateTimePicker, SearchableSelect } from "../../../../../components/common";
import { IInvoiceDiscount } from "../../../../../common/interface/invoice";
import Icon from "../../../../../components/icon";

// ─── Helper ───────────────────────────────────────────────────────────────────

function getInvoiceDiscountTotal(invoice: any): number {
    const discounts: IInvoiceDiscount[] = invoice?.discounts ?? [];
    return discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
}

/**
 * ✅ Amount still owed on a single invoice — discount applied pre-VAT.
 * Prefers stored balanceDue (saved as discountedSubTotal + discountedVAT).
 * Falls back to live calculation for legacy invoices without balanceDue.
 */




// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceUpdateModalProps {
    isOpen?: boolean;
    residentData?: any;
    detailInvoiceInfo?: {
        companyId?: string | number;
        residentId: string;
        residentData: any;
        invoiceTo: number;
    } | null;
    toggle?: () => void;
    isResidentUpdate: boolean;
    invoiceTo: number;
    localICBList?: any[];
    localAuthorityList?: any[];
    fNCDetails: any;
    fundTypeId?: string;
}

interface InvoicePayment {
    id: string;
    value: number;
}

interface InvoiceFormData {
    paymentDate: string;
    paymentMethod: number;
    refNo: string;
    depositTo: string;
    amountReceived: string;
    residentName: string;
    fundType: string | number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const InvoiceUpdateModal = ({
    isOpen = false,
    detailInvoiceInfo = null,
    toggle = () => { },
    isResidentUpdate = false,
    invoiceTo,
    localICBList = [],
    localAuthorityList = [],
    fNCDetails = {},
    fundTypeId = "",
}: InvoiceUpdateModalProps) => {
    const companyId: any = detailInvoiceInfo?.companyId ?? "";
    const residentId: string = detailInvoiceInfo?.residentId ?? "";
    const residentData: any = detailInvoiceInfo?.residentData ?? {};

    const [, forceUpdate] = useState(0);
    const [isCreditWalletInfoModal, setIsCreditWalletInfoModal] = useState(false);
    const [paymentRefId, setPaymentRefId] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isFormLoader, setIsFormLoader] = useState(false);
    const [invoicePayment, setInvoicePayment] = useState<InvoicePayment[]>([]);

    const [formData, setFormData] = useState<InvoiceFormData>({
        paymentDate: "",
        residentName: "",
        paymentMethod: PAYMENT_METHOD_TYPE.CASH,
        refNo: "",
        depositTo: "",
        amountReceived: "",
        fundType: +invoiceTo,
    });

    // ✅ Start with empty fundTypeId so dropdown shows placeholder correctly.
    // For LA/CHC the user must select from dropdown — no auto-selection of first item.
    const [filterFromData, setFilterFromData] = useState<any>({
        fundTypeId: fundTypeId ?? "",
    });

    const validator = useRef(new SimpleReactValidator({ autoForceUpdate: { forceUpdate } }));

    const reFetchInvoiceListByCompany = useRefetchQueryList<any>(["invoiceListByCompany"]);
    const reFetchInvoiceListOfResident = useRefetchQueryList<any>(["invoiceList", residentId]);

    const { bankList: bankDetails = [] }: any = useMasterData();

    // ── Invoice list query ────────────────────────────────────────────────────
    // ✅ For LA/CHC: only query once user selects a fund from dropdown.
    //    For other types: query immediately (no fundTypeId filter needed).
    const needsFundTypeId = [INVOICE_TO_TYPE.LA, INVOICE_TO_TYPE.CHC].includes(+invoiceTo as any);
    const resolvedFundTypeId = fundTypeId || filterFromData.fundTypeId || "";

    const invoiceReq = {
        residentId: residentId ?? "",
        statuses: [INVOICE_STATUS.PENDING, INVOICE_STATUS.PARTIAL],
        invoiceTo: +invoiceTo,
        fundTypeId: resolvedFundTypeId,
    };

    const { data: invoiceList = [], isLoading: isInvoiceListLoading } = useQuery({
        queryKey: ["invoiceUpdateList", invoiceReq],
        queryFn: () => getAllInvoicesList(invoiceReq),
        // ✅ For LA/CHC wait until user selects a fund — otherwise fetch immediately
        enabled: (!!invoiceReq.statuses?.length && invoiceTo !== -1 &&
            (!needsFundTypeId || !!resolvedFundTypeId) && isOpen),
    });


    const filteredInvoiceList = useMultiSearch(invoiceList, filterFromData);

    // ── Sync on open ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!invoiceTo || !isOpen) return;
        setFormData(prev => ({
            ...prev,
            residentName: residentData?.personal?.name ?? "",
            paymentMethod: PAYMENT_METHOD_TYPE.CASH,
            fundType: +invoiceTo,
        }));
        // ✅ Auto-select first item on load for LA/CHC so invoices load immediately.
        // If fundTypeId already provided (from parent), use that.
        // For FNC/INCONT: auto-set from fNCDetails.
        const fundTypeIds =
            fundTypeId
                ? fundTypeId
                : +invoiceTo === INVOICE_TO_TYPE.LA
                    ? localAuthorityList?.[0]?.id ?? ""
                    : +invoiceTo === INVOICE_TO_TYPE.CHC
                        ? localICBList?.[0]?.id ?? ""
                        : (invoiceTo === INVOICE_TO_TYPE.FNC || invoiceTo === INVOICE_TO_TYPE.INCONT)
                            ? fNCDetails?.id ?? ""
                            : "";
        setFilterFromData({ fundTypeId: fundTypeIds });
    }, [isOpen, invoiceTo]);

    // ── Reset on close ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                paymentDate: "",
                paymentMethod: PAYMENT_METHOD_TYPE.CASH,
                refNo: "",
                depositTo: "",
                amountReceived: "",
                residentName: "",
                fundType: "",
            });
            setInvoicePayment([]);
            setIsSubmitted(false);
            validator.current.hideMessages();
        }
    }, [isOpen]);

    // ─────────────────────────────────────────────────────────────────────────
    // BALANCE CALCULATIONS — ✅ discount applied pre-VAT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Amount still owed on an invoice.
     * Uses getInvoiceOpenBalance which reads balanceDue (pre-VAT discount baked in).
     */
    const getNeedToPay = useCallback((invoice: any): number => {
        return getInvoiceOpenBalance(invoice);
    }, []);

    /**
     * Overall outstanding across all filtered invoices — ✅ discount-aware.
     */
    const overallResidentBalance = useMemo(() => {
        return +filteredInvoiceList
            .reduce((total, invoice) => total + getNeedToPay(invoice), 0)
            .toFixed(2);
    }, [filteredInvoiceList, getNeedToPay]);

    // ─────────────────────────────────────────────────────────────────────────
    // PAYMENT DISTRIBUTION
    // ─────────────────────────────────────────────────────────────────────────

    const distributeAmount = useCallback((amount: number) => {
        let remaining = amount;
        const updatedPayments: InvoicePayment[] = [];
        filteredInvoiceList.forEach(invoice => {
            if (remaining <= 0) return;
            const balance = getNeedToPay(invoice);
            const applied = Math.min(remaining, balance);
            updatedPayments.push({ id: invoice.id, value: +applied.toFixed(2) });
            remaining -= applied;
        });
        setInvoicePayment(updatedPayments);
    }, [filteredInvoiceList, getNeedToPay]);

    const handleChangeReceivedPayment = useCallback((id: string, value: number) => {
        setInvoicePayment(prev => {
            const othersPaid = prev
                .filter(p => p.id !== id)
                .reduce((s, p) => s + (Number(p.value) || 0), 0);
            const remaining = Number(formData.amountReceived || 0) - othersPaid;
            const invoice = filteredInvoiceList.find(inv => inv.id === id);
            if (!invoice) return prev;
            const balance = getNeedToPay(invoice);
            const capped = Math.min(Math.min(value, remaining), balance);
            const exists = prev.some(p => p.id === id);
            return exists
                ? prev.map(p => p.id === id ? { ...p, value: capped } : p)
                : [...prev, { id, value: capped }];
        });
    }, [filteredInvoiceList, formData.amountReceived, getNeedToPay]);

    const handleCheckChange = (id: string) => {
        setInvoicePayment(prev => prev.filter(p => p.id !== id));
    };

    const totalInvoicePaid = useMemo(
        () => +(invoicePayment ?? []).reduce((s, p) => s + (Number(p.value) || 0), 0).toFixed(2),
        [invoicePayment]
    );

    // ─────────────────────────────────────────────────────────────────────────
    // FIELD CHANGE
    // ─────────────────────────────────────────────────────────────────────────

    const handleChange = useCallback((field: keyof InvoiceFormData, value: string | number) => {
        if (field === "amountReceived") {
            const n = Number(value);
            if (n > 0) distributeAmount(n);
        }
        setFormData(prev => ({ ...prev, [field]: value }));
    }, [distributeAmount]);

    // ─────────────────────────────────────────────────────────────────────────
    // OVERAGE ALERT
    // ─────────────────────────────────────────────────────────────────────────

    const handlePaymentOverage = () => {
        const resolvedAmount = totalInvoicePaid;
        const enteredAmount = amountReceivedNum;
        const remaining = +(enteredAmount - resolvedAmount).toFixed(2);
        const fmt = (n: number) =>
            n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

        showAlert({
            title: "Amount exceeds resolved",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Save as Direct Fund",
            cancelButtonText: "Save to Resident Account",
            confirmButtonClass: "btn btn-light-success btn-alert me-2 mb-2",
            cancelButtonClass: "btn btn-light-primary btn-alert",
            html: `
              <div style="display:flex;gap:8px;margin-bottom:14px;">
                <div style="flex:1;background:#f7fafc;border-radius:8px;padding:10px 8px;text-align:center;">
                  <div style="font-size:10px;color:#a0aec0;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:3px;">Resolved</div>
                  <div style="font-size:14px;font-weight:600;color:#2d3748;">${fmt(resolvedAmount)}</div>
                </div>
                <div style="flex:1;background:#f7fafc;border-radius:8px;padding:10px 8px;text-align:center;">
                  <div style="font-size:10px;color:#a0aec0;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:3px;">Entered</div>
                  <div style="font-size:14px;font-weight:600;color:#2d3748;">${fmt(enteredAmount)}</div>
                </div>
                <div style="flex:1;background:#fff8e6;border-radius:8px;padding:10px 8px;text-align:center;">
                  <div style="font-size:10px;color:#a0aec0;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:3px;">Remaining</div>
                  <div style="font-size:14px;font-weight:600;color:#854F0B;">${fmt(remaining)}</div>
                </div>
              </div>
              <p style="font-size:13px;color:#718096;margin:0;text-align:center;">
                The remaining <strong>${fmt(remaining)}</strong> needs to be assigned.
              </p>
            `,
            onConfirm: () => saveAsDirectFund(remaining),
            onCancel: () => setIsCreditWalletInfoModal(true),
        });
    };

    const saveAsDirectFund = async (amount: number) => {
        const reqCreditWallet: ICreditWalletModel = {
            ...creditWaletModel,
            type: CREDIT_TYPE.ADVANCE_CREDIT,
            creditAmount: amount,
            creditTo: invoiceTo,
            residentId: "",
            bankId: formData.depositTo,
            paymentRefId: paymentRefId,
            fundTypeId: filterFromData.fundTypeId,
            paymentMethod: formData.paymentMethod,
            date: formData.paymentDate,
            refNo: formData.refNo,
        };
        const creditNotesAddress: any = getResidentInvoiceAddress(
            residentData, +invoiceTo, reqCreditWallet?.fundTypeId,
            { localAuthorityList, localICBList, fNCDetails }
        );
        await createCreditWallet(reqCreditWallet, creditNotesAddress?.shortName);
        submitInvoice(paymentRefId);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SUBMIT
    // ─────────────────────────────────────────────────────────────────────────

    const handleFormSubmit = async () => {
        setIsSubmitted(true);
        if (!validator.current.allValid()) {
            validator.current.showMessages();
            forceUpdate(i => i + 1);
            return;
        }

        const paymentId = generateUid();
        setPaymentRefId(paymentId);

        if (!paymentId) {
            showNotification("Payment ID is missing.", "Payment could not be updated!", "warning");
            return;
        }

        const amountReceivedBalance = +(+formData.amountReceived - +totalInvoicePaid).toFixed(2);
        const customerBalanceDiff = +(overallResidentBalance - +totalInvoicePaid);
        const shouldShowCreditModal = !isResidentUpdate && (amountReceivedBalance > 0 || customerBalanceDiff < 0);

        if (shouldShowCreditModal) {
            handlePaymentOverage();
            return;
        }

        if (isResidentUpdate) {
            if (amountReceivedBalance > 0) {
                const reqCreditWallet: ICreditWalletModel = {
                    ...creditWaletModel,
                    type: CREDIT_TYPE.ADVANCE_CREDIT,
                    creditAmount: amountReceivedBalance,
                    companyId,
                    creditTo: invoiceTo,
                    residentId,
                    bankId: formData.depositTo,
                    paymentRefId: paymentId,
                    fundTypeId: filterFromData.fundTypeId,
                    paymentMethod: formData.paymentMethod,
                    refNo: formData.refNo,
                    date:formData.paymentDate,
                };
                const creditNotesAddress: any = getResidentInvoiceAddress(
                    residentData, +invoiceTo, reqCreditWallet?.fundTypeId,
                    { localAuthorityList, localICBList, fNCDetails }
                );
                await createCreditWallet(reqCreditWallet, creditNotesAddress?.shortName);
                submitInvoice(paymentId);
                return;
            }
            if (customerBalanceDiff < 0) {
                submitInvoice(paymentId);
                return;
            }
        }

        submitInvoice(paymentId);
    };

    const submitInvoice = async (payRefId: string) => {
        setIsFormLoader(true);
        setIsCreditWalletInfoModal(false);
        try {
            if (!invoiceList?.length) { toggle(); return; }

            const updatePromises = invoiceList
                .map(async (invoice: any) => {
                    const payInfo = invoicePayment.find(({ id }) => id === invoice.id);
                    if (!payInfo) return null;

                    const details = {
                        id: payRefId,
                        amount: Number(payInfo.value) || 0,
                        date: formData.paymentDate,
                        refNo: formData.refNo,
                        paymentMethod: formData.paymentMethod,
                        bankId: formData.depositTo,
                    };

                    const payments = [...(invoice.payedInfo ?? [])];
                    const first = payments[0];
                    const isPlaceholder =
                        first && !first.date && !first.refNo && !first.paymentRef &&
                        (!first.amount || Number(first.amount) === 0);

                    if (isPlaceholder) payments[0] = details;
                    else payments.push(details);

                    const res = await updateInvoice(invoice.id, { ...invoice, payedInfo: payments });
                    reFetchInvoiceListByCompany.forceRefetch();
                    reFetchInvoiceListOfResident.forceRefetch();
                    return res;
                })
                .filter(Boolean);

            if (updatePromises.length) {
                await Promise.all(updatePromises);
                validator.current.hideMessages();
                toggle();
            }
        } catch (err) {
            console.error("Error while updating invoices", err);
        } finally {
            setIsFormLoader(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    const amountReceivedNum = Number(formData.amountReceived || 0);
    const remainingUnpaid = +(amountReceivedNum - totalInvoicePaid).toFixed(2);
    const showFooterAlert =
        amountReceivedNum > 0 &&
        filteredInvoiceList.length > 0 &&
        (totalInvoicePaid !== amountReceivedNum || (amountReceivedNum - overallResidentBalance) > 0);

    return (
        <>
            <Modal setIsOpen={() => { }} isOpen={isOpen} fullScreen titleId="transfer-modal" id="invoiceUpdate">
                <ModalHeader setIsOpen={toggle}>
                    <ModalTitle id="transfer-modal">Receive the Payment</ModalTitle>
                </ModalHeader>

                <ModalBody>
                    <div>
                        {/* ── Top: filter + balance summary ──────────────── */}
                        <div className="row mb-4">
                            <div className="col-8">
                                {(invoiceTo === INVOICE_TO_TYPE.LA || invoiceTo === INVOICE_TO_TYPE.CHC) && (
                                    <div className="row">
                                        <div className="col-4">
                                            <FormGroup
                                                id={invoiceTo === INVOICE_TO_TYPE.LA ? "localAuthority" : "icb"}
                                                label={invoiceTo === INVOICE_TO_TYPE.LA ? "Local Authority" : "ICB"}
                                            >
                                                <SearchableSelect
                                                    id={invoiceTo === INVOICE_TO_TYPE.LA ? "localAuthority" : "icb"}
                                                    value={filterFromData.fundTypeId}
                                                    onChange={(e: any) =>
                                                        setFilterFromData((prev: any) => ({ ...prev, fundTypeId: e.target.value }))
                                                    }
                                                    labelKey="name"
                                                    valueKey="id"
                                                    options={invoiceTo === INVOICE_TO_TYPE.LA ? localAuthorityList : localICBList}
                                                    placeholder={`Select ${invoiceTo === INVOICE_TO_TYPE.LA ? "Local Authority" : "ICB"}`}
                                                />
                                            </FormGroup>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="col-4 text-end">
                                <h5 className="h5">Amount Received</h5>
                                <h2 className="fw-bold fs-3 mb-0">{priceFormat(amountReceivedNum)}</h2>
                                <h5 className="h5 mt-3">Customer Balance</h5>
                                <span className="fs-4">{priceFormat(overallResidentBalance)}</span>
                            </div>
                        </div>

                        {/* ── Payment form ──────────────────────────────────── */}
                        <div className="row mb-4">
                            <div className="col-3">
                                <DateTimePicker
                                    id="paymentDate"
                                    label="Payment Date"
                                    maxDate={moment().format("YYYY-MM-DD")}
                                    value={formData.paymentDate}
                                    onChange={(e: any) => handleChange("paymentDate", e.target.value)}
                                    isValid={validator.current.fieldValid("Payment Date")}
                                    isTouched={isSubmitted}
                                    invalidFeedback={validator.current.message("Payment Date", formData.paymentDate, "required")}
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-3">
                                <FormGroup id="paymentMethod" label="Payment Method">
                                    <SearchableSelect
                                        id="paymentMethod"
                                        value={formData.paymentMethod}
                                        onChange={(e: any) => handleChange("paymentMethod", e.target.value)}
                                        isValid={validator.current.fieldValid("Payment Method")}
                                        isTouched={isSubmitted}
                                        invalidFeedback={validator.current.message("Payment Method", formData.paymentMethod, "required")}
                                        options={PAYMENT_METHOD_LIST}
                                        placeholder="Select Payment Method"
                                    />
                                </FormGroup>
                            </div>
                            <div className="col-3">
                                <FormGroup id="refNo" label="Reference No.">
                                    <Input
                                        type="text"
                                        value={formData.refNo}
                                        onChange={(e: any) => handleChange("refNo", e.target.value)}
                                    />
                                </FormGroup>
                            </div>
                            <div className="col-3">
                                <FormGroup id="depositTo" label="Deposit To">
                                    <SearchableSelect
                                        options={bankDetails}
                                        value={formData.depositTo}
                                        onChange={(e: any) => handleChange("depositTo", e.target.value)}
                                        isValid={validator.current.fieldValid("Deposit To")}
                                        isTouched={isSubmitted}
                                        invalidFeedback={validator.current.message("Deposit To", formData.depositTo, "required")}
                                        labelKey="bankName"
                                        valueKey="id"
                                        placeholder="Select Bank"
                                    />
                                </FormGroup>
                            </div>
                            <div className="col-3">
                                <FormGroup id="amountReceived" label="Amount Received">
                                    <Input
                                        type="number"
                                        value={formData.amountReceived}
                                        onChange={(e: any) => handleChange("amountReceived", e.target.value)}
                                        isValid={validator.current.fieldValid("Amount Received")}
                                        isTouched={!!formData.amountReceived}
                                        invalidFeedback={validator.current.message(
                                            "Amount Received",
                                            formData.amountReceived,
                                            "required|numeric|min:1,num"
                                        )}
                                    />
                                </FormGroup>
                            </div>
                        </div>

                        {/* ── Outstanding invoices table ────────────────────── */}
                        <div className="row mt-5">
                            <div className="col-md-12 mb-4">
                                <h1>Outstanding Transaction</h1>
                            </div>
                            <div className="col-md-12">
                                {isInvoiceListLoading ? (
                                    <div className="d-flex justify-content-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading invoices...</span>
                                        </div>
                                    </div>
                                ) : filteredInvoiceList.length === 0 ? (
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
                                                {filteredInvoiceList.map((invoice: any, i: number) => {
                                                    const paymentValue = invoicePayment.find(p => p.id === invoice.id)?.value ?? 0;
                                                    const needToPay = getNeedToPay(invoice);
                                                    const discountTotal = getInvoiceDiscountTotal(invoice);
                                                    const openBalance = Math.max(needToPay - paymentValue, 0);

                                                    return (
                                                        <tr key={invoice.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-shrink-0">
                                                                        <div className="ratio ratio-1x1 me-3" style={{ width: 40 }}>
                                                                            <Checks
                                                                                className="invoice-check mx-auto mt-2"
                                                                                disabled={!Boolean(paymentValue)}
                                                                                onChange={() => Boolean(paymentValue) && handleCheckChange(invoice.id)}
                                                                                checked={Boolean(paymentValue)}
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
                                                            <td>{invoice.invoiceDate ? moment(invoice.invoiceDate).format("DD MMM YYYY") : ""}</td>
                                                            <td>
                                                                {moment(invoice.sDate).format("DD MMM YYYY")} To{" "}
                                                                {moment(invoice.eDate).format("DD MMM YYYY")}
                                                            </td>
                                                            <td>{getLabelByValue(INVOICE_TO_TYPE_LIST, invoice?.invoiceTo) || "—"}</td>
                                                            <td>{priceFormat(invoice.totalPrice)}</td>
                                                            {/* ✅ Discount cell — pre-VAT discount */}
                                                            <td className="text-success">
                                                                {discountTotal > 0 ? (
                                                                    <span title={(invoice.discounts ?? [])
                                                                        .map((d: IInvoiceDiscount) => `${d.code}: −${priceFormat(d.amount)}`)
                                                                        .join("\n")}>
                                                                        −{priceFormat(discountTotal)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted">—</span>
                                                                )}
                                                            </td>
                                                            <td>{priceFormat(openBalance)}</td>
                                                            <td>
                                                                <Input
                                                                    type="number"
                                                                    value={paymentValue}
                                                                    disabled={paymentValue === 0 && +totalInvoicePaid >= amountReceivedNum}
                                                                    isValid={validator.current.fieldValid(`Payment-${i}`)}
                                                                    isTouched={!!paymentValue}
                                                                    invalidFeedback={validator.current.message(
                                                                        `Payment-${i}`,
                                                                        paymentValue,
                                                                        "required|numeric|min:0,num"
                                                                    )}
                                                                    onChange={(e: any) =>
                                                                        handleChangeReceivedPayment(invoice.id, Number(e.target.value) || 0)
                                                                    }
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

                        {/* ── Sticky footer ─────────────────────────────────── */}
                        {amountReceivedNum > 0 && filteredInvoiceList.length > 0 && (
                            <div className="row sticky-bottom">
                                <div className="col-12">
                                    <Card>
                                        <CardBody>
                                            <div className="row">
                                                <div className="col-8 text-end">
                                                    {showFooterAlert && (
                                                        <Alert icon="error" className="py-0 mb-0" isLight color="danger">
                                                            Resolved amount is {priceFormat(totalInvoicePaid)}, but you entered{" "}
                                                            {priceFormat(amountReceivedNum)}. The remaining{" "}
                                                            {priceFormat(Math.abs(remainingUnpaid))} will be saved to credit balance.
                                                        </Alert>
                                                    )}
                                                </div>
                                                <div className="col-4 text-end">
                                                    <Button color="danger" className="me-2" isDisable={isFormLoader} onClick={toggle}>
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        color="info"
                                                        isLoading={isFormLoader}
                                                        isDisable={isFormLoader || totalInvoicePaid > amountReceivedNum}
                                                        onClick={handleFormSubmit}
                                                    >
                                                        Save
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalBody>
            </Modal>

            <ResidentCreditAvialbleList
                localICBList={localICBList}
                localAuthorityList={localAuthorityList}
                fNCDetails={fNCDetails}
                residentData={residentData}
                paymentId={paymentRefId}
                fundTypeId={filterFromData?.fundTypeId}
                invoiceTo={invoiceTo}
                availCredit={+(+formData.amountReceived - +totalInvoicePaid).toFixed(2)}
                isOpen={isCreditWalletInfoModal}
                onUpdateWithCreditNotes={submitInvoice}
                toggle={() => setIsCreditWalletInfoModal(p => !p)}
                invoiceList={invoiceList}
                invoicePayment={invoicePayment}
                formData={formData}
            />
        </>
    );
};