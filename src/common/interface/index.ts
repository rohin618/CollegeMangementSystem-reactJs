export type {IPersonalInfo,IRespiteStatus,IFeesIncrementInfo,IAdmissionInfo,IIncontDetail,IFundDetail,INok,IRoomPrice ,IBillingInfo ,IAdvanceUsage,IAdvancePayment ,IRoomHistory,IResidentModel} from './resident'
export type {IInvoiceModel ,IinvoiceCreditApply ,IInvoiceItem} from './invoice'
export type {ICreditWalletModel,ICreditApply} from './creditWalet'
export type {ILaAndICBModel} from './laAndICB'
export type {IFNCModel} from './fnc'

export interface PricePeriod {
  sDate: string;
  eDate: string;
  pricePerWeek: number;
  minPricePerWeek?: number;
}

export interface Bed {
  id: string | null;
  bedName: string;
  bedStatus?: number;
  pricePeriods?: PricePeriod[];
}

export interface BedRef {
  bedId: string;
  status?: number;
}

export interface Room {
  id: string;
  roomNumber: string | number;
  floor?: string | number;
  description?: string;
  status?: number;
}

export interface RoomReport {
  date: string;
  roomId: string;
  beds: BedRef[];
}

export interface ProcessedBed {
  bedId: string;
  bedName: string;
  bedStatus?: number;
  pricePerWeek: number | null;
  minPricePerWeek: number | null;
  available: boolean;
}

export interface ProcessedRoom {
  roomId?: string;
  roomNumber?: string | number;
  floor?: string | number;
  description?: string;
  status?: number;
  beds: ProcessedBed[];
}

export interface DateWiseRoomAvailability {
  date: string;
  rooms: ProcessedRoom[];
}
