import { serverTimestamp } from "firebase/firestore";
import { generateUid } from "../../../helpers/helpers";
import { CHART_OF_ACCOUNTS_CATEGORY_TYPE, GRN_STATUS_TYPE, PURCHASE_ORDER_STATUS, VAT_MODE_TYPE } from "../../constant";
import { IPurchaseOrderModal } from "../../interface/purchaseOrder";

export const purchaseorderModal: IPurchaseOrderModal = {
    code: 100,
    vendorId: "",
    date: "",
    deliveryDate: "",
    notes: "",
    items: [
        {
            id: generateUid(),               // uuid or ref id
            productId: "",
            description: "",
            qty: null,
            unitPrice: null, // inclide Vat
            coaMapping: {
                // category: CHART_OF_ACCOUNTS_CATEGORY_TYPE.ACCOUNTS_PAYABLE,
                accountId: '', // COA Masters
                type: '' //"DEBIT" | "CREDIT";
            },
            totalAmount: 0,
            vatRate: 0,
            vatAmount: 0,
            vatId:'',
            unitOfMeasurementId:'',
        }
    ],
    // Totals
    subTotal: 0,
    vatTotal: 0,
    totalPrice: 0,
    status: PURCHASE_ORDER_STATUS.DRAFT,
    vatMode: VAT_MODE_TYPE.INCLUDE,
    cancelOrPartialCmt:'', // For Cancel and partial
    mdComment: '',

    requestedBy: '',
    internalMemo: '',

    debitApply: [
        // {
        //     id:'',
        //     debitNoteId:'',
        //     amount:'',
        // }
    ],
    created: {
        date: serverTimestamp(),
        userId: '',
    },
    updated: []
}  