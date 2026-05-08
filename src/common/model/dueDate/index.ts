import { serverTimestamp } from "firebase/firestore";
import { DUEDATE_STATUS } from "../../constant/app";

export const DueDateModel = {
  name: "",
  day: "",
  status:DUEDATE_STATUS.ACTIVE,
   created: {
      date: serverTimestamp(),
      user:'',
    },
    updated: []
}  