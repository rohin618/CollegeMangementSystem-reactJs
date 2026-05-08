import { useCallback, useMemo, useState } from 'react';
import moment from 'moment';
import classNames from 'classnames';
import Swal from 'sweetalert2';

import {
    deleteInvoiceById,
    invoiceSendSingleMail,
    updateInvoiceStatus,
} from '../../../../../../common/api/invoice';
import {
    InvoiceDetailViewModal,
    InvoiceUpdateModal,
} from '../../../../invoice/component';
import {
    getColorByValue,
    getLabelByValue,
    priceFormat,
    showAlert,
} from '../../../../../../helpers/helpers';
import {
    INVOICE_STATUS_TYPE_LIST,
    INVOICE_TYPE_LIST,
} from '../../../../../../common/data/option';
import Icon from '../../../../../../components/icon';
import useDarkMode from '../../../../../../hooks/useDarkMode';
import { getColorNameWithIndex } from '../../../../../../common/data/enumColors';
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Spinner,
} from '../../../../../../components/bootstrap';
import { INVOICE_STATUS, INVOICE_TYPE } from '../../../../../../common/constant';
import {
    useMultiSearch,
    useRemoveItemQueryListById,
    useUpdateQueryListById,
} from '../../../../../../hooks';
import { DataTable, ResidentProfileCard } from '../../../../../../components/common';
import { CreateBlockBedInvoice } from '../../createBlockBedInvoice';
import { useMasterData } from '../../../../../../contexts/mastersContext';
import { IInvoiceModel } from '../../../../../../common/interface';
import { getInvoicePayedAmount } from '../../../../../../helpers/invoice';
import { getInvoiceOpenBalance } from '../../../../../../helpers/helpers';

export const LaOrIcbInvoiceList = ({
    fundType = '',
    laOrICBfundDetails = {},
    activeBlockBedInfo = {},
    invoiceListByFundTypeId = [],
    isInvoiceLoading = false,
}: any) => {
    const { darkModeStatus } = useDarkMode();
    const { localAuthorityList, localICBList, fNCDetails } = useMasterData();

    const [isInvoiceFormOpenModal, setIsInvoiceFormOpenModall] = useState(false);
    const [isDetailInvoiceInfoModal, setIsDetailInvoiceInfoModal] = useState(false);
    const [detailInvoiceInfo, setDetailInvoiceInfo] = useState<any>(null);
    const [invoiceFormObject, setInvoiceFormObject] = useState<any>(null);
    const [invoiceEditObject, setInvoiceEditObject] = useState<any>(null);
    const [isInvoiceEditFormOpen, setIsInvoiceEditFormOpen] = useState(false);
    const [filterFromObject] = useState<any>({ invoiceTo: '', status: '', type: '' });
    const [isSingleMailSend, setIsSingleMailSend] = useState('');

    const { removeItemById } = useRemoveItemQueryListById<any>({
        queryKey: ['invoiceListByFundTypeId', laOrICBfundDetails?.id],
    });
    const updateInvoiceList = useUpdateQueryListById<any>([
        'invoiceListByFundTypeId',
        laOrICBfundDetails?.id,
    ]);

    const filteredInvoiceList = useMultiSearch(invoiceListByFundTypeId, filterFromObject);

    // ─── Status helpers ───────────────────────────────────────────────────────

    const getInvoiceStatus = (invoice: any) => {
        const invoiceDate = moment(invoice?.invoiceDate, 'YYYY-MM-DD');
        const dueDate = moment(invoiceDate).add(Number(invoice?.dueDay || 0), 'days');
        const today = moment();
        const totalPaid =
            invoice?.payedInfo?.reduce(
                (sum: number, p: any) => sum + (Number(p.amount) || 0),
                0,
            ) || 0;
        if (totalPaid >= Number(invoice?.totalPrice || 0)) {
            return { label: 'Paid', type: 'success', dueDate: dueDate.format('DD MMM YYYY') };
        }
        if (today.isAfter(dueDate, 'day')) {
            const days = today.diff(dueDate, 'days');
            return {
                label: `Overdue (${days} day${days > 1 ? 's' : ''})`,
                type: 'danger',
                dueDate: dueDate.format('DD MMM YYYY'),
            };
        }
        if (today.isBetween(invoiceDate, dueDate, 'day', '[]')) {
            return { label: 'Current', type: 'warning', dueDate: dueDate.format('DD MMM YYYY') };
        }
        return { label: '-', type: 'secondary', dueDate: dueDate.format('DD MMM YYYY') };
    };

    // ─── Status action handlers ───────────────────────────────────────────────

    const updateStatusAndCache = async (inv: IInvoiceModel, status: number) => {
        await updateInvoiceStatus(inv.id!, status);
        updateInvoiceList({ ...inv, status });
        if (detailInvoiceInfo) setDetailInvoiceInfo({ ...inv, status });
    };

    const guardInvoiceId = (inv?: IInvoiceModel): boolean => {
        if (!inv?.id) {
            console.warn('Invoice ID is missing');
            return false;
        }
        return true;
    };

    const handleUpdateInvoiceVoidStatus = (inv: IInvoiceModel) => {
        if (!guardInvoiceId(inv) || inv.status === INVOICE_STATUS.VOID) return;
        showAlert({
            title: 'Mark invoice as void?',
            text: 'This invoice will be voided and excluded from billing. This action cannot be undone.',
            confirmButtonText: 'Yes, void invoice',
            onConfirm: async () => {
                try {
                    await updateStatusAndCache(inv, INVOICE_STATUS.VOID);
                } catch (e) {
                    console.error('Failed to void invoice:', e);
                }
            },
        });
    };

    const handleConfirmInvoice = (inv: IInvoiceModel) => {
        if (!guardInvoiceId(inv)) return;
        showAlert({
            title: 'Confirm Invoice?',
            text: 'This will finalise the invoice. You will no longer be able to edit it.',
            confirmButtonText: 'Yes, Confirm',
            onConfirm: async () => {
                try {
                    await updateStatusAndCache(inv, INVOICE_STATUS.PENDING);
                } catch (e) {
                    console.error('Failed to confirm invoice:', e);
                }
            },
        });
    };

    const handleRestoreVoid = (inv: IInvoiceModel) => {
        if (!guardInvoiceId(inv)) return;
        showAlert({
            title: 'Restore voided invoice?',
            text: 'This invoice will be restored to draft.',
            confirmButtonText: 'Yes, restore invoice',
            onConfirm: async () => {
                try {
                    await updateStatusAndCache(inv, INVOICE_STATUS.DRAFT);
                } catch (e) {
                    console.error('Failed to restore invoice:', e);
                }
            },
        });
    };



    // ─── Email handlers ───────────────────────────────────────────────────────

    const handleSendSingleMail = useCallback(async (inv: any) => {
        if (!inv?.id || !inv?.invoiceAddress) {
            showAlert({
                icon: 'warning',
                title: 'Cannot Send Email',
                text: 'Invoice details or invoice address are missing.',
            });
            return;
        }
        try {
            setIsSingleMailSend(inv.id);
            const res = await invoiceSendSingleMail({
                invoiceId: inv.id,
                invoiceAddress: { ...inv.invoiceAddress },
                code: inv.code,
            });
            showAlert({
                icon: 'success',
                title: 'Email Sent',
                text: res?.data?.message || 'Invoice email has been sent successfully.',
            });
        } catch (error: any) {
            showAlert({
                icon: 'error',
                title: 'Send Failed',
                text:
                    error?.response?.data?.error ||
                    error?.message ||
                    'Failed to send invoice email.',
            });
        } finally {
            setIsSingleMailSend('');
        }
    }, []);

    // ─── Modal handlers ───────────────────────────────────────────────────────

    const handleOpenInvoiceDetail = (inv: any) => {
        setDetailInvoiceInfo(inv);
        setIsDetailInvoiceInfoModal(true);
    };

    const handleOpenEditInvoiceFrom = (inv: any) => {
        setIsInvoiceFormOpenModall(true);
        setInvoiceFormObject(inv);
    };

    const handleCloseInvoiceForm = () => {
        setIsInvoiceFormOpenModall(false);
        setInvoiceFormObject(null);
    };

    const handleOpenEditInvoiceDetail = (inv: any) => {
        setInvoiceEditObject(inv);
        setIsInvoiceEditFormOpen(true);
    };

    const handleCloseCreateInvoiceModal = () => {
        setIsInvoiceEditFormOpen(false);
        setInvoiceFormObject(null);
    };

    const handleOpenDeleteInvoice = (id: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            customClass: {
                popup: 'my-swal-popup',
                confirmButton: 'btn btn-light-info',
                cancelButton: 'btn btn-light-danger',
            },
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            await deleteInvoiceById(id);
            removeItemById(id);
        });
    };

    // ─── Table data ───────────────────────────────────────────────────────────

    const invoiceTableData = useMemo(() => {
        return filteredInvoiceList.map((inv: any, index: number) => {
            const colorIndex = getColorNameWithIndex(index);
            const paymentColor = getColorByValue(INVOICE_STATUS_TYPE_LIST, inv.status);
            const payedAmount = getInvoicePayedAmount(inv);
            const overdueStatus = getInvoiceStatus(inv);
            return {
                id: inv.id,
                invoice: inv,
                colorIndex,
                payedAmount,
                balanceDue: getInvoiceOpenBalance(inv),
                paymentColor,
                overdueStatus,
                code: inv?.code,
                invoiceDate: inv?.invoiceDate,
                subTotal: inv?.subTotal,
                vatTotal: inv?.vatTotal,
                totalPrice: inv?.totalPrice,
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredInvoiceList]);

    // ─── Table columns ────────────────────────────────────────────────────────

    const invoiceColumns = useMemo(
        () => [
            {
                label: 'Resident Name',
                key: 'resident',
                render: (row: any) => {
                    if (
                        +row.invoice?.type === INVOICE_TYPE.BLOCK_BED &&
                        !row.invoice?.residentData
                    ) {
                        return <span className='text-muted'>Block Bed Not Assigned</span>;
                    }
                    return (
                        <ResidentProfileCard
                            resident={row.invoice.residentData}
                            colorIndex={row.colorIndex}
                        />
                    );
                },
            },

            {
                label: 'Invoice No',
                key: 'code',
                sortable: true,
                render: (row: any) => row.code,
            },

            {
                label: 'Invoice Date',
                key: 'invoiceDate',
                sortable: true,
                render: (row: any) =>
                    row?.invoiceDate ? moment(row.invoiceDate).format('DD MMM YYYY') : 'NA',
            },

            {
                label: 'Period',
                key: 'period',
                render: (row: any) => (
                    <>
                        {row.invoice.sDate ? moment(row.invoice.sDate).format('DD MMM YYYY') : 'NA'}
                        <Icon icon='ArrowRightAlt' />
                        {row.invoice.eDate ? moment(row.invoice.eDate).format('DD MMM YYYY') : 'NA'}
                    </>
                ),
            },

            {
                label: 'Type',
                key: 'type',
                render: (row: any) => getLabelByValue(INVOICE_TYPE_LIST, +row.invoice?.type),
            },

            {
                label: 'Weekly Fees',
                key: 'weekPrice',
                render: (row: any) => priceFormat(row.invoice?.items?.[0]?.weekPrice ?? 0),
            },

            {
                label: 'Before VAT',
                key: 'subTotal',
                sortable: true,
                render: (row: any) => priceFormat(+row.subTotal),
            },

            {
                label: 'VAT Amount',
                key: 'vatTotal',
                sortable: true,
                render: (row: any) => priceFormat(+row.vatTotal),
            },

            {
                label: 'Invoice Amount',
                key: 'totalPrice',
                sortable: true,
                render: (row: any) => priceFormat(+row.totalPrice),
            },

            {
                label: 'Paid',
                key: 'paid',
                render: (row: any) => <strong>{priceFormat(row.payedAmount)}</strong>,
            },

            {
                label: 'Balance Due',
                key: 'balance',
                sortable: true,
                render: (row: any) => (
                    <strong className={row.balanceDue > 0 ? 'text-danger' : ''}>
                        {priceFormat(row.balanceDue)}
                    </strong>
                ),
            },

            {
                label: 'Status',
                key: 'status',
                render: (row: any) => {
                    const { overdueStatus, paymentColor } = row;
                    if (overdueStatus.label.startsWith('Overdue')) {
                        return (
                            <div
                                className={classNames(
                                    `text-${overdueStatus?.type}`,
                                    'fw-bold py-1 px-3 rounded-pill text-center',
                                )}>
                                {overdueStatus.label}
                            </div>
                        );
                    }
                    return (
                        <div
                            className={classNames(
                                `bg-l${darkModeStatus ? 'o25' : '10'}-${paymentColor}`,
                                `text-${paymentColor}`,
                                'fw-bold py-1 px-3 rounded-pill text-center',
                            )}>
                            {getLabelByValue(INVOICE_STATUS_TYPE_LIST, row.invoice.status)}
                        </div>
                    );
                },
            },

            {
                label: 'Action',
                key: 'action',
                render: (row: any) => {
                    const inv = row?.invoice;
                    const isDraft = inv.status === INVOICE_STATUS.DRAFT;
                    const isVoid = inv.status === INVOICE_STATUS.VOID;
                    const isPend = inv.status === INVOICE_STATUS.PENDING;
                    const canPay = !isDraft && !isVoid;

                    if (isSingleMailSend === row?.id) return <Spinner color='primary' size='lg' />;

                    return (
                        <Dropdown>
                            <DropdownToggle hasIcon={false}>
                                <Button
                                    icon='MoreHoriz'
                                    color='dark'
                                    isLight
                                    shadow='sm'
                                    aria-label='More actions'
                                />
                            </DropdownToggle>
                            <DropdownMenu isAlignmentEnd>
                                <DropdownItem>
                                    <Button
                                        icon='Visibility'
                                        onClick={() => handleOpenInvoiceDetail(inv)}>
                                        View
                                    </Button>
                                </DropdownItem>
                                {isDraft && (
                                    <DropdownItem>
                                        <Button
                                            icon='Edit'
                                            onClick={() => handleOpenEditInvoiceDetail(inv)}>
                                            Edit
                                        </Button>
                                    </DropdownItem>
                                )}
                                {canPay && (
                                    <DropdownItem>
                                        <Button
                                            icon='Update'
                                            onClick={() => handleOpenEditInvoiceFrom(inv)}>
                                            Update Payment
                                        </Button>
                                    </DropdownItem>
                                )}
                                {isVoid && (
                                    <DropdownItem>
                                        <Button
                                            icon='Restore'
                                            onClick={() => handleRestoreVoid(inv)}>
                                            Restore to Draft
                                        </Button>
                                    </DropdownItem>
                                )}
                                {isDraft && (
                                    <DropdownItem>
                                        <Button
                                            icon='Cancel'
                                            onClick={() => handleUpdateInvoiceVoidStatus(inv)}>
                                            Void
                                        </Button>
                                    </DropdownItem>
                                )}
                                {isDraft && (
                                    <DropdownItem>
                                        <Button
                                            icon='Check'
                                            onClick={() => handleConfirmInvoice(inv)}>
                                            Confirm
                                        </Button>
                                    </DropdownItem>
                                )}
                                {isPend && (
                                    <DropdownItem>
                                        <Button
                                            icon='send'
                                            onClick={() =>
                                                showAlert({
                                                    title: 'Send Invoice?',
                                                    text: `Are you sure you want to send invoice ${inv.code}?`,
                                                    confirmButtonText: 'Yes, Send',
                                                    cancelButtonText: 'Cancel',
                                                    showCancelButton: true,
                                                    onConfirm: () =>
                                                        handleSendSingleMail({
                                                            ...inv,
                                                            invoiceAddress: row.invoiceAddress,
                                                        }),
                                                })
                                            }>
                                            Send
                                        </Button>
                                    </DropdownItem>
                                )}
                                {/* {isDraft && (
                                    <DropdownItem>
                                        <Button
                                            icon='Delete'
                                            color='danger'
                                            onClick={() => handleOpenDeleteInvoice(inv.id)}>
                                            Delete
                                        </Button>
                                    </DropdownItem>
                                )} */}
                            </DropdownMenu>
                        </Dropdown>
                    );
                },
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [darkModeStatus, detailInvoiceInfo],
    );

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div>
            <DataTable
                fixed
                columns={invoiceColumns}
                data={invoiceTableData}
                search={false}
                isLoading={isInvoiceLoading}
                pagination={true}
                pageSize={100}
            />

            <CreateBlockBedInvoice
                laOrICBfundDetails={laOrICBfundDetails}
                fundType={fundType}
                invoiceEditObject={invoiceEditObject}
                toggle={handleCloseCreateInvoiceModal}
                isOpen={isInvoiceEditFormOpen}
                activeBlockBedInfo={activeBlockBedInfo}
            />

            <InvoiceDetailViewModal
                fNCDetails={fNCDetails}
                localICBList={localICBList}
                localAuthorityList={localAuthorityList}
                toggle={() => setIsDetailInvoiceInfoModal(false)}
                residentData={detailInvoiceInfo?.residentData}
                detailInvoiceInfo={detailInvoiceInfo}
                isOpen={isDetailInvoiceInfoModal}
                handleConfirmInvoice={handleConfirmInvoice}
                handleUpdateInvoiceVoidStatus={handleUpdateInvoiceVoidStatus}
                handleRestoreVoid={handleRestoreVoid}
                showStatusUpdateBtn={true}
            />

            <InvoiceUpdateModal
                isResidentUpdate={false}
                fNCDetails={fNCDetails}
                invoiceTo={+invoiceFormObject?.invoiceTo}
                toggle={handleCloseInvoiceForm}
                localICBList={localICBList}
                localAuthorityList={localAuthorityList}
                detailInvoiceInfo={invoiceFormObject}
                isOpen={isInvoiceFormOpenModal}
            />
        </div>
    );
};
