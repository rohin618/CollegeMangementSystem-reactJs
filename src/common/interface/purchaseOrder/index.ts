export interface IPurchaseOrderModal {
    id?: string;
    code: number;
    vendorId: string;
    date: string;
    deliveryDate: string;
    notes: string;
    items: IPurchaseOrderItem[];
    created: {
        date: any;
        userId: string;
    };

    updated: any[];


    subTotal: number;
    vatTotal: number;
    totalPrice: number;
    status: number;
    vatMode:number;
    cancelOrPartialCmt:string;
    mdComment: string;
    debitApply:IDebitApply[];

    requestedBy: string;
    internalMemo: string;
}

export interface IPurchaseOrderItem {

    id?: string;               // uuid or ref id
    productId: string;
    description: string;
    qty: number | null;
    unitPrice: number | null; // inclide Vat
    coaMapping: ICOAMapping;
    totalAmount: number;
    vatRate: number;
    vatAmount: number;
    vatId:string;
    unitOfMeasurementId:string;
}

export interface ICOAMapping {
    // category: number;
    accountId: string; 
    type: string;
}
export interface IDebitApply {
    id: string;
    debitNoteId: string; 
    amount: number;
}

