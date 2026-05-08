import { useEffect, useMemo, useRef, useState } from "react";
import { FormGroup, Input, OffCanvas, OffCanvasBody, OffCanvasHeader, OffCanvasTitle, Select, Option, Card, CardHeader, CardTitle, Badge, CardActions, CardBody, Button } from "../../../../../components/bootstrap"
import { useMasterData } from "../../../../../contexts/mastersContext";
import { invoiceModel } from "../../../../../common/model/invoice";
import moment from "moment";
import SimpleReactValidator from 'simple-react-validator';
import { createBlockBedInvoiceByDate } from "../../../../../helpers/createBlockBedInvoice";
import { getResidentInvoiceAddress } from "../../../../../helpers/residentInvoiceAddress";
import Icon from "../../../../../components/icon";
import { getLabelByValue, priceFormat } from "../../../../../helpers/helpers";
import { INVOICE_CATEGORY_LIST, INVOICE_TO_TYPE_LIST } from "../../../../../common/data/option";
import { INVOICE_CATEGORY } from "../../../../../common/constant";
import { getColorNameWithIndex } from "../../../../../common/data/enumColors";
import { createInvoice, updateInvoice } from "../../../../../common/api/invoice";
import { useUpdateQueryListById } from "../../../../../hooks";
import { DateTimePicker, SearchableSelect } from "../../../../../components/common";
import useDarkMode from "../../../../../hooks/useDarkMode";



export const CreateBlockBedInvoice = ({ toggle = () => { }, isOpen = false, activeBlockBedInfo = {}, laOrICBfundDetails = {}, fundType, invoiceEditObject, onRelaodInviceListByFundTypeId }: any) => {
    const { vatList, isLoading: isVATLoading } = useMasterData();
    const validator = useRef(new SimpleReactValidator());
    const { miscellaneousList, billingPatternList, dueDateList, isLoading: isMasterLoading } = useMasterData();
    const [isLoadingForm, setIsLoadingForm] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [invoiceRows, setInvoiceRows] = useState<any[]>([]);
    const updateInvoiceList = useUpdateQueryListById<any>(['invoiceListByFundTypeId', laOrICBfundDetails?.id]);

    const { darkModeStatus } = useDarkMode();
    const [formData, setFormData] = useState<any>({
        ...invoiceModel,
        invoiceDate: moment().format('YYYY-MM-DD'),
    });


    const handleChange = (e: any) => {
        const { id, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [id]: value }));
    };


    // 1️⃣ Generate invoice rows for CREATE mode
    useEffect(() => {
        if (!isOpen) return; // run only when modal is open
        if (invoiceEditObject) return; // skip in edit mode
        if (!formData || !fundType || !laOrICBfundDetails) return;

        const rows = createBlockBedInvoiceByDate({
            formData,
            fundType,
            laOrICBfundDetails,
            vatList,
        });

        setInvoiceRows(rows);
    }, [isOpen, formData, fundType, laOrICBfundDetails, vatList, invoiceEditObject]);


    // 2️⃣ Set invoice rows for EDIT mode
    useEffect(() => {
        if (!invoiceEditObject) return;

        setInvoiceRows([invoiceEditObject]);
        setFormData(invoiceEditObject)
    }, [invoiceEditObject, isOpen]);


    const handleFormSubmit = async () => {
        try {
            setIsSubmitted(true);

            if (!validator.current.allValid()) {
                validator.current.showMessages();
                return;
            }

            setIsLoadingForm(true);

            // Build request list
            for (const [index, invoice] of invoiceRows.entries()) {
                const reqData = {
                    ...invoice,
                    sDate: moment(invoice.sDate).format("YYYY-MM-DD"),
                    eDate: moment(invoice.eDate).format("YYYY-MM-DD"),
                    invoiceDate: formData.invoiceDate,
                    dueDay: formData.dueDay,
                    code: invoice.id ? formData.code : "",
                };

                const action = invoice.id
                    ? updateInvoice(invoice.id, reqData)
                    : createInvoice(reqData, laOrICBfundDetails?.shortName);

                const res = await action;
                // const res: any = '';
                updateInvoiceList(res);

                // const res: any = '';
            }

            // Run all in parallel AND return the response list
            onRelaodInviceListByFundTypeId()
            toggle()

            // ⬅️ IMPORTANT: return results to caller
            // return results;

        } catch (err) {
            console.error("Error generating invoice:", err);
            throw err;               // allow caller to catch error
        } finally {
            setIsLoadingForm(false);
        }
    };












    return (
        <OffCanvas className="offcanvas-invoice w-50" id="invoiceCanvas" placement="end" isOpen={isOpen} setOpen={toggle}>
            <OffCanvasHeader setOpen={toggle}>
                <OffCanvasTitle id="offcanvasExampleLabel">Invoice Generate Form</OffCanvasTitle>
            </OffCanvasHeader>
            <OffCanvasBody>
                <div className="row g-3">
                    <div className="col-4">
                        <FormGroup id="invoiceDate">
                            <DateTimePicker id="invoiceDate" label="Invoice Raised Date"
                                minDate={activeBlockBedInfo?.sDate}
                                maxDate={activeBlockBedInfo?.eDate}
                                value={formData?.invoiceDate}
                                onChange={handleChange}
                                isValid={validator.current.fieldValid('Invoice Raised Date')} isTouched={isSubmitted}
                                invalidFeedback={validator.current.message('Invoice Raised Date', formData.invoiceDate, 'required')} />
                        </FormGroup>
                        {/* <DateTimePicker value={formData?.invoiceDate} onChange={handleChange} /> */}
                    </div>
                    <div className="col-4">
                        <FormGroup id="sDate" >
                            <DateTimePicker id="sDate" label="Invoice Start Date"
                                // min={activeBlockBedInfo?.sDate}

                                value={formData?.sDate}
                                onChange={handleChange}
                                isValid={validator.current.fieldValid('Invoice Start Date')} isTouched={isSubmitted}
                                invalidFeedback={validator.current.message('Invoice Start Date', formData.sDate, 'required')} />
                        </FormGroup>
                    </div>
                    <div className="col-4">
                        <FormGroup id="eDate" >
                            <DateTimePicker id="eDate" label="Invoice End Date"
                                minDate={formData?.sDate || moment().format('YYY-DD-MM')}
                                // max={activeBlockBedInfo?.eDate}
                                value={formData?.eDate} onChange={handleChange}
                                isValid={validator.current.fieldValid('Invoice End Date')} isTouched={isSubmitted}
                                invalidFeedback={validator.current.message('Invoice End Date', formData?.eDate, 'required')} />
                        </FormGroup>
                    </div>
                    <div className="col-4">
                        <FormGroup id="dueDay" label="Invoice Due Day">
                            {/* <Input id="dueDate" type="date"
                                        min={formData?.sDate || moment().format('YYY-DD-MM')}
                                        onKeyDown={(e) => e.preventDefault()} value={formData.eDate} onChange={handleChange}
                                        isValid={validator.current.fieldValid('Invoice End Date')} isTouched={isSubmitted}
                                        invalidFeedback={validator.current.message('Invoice End Date', formData.eDate, 'required')} /> */}
                            <SearchableSelect
                                id="dueDay"
                                placeholder="Select Due Day"
                                value={formData?.dueDay}
                                // disabled
                                onChange={handleChange}
                                isValid={validator.current.fieldValid("Due Day")}
                                isTouched={isSubmitted}
                                invalidFeedback={validator.current.message("Due Day", formData?.dueDay, "required")}

                                options={dueDateList}
                                valueKey="day"
                                labelKey="name"
                            />

                            {/* <Se */}
                        </FormGroup>
                    </div>
                </div>

                {invoiceRows.length > 0 && (

                    <>
                        <div className="row mt-4">
                            <div className="col-12">

                                {(() => {
                                    const isMonthStart = moment(formData.sDate).isSame(moment(formData.sDate).startOf('month'), 'day');
                                    const isMonthEnd = moment(formData.eDate).isSame(moment(formData.eDate).endOf('month'), 'day');

                                    return invoiceRows?.map((row, index) => {
                                        const colorIndex = getColorNameWithIndex(index);

                                        return (
                                            <Card shadow="none" className="border" key={index}>
                                                <CardHeader>
                                                    <CardTitle>
                                                        <Badge
                                                            isLight
                                                            color={colorIndex}
                                                            className="px-3 py-3"
                                                            borderSize={2}
                                                        >
                                                            {getLabelByValue(INVOICE_TO_TYPE_LIST, row.invoiceTo)}
                                                            {" "}
                                                            ({laOrICBfundDetails?.shortName})
                                                        </Badge>

                                                        <span className="text-muted formula-info mx-2">
                                                            <Icon icon="Info" />
                                                            <strong className="ms-1 formula-info">
                                                                (weekly / 7) * days
                                                            </strong>
                                                        </span>
                                                    </CardTitle>
                                                </CardHeader>

                                                <CardBody>
                                                    <div className="table-responsive">
                                                        <table className="table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Category</th>
                                                                    <th>Description</th>
                                                                    <th>Date</th>
                                                                    <th>Week Price</th>
                                                                    <th>VAT</th>
                                                                    <th className="text-end wpx-150">Amount</th>
                                                                    <th>Action</th>
                                                                </tr>
                                                            </thead>

                                                            <tbody>
                                                                {row?.items?.map((item: any) => (
                                                                    <tr key={item.id} className="align-middle">
                                                                        <td>
                                                                            <Badge
                                                                                isLight
                                                                                color={darkModeStatus ? "light" : "dark"}
                                                                                className="px-3 py-2"
                                                                                rounded={1}
                                                                            >
                                                                                {getLabelByValue(
                                                                                    INVOICE_CATEGORY_LIST,
                                                                                    item.category
                                                                                )}
                                                                            </Badge>
                                                                        </td>

                                                                        <td>{item.description ?? "-"}</td>

                                                                        <td>
                                                                            {moment(item?.period?.from).format("DD MMM YYYY")}
                                                                            {" - "}
                                                                            {moment(item?.period?.to).format("DD MMM YYYY")}
                                                                        </td>

                                                                        <td>{priceFormat(item.weekPrice)}</td>
                                                                        <td>{Number(item.vatRate).toFixed(1)}%</td>
                                                                        <td className="text-end wpx-150">
                                                                            {priceFormat(item.amount)}
                                                                        </td>

                                                                        <td></td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                        <div className="row m-0 mt-4">
                            <div className="col-6 p-3 pb-0">
                                <Button color="info" className="w-100" onClick={handleFormSubmit} isLoading={isLoadingForm}>
                                    {formData?.id ? 'Update' : 'Generate'}</Button>
                            </div>
                            <div className="col-6 p-3">
                                <Button isOutline color="danger" className="w-100" onClick={toggle} isDisable={isLoadingForm}>Close</Button>
                            </div>
                        </div></>
                )}



            </OffCanvasBody>
        </OffCanvas>
    )
}