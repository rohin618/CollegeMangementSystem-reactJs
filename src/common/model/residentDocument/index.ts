
import { serverTimestamp } from "firebase/firestore";
import { DOCUMENT_TYPE, DOCUMENT_STATUS, PRICE_PERIOD_STATUS } from '../../constant'
import { VAT_STATUS } from "../../constant/app";

export const residentDocumentsModel = {
    companyId: '',
    residentId:"",
    name: "",
    description: "",
    fundSDate: '',                 // e.g., GST, VAT, Service Tax
    fundEDate: '',                   // e.g., GST, VAT, Service Tax
    size: "",                    // e.g., GSTIN / tax code
    type: '',
    isSigned: false,
    fileUrl: "",
    status: DOCUMENT_STATUS.ACTIVE,              // replaces generic "status"
    created: {
        date: serverTimestamp(),
        user: ""                   // uid of creator
    },
    updated: []
};
