import React, { useMemo } from "react";
import moment from "moment";
import {
    Badge,
    Button,
    Card,
    CardActions,
    CardBody,
    CardHeader,
    CardTitle,
} from "../../../../components/bootstrap";
import Icon from "../../../../components/icon";
import { SearchableSelect } from "../../../../components/common";
import {
    getLabelByValue,
    priceFormat,
    getInvoiceDescriptions,
    getResidentInvoiceAddress,
} from "../../../../helpers/helpers";
import {
    INVOICE_CATEGORY,
    INVOICE_TO_TYPE,
    PLACEMENT_TYPE,
    RESPITE_STATUS_TYPE,
} from "../../../../common/constant";
import {
    INVOICE_CATEGORY_LIST,
    INVOICE_TO_TYPE_LIST,
} from "../../../../common/data/option";
import { getColorNameWithIndex } from "../../../../common/data/enumColors";
import useDarkMode from "../../../../hooks/useDarkMode";
import { CreditWalletApplayCard } from "./creditWalletApplayCard";
import { IInvoiceItem } from "../../../../common/interface";
import { IInvoiceDiscount } from "../../../../common/interface/invoice";
import {
    IInvoiceRow,
    IVat,
    IDiscountMaster,
    ICreditWalletUpdated,
    IWalletApplied,
} from "../../../../common/interface/invoice/invoiceform";
import { calcRowTotals } from "../../../../helpers/invoice/invoiceform.helpers";
import { DiscountApplyCard } from "./discountapplycard";

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvoiceCardProps {
    row          : IInvoiceRow;
    index        : number;
    formData     : any;
    residentData : any;

    localAuthorityList : any[];
    localICBList       : any[];
    fNCDetails         : any;
    vatList            : IVat[];
    miscellaneousList  : any[];
    isMasterLoading    : boolean;

    billingFormula: {
        privateBillingFormula?: string;
        ccBillingFormula?     : string;
        familyTopupPattern?   : string;
    };
    respiteCurrentInfoStatus?: any;

    discountList      : IDiscountMaster[];
    isDiscountLoading?: boolean;

    updatedWallets   : ICreditWalletUpdated[];
    walletApplied    : IWalletApplied[];
    creditWalletInput: any[];

    validator   : any;
    isSubmitted : boolean;

    onAddMiscellaneous        : (index: number) => void;
    onMiscellaneousChange     : (invoiceIndex: number, itemId: string, field: string, value: any) => void;
    onDeleteMiscellaneous     : (invoiceIndex: number, itemId: string) => void;
    onCreditWalletInputChange : (id: string, value: string, creditTo: number, code: string, fundTypeId: string) => void;
    onApplyWallet             : (id: string, code: string | number, creditTo: number) => void;
    onRemoveCredit            : (index: number) => void;
    onApplyDiscount           : (invoiceIndex: number, discount: IInvoiceDiscount) => void;
    onRemoveDiscount          : (invoiceIndex: number, discountId: string) => void;
    onNotesChange             : (invoiceIndex: number, notes: string) => void;
}

// ─── Billing formula label ────────────────────────────────────────────────────

function getFormulaLabel(
    invoiceTo     : number | string,
    residentData  : any,
    formData      : any,
    billingFormula: InvoiceCardProps["billingFormula"],
    respiteStatus : any,
): string {
    const isMonthStart = moment(formData.sDate).isSame(moment(formData.sDate).startOf("month"), "day");
    const isMonthEnd   = moment(formData.eDate).isSame(moment(formData.eDate).endOf("month"), "day");
    const isPermanent  =
        +residentData?.admission?.typeOfPlacement === PLACEMENT_TYPE.PERMANENT ||
        +respiteStatus?.status === RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT;

    if (isMonthStart && isMonthEnd && isPermanent) {
        if (+invoiceTo === INVOICE_TO_TYPE.PRIVATE)
            return billingFormula?.privateBillingFormula ?? "(weekly / 7) * days";
        if (+invoiceTo === INVOICE_TO_TYPE.CLIENT_CONTRIBUTION)
            return billingFormula?.ccBillingFormula ?? "(weekly / 7) * days";
        if (+invoiceTo === INVOICE_TO_TYPE.FAMILY_TOPUP)
            return billingFormula?.familyTopupPattern ?? "(weekly / 7) * days";
    }
    return "(weekly / 7) * days";
}

// ─── Totals summary sub-row ───────────────────────────────────────────────────
//
//  Discount order (pre-VAT):
//    Sub Total (ex VAT)       £ xxx
//    − Discount               £ xxx   ← on pre-VAT subtotal
//    Discounted Sub Total     £ xxx
//    + VAT                    £ xxx
//    ─────────────────────────────
//    Total (inc VAT)          £ xxx
//    − Credit                 £ xxx  [×]
//    ─────────────────────────────
//    Balance Due              £ xxx

interface TotalsRowProps {
    subTotal      : number;
    vatTotal      : number;
    gross         : number;
    discTotal     : number;
    creditTotal   : number;
    balanceDue    : number;
    appliedWallets: IWalletApplied[];
    onRemoveCredit: (i: number) => void;
}

const TotalsRow: React.FC<TotalsRowProps> = ({
    subTotal, vatTotal, discTotal, creditTotal, balanceDue, appliedWallets, onRemoveCredit,
}) => {
    const discountedSub = +(subTotal - discTotal).toFixed(2);
    const totalIncVat   = +(discountedSub + vatTotal).toFixed(2);

    return (
        <tr className="align-middle">
            <td colSpan={7} className="border-0">
                <table className="table w-50 float-end table-borderless mb-0">
                    <tbody>

                        {/* Sub Total ex VAT */}
                        <tr>
                            <td className="text-end text-muted" style={{ fontSize: 13 }}>Sub Total (ex VAT)</td>
                            <th className="text-end">{priceFormat(subTotal)}</th>
                        </tr>

                        {/* Discount — only when applied */}
                        {discTotal > 0 && (
                            <>
                                <tr>
                                    <td className="text-end text-success" style={{ fontSize: 13 }}>Discount</td>
                                    <th className="text-end text-success">−{priceFormat(discTotal)}</th>
                                </tr>
                                <tr>
                                    <td className="text-end text-muted" style={{ fontSize: 13 }}>Discounted Sub Total</td>
                                    <th className="text-end">{priceFormat(discountedSub)}</th>
                                </tr>
                            </>
                        )}

                        {/* VAT on original items */}
                        <tr>
                            <td className="text-end text-muted" style={{ fontSize: 13 }}>VAT</td>
                            <th className="text-end">{priceFormat(vatTotal)}</th>
                        </tr>

                        {/* Total inc VAT (after discount, before credits) */}
                        <tr style={{ borderTop: "1px solid var(--bs-border-color)" }}>
                            <td className="text-end text-muted" style={{ fontSize: 13 }}>Total (inc VAT)</td>
                            <th className="text-end">{priceFormat(totalIncVat)}</th>
                        </tr>

                        {/* Credit wallet rows */}
                        {appliedWallets.map((wallet, i) => (
                            <tr key={i}>
                                <td className="text-end text-info" style={{ fontSize: 13 }}>
                                    Credit ({wallet?.code ?? wallet.id})
                                </td>
                                <td
                                    className="d-flex align-items-center justify-content-end gap-2 text-info"
                                    style={{ fontSize: 13 }}
                                >
                                    −{priceFormat(wallet.amount)}
                                    <Button isLight icon="Delete" color="danger" size="sm" onClick={() => onRemoveCredit(i)} />
                                </td>
                            </tr>
                        ))}

                        {/* Balance Due — only shown when credits applied */}
                        {creditTotal > 0 && (
                            <tr style={{ borderTop: "1px solid var(--bs-border-color)" }}>
                                <td className="text-end fw-semibold" style={{ fontSize: 13 }}>Balance Due</td>
                                <th className="text-end">{priceFormat(balanceDue)}</th>
                            </tr>
                        )}

                    </tbody>
                </table>
            </td>
        </tr>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
    row, index, formData, residentData,
    localAuthorityList, localICBList, fNCDetails,
    vatList, miscellaneousList, isMasterLoading,
    billingFormula, respiteCurrentInfoStatus,
    discountList, isDiscountLoading,
    updatedWallets, walletApplied, creditWalletInput,
    validator, isSubmitted,
    onAddMiscellaneous, onMiscellaneousChange, onDeleteMiscellaneous,
    onCreditWalletInputChange, onApplyWallet, onRemoveCredit,
    onApplyDiscount, onRemoveDiscount, onNotesChange,
}) => {
    const { darkModeStatus } = useDarkMode();
    const colorIndex = getColorNameWithIndex(index);

    const invoiceAddress = useMemo(
        () => getResidentInvoiceAddress(
            residentData, +row.invoiceTo, row.fundTypeId,
            { localAuthorityList, localICBList, fNCDetails },
        ),
        [residentData, row.invoiceTo, row.fundTypeId, localAuthorityList, localICBList, fNCDetails],
    );

    const appliedWalletsForRow = walletApplied.filter(w => w.applyInvoiceIndex === index);

    // gross = subTotal + vatTotal; discTotal is calculated on subTotal (pre-VAT)
    // balanceDue = (subTotal − discTotal) + vatTotal
    const { gross, vatTotal, subTotal, discTotal, balanceDue } = useMemo(
        () => calcRowTotals({ items: row.items, discounts: row.discounts ?? [] }),
        [row.items, row.discounts],
    );

    const creditTotal  = appliedWalletsForRow.reduce((s, w) => s + w.amount, 0);
    const finalBalance = +(balanceDue - creditTotal).toFixed(2);

    const formulaLabel    = getFormulaLabel(row.invoiceTo, residentData, formData, billingFormula, respiteCurrentInfoStatus);
    const hasCreditWallet = updatedWallets?.some(({ creditTo }) => creditTo === +row.invoiceTo);

    return (
        <Card shadow="none" className="border mb-3">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <CardHeader>
                <CardTitle>
                    <Badge isLight color={colorIndex} className="px-3 py-2" borderSize={2}>
                        {getLabelByValue(INVOICE_TO_TYPE_LIST, row.invoiceTo)} ({invoiceAddress?.shortName})
                    </Badge>
                    <span className="text-muted ms-2 d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                        <Icon icon="Info" size="sm" />
                        <strong>{formulaLabel}</strong>
                    </span>
                </CardTitle>
                <CardActions>
                    <Button isLight icon="Add" color="dark" onClick={() => onAddMiscellaneous(index)}>
                        Add Miscellaneous
                    </Button>
                </CardActions>
            </CardHeader>

            <CardBody>

                {/* ── Line items table ─────────────────────────────────────── */}
                <table className="table mb-0 table-fixed">
                    <thead>
                        <tr>
                            <th style={{ width: "12%" }}>Category</th>
                            <th style={{ width: "17%" }}>Description</th>
                            <th style={{ width: "17%" }}>Date</th>
                            <th style={{ width: "11%" }}>Weekly Price</th>
                            <th style={{ width: "14%" }}>VAT</th>
                            <th className="text-end" style={{ width: "10%" }}>VAT Amount</th>
                            <th className="text-end" style={{ width: "16%" }}>Amount (Inc VAT)</th>
                            <th style={{ width: "3%" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {row.items.map((item: IInvoiceItem, i: number) => (
                            <tr key={item.id} className="align-middle">

                                <td>
                                    <Badge isLight color={darkModeStatus ? "light" : "dark"} className="px-3 py-2" rounded={1}>
                                        {getLabelByValue(INVOICE_CATEGORY_LIST, item.category)}
                                    </Badge>
                                </td>

                                {item.category === INVOICE_CATEGORY.MISC ? (
                                    <>
                                        <td>
                                            <SearchableSelect
                                                isValid={validator.current.fieldValid(`Misc ${invoiceAddress?.shortName} ${i}`)}
                                                isTouched={isSubmitted}
                                                invalidFeedback={validator.current.message(
                                                    `Misc ${invoiceAddress?.shortName} ${i}`,
                                                    item.miscellaneousId,
                                                    "required",
                                                )}
                                                onChange={(e: any) =>
                                                    onMiscellaneousChange(index, item.id, "miscellaneousId", e.target.value)
                                                }
                                                name="miscellaneousId"
                                                value={item.miscellaneousId}
                                                isLoading={isMasterLoading}
                                                options={miscellaneousList}
                                                placeholder="Select Miscellaneous"
                                                labelKey="name"
                                                valueKey="id"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="date"
                                                className={`form-control shadow-none${isSubmitted && !item.period?.from ? " is-invalid" : ""}`}
                                                value={item.period?.from || ""}
                                                onChange={(e: any) =>
                                                    onMiscellaneousChange(index, item.id, "period", {
                                                        ...item.period,
                                                        from: e.target.value,
                                                    })
                                                }
                                            />
                                        </td>
                                        <td className="text-muted">—</td>
                                        <td>
                                            <SearchableSelect
                                                isValid={validator.current.fieldValid(`VAT ${invoiceAddress?.shortName} ${i}`)}
                                                isTouched={isSubmitted}
                                                invalidFeedback={validator.current.message(
                                                    `VAT ${invoiceAddress?.shortName} ${i}`,
                                                    item.vatId,
                                                    "required",
                                                )}
                                                id="vatId"
                                                name="vatId"
                                                value={item.vatId ?? ""}
                                                onChange={(e: any) =>
                                                    onMiscellaneousChange(index, item.id, "vatId", e.target.value)
                                                }
                                                options={vatList}
                                                labelKey="rate"
                                                valueKey="id"
                                                renderLabel={(vat: IVat) =>
                                                    `${Number(vat.rate).toFixed(1)}% - ${vat.name}`
                                                }
                                                placeholder="Select VAT Rate"
                                            />
                                        </td>
                                        <td className="text-end">{priceFormat(item.vatAmount || 0)}</td>
                                        <td className="text-end">
                                            <input
                                                type="number"
                                                className={`form-control shadow-none text-end${isSubmitted && !item.amount ? " is-invalid" : ""}`}
                                                value={item.amount}
                                                placeholder="Enter Amount"
                                                onChange={(e: any) =>
                                                    onMiscellaneousChange(index, item.id, "amount", e.target.value)
                                                }
                                            />
                                        </td>
                                        <td>
                                            <Button isLight icon="Delete" color="danger" onClick={() => onDeleteMiscellaneous(index, item.id)} />
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>
                                            {item.description ??
                                                getInvoiceDescriptions(
                                                    invoiceAddress,
                                                    priceFormat(item.weekPrice),
                                                    row.invoiceTo,
                                                )}
                                        </td>
                                        <td>
                                            {moment(item?.period?.from).format("DD MMM YYYY")} –{" "}
                                            {moment(item?.period?.to).format("DD MMM YYYY")}
                                        </td>
                                        <td>{priceFormat(item.weekPrice)}</td>
                                        <td>{Number(item.vatRate).toFixed(1)}%</td>
                                        <td className="text-end">{priceFormat(item.vatAmount)}</td>
                                        <td className="text-end">{priceFormat(item.amount)}</td>
                                        <td></td>
                                    </>
                                )}
                            </tr>
                        ))}

                        <TotalsRow
                            subTotal={subTotal}
                            vatTotal={vatTotal}
                            gross={gross}
                            discTotal={discTotal}
                            creditTotal={creditTotal}
                            balanceDue={finalBalance}
                            appliedWallets={appliedWalletsForRow}
                            onRemoveCredit={onRemoveCredit}
                        />
                    </tbody>
                </table>

                {/* ── Discount section — invoiceBase = subTotal (pre-VAT) ───── */}
                <DiscountApplyCard
                    discountList={discountList}
                    isLoading={isDiscountLoading}
                    appliedDiscounts={row.discounts ?? []}
                    invoiceBase={subTotal}
                    onApply={discount => onApplyDiscount(index, discount)}
                    onRemove={discountId => onRemoveDiscount(index, discountId)}
                />

                {/* ── Credit wallet ─────────────────────────────────────────── */}
                {hasCreditWallet && (
                    <div className="row mt-3">
                        <div className="col-12">
                            <CreditWalletApplayCard
                                applayWalletList={creditWalletInput}
                                invoiceTo={+row.invoiceTo}
                                updatedWalletList={updatedWallets}
                                onChange={onCreditWalletInputChange}
                                onApply={onApplyWallet}
                            />
                        </div>
                    </div>
                )}

                {/* ── Notes ────────────────────────────────────────────────── */}
                <div className="mt-3">
                    <label
                        className="form-label text-muted mb-1"
                        style={{
                            fontSize     : 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontWeight   : 500,
                        }}
                    >
                        Notes
                    </label>
                    <textarea
                        className="form-control shadow-none"
                        rows={2}
                        placeholder="Internal notes for this invoice…"
                        value={row.notes ?? ""}
                        onChange={e => onNotesChange(index, e.target.value)}
                        style={{ fontSize: 13, resize: "vertical" }}
                    />
                </div>

            </CardBody>
        </Card>
    );
};