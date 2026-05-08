


import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
    SubHeaderLeft,
    SubheaderSeparator,
    SubHeader,
    Page,
    PageWrapper,
    SubHeaderRight
} from '../../../layout';
import Icon from '../../../components/icon';
import { Button, Card, CardActions, CardBody, CardHeader, CardLabel, FormGroup, Input, Popovers, Select, Option, CardTitle, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '../../../components/bootstrap';
import { InvoiceHistoryListByCompanyCard } from './component';
import { DateRangePicker } from 'react-date-range';
import moment from 'moment';
import { enGB } from "date-fns/locale";
import { getInvoicesHistoryList } from '../../../common/api/invoice';
import { useQuery } from '@tanstack/react-query';
import { INVOICE_TO_TYPE_LIST, PAYMENT_METHOD_LIST } from '../../../common/data/option';
import { useMultiSearch, useSearch } from '../../../hooks';
import { INVOICE_TO_TYPE } from '../../../common/constant';
import { useMasterData } from '../../../contexts/mastersContext';
import { DateRangePickerPopover, SearchableSelect } from '../../../components/common';
import { downloadOverAllPaymentListAsExcel, downloadOverAllPaymentListAsPDF } from '../../../helpers/exportExcel';




const paymentHistory = () => {

    const [filterFromObject, setFilterFromObject] = useState<any>({
        invoiceTo: '',
        fundTypeId: '',
        paymentMethod: ""
    });
    const [isFilterOpen, setFilterOpen] = useState<Boolean>(false);
    const {
        data: paymentHistoryList = [],
        isLoading,
        refetch: reloadInvoiceList,
    }: any = useQuery({
        queryKey: ['invoiceHistoryListByComapany'],
        queryFn: () => getInvoicesHistoryList(),
    });

    const { localICBList = [],
        localAuthorityList = [],
        fNCDetails = {}, bankList }: any = useMasterData()
    const [datePickerDefaultValue, setDatePickerDefaultValue] = useState<any>({
        startDate: moment("2025-01-01").toDate(),
        endDate: moment().add('1', 'year').endOf('year').toDate(),
        key: 'selection',
    });





    const invoiceHistoryListByComapany = useMemo(() => {

        if (!paymentHistoryList?.length || !datePickerDefaultValue.startDate || !datePickerDefaultValue.endDate) return [];

        return paymentHistoryList.filter((item: any) => {
            const itemDate = moment(item.date);
            return itemDate.isBetween(datePickerDefaultValue.startDate, datePickerDefaultValue.endDate, undefined, "[]"); // inclusive
        });
    }, [paymentHistoryList, datePickerDefaultValue.startDate, datePickerDefaultValue.endDate]);

    const {
        searchValue,
        setSearchValue,
        filteredList: invoiceHistoryListByComapanysearchFilterList
    } = useSearch(invoiceHistoryListByComapany, [
        // ✅ Resident Name
        "payments.invoice.residentData.personal.name",
        // "payments.invoice.residentData.billing.name",

        // // ✅ Invoice / Payment fields
        // "payments.invoice.code",
        "payments.payment.refNo"

    ]);


    /** 🔹 Derived Data */
    const filteredPaymentList = useMultiSearch(invoiceHistoryListByComapanysearchFilterList, filterFromObject);






    const handleChangeFilter = (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target;


        setFilterFromObject((prev: any) => ({
            ...prev,
            [name]: value,
            ...(name === "invoiceTo" && { fundTypeId: "" }) // ✅ reset fundTypeId
        }));
    };


    const handleResetFilter = () => {
        setFilterFromObject({
            invoiceTo: '',
            fundTypeId: '',
            paymentMethod: ""
        })
    }



    const handleDownloadPaymentHisExcel = () => {
        if (filteredPaymentList?.length === 0) return;
        downloadOverAllPaymentListAsExcel(filteredPaymentList, localAuthorityList, localICBList, fNCDetails,bankList)
    }

      const handleDownloadPaymentHisPDF = () => {
        if (filteredPaymentList?.length === 0) return;
        downloadOverAllPaymentListAsPDF(filteredPaymentList, localAuthorityList, localICBList, fNCDetails,bankList)
    }






    return (
        <PageWrapper title={'Payment History'}>
            <SubHeader>
                <SubHeaderLeft>
                    <label
                        className='border-0 bg-transparent cursor-pointer me-0'
                        htmlFor='searchInput'>
                        <Icon icon='Search' size='2x' color='primary' />
                    </label>
                    <Input
                        id='searchInput'
                        type='search'
                        className='border-0 shadow-none bg-transparent'
                        placeholder='Search customer or payment refNo...'
                        onChange={(e: any) => setSearchValue(e.target.value)}
                        value={searchValue}
                    />
                    {/* <SubheaderSeparator /> */}
                    <SubheaderSeparator />

                </SubHeaderLeft>
                <SubHeaderRight>
                    <Button
                        icon='FilterAlt'
                        color='dark'
                        isLight
                        className='btn-only-icon position-relative'
                        aria-label='Filter'
                        onClick={() => setFilterOpen(!isFilterOpen)}
                    >
                        {(filterFromObject.invoiceTo || filterFromObject.paymentMethod || filterFromObject.fundTypeId) && (
                            <Popovers desc='Filtering applied' trigger='hover'>
                                <span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
                                    <span className='visually-hidden'>there is filtering</span>
                                </span>
                            </Popovers>
                        )}
                    </Button>
                    <DateRangePickerPopover value={datePickerDefaultValue} onApply={setDatePickerDefaultValue} />
                      <Dropdown>
                    <DropdownToggle hasIcon={false}>
                        <Button
                            icon="Download"
                            color="info"
                            isLight
                            shadow="sm"
                            aria-label="More actions"
                        >Export</Button>
                    </DropdownToggle>
                    <DropdownMenu isAlignmentEnd>
                        <DropdownItem>
                            <Button
                                icon="PDF"
                                color="info"
                                isLight
                            onClick={handleDownloadPaymentHisPDF}
                            >
                                PDF
                            </Button>
                        </DropdownItem>
                        <DropdownItem>
                            <Button
                                icon="Excel"
                                onClick={handleDownloadPaymentHisExcel}
                            >
                                Excel
                            </Button>
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
                </SubHeaderRight>

              
            </SubHeader>
            <Page container='fluid'>


                {isFilterOpen && <div className='rew'>
                    <div className='col-12'>

                        <Card>
                            <CardHeader>
                                <CardLabel>
                                    <CardTitle>Filter</CardTitle>
                                </CardLabel>
                                <CardActions>
                                    {/* <Button color='dark' icon='Refresh' type='reset' isLight onClick={handleResetFilter}>Reset</Button> */}
                                    <Button
                                        color='link'
                                        className='text-decoration-none text-primary fw-semibold p-0 d-flex align-items-center gap-1'
                                        onClick={() => handleResetFilter()}>
                                        <Icon icon='Refresh' size='lg' className='text-primary' />
                                        Reset
                                    </Button>
                                </CardActions>
                            </CardHeader>
                            <CardBody>
                                <div className='row mb-4'>
                                    <div className='col-md-4'>
                                        <FormGroup id='invoiceTo' label='Payment From' isFloating>
                                            <SearchableSelect
                                                id='invoiceTo'
                                                name='invoiceTo'
                                                value={filterFromObject.invoiceTo}
                                                onChange={handleChangeFilter} options={INVOICE_TO_TYPE_LIST} placeholder='Select Payment From' />

                                        </FormGroup>
                                    </div>
                                    <div className='col-md-4'>
                                        <FormGroup id="paymentMethod" label="Payment Method" isFloating >
                                            <SearchableSelect
                                                placeholder="Select Payment Method"
                                                id="paymentMethod"
                                                name='paymentMethod'
                                                value={filterFromObject.paymentMethod}
                                                onChange={handleChangeFilter} options={PAYMENT_METHOD_LIST} />

                                        </FormGroup>
                                    </div>
                                    {(+filterFromObject.invoiceTo === INVOICE_TO_TYPE.LA || +filterFromObject.invoiceTo === INVOICE_TO_TYPE.CHC) && (
                                        <div className="col-4">
                                            <FormGroup
                                                id={+filterFromObject.invoiceTo === INVOICE_TO_TYPE.LA ? "fundTypeId" : "fundTypeId"}
                                                label='Fund Name'
                                                isFloating
                                            >
                                                <SearchableSelect
                                                    name='fundTypeId'
                                                    value={filterFromObject.fundTypeId}
                                                    onChange={handleChangeFilter}
                                                    placeholder={`Select ${+filterFromObject.invoiceTo === INVOICE_TO_TYPE.LA ? "Local Authority" : "ICB"}`}

                                                    options={(+filterFromObject.invoiceTo === INVOICE_TO_TYPE.LA ? localAuthorityList : localICBList)}
                                                    labelKey='name'
                                                    valueKey='id'
                                                />


                                            </FormGroup>
                                        </div>
                                    )}
                                    {/* <div className='col-md-3 text-end'>
									
								</div> */}
                                </div>
                            </CardBody>

                        </Card>

                    </div>
                </div>}

                <InvoiceHistoryListByCompanyCard bankList={bankList} localICBList={localICBList} localAuthorityList={localAuthorityList} fNCDetails={fNCDetails} reloadInvoiceList={reloadInvoiceList} isLoading={isLoading} filteredPaymentList={filteredPaymentList} />
            </Page>
        </PageWrapper>
    );
};

export default paymentHistory;
