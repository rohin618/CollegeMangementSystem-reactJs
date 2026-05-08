

import { serverTimestamp } from "firebase/firestore";
import { OPENING_BALANCE_STATUS } from '../../constant';
import { IOpeningBalanceModel } from "../../interface/openingBalance";
import { CHART_OF_ACCOUNTS_CATEGORY_TYPE } from "../../constant";

export const openingBalanceModel: IOpeningBalanceModel = {
    roomId: "",              // Required if type = ROOM
    bedId: "",
    residentId: "",
    openingBalanceTo: "",           // Client or external payer
    fundTypeId: "",
    dueDay: '',
    // Core invoice details
    status: OPENING_BALANCE_STATUS.PENDING,
    code: "",
    openingBalanceDate: '', //Need tocrete
    notes: "",
    supplierId: "",
    invoiceId: "",
    creditWalletId: '',
    totalPrice: 0, //Ned to TOfIX
    coaMapping: {
        category: CHART_OF_ACCOUNTS_CATEGORY_TYPE.ACCOUNTS_RECEIVABLE,
        accountId: '',
        type: '' //"DEBIT" | "CREDIT";
    },

    paymentMethod: "",
    refNo: "",
    bankId: "",

    created: {
        date: serverTimestamp(),
        user: ""
    },
    updated: []
};
