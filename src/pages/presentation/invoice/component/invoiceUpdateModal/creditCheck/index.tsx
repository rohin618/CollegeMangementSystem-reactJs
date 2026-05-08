import React, {  useMemo, useRef, useState } from 'react';

import {
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle,
    Button,
} from '../../../../../../components/bootstrap';
import {
    priceFormat,
    getLabelByValue,
    getUserMappedCompanyId,
    getResidentInvoiceAddress,
} from '../../../../../../helpers/helpers';
import { CREDIT_TYPE } from '../../../../../../common/constant';
import moment from 'moment';
import { INVOICE_TO_TYPE_LIST } from '../../../../../../common/data/option';
import { creditWaletModel } from '../../../../../../common/model/creditWalet';
import { CreditCreate } from '../addNewCredit';
import showNotification from '../../../../../../components/extras/showNotification';
import { createCreditWallet, updateCreditWallet } from '../../../../../../common/api/creditWalet';
import { useQuery } from '@tanstack/react-query';
import { getAllResidentWithInvoice } from '../../../../../../common/api/resident';
import { ICreditWalletModel } from '../../../../../../common/interface';
;

interface ResidentInvoiceArrearsCheckProps {
    toggle?: () => void;
    isOpen?: boolean;
    residentData?: any;
    invoiceList?: any[];
    fNCDetails?: any;
    isCredit?: boolean;
    invoicePayment: InvoicePayment[];
    formData: any;
    onUpdateWithCreditNotes?: (_: string) => void;
    invoiceTo: number;
    availCredit: number,
    fundTypeId: string;
    paymentId: string;
    credittWalletsPayedInfoList?: any[];
    localICBList: any[];
    localAuthorityList: any[]
}

interface InvoicePayment {
    id: string;
    value: number;
}

export const ResidentCreditAvialbleList: React.FC<ResidentInvoiceArrearsCheckProps> = ({
    toggle = () => { },
    isOpen = false,
    invoiceList = [],
    isCredit = false,
    invoicePayment = [],
    formData = {},
    onUpdateWithCreditNotes = () => { },
    invoiceTo = -1,
    availCredit = 0,
    fundTypeId = '',
    paymentId = '',
    credittWalletsPayedInfoList = [],
    localICBList = [],
    localAuthorityList = [],
    fNCDetails = {}
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const companyId = getUserMappedCompanyId()?.companyId;



    const { data: residentListWithInvoice, isLoading: isResidentListLoading } =
        useQuery({
            queryKey: ["residentListWithInvoice"],
            queryFn: getAllResidentWithInvoice,
        });

    const creditRef = useRef<any>(null);
    // ✅ Memoized updated invoices
    const updatedInvoices = useMemo(() => {
        return invoiceList
            .map((invoice) => {
                const payInfo = invoicePayment.find((p) => p.id === invoice.id);
                if (!payInfo) return null;

                // Prepare payment details
                const paymentDetails = {
                    amount: Number(payInfo.value) || 0,
                    date: moment().format("YYYY-MM-DD"),
                };

                // Prepare payments array
                const payments = [...(invoice.payedInfo || [])];
                const first = payments[0];
                const isPlaceholder =
                    first &&
                    !first.date &&
                    !first.refNo &&
                    !first.paymentRef &&
                    (!first.amount || Number(first.amount) === 0);

                if (isPlaceholder) payments[0] = paymentDetails;
                else payments.push(paymentDetails);

                // Calculate totals
                const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                const creditAmount = +(totalPaid - invoice.totalPrice).toFixed(2);

                if (creditAmount <= 0) return null;

                return {
                    ...creditWaletModel,
                    type: CREDIT_TYPE.ADVANCE_CREDIT,
                    invoiceId: invoice.id,
                    creditAmount,
                    companyId,
                    creditTo: invoice.invoiceTo,
                    residentId: invoice.residentId,
                    bankId: formData.depositTo,
                    date: formData?.paymentDate,
                    invoice, // Keep original invoice for display purposes
                };
            })
            .filter(Boolean);
    }, [invoiceList, invoicePayment, companyId, formData.depositTo]);




    const handleSubmitCredit = () => {
        try {
            const companyId = getUserMappedCompanyId()?.companyId;
            if (availCredit > 0) {
                const creditAdvance = creditRef.current?.getCreditAdvance();
                const totalCreditAmount = Number(creditAdvance.reduce(
                    (prev: any, cur: any) => prev + (+cur.creditAmount || 0), 0).toFixed(2));
                if (totalCreditAmount !== availCredit) {
                    showNotification(
                        `Warning`,
                        `Available Credit Amount is ${availCredit}, but you entered ${totalCreditAmount}. The advance amount should not be more or less than the available credit.`,
                    );
                    return
                };
                if (!(fundTypeId || invoiceTo || formData.depositTo || companyId)) {
                    console.warn('Some key values are missing');
                }
                const reqCreditWalletData = { type: CREDIT_TYPE.ADVANCE_CREDIT, paymentRefId: paymentId, companyId, creditTo: invoiceTo, bankId: formData.depositTo, fundTypeId, date: formData?.paymentDate };
                setIsLoading(true);
                onUpdateWithCreditNotes(paymentId)
                creditAdvance.forEach(async (credit: any) => {
                    const reqCreditWallet:ICreditWalletModel = {
                        ...creditWaletModel, ...credit, ...reqCreditWalletData, paymentMethod: formData.paymentMethod,
                        refNo: formData.refNo
                    };
                    const residentData = residentListWithInvoice?.find(({ id }) => id === reqCreditWallet.residentId)

                    const creditNotesAddress: any = getResidentInvoiceAddress(
                        residentData,
                        +reqCreditWallet?.creditTo,
                        reqCreditWallet?.fundTypeId,
                        {
                            localAuthorityList,
                            localICBList,
                            fNCDetails,
                        },
                    );



                    await (reqCreditWallet?.id
                        ? updateCreditWallet(reqCreditWallet.id, { ...reqCreditWallet })
                        : createCreditWallet({ ...reqCreditWallet }, creditNotesAddress.shortName));

                    // await createCreditWallet(reqCreditWallet);

                });
                setIsLoading(false)


            } else {
                onUpdateWithCreditNotes(paymentId)
            }
        } catch (e) {
            setIsLoading(false)
        }
    }


    return (
        <Modal isOpen={isOpen} setIsOpen={toggle} size="lg" titleId="tour-title">
            <ModalHeader setIsOpen={toggle}>
                <ModalTitle id="tour-title" className="d-flex align-items-end">
                    <span className="ps-2">
                        {availCredit > 0 ? 'Assigned' : 'Check'} Advance Invoice <br />
                        {/* <h2 className="fw-bold fs-3 mb-0">{priceFormat(Number(availCredit))}</h2> */}
                    </span>
                </ModalTitle>
            </ModalHeader>

            <ModalBody>
                <div className="row mt-4">
                    {availCredit > 0 && <div className='col-12 mb-4'>
                        <h5 className="h5">Avialble Advance Amount</h5>
                        <h2 className="fw-bold fs-3 mb-0">{priceFormat(Number(availCredit))}</h2>

                    </div>}
                    <div className="col-12">
                        {availCredit === 0 && <table className="table">
                            <thead>
                                <tr>
                                    <th>Invoice Code</th>
                                    <th>Invoice Date</th>
                                    <th>Total Invoice</th>
                                    <th>Credit Total</th>
                                    <th>Invoice To</th>
                                </tr>
                            </thead>
                            <tbody>
                                {updatedInvoices.length > 0 ? (
                                    updatedInvoices.map((inv: any, idx) => (
                                        <tr key={idx}>
                                            <td>{inv.invoice.code}</td>
                                            <td>
                                                {moment(inv.invoice.sDate).format("DD MMM YYYY")} -{" "}
                                                {moment(inv.invoice.eDate).format("DD MMM YYYY")}
                                            </td>
                                            <td>{priceFormat(inv.invoice.totalPrice)}</td>
                                            <td>{priceFormat(inv.creditAmount)}</td>
                                            <td>{getLabelByValue(INVOICE_TO_TYPE_LIST, inv.invoice.invoiceTo)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center text-muted py-3">
                                            No {isCredit ? 'Credit' : 'Arrears'} invoices found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>}

                        {availCredit > 0 && <CreditCreate residentListWithInvoice={residentListWithInvoice} isResidentListLoading={isResidentListLoading} credittWalletsPayedInfoList={credittWalletsPayedInfoList} ref={creditRef} invoiceTo={invoiceTo} />}
                    </div>
                </div>
            </ModalBody>

            <ModalFooter>
                <Button
                    isDisable={isLoading}
                    icon="Close"
                    color="danger"
                    isLink
                    onClick={toggle}
                >
                    No
                </Button>
                <Button
                    isLoading={isLoading}
                    icon="DoneOutline"
                    color="success"
                    // isDisable={!updatedInvoices.length}
                    isLight
                    onClick={handleSubmitCredit}
                >
                    Generate
                </Button>
            </ModalFooter>
        </Modal>
    );
};






