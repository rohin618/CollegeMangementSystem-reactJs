
import { serverTimestamp } from "firebase/firestore";
import { COMPANY_STATUS } from '../constant'

export const companyModel = {
    name: "",
    status: COMPANY_STATUS.ACTIVE,
    tradeName: "",
    shortName: "",
    address: "",
    phone: "",
    email: "",
    postCode: "",
    buildingNumber: "",
    privateBillingPattern: "",
    familyTopupPattern: '',
    ccBillingPattern: "",
    logo: "",
    vatRegNo: "",
    companyRegNo: "",
    area: "",
    country: "United Kingdom",
    registerManager:'',

    smtpUser: '',
    smtpPass: '',
    created: {
        date: serverTimestamp(),
        user: ""
    },
    updated: []
};

