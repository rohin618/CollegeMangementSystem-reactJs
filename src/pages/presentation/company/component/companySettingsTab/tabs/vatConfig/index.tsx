import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllVATMaster, updateVAT } from '../../../../../../../common/api/vat';
import {
    Card,
    CardBody,
    CardHeader,
    CardLabel,
    CardTitle,
    CardActions,
    CardSubTitle,
    Checks,
    Spinner,
} from '../../../../../../../components/bootstrap';
import { VAT_STATUS } from '../../../../../../../common/constant/app';
import COLORS from '../../../../../../../common/data/enumColors';
import classNames from 'classnames';
import useDarkMode from '../../../../../../../hooks/useDarkMode';
import moment from 'moment';
import { useUpdateQueryListById } from '../../../../../../../hooks';

export const VATConfigList = ({ companyId = '' }) => {
    const { darkModeStatus } = useDarkMode();
    const { data: vatList = [], isLoading } = useQuery({
        queryKey: ['vatList'],
        queryFn: () => getAllVATMaster(),
    });
    const updateVatList = useUpdateQueryListById<any>(["vatList"]);

    // ✅ Track which VAT item is being updated
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleToggle = async (item: any, checked: boolean) => {
        const today = moment().format("YYYY-MM-DD");
        setLoadingId(item.id); // show loader on this item

        let updatedCompanyIds = [...(item.companyIds || [])];

        if (checked) {
            const hasActive = updatedCompanyIds.some(
                (c: any) => c.id === companyId && !c.endDate
            );

            if (!hasActive) {
                updatedCompanyIds.push({
                    id: companyId,
                    sDate: today,
                    isActive: true,
                    endDate: ""
                });
            }
        } else {
            updatedCompanyIds = updatedCompanyIds.map((c: any) =>
                c.id === companyId && !c.endDate
                    ? { ...c, endDate: today, isActive: false }
                    : c
            );
        }

        try {
            const reqBody = { ...item, companyIds: updatedCompanyIds };
            const res = await updateVAT(item.id, reqBody);
            updateVatList(res);
        } catch (err) {
            console.error("Error updating VAT:", err);
        } finally {
            setLoadingId(null); // hide loader
        }
    };

    return (
        <Card stretch tag='form' noValidate>
            <CardHeader>
                <CardLabel icon='Contacts' iconColor='info'>
                    <CardTitle tag='div' className='h5'>
                        VAT Config                    </CardTitle>
                </CardLabel>

            </CardHeader>
            <CardBody isScrollable>
                {isLoading && <div>Loading...</div>}
                {vatList?.length === 0 && !isLoading && <div>No Data Found...</div>}

                <div className='row'>
                    {vatList?.map((item: any) =>
                        item?.status === VAT_STATUS.ACTIVE && (
                            <div className='col-md-6' key={item.id}>
                                <Card className={`shadow-3d-${darkModeStatus ? COLORS.LIGHT.name : COLORS.DARK.name}`}>
                                    <CardHeader>
                                        <CardLabel>
                                            <CardTitle
                                                tag='div'
                                                className={classNames('h6', 'cursor-pointer', {
                                                    'link-dark': !darkModeStatus,
                                                    'link-light': darkModeStatus,
                                                })}
                                            >
                                                {Number(item.rate)?.toFixed(1)}% {item?.name}
                                            </CardTitle>
                                            <CardSubTitle className='text-muted'>
                                                {item?.code}
                                            </CardSubTitle>
                                        </CardLabel>
                                        <CardActions>
                                            {loadingId === item.id ? (
                                                <Spinner size="sm" />
                                            ) : (
                                                <Checks
                                                    id={item?.code}
                                                    checked={item?.companyIds?.some(
                                                        (c: any) => c.id === companyId && !c.endDate
                                                    )}
                                                    className='big-switch'
                                                    type='switch'
                                                    isInline
                                                    disabled={loadingId !== null} // disable during update
                                                    onChange={(e: any) => handleToggle(item, e.target.checked)}
                                                />
                                            )}
                                        </CardActions>
                                    </CardHeader>

                                    <CardBody>{item?.description}</CardBody>
                                </Card>
                            </div>
                        )
                    )}
                </div>
            </CardBody>
        </Card>
    );
};
