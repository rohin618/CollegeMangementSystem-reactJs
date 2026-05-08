
import { serverTimestamp } from "firebase/firestore";
import { INVOICE_STATUS, INVOICE_TYPE, INVOICE_CATEGORY,EMAIL_STATUS } from '../constant'
import { generateUid } from "../../helpers/helpers";
import { IInvoiceModel } from "../interface";


export const invoiceModel: IInvoiceModel = {
    roomId: "",              // Required if type = ROOM
    bedId: "",
    residentId: "",
    invoiceTo: "",           // Client or external payer
    fundTypeId: "",
    // Core invoice details
    status: INVOICE_STATUS.DRAFT,
    code: "",
    type: INVOICE_TYPE.NORMAL, // NORMAL, ROOM, MISC, MIXED
    invoiceDate: '',
    sDate: "",                // Period start
    eDate: "",                // Period end
    fundSource: "", // LA ID OR ICB ID OR FNC
    fncStatus: "",
    incontStatus: "",
    dueDay: "",
    fundType: "",
    // Billing items (room rent, services, misc, etc.)
    items: [
        {
            id: generateUid(),               // uuid or ref id
            category: INVOICE_CATEGORY.BED, // BED | ROOM | MISC
            description: "",
            qty: 1,
            weekPrice: 0,
            amount: 0,
            vatId: "",
            vatRate: 0,
            vatAmount: 0,
            period: { from: "", to: "" }
        }
    ],

    // Financial settlement
    isArrearsSettled: false,
    isCreditWalletSettled: false,
    creditApply: [
        // {
        //     id: '',
        //     amount: 0
        // creditWalletId:""
        // }
    ],
    arrearsApply: [
        // {
        //     invoiceId: '',
        //     amount: 0
        // weekPrice
        // }
    ],
    payedInfo: [
        // {
        //     amount: 0,
        //     date: '',
        //     paymentRef: '',
        //     method: '' // cash, bank, card, etc.
        // }
    ],
    discounts: [
//   {
//     discountId: "",
//     code: "",
//     name: "",

//     type: "", // PERCENTAGE | AMOUNT

//     value: 0,

//     amount: 0 // calculated discount amount
//   }
],
    notes:"",

    // Totals
    subTotal: 0,
    vatTotal: 0,
    totalPrice: 0,
    balanceDue: 0,
    emailStatus: EMAIL_STATUS.NOT_SENT,
    // emailSentAt: new Date(),

    created: {
        date: serverTimestamp(),
        user: ""
    },
    updated: []
};
