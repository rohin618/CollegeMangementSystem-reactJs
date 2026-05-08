// ─── invoiceForm.types.ts ─────────────────────────────────────────────────────

export type {
    IInvoiceModel,
    IInvoiceItem,
    IInvoiceDiscount,
    IinvoiceCreditApply,
    IInvoiceItemPeriod,
} from "../invoice";

// ─── Discount master from getAllDiscounts API ─────────────────────────────────

export interface IDiscountMaster {
    id                : string;
    code              : string;
    name              : string;
    discountType      : number;           // DISCOUNT_TYPE.PERCENTAGE=1 | AMOUNT=2
    discountValue     : number | string;  // used when PERCENTAGE
    discountAmount    : number;           // used when AMOUNT
    maxDiscountAmount : number;           // % cap — 0 = no cap
    minAmount         : number;           // min invoice base required
    usageLimit        : string | number;
    usedCount         : number;
    colorIndex       ?: string;
    startDate         : string;           // "YYYY-MM-DD"
    endDate           : string;           // "YYYY-MM-DD"
    status            : number;           // DISCOUNT_STATUS.ACTIVE=1 | INACTIVE=2 | EXPIRED=3
    applicableType   ?: number;           // DISCOUNT_APPLICABLE_TYPE.ROOM=2 etc.
}

// ─── Credit wallet UI types ───────────────────────────────────────────────────

export interface ICreditWalletUpdated {
    creditTo   : number;
    fundTypeId : string;
    wallets    : any[];
}

export interface IWalletApplied {
    id               : string;
    amount           : number;
    creditTo         : number;
    fundTypeId       : string;
    applyInvoiceIndex: number;
    code            ?: string;
}

// ─── VAT ─────────────────────────────────────────────────────────────────────

export interface IVat {
    id  : string;
    rate: number;
    name: string;
}

// ─── IInvoiceRow = IInvoiceModel + UI helper ──────────────────────────────────

import { IInvoiceModel } from "../invoice";

export interface IInvoiceRow extends IInvoiceModel {
    invoiceAddress?: any;
}