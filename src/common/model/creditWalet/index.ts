
import { serverTimestamp } from "firebase/firestore";
import { CREDIT_STATUS, CREDIT_TYPE } from "../../constant";


export const creditWaletModel = {
  companyId: "",
  date: '',
  code: "",
  status: 1,   // ✅ maybe change to BANK_STATUS instead?
  invoiceId: "",                 // ✅ changed to camelCase
  residentId: "",
  fundTypeId: "",
  paymentMethod: "",
  refNo: "",
  bankId: "",
  creditApply: [
    // {
    //   id:"", //UID
    //   invoiceId:"" //Applay invoiceId
    // amount:0
    // }
  ],
  creditTo: "",
  paymentRefId: '',
  subTotal: 0,
  vatTotal: 0,
  vatId: '',
  vatRate: 0,
  creditAmount: 0,
  type: CREDIT_TYPE.ADJUSTMENT_CREDIT,
  notes: "",
  items: [
    // {
    //     id: generateUid(),               // uuid or ref id
    //     category: INVOICE_CATEGORY.BED, // BED | ROOM | MISC
    //     description: "",
    //     qty: 1,
    //     weekPrice: 0,
    //     amount: 0,
    //     vatId: "",
    //     vatRate: 0,
    //     vatAmount:0,
    //     period: { from: "", to: "" }
    // }
  ],
  created: {
    date: serverTimestamp(),
    user: ""
  },
  updated: [] // array of { date, user, changes }
}



