import { serverTimestamp } from "firebase/firestore";
import { MISCELLANEOUS_STATUS } from '../../constant'

export const miscellaneousServicesModel = {
    name: '',
    code: 1001,
    vatId:'',
    status: MISCELLANEOUS_STATUS.ACTIVE,
    created: {
        date: serverTimestamp(),
        user: ""
    },
    updated: [] // array of { date, user, changes }
}
