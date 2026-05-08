import moment from "moment";
import {
    evaluateMonthlyPrice,
    getActiveFundDetails,
    getLabelByValue,
    priceFormat,
} from "../../../helpers/helpers";
import { SALUTATION_LIST } from "../../data/option";
import {
    FUND_SOURCE_TYPE,
    LPA_TYPE,
    NOK_INVOICE_REQUIRED,
} from "../../constant";

export const feeIncreaseLetterDocument = (
    residentData: any,
    comapanyDetails: any,
    roomInfo: any,
    theme: any,
    billingFormulas: any,
    headOfficeAddress: any,
    logoBase64: any,
) => {

    const activeFund = getActiveFundDetails(residentData?.fundDetails);

    const monthlyPrice = evaluateMonthlyPrice(
        +activeFund?.fundSource === FUND_SOURCE_TYPE.PRIVATE ?
            billingFormulas.find((item: any) => item.id === comapanyDetails?.privateBillingPattern).formula :
            billingFormulas.find((item: any) => item.id === comapanyDetails?.familyTopupPattern).formula
        ,
        +activeFund?.fundSource === FUND_SOURCE_TYPE.PRIVATE ? roomInfo?.perWeek :
        activeFund?.familyTopupPrice,
    )

    const todayFormatted = moment().format("Do MMMM YYYY");

    // 🧩 Step 1: Extract the feesIncrementInfo array
    const feesArray = residentData?.admission?.feesIncrementInfo || [];

    // 🧩 Step 2: Get the latest (max) date and its corresponding percentage
    const getLatestIncrementInfo = (infoArray: any[] = []) => {
        if (!Array.isArray(infoArray) || infoArray.length === 0) return null;

        const validDates = infoArray
            .filter((i) => i?.date && moment(i.date).isValid())
            .map((i) => ({
                date: moment(i.date),
                percentage: +i.percentage || 0,
            }));

        if (validDates.length === 0) return null;

        // Find the object with the latest date
        const latest = validDates.reduce((latest, current) =>
            current.date.isAfter(latest.date) ? current : latest
        );
        return latest;
    };

    const latestInfo = getLatestIncrementInfo(feesArray);

    // 🧩 Step 3: Get percentage & date from latest object
    const feeIncreasePercent = latestInfo?.percentage || 0;
    const formattedEndDate = latestInfo
        ? latestInfo.date.format("Do MMMM YYYY")
        : "N/A";

    // 🧩 Step 4: Calculate new fees
    const baseWeeklyPrice =
        +activeFund?.fundSource === FUND_SOURCE_TYPE.PRIVATE
            ? roomInfo?.perWeek : activeFund?.familyTopupPrice;

    const newWeekly = baseWeeklyPrice
        ? Number((baseWeeklyPrice * (1 + feeIncreasePercent / 100)).toFixed(2))
        : 0;

    const newMonthly = monthlyPrice * (1 + feeIncreasePercent / 100);

    // 🧩 Step 5: Get NOK details
    const getNokName = () => {
        const nokList = residentData?.nok ?? [];
        const invoiceReq = nokList.find(
            ({ invoiceRequired }: any) =>
                invoiceRequired === NOK_INVOICE_REQUIRED.YES
        );
        const lpa = nokList.find(({ lpa }: any) => lpa === LPA_TYPE.YES);
        if (lpa) return { ...lpa };
        if (invoiceReq) return { ...invoiceReq };
        return { ...residentData?.billing };
    };
    

    // 🧾 Return formatted HTML letter
    return `
    <div
  style="
    max-width:900px;
    margin:0 auto;
    padding:48px;
    border:1px solid ${theme.border};
    border-radius:8px;
    box-shadow:${theme.shadow};
    background:${theme.bg};
    color:${theme.text};
  "
  class="welcome-letter"
>

        
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <div>
            <img
                src="${logoBase64 || "" }"
                alt="Company Logo"
                style="max-height:80px;max-width:200px;object-fit:contain;"
            />
            </div>
             <p style="text-align:right; font-size:14px; color:${theme.text}; line-height:1.4;">

             ${comapanyDetails.buildingNumber}
					, ${comapanyDetails?.area}</br> ${comapanyDetails?.address}</br> ${comapanyDetails?.postCode}
				<br>
            Tel: ${comapanyDetails?.phone}
        </p>
        </div>

        <header style="margin-bottom:28px;border-bottom:2px solid ${theme.headerBorder};padding-bottom:10px;text-align:center;">

            <h1 style="font-size:22px;font-weight:700;text-transform:uppercase;opacity:0.9;margin:0;">Annual Fee Increase</h1>
        </header>

        <div style="font-size:14px;color:${theme.mutedText};text-align:right;margin-top:8px;">
${todayFormatted}</div>

        <p style="margin:12px 0;">Dear <b>${getNokName()?.name || "N/A"}</b> (NOK of <b>${residentData?.personal?.name}</b>),</p>

        <p style="margin:12px 0;">I hope this letter finds you well.</p>

        <p style="margin:12px 0;">
            We are writing to inform you of our annual fee adjustment. Each year, we carefully review our costs, and
            while we always aim to keep increases to a minimum, it has become necessary to implement a modest rise due
            to increases in food prices, fuel bills, and staff wages.
        </p>

        <p style="margin:12px 0;">
            This adjustment also ensures we can continue to recognise and reward our dedicated staff for their ongoing
            hard work and commitment through annual salary reviews.
        </p>

        <p style="margin:12px 0;">
            An <strong>${feeIncreasePercent}% fee increase</strong> will take effect from <strong>${formattedEndDate}</strong>.
        </p>

        <p style="margin:12px 0;">
            For <strong>
            ${getLabelByValue(
        SALUTATION_LIST,
        residentData?.personal?.salutation
    )}. ${residentData?.personal?.name},
            </strong> the new fees will be:
        </p>

        <ul style="margin:12px 0;">
            <li><strong>Weekly Fee:</strong> ${priceFormat(newWeekly)}</li>
            <li><strong>Monthly Fee:</strong> ${priceFormat(newMonthly)}</li>
        </ul>

        <p style="margin:12px 0;">
            We kindly ask that you update the <strong>Standing Order/Direct Debit</strong> arrangements with your bank
            to reflect the new monthly amount starting from ${formattedEndDate}.
        </p>

        <p style="margin:12px 0;">
            If you have any questions or require further information, please do not hesitate to contact our Accounts Team
            on <strong>${comapanyDetails?.phone}</strong>.
        </p>

        <p style="margin:12px 0;">We appreciate your understanding and continued support.</p>

        <div class="mt-5" style="margin-top:3rem;">
            <p style="margin:12px 0;">Yours sincerely</p>
            <p style="margin:12px 0;font-weight:700;">
                On behalf of<br>
                ${comapanyDetails?.tradeName}<br>
                Head Office - Accounts
            </p>
        </div>

        <footer style="
  border-top:1px solid ${theme.border};
  padding-top:16px;
  text-align:center;
  font-size:13px;
  color:${theme.mutedText};
"
class="welcomeLetter-footer feesincrement-letter mt-5"
>

            <p>Registered Provider: ${comapanyDetails?.name}</p>
            <p>Registered Manager: ${comapanyDetails?.registerManager}</p>
            <p>Registered with Care Quality Commission (CQC)</p>
            <p>${comapanyDetails?.name} Registered in England & Wales No: ${comapanyDetails?.companyRegNo}</p>
            <p>Registered Office: ${headOfficeAddress?.buildingNumber && `${headOfficeAddress.buildingNumber} `}
						${headOfficeAddress?.area} ${headOfficeAddress?.address} ${headOfficeAddress?.postCode} </p>
        </footer>
    </div>
    `;
};
