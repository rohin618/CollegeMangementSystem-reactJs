import {
	CardBody,
	Card,
	CardHeader,
	CardTitle,
	CardLabel,
	CardActions,
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
	Badge,
	FormGroup,
	Select,
	Option,
} from '../../../../../../components/bootstrap';

import { getInvoicesHistoryList, updateInvoice } from '../../../../../../common/api/invoice';

import moment from 'moment';
import { useQuery } from '@tanstack/react-query';

import {
	getColorByValue,
	getCreditWalletsByPaymentId,
	getLabelByValue,
	getResidentInvoiceAddress,
	priceFormat,
	showAlert,
	updatePaymentStatus,
} from '../../../../../../helpers/helpers';

import { INVOICE_TO_TYPE_LIST, PAYMENT_METHOD_LIST } from '../../../../../../common/data/option';
import { useState, useMemo, useCallback } from 'react';
import useDarkMode from '../../../../../../hooks/useDarkMode';
import { getColorNameWithIndex } from '../../../../../../common/data/enumColors';
import Swal from 'sweetalert2';

import Avatar, { AvatarGroup } from '../../../../../../components/Avatar';
import { UpdatePayedAmountModal } from '../../../../paymentHistory/component';

import {
	useRefetchQueryList,
	useRemoveItemQueryListById,
	useSearch,
	useUpdateQueryListById,
} from '../../../../../../hooks';

import { PAYMENT_STATUS, PREBOOK_TYPE } from '../../../../../../common/constant';
import { deleteCreditWallet } from '../../../../../../common/api/creditWalet';
import { useParams } from 'react-router-dom';
import { AdvanceCreditForm } from '../../../../creditWallet/component';
import {
	DataTable,
	ResidentProfileCard,
	ResidentProfileGroup,
	SearchableSelect,
} from '../../../../../../components/common';
import Icon from '../../../../../../components/icon';

export const ResidentPaymentHistory = ({
	localICBList = [],
	localAuthorityList = [],
	fNCDetails = {},
	bankList = [],
}: any) => {
	const { residentId }: any = useParams();

	const invoiceReq = {
		residentId: residentId ?? '',
	};

	const { darkModeStatus } = useDarkMode();

	const [isEditInvoicePayedModalOpen, setIsEditInvoicePayedModalOpen] = useState(false);
	const [editInvoicePayedList, setEditInvoicePayedList] = useState<any[]>([]);
	const [editInvoiceCurentPayedInfoList, setEditInvoiceCurentPayedInfoList] = useState<any[]>([]);
	const [editCredittWalletsPayedInfoList, setEditCredittWalletsPayedInfoList] = useState<any[]>(
		[],
	);
	const [editInvoiceTo, setEditInvoiceTo] = useState<number>(-1);
	const [isResident, setIsResident] = useState<boolean>(false);
	const [isOpenAddAdvanceModel, setIsOpenAddAdvanceModel] = useState<boolean>(false);
	const [advanceEditObject, setAdvanceEditObject] = useState(null);

	const updateInvoiceListByComapany = useUpdateQueryListById<any>(['invoiceListByCompany']);
	const updateInvoiceListByResidentId = useUpdateQueryListById<any>(['invoiceList', residentId]);
	    const refetchResidentInvoiceList = useRefetchQueryList<any>(['invoiceList', residentId]);

	const { removeItemById } = useRemoveItemQueryListById<any>({
		queryKey: ['invoiceHistoryListByResidentId', invoiceReq],
	});

	const { removeItemById: removeCreditWalletById } = useRemoveItemQueryListById<any>({
		queryKey: ['creditWalletListByCompanyId'],
	});

	const {
		data: paymentHistoryList = [],
		isLoading,
		refetch: reloadInvoiceList,
	}: any = useQuery({
		queryKey: ['invoiceHistoryListByResidentId', invoiceReq],
		queryFn: () => getInvoicesHistoryList(invoiceReq),
	});


	/** UseMemo to directly return list */
	const invoiceHistoryListByResidentId = useMemo(() => paymentHistoryList, [paymentHistoryList]);

	/** Extract Invoices Without Current Payment */
	const extractInvoices = useCallback(
		(data: any) =>
			data?.payments?.map(({ invoice, payment }: any) => {
				const clone = { ...invoice };
				clone.payedInfo =
					invoice.payedInfo?.filter(
						(p: any) => p.id !== data.paymentId && p.id !== payment.id,
					) || [];
				delete clone.residentData;
				clone.status = updatePaymentStatus(clone);
				return clone;
			}) || [],
		[updatePaymentStatus],
	);

	const handleCloseUpdatePaymentModal = useCallback(() => {
		setEditInvoicePayedList([]);
		setEditInvoiceCurentPayedInfoList([]);
		setEditCredittWalletsPayedInfoList([]);
		setEditInvoiceTo(-1);
		setIsEditInvoicePayedModalOpen(false);
	}, []);

	/** Open Edit Popup */
	const handleOpenEditInvoiceForm = useCallback((invoice: any) => {
		if (invoice?.isAdvanceCredit) {
			const creditWallet = invoice.payments
				.flatMap(({ creditWallets }: any) => creditWallets)
				?.at(0);
			setIsOpenAddAdvanceModel(true);
			setAdvanceEditObject(creditWallet);
			return;
		}

		const invoiceList = invoice.payments.map(({ invoice, payment }: any) => ({
			...invoice,
			payedInfo: invoice.payedInfo?.filter(({ id }: any) => payment.id !== id),
		}));

		const invoicePayedInfo = invoice.payments.map(({ payment, invoice }: any) => ({
			...payment,
			invoiceId: invoice.id,
		}));

		const creditWallets = invoice.payments.map(({ creditWallets }: any) => ({ creditWallets }));

		const residentIds = invoice.payments.map(({ invoice }: any) => invoice?.residentId);
		const isResidentSame = residentIds.every((v: string) => v === residentIds[0]);

		setIsResident(isResidentSame);
		setEditCredittWalletsPayedInfoList(getCreditWalletsByPaymentId(creditWallets));
		setEditInvoicePayedList(invoiceList);
		setEditInvoiceCurentPayedInfoList(invoicePayedInfo);
		setEditInvoiceTo(invoice.payments[0]?.invoice?.fundSource);
		setIsEditInvoicePayedModalOpen(true);
	}, []);

	/** Delete Invoice */
	const handleOpenDeleteInvoice = useCallback(
		(payHistory: any) => {
			showAlert({
				title: 'Are you sure?',
				text: "You won't be able to revert this!",
				icon: 'warning',
				showCancelButton: true,
				confirmButtonText: 'Yes, delete it!',
				cancelButtonText: 'Cancel',

				onConfirm: async () => {
					const removedPayed = extractInvoices(payHistory);

					const creditWallets = payHistory.payments.map(({ creditWallets }: any) => ({
						creditWallets,
					}));

					const uniqueCreditWallets = getCreditWalletsByPaymentId(creditWallets);

					const creditApplyTotal = uniqueCreditWallets
						.flatMap(({ creditApply = [] }) => creditApply)
						.reduce((sum, { amount }) => sum + (Number(amount) || 0), 0);

					if (creditApplyTotal > 0) {
						showAlert({
							icon: 'warning',
							title: 'Cannot Delete Payment',
							html: `
                            <p>This payment used <b>${priceFormat(creditApplyTotal)}</b> from credit wallet.</p>
                            <p>You cannot delete this payment history.</p>
                        `,
						});
						return;
					}

					for (const wallet of uniqueCreditWallets) {
						await deleteCreditWallet(wallet.id);
						removeCreditWalletById(wallet.id);
					}

					for (const invoice of removedPayed) {
						const res = await updateInvoice(invoice.id, invoice);
						updateInvoiceListByComapany(res);
						updateInvoiceListByResidentId(res);
					}

					removeItemById(payHistory.paymentId, 'paymentId');
				},
			});
		},
		[
			extractInvoices,
			removeCreditWalletById,
			removeItemById,
			updateInvoiceListByComapany,
			updateInvoiceListByResidentId,
		],
	);

	/** Search */
	const { searchValue, setSearchValue, filteredList } = useSearch(
		invoiceHistoryListByResidentId,
		['invoiceTo'],
	);

	const invoiceTableData = useMemo(() => {
		if (!filteredList?.length) return [];

		return filteredList.map((invoice: any, index: number) => {
			const totalPayed = invoice.payments.reduce(
				(sum: number, cur: any) => sum + (cur.payment.amount || 0),
				0,
			);

			const creditWallets = invoice.payments.map(({ creditWallets }: any) => ({
				creditWallets,
			}));

			const creditTotal = getCreditWalletsByPaymentId(creditWallets).reduce(
				(sum: number, { creditAmount }: any) => sum + (Number(creditAmount) || 0),
				0,
			);

			const invoiceAddress = getResidentInvoiceAddress(
				invoice?.payments[0]?.invoice?.residentData,
				+invoice.invoiceTo,
				invoice?.fundTypeId,
				{
					localAuthorityList,
					localICBList,
					fNCDetails,
				},
			);

			const bankDetails = bankList?.find(
				(bank: any) => bank.id === invoice?.payments[0]?.payment?.bankId,
			);
			const fundColor = getColorByValue(INVOICE_TO_TYPE_LIST, +invoice.invoiceTo);
			return {
				id: invoice.id,
				index,
				invoice,
				avatars: invoice.payments,
				paymentMethod: invoice?.payments[0]?.payment?.paymentMethod,
				refNo: invoice?.payments[0]?.payment?.refNo || 'NA',
				bankName: bankDetails?.bankName || '',
				date: invoice.date,
				address: invoiceAddress?.shortName || 'NA',
				total: totalPayed + creditTotal,
				fundColor,
			};
		});
	}, [filteredList]);

	const invoiceColumns = useMemo(
		() => [
			{
				label: 'Resident',
				key: 'avatars',
				render: (row: any) => {
					// ✅ Deduplicate residents by residentData.id
					const uniqueAvatars = Array.from(
						new Map(
							row.avatars
								?.filter((item: any) => item?.invoice?.residentData?.id)
								.map((item: any) => [item.invoice.residentData.id, item]),
						).values(),
					);

					return (
						<ResidentProfileGroup max={1}>
							{uniqueAvatars.map(({ invoice }: any, i: number) => (
								<ResidentProfileCard
									key={invoice.residentData.id}
									resident={invoice.residentData}
									colorIndex={getColorNameWithIndex(i)}
								/>
							))}
						</ResidentProfileGroup>
					);
				},
			},

			{
				label: 'Date',
				key: 'date',
				sortable: true,
				render: (row: any) => moment(row.date).format('DD MMM YYYY'),
			},
			{
				label: 'Payment Ref',
				key: 'refNo',
				sortable: false,
				render: (row: any) => <strong>{row.refNo}</strong>,
			},

			{
				label: 'Amount',
				key: 'total',
				sortable: true,
				render: (row: any) => (
					<strong className={`text-success`}>{priceFormat(+row.total)}</strong>
				),
			},

			{
				label: 'Payment Method',
				key: 'paymentMethod',
				render: (row: any) => getLabelByValue(PAYMENT_METHOD_LIST, row.paymentMethod),
			},

			{
				label: 'Invoice To',
				key: 'address',
				render: (row: any) => (
					<Badge
						className={`me-2 border-${row.fundColor} px-3 py-2 border-2 fs-9`}
						isLight
						color={row.fundColor}>
						{row.address}
					</Badge>
				),
			},
			{
				label: 'Bank',
				key: 'bankName',
			},

			{
				label: 'Action',
				key: 'action',
				render: (row: any) => (
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
									icon='Edit'
									color='info'
									isLight
									onClick={() => handleOpenEditInvoiceForm(row.invoice)}>
									Edit
								</Button>
							</DropdownItem>
							<DropdownItem>
								<Button
									icon='delete'
									onClick={() => handleOpenDeleteInvoice(row.invoice)}>
									Delete
								</Button>
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				),
			},
		],
		[],
	);

	/** Table Rows */
	const invoiceRows = useMemo(() => {
		if (!filteredList.length)
			return (
				<tr>
					<td colSpan={7} className='text-center text-muted py-3'>
						{isLoading ? 'Loading...' : 'No Payment found.'}
					</td>
				</tr>
			);

		return filteredList.map((invoice: any, index: number) => {
			const totalPayed = invoice.payments.reduce(
				(sum: number, cur: any) => sum + (cur.payment.amount || 0),
				0,
			);

			const getCreditTotal = (invoice: any) => {
				const creditWallets = invoice.payments.map(({ creditWallets }: any) => ({
					creditWallets,
				}));
				const uniqueCreditWallets = getCreditWalletsByPaymentId(creditWallets);
				return uniqueCreditWallets.reduce(
					(sum: number, { creditAmount }: any) => sum + (Number(creditAmount) || 0),
					0,
				);
			};

			const totalPay = totalPayed + getCreditTotal(invoice);

			const invoiceAddress = getResidentInvoiceAddress(
				invoice?.payments[0]?.invoice?.residentData,
				+invoice.invoiceTo,
				invoice?.fundTypeId,
				{ localAuthorityList, localICBList, fNCDetails },
			);

			return (
				<tr key={invoice.id}>
					<td>
						<AvatarGroup>
							{invoice.payments.map(({ invoice }: any, i: number) => (
								<Avatar
									key={i}
									userName={invoice?.residentData?.personal?.name}
									color={getColorNameWithIndex(index)}
								/>
							))}
						</AvatarGroup>
					</td>

					<td>{moment(invoice.date).format('DD MMM YYYY')}</td>

					<td>{invoiceAddress?.shortName || 'NA'}</td>

					<td>
						<Badge isLight>{priceFormat(totalPay)}</Badge>
					</td>

					<td>
						<Dropdown>
							<DropdownToggle hasIcon={false}>
								<Button icon='MoreHoriz' color='dark' isLight />
							</DropdownToggle>
							<DropdownMenu isAlignmentEnd>
								<DropdownItem>
									<Button
										icon='delete'
										onClick={() => handleOpenDeleteInvoice(invoice)}>
										Delete
									</Button>
								</DropdownItem>
								<DropdownItem>
									<Button
										icon='Edit'
										color='info'
										isLight
										onClick={() => handleOpenEditInvoiceForm(invoice)}>
										Edit
									</Button>
								</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					</td>
				</tr>
			);
		});
	}, [filteredList, isLoading, darkModeStatus]);

	const handleToggleCreateAdvanceModal = () => {
		setIsOpenAddAdvanceModel(false);
		setAdvanceEditObject(null);
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardLabel icon='Receipt'>
						<CardTitle>Payment History</CardTitle>
						<CardActions>Total: {filteredList?.length}</CardActions>
					</CardLabel>
				</CardHeader>

				<CardBody>
					<div className='row mb-4'>
						<div className='col-md-4'>
							<FormGroup id='searchList' label='Payment From'>
								<SearchableSelect
									id='searchList'
									value={searchValue}
									onChange={(e: any) => setSearchValue(e.target.value)}
									options={INVOICE_TO_TYPE_LIST}
									placeholder='Select Payment From'
								/>
							</FormGroup>
						</div>

						<div className='col-md-4 d-flex align-items-end'>
							<Button
								color='link'
								className='text-decoration-none text-primary fw-semibold p-0 d-flex align-items-center gap-1 justify-content-center'
								onClick={() => setSearchValue('')}>
								<Icon icon='Refresh' size='lg' className='text-primary' />
								Reset
							</Button>
						</div>
					</div>
					<DataTable
						columns={invoiceColumns}
						data={invoiceTableData}
						isLoading={isLoading}
						pagination={false}
						//   pageSize={10}
						search={false}
						noDataFound='Payment not recorded yet.'
						fixed
					/>
					{/* <table className="table table-modern table-hover">
                        <thead>
                            <tr>
                                <th>Residents</th>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Paid Amount</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>{invoiceRows}</tbody>
                    </table> */}
				</CardBody>
			</Card>

			<UpdatePayedAmountModal
				isOpen={isEditInvoicePayedModalOpen}
				toggle={handleCloseUpdatePaymentModal}
				invoiceList={editInvoicePayedList}
				invoiceTo={editInvoiceTo}
				isResidentUpdate={true}
				reloadInvoiceList={reloadInvoiceList}
				InvoiceCurentPayedInfoList={editInvoiceCurentPayedInfoList}
				credittWalletsPayedInfoList={editCredittWalletsPayedInfoList}
                refetchResidentInvoiceList={refetchResidentInvoiceList.forceRefetch}
			/>

			<AdvanceCreditForm
				isOpen={isOpenAddAdvanceModel}
				toggle={handleToggleCreateAdvanceModal}
				advanceEditObject={advanceEditObject}
			/>
		</>
	);
};
