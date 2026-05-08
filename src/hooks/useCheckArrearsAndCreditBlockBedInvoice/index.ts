
import { useMemo } from "react";
import { checkArrearsAndCreditBlockBedInvoice, generateUid } from "../../helpers/helpers";
import { IInvoiceModel, ILaAndICBModel } from "../../common/interface";


/* ---------------- Main Hook ---------------- */

interface ArrearsItem {
    vatRate: number;
    id: string;
    description: string;
    weekPrice: number;
    oldweekPrice?: number;
    amount: number;
    vatId: string;
    qty: number;
    category: number;
    period: { from: string; to: string };
    diffAmount: number;
    subTotal: number;
}

interface InvoiceRow {
    startDate: string;
    endDate: string;
    totalPrice: number;
    arrearsDiff: number;
    arrearsTotalPrice: number;
    invoiceTo: number;
    originalInvoice: IInvoiceModel;
    arrearsItems: ArrearsItem[];
};


interface IuseCheckArrearsAndCreditBlockBedInvoice {
    invoiceList: IInvoiceModel[];
    isCredit: boolean;
    laOrICBfundDetails?: ILaAndICBModel;
    vatList: any[];
}


export function useCheckArrearsAndCreditBlockBedInvoice({
    invoiceList,
    isCredit,
    laOrICBfundDetails,
    vatList,
}: IuseCheckArrearsAndCreditBlockBedInvoice): InvoiceRow[] {
    return useMemo(() => {
        if (!laOrICBfundDetails) return [];
     
        const reqObj: IuseCheckArrearsAndCreditBlockBedInvoice = {
            invoiceList,
            isCredit,
            laOrICBfundDetails,
            vatList,
        }

        return checkArrearsAndCreditBlockBedInvoice(reqObj)
    }, [
        invoiceList,
        isCredit,
        laOrICBfundDetails,
        vatList,
    ]);
}

