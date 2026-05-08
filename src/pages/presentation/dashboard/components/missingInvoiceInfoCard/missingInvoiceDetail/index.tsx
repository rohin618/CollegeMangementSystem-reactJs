// ─── MissingInvoiceDetailList.tsx ────────────────────────────────────────────
// Reuses InvoiceCard + DiscountApplyCard from the invoice form component tree.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle,
    Button,
} from '../../../../../../components/bootstrap';
import {
    generateUid,
    getUserMappedCompanyId,
    getUserMappedCompany,
    getResidentInvoiceAddress,
    mergeArrayOfObjectUniqueByKey,
    getVatAmount,
    showAlert,
    priceFormat,
} from '../../../../../../helpers/helpers';
import moment from 'moment';
import { useRemoveItemQueryListById, useUpdateQueryListById } from '../../../../../../hooks';
import { getColorNameWithIndex } from '../../../../../../common/data/enumColors';
import SimpleReactValidator from 'simple-react-validator';
import { createInvoice, updateInvoice } from '../../../../../../common/api/invoice';
import { updateCreditWallet } from '../../../../../../common/api/creditWalet';
import { INVOICE_CATEGORY } from '../../../../../../common/constant';
import { useMasterData } from '../../../../../../contexts/mastersContext';
import showNotification from '../../../../../../components/extras/showNotification';
import { ICreditApply } from '../../../../../../common/interface';
import { ResidentProfileCard } from '../../../../../../components/common';
import { useQuery } from '@tanstack/react-query';
import { getAllDiscounts } from '../../../../../../common/api/discount';
import { QUERY_KEY } from '../../../../../../common/constant';
import { ICreditWalletUpdated, IDiscountMaster, IInvoiceDiscount, IInvoiceRow, IWalletApplied } from '../../../../../../common/interface/invoice/invoiceform';
import { rebuildRowTotals } from '../../../../../../helpers/invoice/invoiceform.helpers';
import { InvoiceCard } from '../../../../resident/component/invoice-card';



// ─── Props ────────────────────────────────────────────────────────────────────

interface MissingInvoiceDetailListProps {
    toggle       : () => void;
    isOpen       : boolean;
    residentData ?: any;
    invoiceList  ?: any[];
    index        ?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MissingInvoiceDetailList: React.FC<MissingInvoiceDetailListProps> = ({
    toggle       = () => {},
    isOpen       = false,
    invoiceList  = [],
    residentData = {},
    index        = -1,
}) => {
    const { id }: any = residentData;

    const [isLoading,   setIsLoading]   = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [invoiceRows, setInvoiceRows] = useState<IInvoiceRow[]>([]);

    const [creditWalletAddInvoice, setCreditWalletAddInvoice] = useState<any[]>([]);
    const [creditWalletInput,      setCreditWalletInput]      = useState<any[]>([]);

    const validator         = useRef(new SimpleReactValidator());
    const updateInvoiceList = useUpdateQueryListById<any>(['invoiceList', id]);
    const colorIndex        = getColorNameWithIndex(index);

    const { removeItemById } = useRemoveItemQueryListById<any>({
        queryKey: ['invoicesbyResidentGroupList'],
    });

    const {
        localAuthorityList = [],
        localICBList       = [],
        fNCDetails,
        miscellaneousList,
        billingPatternList,
        vatList,
        isLoading: isMasterLoading,
    }: any = useMasterData();

    // ── Discount master ───────────────────────────────────────────────────────
    const {
        data: discountList = [] as IDiscountMaster[],
        isLoading: isDiscountLoading,
    } = useQuery<IDiscountMaster[]>({
        queryKey : [QUERY_KEY.DISCOUNT_LIST],
        queryFn  : getAllDiscounts,
        staleTime: 5 * 60 * 1000,
    });

    // ── Billing formulas ──────────────────────────────────────────────────────
    const billingFormula = useMemo(() => {
        const info = getUserMappedCompany();
        return {
            privateBillingFormula: billingPatternList.find((d: any) => d.id === info?.privateBillingPattern)?.billingFormula,
            ccBillingFormula     : billingPatternList.find((d: any) => d.id === info?.ccBillingPattern)?.billingFormula,
            familyTopupPattern   : billingPatternList.find((d: any) => d.id === info?.familyTopupPattern)?.billingFormula,
        };
    }, [billingPatternList]);

    // ── Sync invoiceList → invoiceRows ────────────────────────────────────────
    useEffect(() => {
        if (invoiceList?.length > 0) {
            setInvoiceRows(
                invoiceList.map((r: any) => ({
                    ...r,
                    discounts : (r.discounts  ?? []) as IInvoiceDiscount[],
                    notes     : (r.notes      ?? "") as string,
                    balanceDue: (r.balanceDue ?? r.totalPrice ?? 0) as number,
                }))
            );
        } else {
            setInvoiceRows([]);
        }
    }, [invoiceList]);

    // ─────────────────────────────────────────────────────────────────────────
    // MISC HANDLERS
    // ─────────────────────────────────────────────────────────────────────────

    const handleAddMiscellaneous = (index: number) => {
        setInvoiceRows(prev => {
            const updated = [...prev];
            const row     = { ...updated[index] };
            row.items = [
                ...row.items,
                {
                    id             : generateUid(),
                    category       : INVOICE_CATEGORY.MISC,
                    description    : "",
                    miscellaneousId: "",
                    qty            : 1,
                    weekPrice      : 0,
                    amount         : 0,
                    vatId          : "",
                    vatRate        : 0,
                    vatAmount      : 0,
                    period         : { from: "", to: "" },
                },
            ];
            updated[index] = rebuildRowTotals(row, discountList);
            return updated;
        });
    };

    const handleMiscellaneousChange = (
        invoiceIndex: number,
        itemId      : string,
        field       : string,
        value       : any
    ) => {
        setInvoiceRows(prev => {
            const updated = [...prev];
            const row     = { ...updated[invoiceIndex] };

            row.items = row.items.map((item: any) => {
                if (item.id !== itemId || item.category !== INVOICE_CATEGORY.MISC) return item;

                let u = { ...item };
                if (field === "amount") {
                    u.amount = Number(value) || 0;
                } else if (field === "vatId") {
                    const vat = vatList.find((v: any) => v.id === value);
                    u.vatId   = value;
                    u.vatRate = Number(vat?.rate || 0);
                } else if (typeof value === "object" && !Array.isArray(value)) {
                    u[field] = { ...u[field], ...value };
                } else {
                    u[field] = value;
                }
                u.vatAmount = getVatAmount(u.amount, u.vatRate);
                return u;
            });

            updated[invoiceIndex] = rebuildRowTotals(row, discountList);
            return updated;
        });
    };

    const handleDeleteMiscellaneous = (invoiceIndex: number, itemId: string) => {
        setInvoiceRows(prev => {
            const updated = [...prev];
            const row     = { ...updated[invoiceIndex] };
            row.items     = row.items.filter(
                (item: any) => !(item.id === itemId && item.category === INVOICE_CATEGORY.MISC)
            );
            updated[invoiceIndex] = rebuildRowTotals(row, discountList);
            validator.current.purgeFields();
            return updated;
        });
    };

    // ─────────────────────────────────────────────────────────────────────────
    // DISCOUNT HANDLERS
    // ─────────────────────────────────────────────────────────────────────────

    const handleApplyDiscount = (invoiceIndex: number, discount: IInvoiceDiscount) => {
        setInvoiceRows(prev => {
            const updated  = [...prev];
            const row      = { ...updated[invoiceIndex] };
            row.discounts  = [...(row.discounts ?? []), discount];
            const discTotal = row.discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
            row.balanceDue  = +Math.max(row.totalPrice - discTotal, 0).toFixed(2);
            updated[invoiceIndex] = row;
            return updated;
        });
    };

    const handleRemoveDiscount = (invoiceIndex: number, discountId: string) => {
        setInvoiceRows(prev => {
            const updated  = [...prev];
            const row      = { ...updated[invoiceIndex] };
            row.discounts  = (row.discounts ?? []).filter(d => d.discountId !== discountId);
            const discTotal = row.discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
            row.balanceDue  = +Math.max(row.totalPrice - discTotal, 0).toFixed(2);
            updated[invoiceIndex] = row;
            return updated;
        });
    };

    // ─────────────────────────────────────────────────────────────────────────
    // NOTES
    // ─────────────────────────────────────────────────────────────────────────

    const handleNotesChange = (invoiceIndex: number, notes: string) => {
        setInvoiceRows(prev => {
            const updated = [...prev];
            updated[invoiceIndex] = { ...updated[invoiceIndex], notes };
            return updated;
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
                ? prev.map((x: any) =>
                      x.id === id ? { ...x, amount: Number(value), creditTo, code, fundTypeId } : x
                  )
                : [...prev, { id, amount: Number(value), creditTo, code, fundTypeId }]
        );
    };

    const handleApplyWallet = (id: string, code: string | number, creditTo: number) => {
        const entry         = creditWalletInput.find((x: any) => x.id === id);
        if (!entry) return;

        const creditApplied = (creditWalletAddInvoice ?? [])
            .filter((c: any) => c?.creditTo === creditTo)
            .reduce((s: number, { amount = 0 }: any) => s + Number(amount), 0);

        const invoiceAmount = (
            invoiceRows.find(({ invoiceTo }) => invoiceTo === creditTo)?.items ?? []
        ).reduce((s: number, { amount = 0 }: any) => s + Number(amount), 0);

        if (creditApplied + Number(entry?.amount || 0) > invoiceAmount) {
            showNotification(
                `Total credit cannot exceed invoice amount (${priceFormat(invoiceAmount)})`,
                "warning"
            );
            return;
        }

        const targetIndex = invoiceRows.findIndex(
            (row: any) => row.invoiceTo === entry.creditTo && row.fundTypeId === entry.fundTypeId
        );
        if (targetIndex === -1) return;

        setCreditWalletAddInvoice(prev => [
            ...prev,
            { ...entry, code, applyInvoiceIndex: targetIndex },
        ]);
        setCreditWalletInput([]);
        validator.current.purgeFields();
    };

    const handleRemoveCredit = (i: number) => {
        setCreditWalletAddInvoice(prev =>
            prev.filter((_: any, idx: number) => idx !== i)
        );
    };

    // ── Credit wallet computed ────────────────────────────────────────────────

    const updatedWallets = useMemo((): ICreditWalletUpdated[] => {
        if (!residentData?.creditWallets) return [];

        const withInvoices = residentData.creditWallets.map((wallet: any) => {
            const used  = (creditWalletAddInvoice ?? [])
                .filter(({ id }: any) => id === wallet?.id)
                .reduce((s: number, { amount = 0 }: any) => s + Number(amount), 0);
            const avail = (wallet?.creditApply ?? []).reduce(
                (s: number, { amount }: any) => s + Number(amount || 0), 0
            );
            return {
                ...wallet,
                creditAmountUsed: (wallet.creditAmount - avail) - used,
                invoice         : wallet.invoice ?? invoiceList?.find((x: any) => x.id === wallet.invoiceId),
            };
        });

        const grouped = withInvoices.reduce(
            (acc: Record<string, any[]>, wallet: any) => {
                const creditTo   = Number(wallet.creditTo);
                const fundTypeId = String(wallet.fundTypeId);
                if (!invoiceRows.some(r => Number(r.invoiceTo) === creditTo && String(r.fundTypeId) === fundTypeId))
                    return acc;
                const key = `${creditTo}|${fundTypeId}`;
                acc[key]  = [...(acc[key] ?? []), wallet];
                return acc;
            },
            {} as Record<string, any[]>
        );

        return Object.entries(grouped).map(([key, wallets]) => {
            const [creditTo, fundTypeId] = key.split("|");
            return { creditTo: Number(creditTo), fundTypeId, wallets: wallets as any[] };
        });
    }, [residentData, invoiceList, creditWalletAddInvoice, invoiceRows]);

    const walletApplied = useMemo((): IWalletApplied[] => {
        const result: IWalletApplied[] = [];
        const local = creditWalletAddInvoice.map((w: any) => ({ ...w }));

        invoiceRows.forEach((inv, index) => {
            const base = inv.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
            let remaining = base;

            local
                .filter((w: any) =>
                    w.creditTo === inv.invoiceTo && w.fundTypeId === inv.fundTypeId
                )
                .forEach((wallet: any) => {
                    if (remaining <= 0 || wallet.amount <= 0) return;
                    const apply = Math.min(wallet.amount, remaining);
                    result.push({
                        id               : wallet.id,
                        amount           : apply,
                        creditTo         : inv.invoiceTo as number,
                        fundTypeId       : inv.fundTypeId,
                        applyInvoiceIndex: index,
                        code             : wallet.code,
                    });
                    wallet.amount -= apply;
                    remaining     -= apply;
                });
        });
        return result;
    }, [invoiceRows, creditWalletAddInvoice]);

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
            setIsLoading(true);

            for (const [index, row] of invoiceRows.entries()) {

                const creditApply = walletApplied
                    .filter(w => w.applyInvoiceIndex === index)
                    .map(({ id, amount }) => ({
                        id            : generateUid(),
                        creditWalletId: id,
                        amount        : Number(amount) || 0,
                    }));

                const invoiceAddress: any = getResidentInvoiceAddress(
                    residentData, +row.invoiceTo, row.fundTypeId,
                    { localAuthorityList, localICBList, fNCDetails }
                );

                const reqData = {
                    ...row,
                    sDate      : moment(row.sDate).format("YYYY-MM-DD"),
                    eDate      : moment(row.eDate).format("YYYY-MM-DD"),
                    invoiceDate: moment().format("YYYY-MM-DD"),
                    creditApply,
                    // IInvoiceModel fields
                    discounts  : (row.discounts ?? []).map((d: IInvoiceDiscount) => ({
                        discountId: d.discountId,
                        code      : d.code,
                        name      : d.name,
                        type      : d.type,
                        value     : d.value,
                        amount    : d.amount,
                    })),
                    balanceDue : row.balanceDue ?? row.totalPrice,
                    notes      : row.notes ?? "",
                };

                const action = row.id
                    ? updateInvoice(row.id, reqData)
                    : createInvoice(reqData, invoiceAddress?.shortName);

                const res = await action;
                updateInvoiceList(res);

                if (!res?.id || creditApply.length === 0) continue;

                const walletPromises = (residentData?.creditWallets ?? []).map((wallet: any) => {
                    const applied: ICreditApply[] = creditApply
                        .filter(({ creditWalletId }) => creditWalletId === wallet.id)
                        .map(({ id, amount }) => ({ invoiceId: res.id, id, amount: Number(amount) }));
                    if (!applied.length) return null;
                    return updateCreditWallet(wallet.id, {
                        ...wallet,
                        creditApply: wallet.id
                            ? mergeArrayOfObjectUniqueByKey(wallet.creditApply, applied)
                            : [],
                    });
                });

                await Promise.all(walletPromises.filter(Boolean));
            }

            removeItemById(id);
            toggle();
        } catch (err) {
            console.error("Error generating invoice:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    // formData stub — MissingInvoice doesn't have date pickers,
    // dates come directly from invoiceList items.
    const formData = useMemo(() => ({
        sDate      : invoiceRows[0]?.sDate ?? "",
        eDate      : invoiceRows[0]?.eDate ?? "",
        invoiceDate: moment().format("YYYY-MM-DD"),
        dueDay     : "",
    }), [invoiceRows]);

    return (
        <Modal isOpen={isOpen} setIsOpen={toggle} size="xl" titleId="tour-title">
            <ModalHeader setIsOpen={toggle}>
                <ModalTitle id="tour-title" className="d-flex align-items-end">
                    <span className="ps-2">Missing Invoice</span>
                </ModalTitle>
            </ModalHeader>

            <ModalBody>
                <div className="row mt-4">

                    {/* ── Resident profile ──────────────────────────────────── */}
                    <div className="col-md-12 mb-4">
                        <ResidentProfileCard resident={residentData} colorIndex={colorIndex} />
                    </div>

                    <div className="col-12">
                        {invoiceRows.length === 0 ? (
                            <h4 className="text-center">No invoices found</h4>
                        ) : (
                            invoiceRows.map((row, index) => (
                                // ── Reusing InvoiceCard from invoice form ────
                                <InvoiceCard
                                    key={`${row.invoiceTo}_${row.fundTypeId}_${index}`}
                                    row={row}
                                    index={index}
                                    formData={formData}
                                    residentData={residentData}
                                    localAuthorityList={localAuthorityList}
                                    localICBList={localICBList}
                                    fNCDetails={fNCDetails}
                                    vatList={vatList}
                                    miscellaneousList={miscellaneousList}
                                    isMasterLoading={isMasterLoading}
                                    billingFormula={billingFormula}
                                    respiteCurrentInfoStatus={undefined}
                                    discountList={discountList}
                                    isDiscountLoading={isDiscountLoading}
                                    updatedWallets={updatedWallets}
                                    walletApplied={walletApplied}
                                    creditWalletInput={creditWalletInput}
                                    invoiceList={invoiceList}
                                    validator={validator}
                                    isSubmitted={isSubmitted}
                                    onAddMiscellaneous={handleAddMiscellaneous}
                                    onMiscellaneousChange={handleMiscellaneousChange}
                                    onDeleteMiscellaneous={handleDeleteMiscellaneous}
                                    onCreditWalletInputChange={handleCreditWalletInputChange}
                                    onApplyWallet={handleApplyWallet}
                                    onRemoveCredit={handleRemoveCredit}
                                    onApplyDiscount={handleApplyDiscount}
                                    onRemoveDiscount={handleRemoveDiscount}
                                    onNotesChange={handleNotesChange}
                                />
                            ))
                        )}
                    </div>
                </div>
            </ModalBody>

            <ModalFooter>
                <Button
                    isDisable={isLoading}
                    icon="Close"
                    color="danger"
                    isLink
                    onClick={toggle}
                >
                    No
                </Button>
                <Button
                    isLoading={isLoading}
                    icon="DoneOutline"
                    color="success"
                    isLight
                    onClick={handleFormSubmit}
                >
                    Generate
                </Button>
            </ModalFooter>
        </Modal>
    );
};