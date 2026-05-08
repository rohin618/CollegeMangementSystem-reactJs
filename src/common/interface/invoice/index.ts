import { FieldValue } from "firebase/firestore";


export interface IInvoiceItemPeriod {
    from: string;
    to: string;
}
export interface IInvoiceDiscount {
    discountId: string;
    code: string;
    name: string;

    type: string | number; // PERCENTAGE | AMOUNT

    value: number; // 10 (%) or 50 (£)

    amount: number; // calculated discount amount
}
export interface IInvoiceItem {
    id: string;
    category: string | number; // BED | ROOM | MISC
    description: string;
    qty: number;
    weekPrice: number;
    amount: number;
    vatId: string;
    vatRate: number;
    period: IInvoiceItemPeriod;
    vatAmount: number
    miscellaneousId?: string
}

export interface IinvoiceCreditApply {
    id: string;
    amount: number;
    creditWalletId?: string;
}

export interface IArrearsApply {
    invoiceId: string;
    amount: number;
    weekPrice?: number;
}

export interface IPayedInfo {
    amount: number;
    date: string;
    paymentRef: string;
    method: string; // cash, bank, card, etc.
}

// Shared from your previous structure
export interface IUpdatedInfo {
    date?: FieldValue | string;
    user?: string;
}

export interface ICreatedInfo {
    date: FieldValue;
    user: string;
}

export interface IInvoiceModel {
    id?: string;
    roomId: string;
    bedId: string;
    residentId: string;
    invoiceTo: number | string;
    fundTypeId: string;
    emailStatus: number;
    status: number;
    code: string;
    type: string | number;
discounts: IInvoiceDiscount[];
    invoiceDate: string;
    sDate: string;
    eDate: string;
    fundType: string
    fundSource: string;
    fncStatus: string;
    incontStatus: string;
    notes: string;
    dueDay: string | number;

    items: IInvoiceItem[];

    // Financial settlement
    isArrearsSettled: boolean;
    isCreditWalletSettled: boolean;

    creditApply: IinvoiceCreditApply[];
    arrearsApply: IArrearsApply[];

    payedInfo: IPayedInfo[];

    // Totals
    subTotal: number;
    vatTotal: number;
    totalPrice: number;
    balanceDue: number;

    created: ICreatedInfo;
    updated: IUpdatedInfo[];
    companyId?: string
    seq?: number
    parentInvoiceId?: string
}
