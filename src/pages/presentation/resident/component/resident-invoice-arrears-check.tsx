import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalTitle,
    Button,
    CardBody,
    CardHeader,
    CardTitle,
    Card,
    Badge,
    CardActions,
    Textarea,
} from '../../../../components/bootstrap';
import {
    getFundTypes,
    getActiveResidentRoomPriceDetails,
    priceFormat,
    getLabelByValue,
    getInvoiceDisplayCode,
    generateUid,
    getUserMappedCompany,
    getResidentInvoiceAddress,
    createInvoiceDataByDate,
    checkArrearsAndCreditOfInvoice,
    getColorByValue,
} from '../../../../helpers/helpers';
import { CREDIT_TYPE, INVOICE_CATEGORY, INVOICE_STATUS, INVOICE_TO_TYPE, INVOICE_TYPE, PAYMENT_STATUS, RESIDENT_STATUS_TYPE } from '../../../../common/constant';
import moment from 'moment';
import { INVOICE_TO_TYPE_LIST, INVOICE_TYPE_LIST } from '../../../../common/data/option';
import { invoiceModel } from '../../../../common/model/invoice';
import { createInvoice, updateInvoice } from "../../../../common/api/invoice";
import { useActivePriceInfoByEndDate, useCheckArrearsAndCreditBlockBedInvoice, useInvoiceCheckArrearsAndCredit, useRefetchQueryList, useUpdateQueryListById, useUpdateQueryObjectById } from '../../../../hooks';
import { creditWaletModel } from '../../../../common/model/creditWalet';
import { createCreditWallet } from '../../../../common/api/creditWalet';
import { number } from 'framer-motion';
import { useGetBillingPatternList } from '../../../../hooks/useGetBillingPatternList';
import { useMasterData } from '../../../../contexts/mastersContext';
import { arrayUnion } from 'firebase/firestore';
import { ICreditWalletModel, IInvoiceModel, ILaAndICBModel } from '../../../../common/interface';
import { IInvoiceItem } from '../../../../common/interface/invoice';
import Icon from '../../../../components/icon';
import { createBlockBedInvoiceByDate } from '../../../../helpers/createBlockBedInvoice';
import { DateTimePicker } from '../../../../components/common';

interface ResidentInvoiceArrearsCheckProps {
    toggle?: () => void;
    isOpen?: boolean;
    residentData?: any;
    invoiceList?: any[];
    fNCDetails?: any;
    isCredit?: boolean;
    vatList: any[];
    localAuthorityList: any[];
    localICBList: any[];
    laOrICBfundDetails?: ILaAndICBModel | undefined
    isBlockBed?: boolean;
    onRelaodInviceListByFundTypeId?: () => void;
}

interface InvoiceRow {
    startDate: string;
    endDate: string;
    totalPrice: number;
    arrearsTotalPrice: number;
    arrearsDiff: number;
    invoiceTo: string;
    originalInvoice: any;

}


interface arrearsOrCredit { originalInvoice: IInvoiceModel, arrearsOrCredit: IInvoiceModel }

export const ResidentInvoiceArrearsCheck: React.FC<ResidentInvoiceArrearsCheckProps> = ({
    toggle = () => { },
    isOpen = !false,
    residentData,
    invoiceList = [],
    fNCDetails = {},
    isCredit = false,
    localAuthorityList = [],
    vatList = [],
    localICBList = [],
    laOrICBfundDetails,
    isBlockBed = false,
    onRelaodInviceListByFundTypeId = () => { }
}) => {
    const { id }: any = residentData ? residentData : {};
    const reqObjCreditWallet = {
        isGroupByResident: true
    }

    const updateInvoiceList = useUpdateQueryListById<any>(['invoiceList', id]);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const updateResidentCache = useUpdateQueryObjectById(['residentDetails', id]);

    var refetchCreditWalletListByCompanyId = useRefetchQueryList<any>(['creditWalletListByCompanyId', reqObjCreditWallet]);
    var refetchCreditNotesListByCompanyId = useRefetchQueryList<any>(['creditNotesListByCompanyId', reqObjCreditWallet]);
    const [updatedInvoices, setUpdatedInvoices] = useState<arrearsOrCredit[]>([])

    const { billingPatternList, isLoading: isMasterLoading, isError } = useMasterData();
    const billingFormula = useMemo(() => {
        const info = getUserMappedCompany();

        const privateBillingFormula = billingPatternList.find((data: any) => data?.id === info?.privateBillingPattern)?.billingFormula
        const ccBillingFormula = billingPatternList.find((data: any) => data?.id === info?.ccBillingPattern)?.billingFormula
        return { privateBillingFormula, ccBillingFormula };
    }, [billingPatternList]);
    const { fundSource, fundType, incontStatus, fncStatus } = getFundTypes(residentData) || {};



    useEffect(() => {


        const arrearsOrCredieInvoice: any[] = invoiceList
            .filter((i: IInvoiceModel) =>
                (i.type === INVOICE_TYPE.NORMAL || i.type === INVOICE_TYPE.BLOCK_BED) &&
                (i.status !== INVOICE_STATUS.DRAFT && i.status !== INVOICE_STATUS.VOID)
            ).map((invoice: IInvoiceModel) => {
                console.log('invoiceList----', invoice)
                let endDate = moment(invoice.eDate);

                if (!isBlockBed && residentData) {
                    const residentStatus = +residentData?.admission?.residentStatus;
                    const dischargeDateRaw = residentData?.admission?.dateDischargeAndRip;
                    const dischargeDate = dischargeDateRaw ? moment(dischargeDateRaw) : null;

                    if (residentStatus !== RESIDENT_STATUS_TYPE.ACTIVE && dischargeDate) {

                        const isSameMonth = endDate.isSame(dischargeDate, "month");
                        const isBefore = dischargeDate.isBefore(endDate);

                        if (isSameMonth || isBefore) {
                            endDate = dischargeDate.clone();
                        }
                    }
                }




                const formData = {
                    sDate: invoice.sDate,
                    eDate: endDate.format('YYYY-MM-DD'),

                };



                // delete invoice.residentData

                // --------------------------------------------
                // OPTIMIZED CREDIT HISTORY FILTER (ES6)
                // --------------------------------------------
                const creditHistoryList = (residentData?.creditWallets ?? []).filter(
                    (i: ICreditWalletModel) =>
                        i &&
                        (i.type === CREDIT_TYPE.ADJUSTMENT_CREDIT ||
                            i.type === CREDIT_TYPE.VAT_ADJUSTMENT_CREDIT) &&
                        i.invoiceId === invoice?.id
                );
                // --------------------------------------------
                // OPTIMIZED ARREARS HISTORY FILTER (ES6)
                // --------------------------------------------
                const historyListArrear = (invoiceList ?? []).filter(
                    (inv: IInvoiceModel) =>
                        inv &&
                        (inv.type === INVOICE_TYPE.ARREARS ||
                            inv.type === INVOICE_TYPE.VAT_ARREARS) &&
                        (inv.status !== INVOICE_STATUS.DRAFT && inv.status !== INVOICE_STATUS.VOID) &&
                        inv.parentInvoiceId === invoice?.id
                );

                let generatedRows = []
                if (isBlockBed) {
                    generatedRows = createBlockBedInvoiceByDate({
                        formData,
                        fundType: invoice.invoiceTo,
                        laOrICBfundDetails,
                        vatList,
                    });
                } else {
                    generatedRows = createInvoiceDataByDate({
                        formData,
                        residentData,
                        invoiceModel,
                        fundSource,
                        fncStatus,
                        incontStatus,
                        fundType,
                        localAuthorityList,
                        localICBList,
                        vatList,
                        fNCDetails,
                        billingFormula,
                        isShowBlockBednotify: false
                    });
                }




                const updatedInvoice = generatedRows.find(
                    (inv: IInvoiceModel) => +inv.invoiceTo === +invoice.invoiceTo && inv.fundTypeId === invoice.fundTypeId
                );



                const arrearsOrCredit = checkArrearsAndCreditOfInvoice(invoice, updatedInvoice, [...historyListArrear, ...creditHistoryList])
                // return checkArrearsAndCreditOfInvoice(invoice, generatedRows[0])
                if (!arrearsOrCredit) return
                return { originalInvoice: invoice, arrearsOrCredit }



            }).filter(Boolean)




        setUpdatedInvoices(arrearsOrCredieInvoice)


        // return arrearsOrCredieInvoice as arrearsOrCredit[]


    }, [isBlockBed, invoiceList, residentData, isOpen])
    // ✅ Calculate invoices with arrears (optimized)

    const handleInvoiceGenerate = async () => {
        try {
            setIsLoading(true);

            for (const data of updatedInvoices) {
                const { originalInvoice, arrearsOrCredit }: arrearsOrCredit = data;


        

                const address = getResidentInvoiceAddress(
                    residentData,
                    +originalInvoice.invoiceTo,
                    originalInvoice.fundTypeId,
                    {
                        localAuthorityList,
                        localICBList,
                        fNCDetails,
                    },
                );

                const shortName: string | undefined = isBlockBed
                    ? laOrICBfundDetails?.shortName
                    : address.shortName;

                /** --------------------------------------------------
                 * 🔹 CASE 1: ARREARS (ARREARS / VAT_ARREARS)
                 -----------------------------------------------------*/
                if (
                    arrearsOrCredit.type === INVOICE_TYPE.ARREARS ||
                    arrearsOrCredit.type === INVOICE_TYPE.VAT_ARREARS
                ) {
                    const reqBody = {
                        ...invoiceModel,
                        ...arrearsOrCredit,
                        invoiceDate: arrearsOrCredit.invoiceDate || moment().format("YYYY-MM-DD"),
                        parentInvoiceId: originalInvoice.id,
                    };



                    const arrearsRes: any = await createInvoice(reqBody, shortName || '');

                    if (arrearsRes?.id) {


                        if (!isBlockBed) {
                            updateInvoiceList({ ...arrearsRes });
                        } else {
                            onRelaodInviceListByFundTypeId?.()
                        }


                        // const updated = isBlockBed
                        //     ? 
                        //     : updateInvoiceList({ ...arrearsRes });

                    }

                    continue; // ✔️ process next invoice without breaking loop
                }

                /** --------------------------------------------------
                 * 🔹 CASE 2: CREDIT NOTE
                 -----------------------------------------------------*/

                if (arrearsOrCredit.type === INVOICE_TYPE.CREDIT || arrearsOrCredit.type === INVOICE_TYPE.VAT_ARREARS) {
                    let typeOfCredit: number = CREDIT_TYPE.ADJUSTMENT_CREDIT;

                    if (arrearsOrCredit.subTotal === 0 && arrearsOrCredit.vatTotal !== 0) {
                        typeOfCredit = CREDIT_TYPE.VAT_ADJUSTMENT_CREDIT;
                    } else if (arrearsOrCredit.totalPrice < 0) {
                        typeOfCredit = CREDIT_TYPE.ADJUSTMENT_CREDIT;
                    }

                    const credititems = (arrearsOrCredit?.items ?? [])
                        .filter(item => item) // remove null values
                        .map(item => ({
                            ...item,
                            amount: Math.abs(Number(item?.amount ?? 0)),
                            vatAmount: Math.abs(Number(item?.vatAmount ?? 0)),
                        }));

                    const reqCreditWallet: ICreditWalletModel = {
                        ...creditWaletModel,
                        type: typeOfCredit,
                        invoiceId: originalInvoice?.id || '',
                        items: credititems || [],
                        residentId: originalInvoice.residentId,
                        fundTypeId: originalInvoice.fundTypeId,
                        subTotal: arrearsOrCredit.subTotal,
                        vatTotal: arrearsOrCredit.vatTotal,
                        creditAmount: arrearsOrCredit.totalPrice,
                        creditTo: originalInvoice.invoiceTo,
                        date: arrearsOrCredit.invoiceDate || moment().format("YYYY-MM-DD"),
                    };


                    const creditRes = await createCreditWallet(reqCreditWallet, shortName || '');




                    const residentDetails = {
                        ...residentData,
                        creditWallets: [
                            ...(Array.isArray(residentData?.creditWallets) ? residentData.creditWallets : []),
                            creditRes
                        ]
                    };


                    updateResidentCache(residentDetails);
                    refetchCreditWalletListByCompanyId?.forceRefetch();
                    refetchCreditNotesListByCompanyId?.forceRefetch();
                }
            }

            toggle(); // ✔️ only once after ALL processing
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };


    const updateItemDescription = (
        invIdx: number,
        itemIdx: number,
        value: string
    ) => {
        setUpdatedInvoices((prev) => {
            const copy = [...prev];

            copy[invIdx] = {
                ...copy[invIdx],
                arrearsOrCredit: {
                    ...copy[invIdx].arrearsOrCredit,
                    items: copy[invIdx].arrearsOrCredit.items.map(
                        (item: IInvoiceItem, idx: number) =>
                            idx === itemIdx ? { ...item, description: value } : item
                    )
                }
            };

            return copy;
        });
    };

    const updateInvoiceDate = (
        invIdx: number,
        value: string
    ) => {
        setUpdatedInvoices((prev) => {
            const copy = [...prev];

            copy[invIdx] = {
                ...copy[invIdx],
                arrearsOrCredit: {
                    ...copy[invIdx].arrearsOrCredit,
                    invoiceDate: value
                }
            };

            return copy;
        });
    };




    return (
        <Modal isOpen={isOpen} setIsOpen={toggle} size='xl' titleId="tour-title">
            <ModalHeader setIsOpen={toggle}>
                <ModalTitle id="tour-title" className="d-flex align-items-end">
                    <span className="ps-2">Generate Credit and Arrears Invoices</span>
                </ModalTitle>
            </ModalHeader>

            <ModalBody>
                <div className="row mt-4">
                    <div className="col-12">
                        {updatedInvoices.map(({ arrearsOrCredit, originalInvoice }: arrearsOrCredit, invIdx: number) => {
                            const itemCount = arrearsOrCredit?.items?.length;
                            const color = getColorByValue(INVOICE_TO_TYPE_LIST, arrearsOrCredit?.invoiceTo);
                            //  ({invoiceAddress?.shortName}
                            return (
                                <Card shadow='none' className="border mb-4" key={invIdx} >
                                    <CardHeader>
                                        <CardTitle>
                                            <Badge isLight color={color} className=" px-3 py-3" borderSize={2}>{getLabelByValue(INVOICE_TO_TYPE_LIST, arrearsOrCredit?.invoiceTo)}</Badge>
                                            <span className="text-muted formula-info mx-2">
                                                {getLabelByValue(INVOICE_TYPE_LIST, arrearsOrCredit?.type)} for  {moment(arrearsOrCredit?.sDate).format("DD MMM YYYY")}{" "}
                                                <Icon icon="ArrowRightAlt" />{" "}
                                                {moment(arrearsOrCredit?.eDate).format("DD MMM YYYY")}
                                            </span>
                                        </CardTitle>
                                        <CardActions>
                                            <span className="text-muted formula-info mx-2">

                                                <DateTimePicker isFloating label='Select Date'
                                                    value={arrearsOrCredit.invoiceDate}
                                                    onChange={(e: any) =>
                                                        updateInvoiceDate(invIdx, e.target.value)
                                                    }
                                                // rows={3}
                                                />
                                            </span>
                                        </CardActions>
                                    </CardHeader>

                                    <CardBody>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    {/* <th>Date</th> */}
                                                    {/* <th>Category</th> */}
                                                    {/* <th>Period</th> */}
                                                    <th>Description</th>
                                                    {/* <th>Vat</th> */}
                                                    <th>Vat Amount</th>
                                                    <th>Price</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {arrearsOrCredit?.items?.map((item: IInvoiceItem, itemIdx: number) => (
                                                    <tr key={`${invIdx}-${itemIdx}`} className='align-middle'>


                                                        {/* Description */}
                                                        <td>
                                                            {/* {item.description} */}


                                                            <Textarea
                                                                value={item.description || ""}
                                                                onChange={(e: any) =>
                                                                    updateItemDescription(invIdx, itemIdx, e.target.value)
                                                                }
                                                                rows={3}
                                                            />

                                                        </td>

                                                        <td>{priceFormat(item.vatAmount)}</td>

                                                        {/* Price (per item!) */}
                                                        <td className="text-end">{priceFormat(item.amount)}</td>
                                                    </tr>
                                                ))}


                                            </tbody>
                                        </table>
                                        <table className="table w-50 float-end table-borderless">
                                            <tbody>
                                                {/* Summary Rows */}
                                                <tr>
                                                    <td className="text-end">Sub Total</td>
                                                    <th className="text-end">{priceFormat(arrearsOrCredit?.subTotal)}</th>
                                                </tr>

                                                <tr>
                                                    <td className="text-end">VAT Total</td>
                                                    <th className="text-end">{priceFormat(arrearsOrCredit?.vatTotal)}</th>
                                                </tr>

                                                <tr>
                                                    <td className="text-end">Total</td>
                                                    <th className="text-end">{priceFormat(arrearsOrCredit?.totalPrice)}</th>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </CardBody>
                                </Card>
                            );
                        })}


                        {!updatedInvoices || updatedInvoices.length === 0 && (
                            <h4 className='text-center'>No credit and arrears invoices found</h4>


                        )}

                    </div>
                </div>
            </ModalBody>

            <ModalFooter>
                <Button isDisable={isLoading} icon="Close" color="danger" isLink onClick={toggle}>
                    No
                </Button>
                <Button isLoading={isLoading} icon="DoneOutline" color="success" isDisable={updatedInvoices.length === 0} isLight onClick={handleInvoiceGenerate}>
                    Generate
                </Button>
            </ModalFooter>
        </Modal>
    );
};
