
import { serverTimestamp } from "firebase/firestore";
import { LA_STATUS, VAT_CONFIG_STATUS } from '../constant'
import { generateUid } from "../../helpers/helpers";


export const fnmModel = {
    companyId: "",
    name: "FNC",
    address: "",
    phone: "",
    email: "",
    postCode: "",
    buildingNumber: "",
    area: "",
    country: "United Kingdom",
    status: LA_STATUS.ACTIVE,
    fncContribut: '',
    vatId: '',
    priceInfo: [

        {
            perWeek: "",
            sDate: "",
            eDate: ""
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
    updated: []
};
