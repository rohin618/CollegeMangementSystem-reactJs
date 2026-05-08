// hooks/useGenerateInvoiceRows.ts
import { useMemo } from "react";
import { createInvoiceDataByDate, } from "../../helpers/helpers";

interface VatInfo {
    id?: string;
    rate?: number;
};

interface CreateInvoiceDataByDateParams {
    formData: {
        sDate: string;
        eDate: string;
    };
    residentData: {
        id: string;
        roomId?: string;
        bedId?: string;
        fundDetails?: any[];
        roomPrice?: any[];
        admission?: {
            admissionDate?: string;
        };
        [key: string]: any;
    };
    invoiceModel: Record<string, any>;
    fundSource: number;
    fncStatus: number;
    incontStatus: number;
    fundType: number;
    localAuthorityList: any;
    localICBList: any;
    vatList: any[];
    fNCDetails: any;
    isOpen?: boolean;
    billingFormula: any
}


const getVatAmount = (total: number, vatRate?: number) => {
    if (!vatRate || vatRate <= 0) return 0;
    const vatAmount = total - total / (1 + vatRate / 100);
    return +vatAmount.toFixed(2);
};


export function useGenerateInvoiceRows(invoice: CreateInvoiceDataByDateParams) {


    const {
        formData,
        residentData,
        fNCDetails,
        isOpen,
    }: CreateInvoiceDataByDateParams = invoice;




    return useMemo(() => {
        if (!isOpen) return []


        return createInvoiceDataByDate({ ...invoice, isShowBlockBednotify: true })
    }, [residentData?.fundDetails, residentData?.roomPrice, fNCDetails, formData?.sDate, formData?.eDate, isOpen]);
}
