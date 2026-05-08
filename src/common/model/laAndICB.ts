
import { serverTimestamp } from "firebase/firestore";
import { BLOCK_BEDS_STATUS, LA_STATUS, PREBOOK_HISTORY_STATUS, VAT_CONFIG_STATUS } from '../constant'
import { generateUid } from "../../helpers/helpers";


export const laAndICBModel = {
    companyId: "",
    name: "",
    shortName: "",
    address: "",
    phone: "",
    email: "",
    postCode: "",
    buildingNumber: "",
    area: "",
    country: "United Kingdom",
    vatId: '',
    status: LA_STATUS.ACTIVE,
    blockBedHistory: [
        // {
        //     residentId: "abcd123",
        //     bedId: "bed001",
        //     roomId: "R101",
        //     sDate: "11/11/2025",
        //     eDate: "", // empty at creation time
        //     status: PREBOOK_HISTORY_STATUS.ACTIVE,
        //     blockBedId: bedBlockActive.id,
        //     id: generateUid() // generated unique ID
        // }
    ],
    blockBeds: [
        {
            id: generateUid(),
            noOfBlockBed: '',
            perWeek: '',
            sDate: '',
            eDate: '',
            status: BLOCK_BEDS_STATUS.ACTIVE,
        }
    ],
    vatConfigList: [
        {
            id: '',
            vatId: "",
            vatEffectiveDate: '',
            status: VAT_CONFIG_STATUS.ACTIVE
        }
    ],
    created: {
        date: serverTimestamp(),
        user: ""
    },
    updated: [],
};