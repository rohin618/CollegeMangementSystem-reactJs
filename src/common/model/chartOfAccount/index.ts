import { serverTimestamp } from "firebase/firestore";
import { CHART_OF_ACCOUNTS_CATEGORY_TYPE, CHART_OF_ACCOUNTS_STATUS } from "../../constant";
import { IChartOfAccount } from "../../interface/chartOfAccount";


export const chartOfAccountModel: IChartOfAccount = {

    companyId: '',
    categoryType: CHART_OF_ACCOUNTS_CATEGORY_TYPE.ASSET || undefined,
    code: '', // Need Create Dynamic from last save DB AC1001 = AC1002
    accountName: '',
    description: "",
    created: {
        date: serverTimestamp(),
        user: ""
    },
    status: CHART_OF_ACCOUNTS_STATUS.ACTIVE,
    updated: []
}