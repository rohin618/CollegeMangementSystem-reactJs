
export interface IPersonalInfo {
    name: string;
    gender: number | string;
    dob: string;
    email: string;
    phone: string;
    addres: string;
    salutation: number | string;
}

export interface IRespiteStatus {
    status: string;
    sDate: string;
    eDate: string;
}

export interface IFeesIncrementInfo {
    percentage: string;
    date: string;
}

export interface IAdmissionInfo {
    admissionDate: string;
    typeOfPlacement: string;
    respiteSDate: string;
    respiteEDate: string;

    respiteStatusList: IRespiteStatus[];

    invoiceRequest: number | string;
    invoiceMode: number | string;
    residentStatus: number | string;
    dateDischargeAndRip: string;
    contractStatus: number | string;
    noOfRespiteWeeks: string;

    bookingType: number | string;

    feesIncrementInfo: IFeesIncrementInfo[];
}

export interface IIncontDetail {
    perWeek: string;
    sDate: string;
    eDate: string;
}

export interface IIaOrContributionInfo {
    perWeek: string;
    sDate: string;
    eDate: string;
}

export interface IFundDetail {
    fundSource: string | number;
    clientId: string;
    nameOfLa: string;
    nameIbc: string;

    laContribution: number;

    fundType: string | number;
    clientContribution: string | number;
    clientContributionSdate: string;

    fncStatus: string | number;
    fncSdate: string;

    incontStatus: string | number;
    incontDetails: IIncontDetail[];

    sDate: string;
    eDate: string;
    status: string | number;

    familyTopupStatus: number | string;
    familyTopupEffectiveDate: string;
    familyTopupPrice: string | number;

    thirdPartyTopupStatus: number | string;
    thirdPartyTopupEffectiveDate: string;
    thirdPartyTopupPrice: string | number;
}

export interface INok {
    salutation: number;
    name: string;
    email: string;
    address: string;
    phone: string;
    relation: string;

    lpa: string;
    lpaSdate: string;

    townOrCity: string;
    county: string;
    postcode: string;

    invoiceRequired: number;
}

export interface IRoomPrice {
    perWeek: string;
    sDate: string;
    eDate: string;
    status: string;

    isBelowMinPrice: boolean;
    laOrContributionInfo: IIncontDetail
}

export interface IBillingInfo {
    name: string;
    addressLine1: string;
    addressLine2: string;
    townOrCity: string;
    county: string;
    postcode: string;
    country: string;
    phoneNumber: string;
}

export interface IAdvanceUsage {
    type: string;
    amount: number;
    date: string;
    invoiceId?: string;
    transactionId?: string;
    note?: string;
}

export interface IAdvancePayment {
    totalAmount: number;
    status: number | string;
    remarks: string;
    date: string;
    balanceAmount: number;
    usageHistory: IAdvanceUsage[];
}

export interface IRoomHistory {
    id: string;
    roomId: string;
    bedId: string;
    bookingType: string; // or BOOKING_TYPE if strictly same enum
    sDate: string;
    eDate: string | null;
    status: string;
    note: string;
}

export interface IResidentModel {
    id: string;
    bedId: string;
    roomId: string;

    personal: IPersonalInfo;
    admission: IAdmissionInfo;

    fundDetails: IFundDetail[];

    nok: INok[];

    roomPrice: IRoomPrice[];

    billing: IBillingInfo;

    advancePayment: IAdvancePayment;

    roomHistory: IRoomHistory[];
}
