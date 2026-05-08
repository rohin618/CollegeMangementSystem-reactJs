import {
    Card, CardBody, CardHeader, CardTitle, CardLabel, CardActions,
    Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Badge,
} from '../../../../../components/bootstrap';
import { deleteCreditWallet, getAllByCompanyIdCreditWallet } from '../../../../../common/api/creditWalet';
import { useQuery } from '@tanstack/react-query';
import {
    getFirstLetter, getLabelByValue, getResidentInvoiceAddress,
    mergeArrayOfObjectUniqueByKey, priceFormat, showAlert,
} from '../../../../../helpers/helpers';
import useDarkMode from '../../../../../hooks/useDarkMode';
import Icon from '../../../../../components/icon';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { CREDIT_TO_TYPE_LIST, CREDIT_TYPE_LIST, CREDIT_TYPE_STAUS_LIST } from '../../../../../common/data/option';
import { CREDIT_STATUS, CREDIT_TYPE } from '../../../../../common/constant';
import moment from 'moment';
import { InvoiceDetailViewModal } from '../../../invoice/component';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { CreditNoteDoc } from '../creditNoteDoc';
import { ResidentProfileCard } from '../../../../../components/common';
import { AdvanceCreditForm } from '../advanceCreditForm';
import { useRemoveItemQueryListById, useSearch, useUpdateQueryListById } from '../../../../../hooks';
import Swal from 'sweetalert2';
import { ICreditWalletModel } from '../../../../../common/interface';

// ─── Constants (module level — stable references) ────────────────────────────
const QUERY_KEY_BASE = 'creditWalletListByCompanyId';
const REQ_OBJ = { isGroupByResident: true };
const QUERY_KEY = [QUERY_KEY_BASE, REQ_OBJ];

// ─── Types ────────────────────────────────────────────────────────────────────
interface CreditWalletListByCompanyIdCardProps {
    activeTab: number | string;
    searchValue: string;
}

interface ResidentCardProps {
    resident: any;
    index: number;
    darkModeStatus: boolean;
    localAuthorityList: any[];
    localICBList: any[];
    fNCDetails: any;
    onOpenInvoiceDetail: (invoice: any, resident: any) => void;
    onOpenCreditNotesDoc: (credit: any, resident: any) => void;
    onOpenApplyCredit: (credit: any) => void;
    onOpenDeleteWallet: (wallet: ICreditWalletModel, resident: any) => void;
}

// ─── ResidentCard (outside parent — stable, no remount on parent re-render) ──
const ResidentCard = memo(({
    resident,
    index,
    darkModeStatus,
    localAuthorityList,
    localICBList,
    fNCDetails,
    onOpenInvoiceDetail,
    onOpenCreditNotesDoc,
    onOpenApplyCredit,
    onOpenDeleteWallet,
}: ResidentCardProps) => {
    const colorIndex = getColorNameWithIndex(index);

    const invoiceAddress = getResidentInvoiceAddress(
        resident,
        +resident?.creditWallets[0]?.creditTo,
        resident?.creditWallets[0]?.fundTypeId,
        { localAuthorityList, localICBList, fNCDetails },
    );

    const totalCredit = useMemo(
        () => resident?.creditWallets?.reduce((sum: number, w: any) => sum + (w.creditAmount || 0), 0) ?? 0,
        [resident.creditWallets],
    );

    return (
        <div className="col-md-12">
            <Card className="border-1" borderSize={2}>
                <CardHeader>
                    <CardLabel>
                        <CardTitle tag="div" className="h5">
                            {resident?.id ? (
                                <ResidentProfileCard resident={resident} colorIndex={colorIndex} />
                            ) : (
                                <div className="d-flex align-items-center">
                                    <div className="flex-shrink-0 me-3">
                                        <div className="ratio ratio-1x1" style={{ width: 48 }}>
                                            <div className={`bg-l${darkModeStatus ? 'o25' : '25'}-${colorIndex} text-${colorIndex} rounded-2 d-flex align-items-center justify-content-center`}>
                                                <span className="fw-bold">{getFirstLetter(invoiceAddress?.name)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="fs-6 fw-bold">{invoiceAddress?.name}</div>
                                        <small>{invoiceAddress?.shortName}</small>
                                    </div>
                                </div>
                            )}
                        </CardTitle>
                    </CardLabel>
                    <CardActions>
                        <label className="text-muted">Overall:</label>
                        <strong className="fs-5">{priceFormat(totalCredit)}</strong>
                    </CardActions>
                </CardHeader>
                <CardBody>
                    <table className="table table-modern table-hover">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Type</th>
                                <th>Credit Amount</th>
                                <th>Available Balance</th>
                                <th>Category</th>
                                <th>Invoice To</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Invoice Link</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {resident.creditWallets.map((credit: any) => {
                                const invoices = mergeArrayOfObjectUniqueByKey(credit.invoices, credit.invoices);
                                const creditInvoiceAddress = getResidentInvoiceAddress(
                                    resident,
                                    +credit.creditTo,
                                    credit?.fundTypeId,
                                    { localAuthorityList, localICBList, fNCDetails },
                                );
                                const creditApplyTotal = (credit?.creditApply || []).reduce(
                                    (sum: number, { amount }: any) => sum + (Number(amount) || 0),
                                    0,
                                );

                                return (
                                    <tr key={credit.id}>
                                        <td>{credit.code}</td>
                                        <td>
                                            <Badge isLight className="p-2 px-3 fs-9"
                                                color={CREDIT_TYPE.ADJUSTMENT_CREDIT === credit.type ? 'success' : 'info'}>
                                                {getLabelByValue(CREDIT_TYPE_LIST, credit.type)}
                                            </Badge>
                                        </td>
                                        <td>{priceFormat(credit.creditAmount)}</td>
                                        <td>{priceFormat(credit.creditAmount - creditApplyTotal)}</td>
                                        <td>{creditInvoiceAddress?.shortName || 'NA'}</td>
                                        <td>
                                            <Badge isLight className="p-2 px-3 fs-9"
                                                color={darkModeStatus ? 'light' : 'dark'}>
                                                {getLabelByValue(CREDIT_TO_TYPE_LIST, credit.creditTo)}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge isLight className="p-2 px-3 fs-9"
                                                color={CREDIT_STATUS.ACTIVE === +credit.status ? 'success' : 'danger'}>
                                                {getLabelByValue(CREDIT_TYPE_STAUS_LIST, credit.status)}
                                            </Badge>
                                        </td>
                                        <td>{moment(credit.date).format('DD MMM YYYY')}</td>
                                        <td>
                                            {invoices?.length > 0 ? (
                                                <div className="d-flex flex-wrap gap-2">
                                                    {invoices.map((invoice: any) => (
                                                        <Button key={invoice.id} isLight color="primary" size="sm"
                                                            onClick={() => onOpenInvoiceDetail(invoice, resident)}>
                                                            #{invoice.code}
                                                        </Button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted">No invoices</span>
                                            )}
                                        </td>
                                        <td>
                                            <Dropdown>
                                                <DropdownToggle hasIcon={false}>
                                                    <Button icon="MoreHoriz" color="dark" isLight shadow="sm" aria-label="More actions" />
                                                </DropdownToggle>
                                                <DropdownMenu isAlignmentEnd>
                                                    <DropdownItem>
                                                        <Button icon="Visibility" onClick={() => onOpenCreditNotesDoc(credit, resident)}>
                                                            View
                                                        </Button>
                                                    </DropdownItem>
                                                    <DropdownItem>
                                                        <Button icon="Delete" onClick={() => onOpenDeleteWallet(credit, resident)}>
                                                            Delete
                                                        </Button>
                                                    </DropdownItem>
                                                    <DropdownItem>
                                                        <Button icon="CreditCard" onClick={() => onOpenApplyCredit(credit)}>
                                                            Apply Credit
                                                        </Button>
                                                    </DropdownItem>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardBody>
            </Card>
        </div>
    );
});

ResidentCard.displayName = 'ResidentCard';

// ─── Main Component ───────────────────────────────────────────────────────────
export const CreditWalletListByCompanyIdCard = ({ activeTab, searchValue }: CreditWalletListByCompanyIdCardProps) => {
    const { darkModeStatus } = useDarkMode();
    const { localAuthorityList = [], localICBList = [], fNCDetails } = useMasterData();

    const [invoiceDetailInfo, setInvoiceDetailInfo] = useState<any>({});
    const [isDetailInvoiceInfoModal, setIsDetailInvoiceInfoModal] = useState(false);
    const [isOpenAddAdvanceModel, setIsOpenAddAdvanceModel] = useState(false);
    const [advanceEditObject, setAdvanceEditObject] = useState<any>(null);
    const [creditDetailInfo, setCreditDetailInfo] = useState<any>({});
    const [isDetailICreditInfoModal, setIsDetailICreditInfoModal] = useState(false);

    // ── Query (fires exactly once, fully cached) ──────────────────────────────
    const { data: creditWalletList = [], isLoading, isError, refetch } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => getAllByCompanyIdCreditWallet(REQ_OBJ),
        staleTime: Infinity,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        retry: 1,
    });

    const { removeItemById: removeCreditWalletById } = useRemoveItemQueryListById<any>({ queryKey: QUERY_KEY });
    const updateCreditWalletList = useUpdateQueryListById<any>(QUERY_KEY);

    // ── Filtering ─────────────────────────────────────────────────────────────
    const filteredWalletList = useMemo(() => {
        if (activeTab === 'ALL') return creditWalletList;
        return creditWalletList
            .map((resident: any) => ({
                ...resident,
                creditWallets: resident.creditWallets?.filter((w: any) => +w.type === activeTab) ?? [],
            }))
            .filter((r: any) => r.creditWallets.length > 0);
    }, [creditWalletList, activeTab]);

    const { setSearchValue, filteredList: filteredCreditList } = useSearch(filteredWalletList, [
        'creditWallets.code',
        'personal.name',
    ]);

    useEffect(() => {
        setSearchValue(searchValue);
    }, [searchValue, setSearchValue]);

    // ── Handlers (stable with useCallback) ───────────────────────────────────
    const openInvoiceDetail = useCallback((invoice: any, residentData: any) => {
        setInvoiceDetailInfo({ ...invoice, residentData });
        setIsDetailInvoiceInfoModal(true);
    }, []);

    const handleOpenCreditNotesDoc = useCallback((credit: any, residentData: any) => {
        setCreditDetailInfo({ ...credit, residentData });
        setIsDetailICreditInfoModal(true);
    }, []);

    const handleCloseCreditNotesDoc = useCallback(() => {
        setCreditDetailInfo({});
        setIsDetailICreditInfoModal(false);
    }, []);

    const handleOpenApplyCredit = useCallback((credit: any) => {
        setAdvanceEditObject(credit);
        setIsOpenAddAdvanceModel(true);
    }, []);

    const handleOpenDeleteWallet = useCallback(async (wallet: ICreditWalletModel, resident: any) => {
        if (!wallet?.id || !resident?.id) return;

        showAlert({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            onConfirm: async () => {
                const creditApplied = (wallet.creditApply || []).reduce(
                    (sum: number, { amount }: any) => sum + Number(amount || 0), 0,
                );

                if (creditApplied > 0) {
                    const invoiceCodesHtml = (wallet.invoices || [])
                        .map((inv: any) => `<b>#${inv.code}</b>`).join(', ');
                    const remainingBalance = Math.max(0, Number(wallet.creditAmount || 0) - creditApplied);

                    await Swal.fire({
                        icon: 'warning',
                        title: 'Cannot Delete Credit',
                        html: `
                            <p>Credit Wallet <b>${wallet.code}</b> has been used in Invoice(s): ${invoiceCodesHtml}</p>
                            <p>Used Amount: <b>${priceFormat(creditApplied)}</b><br/>
                            Available Balance: <b>${priceFormat(remainingBalance)}</b></p>
                            <p>Since this credit has already been applied, it cannot be deleted.</p>
                        `,
                    });
                    return;
                }

                const resWalletDelete = await deleteCreditWallet(wallet.id!);
                if (!resWalletDelete?.success) return;

                const updatedWallets = resident.creditWallets?.filter(
                    (w: ICreditWalletModel) => w.id !== wallet.id,
                );
                if (updatedWallets?.length > 0) {
                    updateCreditWalletList({ ...resident, creditWallets: updatedWallets });
                } else {
                    removeCreditWalletById(resident.id);
                }
            },
        });
    }, [updateCreditWalletList, removeCreditWalletById]);

    // ── Render ────────────────────────────────────────────────────────────────
    if (isLoading) return (
        <div className="col-12 text-center p-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-3">Loading Credit Wallets...</p>
        </div>
    );

    if (isError) return (
        <div className="col-12 text-center p-5 text-danger">
            <Icon icon="Error" size="lg" className="me-2" />
            Failed to load credit wallet list.
            <div className="mt-3">
                <Button color="danger" onClick={refetch}>Retry</Button>
            </div>
        </div>
    );

    if (creditWalletList.length === 0) return (
        <div className="col-12 text-center p-5 text-muted">
            <Icon icon="Wallet" size="lg" className="me-2" />
            <p>No credit wallets found.</p>
        </div>
    );

    if (filteredCreditList.length === 0) return (
        <div className="col-12 text-center p-5">
            <Icon icon="Info" size="lg" color="primary" className="mb-3" />
            <h5 className="text-muted mb-0">No Data Found</h5>
        </div>
    );

    return (
        <div className="row">
            {filteredCreditList.map((resident: any, index: number) => (
                <ResidentCard
                    key={resident?.id || index}
                    resident={resident}
                    index={index}
                    darkModeStatus={darkModeStatus}
                    localAuthorityList={localAuthorityList}
                    localICBList={localICBList}
                    fNCDetails={fNCDetails}
                    onOpenInvoiceDetail={openInvoiceDetail}
                    onOpenCreditNotesDoc={handleOpenCreditNotesDoc}
                    onOpenApplyCredit={handleOpenApplyCredit}
                    onOpenDeleteWallet={handleOpenDeleteWallet}
                />
            ))}

            <InvoiceDetailViewModal
                fNCDetails={fNCDetails}
                localICBList={localICBList}
                localAuthorityList={localAuthorityList}
                toggle={() => setIsDetailInvoiceInfoModal(false)}
                residentData={invoiceDetailInfo?.residentData}
                detailInvoiceInfo={invoiceDetailInfo}
                isOpen={isDetailInvoiceInfoModal}
            />
            <CreditNoteDoc
                toggle={handleCloseCreditNotesDoc}
                isOpen={isDetailICreditInfoModal}
                creditDetailInfo={creditDetailInfo}
            />
            <AdvanceCreditForm
                isFromApplyCredit={advanceEditObject?.type !== CREDIT_TYPE.ADJUSTMENT_CREDIT}
                isOpen={isOpenAddAdvanceModel}
                toggle={() => setIsOpenAddAdvanceModel(prev => !prev)}
                advanceEditObject={advanceEditObject}
            />
        </div>
    );
};