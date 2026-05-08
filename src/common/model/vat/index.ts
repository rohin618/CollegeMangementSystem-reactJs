
import { serverTimestamp } from "firebase/firestore";
import { BED_STATUS, ROOM_STATUS, PRICE_PERIOD_STATUS } from '../../constant'
import { VAT_STATUS } from "../../constant/app";

export const VATModel = {
  companyIds: [],               // link to the company
  name: "",                    // e.g., GST, VAT, Service Tax
  code: "",                    // e.g., GSTIN / tax code
  rate: 0,                     // number for % (e.g., 18)
  efftDateFrom: "",            // YYYY-MM-DD or Timestamp
//   efftDateTo: null,            // optional, for expiry
  description: "",
  status: VAT_STATUS.ACTIVE,              // replaces generic "status"
  created: {
    date: serverTimestamp(),
    user: ""                   // uid of creator
  },
  updated: []
};
