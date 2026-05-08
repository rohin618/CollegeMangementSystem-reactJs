import { FieldValue } from "firebase/firestore";

export interface IPricePeriod {
    sDate: string; // stored as string (formatted via toLocaleString)
    eDate: string;
    pricePerWeek: number;
    minPricePerWeek: number;
    status: string | number;
}

export interface ICreatedInfo {
    date: FieldValue; // serverTimestamp()
    user: string;
}

export interface IUpdatedInfo {
    date?: FieldValue | string;
    user?: string;
}

export interface IBedModel {
    roomId: string;
    bedName: string;
    bedStatus: string | number;
    pricePeriods: IPricePeriod[];
    created: ICreatedInfo;
    updated: IUpdatedInfo[];
}
