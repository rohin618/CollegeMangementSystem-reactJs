
import { serverTimestamp } from "firebase/firestore";
import { BED_STATUS, ROOM_STATUS, PRICE_PERIOD_STATUS } from '../constant'
import generateData from "../function/generateData";
import { generateUid } from "../../helpers/helpers";

export const bedModel = {
    roomId: "",
    bedName: '',
    bedStatus: BED_STATUS.AVAILABLE,
    pricePeriods: [
        {
            id:generateUid(),
            sDate: '',//toLocaleString is Adapts for user time zone
            eDate: '',  //toLocaleString is Adapts for user time zone
            pricePerWeek: 0,
            minPricePerWeek: 0,
            status: PRICE_PERIOD_STATUS.ACTIVE
        }
    ],
    created: {
        date: serverTimestamp(),
        user: ""
    },
    updated: []
};

