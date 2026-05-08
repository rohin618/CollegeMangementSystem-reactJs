// ─── invoiceForm.helpers.ts ───────────────────────────────────────────────────
// Pure helpers — no React. Fully unit-testable.

import { DISCOUNT_STATUS, DISCOUNT_TYPE } from "../../common/constant";
import { IDiscountMaster, IInvoiceDiscount, IInvoiceRow } from "../../common/interface/invoice/invoiceform";
import { priceFormat } from "../helpers";

// ─── Date ─────────────────────────────────────────────────────────────────────

const todayStr = (): string => new Date().toISOString().slice(0, 10);

// ─── Discount status ──────────────────────────────────────────────────────────

export type TDiscountStatus = number | "NOT_STARTED";

export function getDiscountStatus(d: IDiscountMaster): TDiscountStatus {
    if (d.status === DISCOUNT_STATUS.INACTIVE) return DISCOUNT_STATUS.INACTIVE;
    if (d.status === DISCOUNT_STATUS.EXPIRED)  return DISCOUNT_STATUS.EXPIRED;
    if (d.endDate   && todayStr() > d.endDate)   return DISCOUNT_STATUS.EXPIRED;
    if (d.startDate && todayStr() < d.startDate) return "NOT_STARTED";
    return DISCOUNT_STATUS.ACTIVE;
}

export const isDiscountActive = (d: IDiscountMaster): boolean =>
    getDiscountStatus(d) === DISCOUNT_STATUS.ACTIVE;

// ─── Discount calculation (base = subTotal, i.e. pre-VAT) ────────────────────

export function calcDiscountAmount(d: IDiscountMaster, subTotal: number): number {
    let raw: number;

    if (d.discountType === DISCOUNT_TYPE.PERCENTAGE) {
        raw = +(subTotal * Number(d.discountValue) / 100).toFixed(2);
        const cap = Number(d.maxDiscountAmount) || 0;
        if (cap > 0) raw = Math.min(raw, cap);
    } else {
        raw = Number(d.discountAmount);
    }

    // Never let discount exceed the pre-VAT subtotal
    return +Math.min(raw, subTotal).toFixed(2);
}

// ─── Display labels ───────────────────────────────────────────────────────────

export function getMasterDiscountLabel(d: IDiscountMaster): string {
    return d.discountType === DISCOUNT_TYPE.PERCENTAGE
        ? `${d.discountValue}% off`
        : `${priceFormat(Number(d.discountAmount))} off`;
}

export function getAppliedDiscountLabel(d: IInvoiceDiscount): string {
    return +d.type === DISCOUNT_TYPE.PERCENTAGE
        ? `${d.value}% off`
        : `${priceFormat(d.value)} off`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateDiscount(
    d      : IDiscountMaster,
    subTotal: number,           // ← pre-VAT base
    applied: IInvoiceDiscount[]
): string | null {
    const status = getDiscountStatus(d);
    if (status === DISCOUNT_STATUS.INACTIVE)
        return `"${d.code}" is currently inactive.`;
    if (status === DISCOUNT_STATUS.EXPIRED)
        return `"${d.code}" expired on ${d.endDate}.`;
    if (status === "NOT_STARTED")
        return `"${d.code}" is not valid yet — starts ${d.startDate}.`;

    const remaining = Number(d.usageLimit) - Number(d.usedCount);
    if (remaining <= 0)
        return `"${d.code}" has reached its usage limit.`;

    const minAmt = Number(d.minAmount) || 0;
    if (minAmt > 0 && subTotal < minAmt)
        return `Minimum invoice amount for "${d.code}" is ${priceFormat(minAmt)}.`;

    if (applied.find(x => x.discountId === d.id))
        return `"${d.code}" is already applied to this invoice.`;

    // Block if already-applied discounts have fully consumed the pre-VAT base
    const alreadyDiscounted = applied.reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const remainingBalance  = +(subTotal - alreadyDiscounted).toFixed(2);

    if (remainingBalance <= 0)
        return `Invoice balance is already fully discounted.`;

    return null;
}

// ─── Build IInvoiceDiscount from master (base = subTotal, pre-VAT) ────────────

export function buildInvoiceDiscount(
    master        : IDiscountMaster,
    subTotal      : number,             // ← pre-VAT base
    alreadyApplied: IInvoiceDiscount[] = []
): IInvoiceDiscount {
    const alreadyDiscounted = alreadyApplied.reduce(
        (s, d) => s + (Number(d.amount) || 0), 0
    );
    const remainingBase = +Math.max(subTotal - alreadyDiscounted, 0).toFixed(2);

    return {
        discountId: master.id,
        code      : master.code,
        name      : master.name,
        type      : master.discountType,
        value     : master.discountType === DISCOUNT_TYPE.PERCENTAGE
                        ? Number(master.discountValue)
                        : Number(master.discountAmount),
        // Capped at remaining pre-VAT balance
        amount    : calcDiscountAmount(master, remainingBase),
    };
}

// ─── Recalc % discounts when base changes ─────────────────────────────────────

export function recalcDiscounts(
    discounts : IInvoiceDiscount[],
    masterList: IDiscountMaster[],
    subTotal  : number              // ← pre-VAT base
): IInvoiceDiscount[] {
    return discounts.map(d => {
        const master = masterList.find(m => m.id === d.discountId);
        if (!master) return d;
        return { ...d, amount: calcDiscountAmount(master, subTotal) };
    });
}

// ─── Rebuild all row totals ───────────────────────────────────────────────────
//
//  Order:  subTotal (ex-VAT)
//          − discounts           ← applied on pre-VAT base
//          = discountedSubTotal
//          + vatTotal            ← VAT on original items (unchanged)
//          = balanceDue (gross after discount)

export function rebuildRowTotals(
    row       : IInvoiceRow,
    masterList: IDiscountMaster[]
): IInvoiceRow {
    const gross    = +row.items.reduce((s, i) => s + (Number(i.amount) || 0), 0).toFixed(2);
    const vatTotal = +row.items.reduce((s, i) => s + (Number(i.vatAmount) || 0), 0).toFixed(2);
    const subTotal = +(gross - vatTotal).toFixed(2);

    const discounts  = recalcDiscounts(row.discounts ?? [], masterList, subTotal);
    const discTotal  = +discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0).toFixed(2);

    // discount comes off pre-VAT subtotal; VAT is then added back
    const balanceDue = +(subTotal - discTotal + vatTotal).toFixed(2);

    return { ...row, discounts, subTotal, vatTotal, totalPrice: gross, balanceDue };
}

// ─── Quick totals read (no mutation) ─────────────────────────────────────────
//
//  Returned values:
//    subTotal   — ex-VAT
//    vatTotal   — VAT portion
//    gross      — subTotal + vatTotal  (no discounts)
//    discTotal  — total discount (applied on subTotal)
//    balanceDue — (subTotal − discTotal) + vatTotal

export function calcRowTotals(row: Pick<IInvoiceRow, "items" | "discounts">) {
    const gross      = +row.items.reduce((s, i) => s + (Number(i.amount) || 0), 0).toFixed(2);
    const vatTotal   = +row.items.reduce((s, i) => s + (Number(i.vatAmount) || 0), 0).toFixed(2);
    const subTotal   = +(gross - vatTotal).toFixed(2);
    const discTotal  = +(row.discounts ?? []).reduce((s, d) => s + (Number(d.amount) || 0), 0).toFixed(2);

    // Discount on pre-VAT, then VAT added back
    const balanceDue = +(subTotal - discTotal + vatTotal).toFixed(2);

    return { gross, vatTotal, subTotal, discTotal, balanceDue };
}