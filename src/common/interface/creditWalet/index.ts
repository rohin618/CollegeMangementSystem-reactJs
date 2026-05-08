import { FieldValue } from "firebase/firestore";
import { IInvoiceItem, IInvoiceModel } from "../invoice";


export interface ICreditApply {
    id: string;         // UID
    invoiceId: string;  // Applied invoice id
    amount: number;
}

export interface ICreatedInfo {
    date: FieldValue;
    user: string;
}

export interface IUpdatedInfo {
    date?: FieldValue | string;
    user?: string;
}

export interface ICreditWalletModel {
    id?: string;
    companyId: string;
    date: string;
    code: string;
    status: string | number;            // If you have BANK_STATUS enum, we can replace later
    invoiceId: string;
    residentId: string;
    fundTypeId: string;
    paymentMethod: string | number;
    refNo: string;
    bankId: string;

    creditApply: ICreditApply[] | [];

    creditTo: string | number;
    paymentRefId: string;
    items?: IInvoiceItem[];
    subTotal: number;
    vatTotal: number;

    vatId: string;
    notes: string;
    vatRate: number;

    creditAmount: number;

    type: string | number;
    invoices?:IInvoiceModel[]

    created: ICreatedInfo;
    updated: IUpdatedInfo[];
}
