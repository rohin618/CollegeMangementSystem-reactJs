
import { serverTimestamp } from "firebase/firestore";
import { BED_STATUS, ROOM_STATUS, PRICE_PERIOD_STATUS, BANK_STATUS, PRIMARY_ACCOUNT } from '../constant'
import { PRICE_PERIOD_STATUS_LIST } from "../data/option";

export const bankModel = {

  companyId: "",
  openingBalance: 0,
  bankName: "",
  accountName: "",
  accountNumber: "",
  sortCode: "",
  IBAN: "",
  BIC: "",
  bankAddress: "",
  primaryAccount: PRIMARY_ACCOUNT.NO,
  status: BANK_STATUS.ACTIVE,   // ✅ maybe change to BANK_STATUS instead?
  created: {
    date: serverTimestamp(),
    user: ""
  },
  updated: [], // array of { date, user, changes }

}
