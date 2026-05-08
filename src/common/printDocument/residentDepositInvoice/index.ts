import moment from 'moment';
import { LPA_TYPE, NOK_INVOICE_REQUIRED, } from '../../constant';
import { getLabelByValue } from '../../../helpers/helpers';
import { SALUTATION_LIST } from '../../data/option';



export const residentDepositInvoiceDocument = (residentData: any,
    comapanyDetails: any,
    roomInfo: any,
    monthlyPrice: number,
    primaryBankDetails: any) => {

    const getNokName = () => {
        const nokList = residentData?.nok ?? [];
        const invoiceReq = nokList.find(
            ({ invoiceRequired }: any) =>
                +invoiceRequired === NOK_INVOICE_REQUIRED.YES
        );
        const lpa = nokList.find(({ lpa }: any) => +lpa === LPA_TYPE.YES);
        if (lpa) return { ...lpa };
        if (invoiceReq) return { ...invoiceReq };
        return { ...residentData?.billing};
    };

    const nokDetails = getNokName();

    return `<div class="invoice-box">
        <!-- Header -->
        <div class="invoice-header text-center">
            <h2 class="fw-bold opacity-75">INVOICE</h2>
        </div>

        <!-- Company Info -->
        <div class="mb-4">
            <p class="mb-0 fw-bold">${comapanyDetails?.tradeName}</p>
            <p class="mb-0">${comapanyDetails?.area}</p>
            <p class="mb-0">${comapanyDetails?.address}</p>
            <p class="mb-0">${comapanyDetails?.phone}</p>
            <p class="mb-0">${comapanyDetails?.email}</p>
            <p class="mb-0">VAT Registration No.: 421220657</p>
        </div>

        <!-- Invoice / Customer Info -->
        <div class="row mb-4">
            <div class="col-6">
                <p class="fw-bold mb-1">Invoice To,</p>
                <p class="mb-0">Dear ${getLabelByValue(SALUTATION_LIST, nokDetails?.salutation || '')} ${nokDetails?.name || "N/A"}</p>
                <p class="mb-0">Re: ${getLabelByValue(SALUTATION_LIST, residentData?.personal?.salutation)}. ${residentData?.personal?.name}</p>
                <p class="mb-0">
  ${[
            nokDetails?.townOrCity,
            nokDetails?.county,
            nokDetails?.country,
            nokDetails?.postcode
        ]
            .filter(Boolean)
            .join(" ")
        }
</p>

            </div>
            <div class="col-6">
                <table class="table table-borderless table-sm customer-info-table">
                    <tr>
                        <td>Invoice No</td>
                        <td class="fw-bold">${residentData?.code || '#NA'}</td>
                    </tr>
                    <tr>
                        <td>Invoice Date</td>
                        <td class="fw-bold">${moment(residentData?.advancePayment?.date).format('DD-MM-YYYY')}</td>
                    </tr>
                 
                </table>
            </div>
        </div>

        <!-- Items Table -->
        <table class="table table-bordered text-center">
            <thead class="table-light">
                <tr class="tab-border">
                    <th>S.No</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Period</th>
                    <th>VAT %</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr class="bottom-border">
                    <td>1</td>
                    <td>Pvt</td>
                    <td class="text-start">Resident Deposite Amount</td>
                    <td>${moment(residentData?.admission?.admissionDate).format('DD MMMM YYYY')}</td>
                    <td>Exempt</td>
                    <td>1</td>
                    <td>${residentData?.advancePayment?.totalAmount}</td>
                    <td>${residentData?.advancePayment?.totalAmount}</td>
                </tr>
            </tbody>
        </table>

        <!-- Totals -->
        <table class="table table-borderless totals-table w-50 ms-auto">
            <tr>
                <td>Sub Total</td>
                <td class="text-end">${residentData?.advancePayment?.totalAmount}</td>
            </tr>
            <tr>
                <td>VAT Total</td>
                <td class="text-end">0.00</td>
            </tr>
            <tr>
                <td>Total</td>
                <td class="text-end">${residentData?.advancePayment?.totalAmount}</td>
            </tr>
            <tr class="bottom-border">
                <td>Payment</td>
                <td class="text-end">${residentData?.advancePayment?.totalAmount}</td>
            </tr>
            <tr>
                <td>Balance Due</td>
                <td class="text-end">${residentData?.advancePayment?.balanceAmount}</td>
            </tr>
        </table>

        <!-- VAT Summary -->
        <p class="section-title">VAT Summary</p>
        <table class="table table-bordered text-center">
            <thead class="table-light">
                <tr class="table-dark">
                    <th>Rate</th>
                    <th>VAT Amount</th>
                    <th>Net Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Exempt</td>
                    <td>0.00</td>
                    <td>${residentData?.advancePayment?.totalAmount}</td>
                </tr>
            </tbody>
        </table>

        <!-- Payment Details -->
        <p class="section-title">Payment Details</p>
        <p class="mb-0">Account Name: ${primaryBankDetails?.bankName}</p>
        <p class="mb-0">Acc Number:${primaryBankDetails?.accountNumber}</p>
        <p class="mb-0">Sort Code: ${primaryBankDetails?.sortCode}</p>
        <p class="mb-0">Email: ${comapanyDetails?.email}</p>
        <p class="mb-0">Tel No:${comapanyDetails?.phone}</p>
    </div>`;
};
