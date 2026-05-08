import moment from "moment";
import { getActiveFundDetails, getActiveWeekInfoByEndDate, getLabelByValue, priceFormat } from "../../../helpers/helpers"
import { FUND_SOURCE_LIST, FUND_SOURCE_STATUS_TYPE_LIST, SALUTATION_LIST } from "../../data/option"
import { useEffect } from "react";
import { FUND_SOURCE_TYPE, LPA_TYPE, NOK_INVOICE_REQUIRED } from "../../constant";
import { FAMILY_OR_THIRD_PARTY_TOPUP_STATUS } from "../../constant/app";


export const creditNoteDocument = (
    residentData: any,
    comapanyDetails: any,
    roomInfo: any,
    monthlyPrice: number
) => {


    return `
<h4>-----</h4>
    `


}