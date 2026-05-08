import { serverTimestamp } from "firebase/firestore";
import { USER_STATUS ,SALUTATION } from '../constant'


export const userModel = {
    companyIds:'',
    code:'',
    salutation: SALUTATION.MR,
    name: "",
    email: '',
    phone: '',
    userType: '',
    status: USER_STATUS.ACTIVE,
    created: {
        date: serverTimestamp(),
        user: ""
    },
    updated: []
};
