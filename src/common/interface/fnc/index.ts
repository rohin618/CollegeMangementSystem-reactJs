

export interface IFnmPriceInfo {
    perWeek: string | number;
    sDate: string;
    eDate: string;
}

export interface IVatConfig {
    id: string;
    vatId: string;
    vatEffectiveDate: string;
    status:  string | number;
}

export interface ICreatedInfo {
    date: any;  // Firestore timestamp
    user: string;
}

export interface IUpdatedInfo {
    date: any;
    user: string;
}

export interface IFNCModel {
    id?:string;
    companyId: string;
    name: string;
    address: string;
    phone: string;
    postCode: string;
    buildingNumber: string;
    area: string;
    country: string;

    status:  string | number;

    fncContribut: string | number;
    vatId: string;

    priceInfo: IFnmPriceInfo[];

    vatConfigList: IVatConfig[];

    created: ICreatedInfo;
    updated: IUpdatedInfo[];
}
