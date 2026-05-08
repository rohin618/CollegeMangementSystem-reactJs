import moment from "moment";
import { getActiveRespiteDetails, getGender, getLabelByValue, priceFormat } from "../../../helpers/helpers";
import { SALUTATION_LIST } from "../../data/option";
import { LPA_TYPE, NOK_INVOICE_REQUIRED } from "../../constant";
import useDarkMode from "../../../hooks/useDarkMode";


export const welcomeLetterPrivateRespite = (residentData: any, comapanyDetails: any, roomInfo: any,primaryBankDetails: any,theme:any,headOfficeAddress:any,logoBase64:any) => {
    const todayFormatted = moment().format('Do MMMM YYYY');
    const getNokName = () => {
        const nokList = residentData?.nok ?? [];
        const invoiceReq = nokList.find(({ invoiceRequired }: any) => invoiceRequired === NOK_INVOICE_REQUIRED.YES);
        const lpa = nokList.find(({ lpa }: any) => lpa === LPA_TYPE.YES);
        if (lpa) return { ...lpa };
        if (invoiceReq) return { ...invoiceReq };
         return { ...residentData?.billing }
    };
    const pronouns = getGender(residentData?.personal?.gender)


        const activeRespite = getActiveRespiteDetails(residentData?.admission?.respiteStatusList);
    
        let start = moment(residentData?.admission?.respiteSDate);
        let end = moment(residentData?.admission?.respiteEDate);
    
        let noOfRespiteWeeks = residentData?.admission?.noOfRespiteWeeks || 0;
        
        if(activeRespite){
                start = moment(activeRespite?.sDate);
                end = moment(activeRespite?.eDate);
                const diffInDays = end.diff(start, 'days'); 
                noOfRespiteWeeks = diffInDays < 7 ? 1 : Math.ceil(diffInDays / 7); 
        }

    const totalDays = end.diff(start, "days") + 1; 
    const weeklyPrice = roomInfo?.perWeek || 0;
    const totalAmount = (weeklyPrice / 7) * totalDays;

    const formatted =
        start.isSame(end, "month")
            ? start.format("MMMM YYYY")
            : `${start.format("MMMM YYYY")}–${end.format("MMMM YYYY")}`;

    return ` <div style="
  max-width:900px;
  margin:0 auto;
  padding:48px;
  border:1px solid ${theme.border};
  border-radius:8px;
  box-shadow:0 6px 18px rgba(15,23,42,0.04);
  background:${theme.bg};
  color:${theme.text};
    text-align: justify;
"
class="welcome-letter">

                     <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <div>
            <img
                src="${logoBase64 || ""}"
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

             <header style="
  margin-bottom:28px;
  border-bottom:2px solid ${theme.headerBorder};
  padding-bottom:10px;
  text-align:center;
">
            <h1 style="font-size:22px; font-weight:700; text-transform:uppercase; opacity:0.9; margin:0;">Welcome to ${comapanyDetails?.tradeName}</h1>
        </header>

        <div style="font-size:14px; color:${theme.text}; text-align:right; margin-top:8px;">${todayFormatted}</div>

        <p><strong>Dear  ${getNokName()?.name || "NA"} (NOK of ${residentData?.personal?.name}),</strong></p>
        <p>
            We are delighted to welcome <strong>${getLabelByValue(SALUTATION_LIST, residentData?.personal?.salutation)}. ${residentData?.personal?.name}</strong> to <strong>${comapanyDetails?.tradeName},</strong> and we hope ${pronouns.subject} has a pleasant and happy stay here with us. If you have any further queries or need more information regarding ${pronouns.possessive} care, please do not hesitate to contact the Manager at <strong>${comapanyDetails?.tradeName}</strong> on <strong>${comapanyDetails?.phone}.</strong>
        </p>
        <p>Please find enclosed the invoice for the month of ${formatted}. The weekly nursing fee is ${priceFormat(roomInfo?.perWeek)} excluding FNC. The Respite invoice will be ${priceFormat(totalAmount)} for <b>${getLabelByValue(SALUTATION_LIST, residentData?.personal?.salutation)}. ${residentData?.personal?.name}</b> (${priceFormat(roomInfo?.perWeek)} per week divided by 7 days multiplied by ${totalDays} days – Respite ${noOfRespiteWeeks} weeks stay). As per our terms and conditions, all payments must be made within 5 days from the date the invoice is issued.</p>

        <p>You can either pay via Bacs (account details below) or by cheque. Please post the cheque to the head office address as above.</p>

        <p style="margin-top:16px; margin-bottom:16px;"><strong><u>Payment details</u></strong></p>
        <p style="margin-bottom:16px;">
            <strong>Bank:</strong> ${primaryBankDetails?.bankName}<br>
            <strong>Account Name:</strong> ${primaryBankDetails?.accountName}<br>
            <strong>Sort code:</strong> ${primaryBankDetails?.sortCode}<br>
            <strong>Account Number:</strong> ${primaryBankDetails?.accountNumber}
        </p>

        <p>Please find attached the contract for <b>${getLabelByValue(SALUTATION_LIST, residentData?.personal?.salutation)}. ${residentData?.personal?.name}</b>. Please sign and return one copy of the contract within 5 working days by email or post it to ${comapanyDetails?.tradeName} ${comapanyDetails.buildingNumber} ${comapanyDetails?.area} ${comapanyDetails?.address} ${comapanyDetails?.postCode}. If we will not receive the signed contract within 5 working days, we will deem you are in agreement with our contract.</p>

        <p>If you have any further questions on the invoices, please do not hesitate to contact the accounts team on ${comapanyDetails?.phone} or email ‘${comapanyDetails?.email}’.</p>

        <div style="margin-top:40px;">
            <p>Yours sincerely</p>
            <p><strong>On behalf of<br>A ${comapanyDetails?.tradeName}<br>Head Office - Accounts</strong></p>
        </div>

        <footer style="
  border-top:1px solid ${theme.border};
  padding-top:16px;
  text-align:center;
  font-size:13px;
  color:${theme.mutedText};
"
class="welcomeLetter-footer mt-4 RespiteLetterPrivate-footer"
>
            <p>Registered Provider: ${comapanyDetails?.name}</p>
            <p>Registered Manager: ${comapanyDetails?.registerManager}</p>
            <p>Registered with Care Quality Commission (CQC)</p>
            <p>${comapanyDetails?.name} Registered in England & Wales No: ${comapanyDetails?.companyRegNo}</p>
            <p>Registered Office: ${headOfficeAddress?.buildingNumber && `${headOfficeAddress.buildingNumber} `}
						${headOfficeAddress?.area} ${headOfficeAddress?.address} ${headOfficeAddress?.postCode} </p>
        </footer>
    </div>`
}