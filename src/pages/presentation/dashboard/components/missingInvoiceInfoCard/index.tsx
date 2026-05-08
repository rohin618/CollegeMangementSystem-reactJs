
import React, { FC, useMemo, useState } from 'react';
import {
    CardActions,
    CardBody,
    CardHeader,
    CardLabel,
    CardSubTitle,
    CardTitle,
    Card,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Dropdown, Button,
    Spinner,
    Alert
} from '../../../../../components/bootstrap';
;

import useDarkMode from '../../../../../hooks/useDarkMode';
import { TColor } from '../../../../../type/color-type';
// import { demoPagesMenu } from '../../../../../menu';
import Popovers from '../../../../../components/bootstrap/Popovers';
import USERS from '../../../../../common/data/userDummyData';
import { useQuery } from '@tanstack/react-query';
import { getAllInvoicesbyResidentGroupList } from '../../../../../common/api/invoice';
import { createInvoiceDataByDate, getFirstLetter, getFundTypes, getMissingInvoiceRanges, getUserMappedCompany } from '../../../../../helpers/helpers';

import { PREBOOK_TYPE, RESIDENT_STATUS_TYPE } from '../../../../../common/constant';
import { invoiceModel } from '../../../../../common/model/invoice';
import { useRemoveItemQueryListById } from '../../../../../hooks';
import { MissingInvoiceDetailList } from './missingInvoiceDetail';
import Icon from '../../../../../components/icon';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { ResidentProfileCard } from '../../../../../components/common';
import moment from 'moment';

interface IAnswerCustomerProps {
    id?: string | number;
    imgWebp: string;
    img: string;
    name: string;
    job: string;
    value: number;
    color: TColor | 'link' | 'brand' | 'brand-two' | 'storybook';
    resident: any;
    fNCDetails: any;
    index: number
}
const AnswerCustomer: FC<IAnswerCustomerProps> = (props: IAnswerCustomerProps) => {
    const [isOpenMissingInvoiceList, setIsOpenMissingInvoiceList] = useState(false)
    const { id, imgWebp, img, name, job, value, color, resident, index } = props;
    const { fundSource, fundType, incontStatus, fncStatus } = getFundTypes(resident) || {};


    const { vatList = [], localAuthorityList = [], localICBList = [], billingPatternList = [], fNCDetails, isLoading: isVATLoading } = useMasterData();

    const { darkModeStatus } = useDarkMode();

    const { removeItemById, clearList } = useRemoveItemQueryListById<any>({
        queryKey: ['invoicesbyResidentGroupList'],
    });

    const colorIndex = getColorNameWithIndex(index);

    const billingFormula = useMemo(() => {
        const info = getUserMappedCompany();

        const privateBillingFormula = billingPatternList.find((data: any) => data?.id === info?.privateBillingPattern)?.billingFormula
        const ccBillingFormula = billingPatternList.find((data: any) => data?.id === info?.ccBillingPattern)?.billingFormula
        return { privateBillingFormula, ccBillingFormula };
    }, [billingPatternList]);


    const invoiceRows = useMemo(() => {
        if (!resident?.invoiceList || !resident?.admission?.admissionDate) return [];
        const residentStatus = +resident?.admission?.residentStatus;
        const dischargeDateRaw = resident?.admission?.dateDischargeAndRip;
        const dischargeDate = dischargeDateRaw ? moment(dischargeDateRaw) : null;

           let endDate = moment().endOf('month');
        if (residentStatus !== RESIDENT_STATUS_TYPE.ACTIVE && dischargeDate) {

            const isSameMonth = endDate.isSame(dischargeDate, "month");
            const isBefore = dischargeDate.isBefore(endDate);

            if (isSameMonth || isBefore) {
                endDate = dischargeDate.clone();
            }
        }

        const invoiceMissingList = getMissingInvoiceRanges(
            resident.invoiceList,
            resident.admission.admissionDate,
            endDate
        );

        let rows: any[] = [];

        invoiceMissingList.forEach((missingInvoice) => {
            if (!missingInvoice?.sDate || !missingInvoice?.eDate) return;

            const generatedRows = createInvoiceDataByDate({
                formData: missingInvoice,
                residentData: resident,
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

            if (Array.isArray(generatedRows)) {
                rows.push(...generatedRows); // flatten
            } else if (generatedRows) {
                rows.push(generatedRows);
            }
        });

        return rows;
    }, [
        resident?.invoiceList,
        resident?.admission?.admissionDate,
        resident?.fundDetails,
        resident?.roomPrice,
        fNCDetails,
        invoiceModel,
        fundSource,
        fncStatus,
        incontStatus,
        fundType,
        localAuthorityList,
        localICBList,
        vatList,
    ]);

    if (invoiceRows.length == 0) { removeItemById(resident.id); return }



    return (
        <div className='col-12'>
            <div className='row g-2'>
                <div className='col d-flex'>
                    <ResidentProfileCard
                        resident={resident}
                        colorIndex={colorIndex}
                    />

                </div>
                <div className='col-auto'>
                    <div className='d-flex align-items-center'>
                        <Popovers desc='Remaining time' trigger='hover'>
                            <div className="text-muted me-3">
                                <span>Missing: <span className="text-info fw-bold">{invoiceRows?.length}</span></span></div>
                        </Popovers>

                        <Button
                            color='info'
                            isLight
                            icon='RemoveRedEye'
                            className='text-nowrap'
                            onClick={() => setIsOpenMissingInvoiceList(true)}
                        >
                            View
                        </Button>
                    </div>
                </div>
            </div>
            <MissingInvoiceDetailList residentData={resident} index={index} toggle={() => setIsOpenMissingInvoiceList(p => !p)} isOpen={isOpenMissingInvoiceList} invoiceList={invoiceRows} />
        </div>
    );
};
0n

export const MissingResidentInvoiceInfoCard = ({ fNCDetails = {} }) => {
    const { darkModeStatus } = useDarkMode();

    const {
        data: invoicesbyResidentGroupList,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['invoicesbyResidentGroupList'],
        queryFn: getAllInvoicesbyResidentGroupList,
    });


    return (
        <Card stretch>
            <CardHeader>
                <CardLabel icon="Info" iconColor="danger">
                    <CardTitle tag="div" className="h5">
                        Missing Invoice
                    </CardTitle>
                    <CardSubTitle tag="div" className="h6">
                        Resident
                    </CardSubTitle>
                </CardLabel>
                <CardActions>
                    <Dropdown>
                        <DropdownToggle hasIcon={false}>
                            <Button
                                color={darkModeStatus ? 'light' : 'dark'}
                                isLink
                                hoverShadow="default"
                                icon="MoreHoriz"
                                aria-label="More Actions"
                            />
                        </DropdownToggle>
                        <DropdownMenu isAlignmentEnd>
                            <DropdownItem>
                                <Button icon="Send" tag="a" href="mailto:example@site.com">
                                    Send Bulk Mail
                                </Button>
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </CardActions>
            </CardHeader>

            <CardBody>
                <div style={{ maxHeight: "450px", overflowY: "auto", scrollbarWidth: 'thin', }} className="px-3 py-2">
                    {/* ✅ Loader */}
                    {isLoading && (
                        <div className="d-flex justify-content-center align-items-center py-6">
                            <Spinner size="lg" />
                        </div>
                    )}

                    {/* ✅ Error State */}
                    {isError && (
                        <Alert variant="destructive" className="my-4">
                            <strong>Error:</strong> {error?.message || 'Failed to load invoices.'}
                        </Alert>
                    )}

                    {/* ✅ Main Data / No Data */}
                    {!isLoading && !isError && (
                        <>
                            {invoicesbyResidentGroupList?.length ? (
                                <div className="row g-3">
                                    {invoicesbyResidentGroupList.map((resident, index) => (
                                        <AnswerCustomer
                                            key={resident.id || index}
                                            resident={resident}
                                            index={index}
                                            img={USERS.GRACE.src}
                                            imgWebp={USERS.GRACE.srcSet}
                                            name={resident.personal.name}
                                            color={USERS.GRACE.color}
                                            job="Maryland"
                                            value={43}
                                            fNCDetails={fNCDetails}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <i className="bi bi-inbox fs-2 mb-2"></i>
                                    <p className="mb-0">No missing invoices found.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </CardBody>

        </Card>
    );
};
