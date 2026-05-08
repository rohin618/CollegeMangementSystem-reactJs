

import React, { useMemo, useRef, useState } from 'react';
import {
    SubHeaderLeft,
    SubheaderSeparator,
    SubHeader,
    Page,
    PageWrapper,
    SubHeaderRight
} from '../../../layout';
import Icon from '../../../components/icon';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Input, Popovers } from '../../../components/bootstrap';
import { InvoiceCreateAndUpdateForm, InvoiceListByCompanyCard, } from './component'
import { useSearch } from '../../../hooks';

import { useQuery } from '@tanstack/react-query';
import { getAllInvoicesList } from '../../../common/api/invoice';
import { useMasterData } from '../../../contexts/mastersContext';
import moment from 'moment';
import { DateRangePickerPopover } from '../../../components/common';
import { downloadOverAllInvoiceListAsExcel, downloadOverAllInvoiceListAsPDF } from '../../../helpers/exportExcel';
import { useGetAllRoomsWithBeds } from '../../../hooks/useGetAllRoomsWithBed';







const EMPTY_ARRAY: any[] = [];

const InvoicePage = () => {

    const [isOpenCreateInvoiceForm, setIsOpenCreateInvoiceForm] = useState(false);
    const [isFilterOpen, setFilterOpen] = useState<boolean>(false);
    const [filterDataSize, setFilterDataSize] = useState(0);

    const [dateRange, setDateRange] = useState<any>({
        startDate: moment("2025-01-01").toDate(),
        endDate: moment().add('1', 'year').endOf('year').toDate(),
        key: 'selection',
    });

    const {
        data: roomsList = [],
        isLoading: roomListIsLoading,
        isError: isRoomError,
    } = useGetAllRoomsWithBeds();


    const { localAuthorityList = [], localICBList = [], fNCDetails, isLoading: isMasterLoading, isError: isMasterError } = useMasterData();

    const {
        data: invoiceListByComapany = EMPTY_ARRAY,
        isLoading,
        isError,
        refetch: onRelaodInviceList,
    } = useQuery<any[], Error>({
        queryKey: ["invoiceListByCompany"],
        queryFn: () => getAllInvoicesList(), // ✅ WRAPPER
        staleTime: 5 * 60 * 1000,
        //   cacheTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        //   keepPreviousData: true,
    });
    const invoiceRangeListByComapany = useMemo(() => {

        if (!invoiceListByComapany?.length || !dateRange.startDate || !dateRange.endDate) return [];

        return invoiceListByComapany.filter((item: any) => {
            const itemDate = moment(item.invoiceDate);
            return itemDate.isBetween(dateRange.startDate, dateRange.endDate, undefined, "[]"); // inclusive
        });
    }, [invoiceListByComapany, dateRange.startDate, dateRange.endDate]);




    const searchKeys = useMemo(() => ["code", "residentData?.personal?.name"], []);
    const { searchValue, setSearchValue, filteredList: filteredInvoiceListByComapany } = useSearch(invoiceRangeListByComapany || [], searchKeys);
    // ✅ safe default






    const handleOpenCreateInvoiceModal = () => {
        setIsOpenCreateInvoiceForm(true)
    }
    const handleCloaseCreateInvoiceModal = () => {
        setIsOpenCreateInvoiceForm(false)
    }

    const handleDownloadInvoiceExcel = () => {

        if (filteredInvoiceListByComapany?.length === 0) return;
        downloadOverAllInvoiceListAsExcel(filteredInvoiceListByComapany, localAuthorityList, localICBList, fNCDetails, roomsList)

    }

    const handleDownloadInvoicePDF = () => {
        if (filteredInvoiceListByComapany?.length === 0) return;
        downloadOverAllInvoiceListAsPDF(filteredInvoiceListByComapany, localAuthorityList, localICBList, fNCDetails, roomsList)

    };





    return (
        <PageWrapper title={'Invoice'}>
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
                        placeholder='Search an invoice by code or resident name...' onChange={(e: any) => setSearchValue(e.target.value)}
                        value={searchValue} />
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
                        {invoiceListByComapany?.length !== filterDataSize && (
                            <Popovers desc='Filtering applied' trigger='hover'>
                                <span className='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger p-2'>
                                    <span className='visually-hidden'>there is filtering</span>
                                </span>
                            </Popovers>
                        )}
                    </Button>
                    <DateRangePickerPopover value={dateRange} onApply={setDateRange} />
                    <Button
                        color='info'
                        isLight
                        // onClick={() => navigate('/rooms/create')}
                        onClick={handleOpenCreateInvoiceModal}
                        icon='AddCircle'
                    >
                        Add Invoice
                    </Button>

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
                                    onClick={handleDownloadInvoicePDF}
                                >
                                    PDF
                                </Button>
                            </DropdownItem>
                            <DropdownItem>
                                <Button
                                    icon="Excel"
                                    onClick={handleDownloadInvoiceExcel}
                                >
                                    Excel
                                </Button>
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>


                </SubHeaderRight>

            </SubHeader>
            <Page container='fluid'>

                <InvoiceListByCompanyCard isLoading={isLoading && isMasterLoading} localICBList={localICBList} onRelaodInviceList={onRelaodInviceList} invoiceListByComapany={filteredInvoiceListByComapany} localAuthorityList={localAuthorityList} fNCDetails={fNCDetails} isFilterOpen={isFilterOpen} setFilterDataSize={setFilterDataSize} invoiceListByCompanyNoFilter={invoiceListByComapany}/>

                <InvoiceCreateAndUpdateForm
                    //   residentData={invoiceEditObject?.residentData}
                    toggle={handleCloaseCreateInvoiceModal}
                    isOpen={isOpenCreateInvoiceForm}
                    onSave={() => { }}
                    invoiceList={invoiceListByComapany}
                //   residentGetDataFetch={residentGetDataFetch}
                //   invoiceEditObject={invoiceEditObject}
                />
            </Page>
        </PageWrapper >

    );
};

export default InvoicePage;