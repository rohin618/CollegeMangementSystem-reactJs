import { FieldValue, Timestamp } from "firebase/firestore";
import { OPENING_BALANCE_STATUS } from "../../constant";

export interface IOpeningBalanceCreditApply {
    id: string;
    amount: number;
    creditWalletId: string;
}

export interface IOpeningBalancePaymentInfo {
    amount: number;
    date: string;          // YYYY-MM-DD
    paymentRef: string;
    method: string | number;
}

export interface IOpeningBalanceCreated {
    date: Timestamp | FieldValue | null;
    user: string;
}

export interface IOpeningBalanceUpdated {
    date: Timestamp | FieldValue | null;
    user: string;
}

export interface ICoaDetails {
    accountId: string;
    type: string;
    category: number
}


export interface IOpeningBalanceModel {
    roomId?: string;       // Required if type = ROOM
    bedId?: string;
    residentId?: string;
    openingBalanceTo: string | number;      // Client / External Payer
    fundTypeId: string;
    status: string | number;
    code: string;
    openingBalanceDate: string;    // YYYY-MM-DD
    notes?: string;
    supplierId: string;
    invoiceId: string;
    creditWalletId: string;
    totalPrice: number;
    coaMapping: ICoaDetails
    created: IOpeningBalanceCreated;
    updated: IOpeningBalanceUpdated[];
    dueDay: number | '',

    
    paymentMethod: string | number;
    refNo: string;
    bankId: string;
}
