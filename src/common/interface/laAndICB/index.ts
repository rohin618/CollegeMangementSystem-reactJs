

export interface ICreatedInfo {
    date: any;      // Firestore timestamp
    user: string;
}

export interface IUpdatedInfo {
    date: any;
    user: string;
}

export interface IBlockBedHistory {
    id: string;
    residentId: string;
    bedId: string;
    roomId: string;
    sDate: string;
    eDate: string;
    status: string | number;
    blockBedId: string;
}

export interface IBlockBed {
    id: string;
    noOfBlockBed: string | number;
    perWeek: string | number;
    sDate: string;
    eDate: string;
    status:  string | number;
}

export interface IVatConfig {
    id: string;
    vatId: string;
    vatEffectiveDate: string;
    status: string | number;
}

export interface ILaAndICBModel {
    id?:string;
    companyId: string;
    name: string;
    shortName: string;
    address: string;
    phone: string;
    email: string;
    postCode: string;
    buildingNumber: string;
    area: string;
    country: string;
    vatId: string;
    status:  string | number;

    blockBedHistory: IBlockBedHistory[];
    blockBeds: IBlockBed[];
    vatConfigList: IVatConfig[];

    created: ICreatedInfo;
    updated: IUpdatedInfo[];
}
