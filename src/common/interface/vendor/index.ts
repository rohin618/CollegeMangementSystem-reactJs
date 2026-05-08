
export interface IVendorModal {
    id?: string;
    name: string;
    code: number;
    tradeName: string;
    emailId: string;
    addressLine1:string;
    addressLine2:string;
    city:string;
    postCode: number | string;
    country: string;
    primaryContact: string;
    primaryPhone: number | string;
    secondaryContact: string;
    secondaryPhone: number | string;
    status: number | string;
    vatRegNo:string | number;
    referenceNo:string | number;



    bankName: string;
	accountName: string;
	accountNumber: number | string;
	sortCode: string;
	IBAN: string;
	BIC: string;
	bankAddress: string;


    paymentMode: number | string;
    description: string;
    emails: { id: string; email: string; isPrimary: boolean }[];
    phones: { id: string; phone: string; isPrimary: boolean }[];

    qualityScore?: number;
    pricingScore?: number;
    behaviourScore?: number;
    externalScore?: number;
    postDeliveryScore?: number;
    overallRating?: number;

    created: {
        date: any;
        userId: string;
    };

    updated: any[];
}
