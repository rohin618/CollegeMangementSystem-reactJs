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
} from '../../../../../components/bootstrap';
import {
	getInvoicesHistoryList,
	updateInvoice,
} from '../../../../../common/api/invoice';
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
} from '../../../../../helpers/helpers';
import { INVOICE_TO_TYPE_LIST, PAYMENT_METHOD_LIST } from '../../../../../common/data/option';
import { useState, useMemo, useCallback } from 'react';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import Swal from 'sweetalert2';
import Avatar, { AvatarGroup } from '../../../../../components/Avatar';
import { UpdatePayedAmountModal } from '../updatePayedAmount';
import {
	useMultiSearch,
	useRefetchQueryList,
	useRemoveItemQueryListById,
	useSearch,
	useUpdateQueryListById,
} from '../../../../../hooks';
import { INVOICE_STATUS, INVOICE_TO_TYPE, PAYMENT_STATUS, PREBOOK_TYPE } from '../../../../../common/constant';
import { deleteCreditWallet, getAllByCompanyIdCreditWallet } from '../../../../../common/api/creditWalet';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { AdvanceCreditForm } from '../../../creditWallet/component';
import { DataTable, ResidentProfileCard, ResidentProfileGroup } from '../../../../../components/common';
import { downloadOverAllPaymentHistoryListAsExcel, downloadOverAllPaymentHistoryListAsPDF } from '../../../../../helpers/exportExcel';
import { useGetAllRoomsWithBeds } from '../../../../../hooks/useGetAllRoomsWithBed';

/** 🔹 Main Component */
export const InvoiceHistoryListByCompanyCard = ({
	isLoading = false,
	filteredPaymentList = [],
	reloadInvoiceList = () => { },
	localAuthorityList = [],
	localICBList = [],
	fNCDetails = [],
	bankList = []
}: any) => {
	const { darkModeStatus } = useDarkMode();

	/** 🔹 Local States */
	const [invoiceEditObject, setInvoiceEditObject] = useState<any>(null);
	const [isInvoiceEditFormOpen, setIsInvoiceEditFormOpen] = useState(false);
	const [isEditInvoicePayedModalOpen, setIsEditInvoicePayedModalOpen] = useState(false);
	const [editInvoicePayedList, setEditInvoicePayedList] = useState<any[]>([]);
	const [editInvoiceCurentPayedInfoList, setEditInvoiceCurentPayedInfoList] = useState<any[]>([]);
	const [editCredittWalletsPayedInfoList, setEditCredittWalletsPayedInfoList] = useState<any[]>([]);
	const [editInvoiceTo, setEditInvoiceTo] = useState<number>(-1);
	const [isResident, setIsResident] = useState<boolean>(false);
	const [isOpenAddAdvanceModel, setIsOpenAddAdvanceModel] = useState<boolean>(false);
	const [advanceEditObject, setAdvanceEditObject] = useState(null);

	//    const { data: creditWalletList = [], isLoading, isError, refetch } = useQuery({
	// 		queryKey: ['creditWalletListByCompanyId', reqObjCreditWallet],
	// 		queryFn: () => getAllByCompanyIdCreditWallet(reqObjCreditWallet),
	// 		staleTime: 5 * 60 * 1000, // cache fresh for 5 minutes
	// 		retry: 1, // retry once on failure
	// 	});



	const { removeItemById } = useRemoveItemQueryListById<any>({
		queryKey: ['invoiceHistoryListByComapany'],
	});

	const reqObjCreditWallet = {
		isGroupByResident: true
	}
	var refetchCreditWalletListByCompanyId = useRefetchQueryList<any>(['creditWalletListByCompanyId', reqObjCreditWallet]);
	var refetchInvoiceListByComapany = useRefetchQueryList<any>(['invoiceListByCompany']);

	const {
		data: roomsList = [],
		isLoading: roomListIsLoading,
		isError: isRoomError,
	} = useGetAllRoomsWithBeds();



	// const fromDate = dateRange.selection.startDate
	// const toDate = dateRange.selection.endDate





	const extractInvoices = useCallback(
		(data: any) =>
			data?.payments?.map(({ invoice, payment }: any) => {
				const clone = { ...invoice };
				clone.payedInfo = Array.isArray(invoice.payedInfo)
					? invoice.payedInfo.filter(
						(p: any) => p.id !== data.paymentId && p.id !== payment.id
					)
					: [];
				delete clone.residentData;
				clone.status = updatePaymentStatus(clone);
				return clone;
			}) || [],
		[updatePaymentStatus]
	);

	const handleCloseUpdatePaymentModal = useCallback(() => {
		setEditInvoicePayedList([]);
		setIsEditInvoicePayedModalOpen(false);
		setEditInvoiceTo(-1);
	}, []);

	const handleOpenEditInvoiceForm = useCallback((invoice: any) => {

		if (invoice?.isAdvanceCredit) {
			const creditWallet = invoice.payments.flatMap(({ creditWallets }: any) => creditWallets)?.at(0);
			setIsOpenAddAdvanceModel(true);
			setAdvanceEditObject(creditWallet)
			return
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
		const isResidentSame =
			residentIds.length > 0 && residentIds.every((v: string) => v === residentIds[0]);

		setIsResident(isResidentSame);
		setEditCredittWalletsPayedInfoList(getCreditWalletsByPaymentId(creditWallets));
		setEditInvoicePayedList(invoiceList);
		setEditInvoiceCurentPayedInfoList(invoicePayedInfo);
		setEditInvoiceTo(invoice.payments[0]?.invoice?.fundSource);
		setIsEditInvoicePayedModalOpen(true);
	}, []);


	const handleToggleCreateAdvanceModal = () => {
		setIsOpenAddAdvanceModel(false);
		setAdvanceEditObject(null)
	}

	/** 🔹 Delete Invoice Payment */
	const handleOpenDeleteInvoice = useCallback(
		async (payHistory: any) => {
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
						await showAlert({
							icon: 'warning',
							title: 'Cannot Delete Payment',
							html: `
            <p>This payment made on <b>${payHistory.date}</b>
            used <b>${priceFormat(creditApplyTotal)}</b> from your credit wallet.</p>
            <p>You cannot delete this payment history.</p>
          `,
						});
						return;
					}

					for (const wallet of uniqueCreditWallets) {
						await deleteCreditWallet(wallet.id);

					}
					for (const invoice of removedPayed) {
						if (!invoice.id) continue;
						const res = await updateInvoice(invoice.id, invoice);

					};
					refetchCreditWalletListByCompanyId?.forceRefetch()
					refetchInvoiceListByComapany?.forceRefetch();
					removeItemById(payHistory.paymentId, 'paymentId');
				}
			});
			// if (!confirm.isConfirmed) return;

		},
		[extractInvoices, refetchCreditWalletListByCompanyId, removeItemById, refetchInvoiceListByComapany]
	);

	// /** 🔹 Toggle & Save Invoice Edit */
	// const toggleInvoiceEditForm = useCallback(() => {
	// 	setInvoiceEditObject(null);
	// 	setIsInvoiceEditFormOpen((prev) => !prev);
	// }, []);
	// const handleOnInvoiceSave = useCallback(() => {
	// 	setIsInvoiceEditFormOpen(false);
	// 	setInvoiceEditObject(null);
	// 	reloadInvoiceList();
	// }, [reloadInvoiceList]);









	// const invoiceRows = useMemo(() => {
	// 	if (!filteredPaymentList.length)
	// 		return (
	// 			<tr>
	// 				<td colSpan={7} className="text-center text-muted py-3">
	// 					{isLoading ? 'Loading invoices...' : ' Payment not recorded yet.'}
	// 				</td>
	// 			</tr>
	// 		);

	// 	return filteredPaymentList.map((invoice: any, index: number) => {
	// 		const totalPayed = invoice.payments.reduce(
	// 			(sum: number, cur: any) => sum + (cur.payment.amount || 0),
	// 			0
	// 		);

	// 		const getCreditTotal = (invoice: any) => {
	// 			const creditWallets = invoice.payments.map(({ creditWallets }: any) => ({
	// 				creditWallets,
	// 			}));
	// 			const uniqueCreditWallets = getCreditWalletsByPaymentId(creditWallets);
	// 			return uniqueCreditWallets.reduce((sum: number, { creditAmount }: any) => sum + (Number(creditAmount) || 0), 0);
	// 		};

	// 		const totalPay = +totalPayed + getCreditTotal(invoice);


	// 		const invoiceAddress = getResidentInvoiceAddress(invoice?.payments[0]?.invoice?.residentData, +invoice.invoiceTo, invoice?.fundTypeId, {
	// 			localAuthorityList,
	// 			localICBList,
	// 			fNCDetails
	// 		})

	// 		return (
	// 			<tr key={invoice.id}>
	// 				<td>
	// 					<AvatarGroup className="avatar-group-payed-invoice">
	// 						{invoice.payments.map(({ invoice }: any, i: number) => (
	// 							<Avatar
	// 								key={i}
	// 								userName={invoice?.residentData?.personal?.name}
	// 								color={getColorNameWithIndex(index)}
	// 							/>
	// 						))}
	// 					</AvatarGroup>
	// 				</td>
	// 				<td>{getLabelByValue(PAYMENT_METHOD_LIST,invoice?.payments[0]?.payment?.paymentMethod)}</td>
	// 				<td>{moment(invoice.date).format('DD MMM YYYY')}</td>

	// 				<td>{invoiceAddress?.shortName ? invoiceAddress?.shortName : 'NA'}</td>
	// 				<td>
	// 					<Badge isLight>{priceFormat(+totalPay)}</Badge>
	// 				</td>
	// 				{/* <td>{fundSource}</td> */}
	// 				<td>
	// 					<Dropdown>
	// 						<DropdownToggle hasIcon={false}>
	// 							<Button
	// 								icon="MoreHoriz"
	// 								color="dark"
	// 								isLight
	// 								shadow="sm"
	// 								aria-label="More actions"
	// 							/>
	// 						</DropdownToggle>
	// 						<DropdownMenu isAlignmentEnd>

	// 							<DropdownItem>
	// 								<Button
	// 									icon="Edit"
	// 									color="info"
	// 									isLight
	// 									onClick={() => handleOpenEditInvoiceForm(invoice)}
	// 								>
	// 									Edit
	// 								</Button>
	// 							</DropdownItem>
	// 							<DropdownItem>
	// 								<Button
	// 									icon="delete"
	// 									onClick={() => handleOpenDeleteInvoice(invoice)}
	// 								>
	// 									Delete
	// 								</Button>
	// 							</DropdownItem>
	// 						</DropdownMenu>
	// 					</Dropdown>
	// 				</td>
	// 			</tr>
	// 		);
	// 	});
	// }, [invoiceHistoryListByComapany, isLoading, darkModeStatus, handleOpenEditInvoiceForm, handleOpenDeleteInvoice]);


	const invoiceTableData = useMemo(() => {
		if (!filteredPaymentList?.length) return [];

		return filteredPaymentList.map((invoice: any, index: number) => {
			const totalPayed = invoice.payments.reduce(
				(sum: number, cur: any) => sum + (cur.payment.amount || 0),
				0
			);

			const creditWallets = invoice.payments.map(
				({ creditWallets }: any) => ({ creditWallets })
			);

			const creditTotal = getCreditWalletsByPaymentId(creditWallets).reduce(
				(sum: number, { creditAmount }: any) =>
					sum + (Number(creditAmount) || 0),
				0
			);

			const invoiceAddress = getResidentInvoiceAddress(
				invoice?.payments[0]?.invoice?.residentData,
				+invoice.invoiceTo,
				invoice?.fundTypeId,
				{
					localAuthorityList,
					localICBList,
					fNCDetails,
				}
			);

			const bankDetails = bankList?.find((bank: any) => bank.id === invoice?.payments[0]?.payment?.bankId)
			const fundColor = getColorByValue(INVOICE_TO_TYPE_LIST, +invoice.invoiceTo,);

			const firstPayment = invoice?.payments?.[0]?.payment;
			return {
				id: invoice.id,
				index,
				invoice,
				avatars: invoice.payments,
				paymentMethod: getLabelByValue(
					PAYMENT_METHOD_LIST,
					firstPayment?.paymentMethod
				),

				refNo: invoice?.payments[0]?.payment?.refNo || 'NA',
				bankName: bankDetails?.bankName || '',
				date: invoice.date,
				address: invoiceAddress?.shortName || "NA",
				total: totalPayed + creditTotal,
				fundColor
			};
		});
	}, [filteredPaymentList]);


	const invoiceColumns = useMemo(() => [
		{
			label: "Resident",
			key: "avatars",
			render: (row: any) => {
				// ✅ Deduplicate residents by residentData.id
				const uniqueAvatars = Array.from(
					new Map(
						row.avatars
							?.filter((item: any) => item?.invoice?.residentData?.id)
							.map((item: any) => [
								item.invoice.residentData.id,
								item,
							])
					).values()
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
			label: "Date",
			key: "date",
			sortable: true,
			render: (row: any) =>
				row?.date ? moment(row.date).format("DD MMM YYYY") : '-',
		},
		{
			label: "Payment Ref",
			key: "refNo",
			sortable: false,
			render: (row: any) =>
				<strong>{row.refNo}</strong>
		},

		{
			label: "Amount",
			key: "total",
			sortable: true,
			render: (row: any) => (
				<strong className={`text-success`}>{priceFormat(+row.total)}</strong>
			),
		},

		{
			label: "Payment Method",
			key: "paymentMethod",
			// render: (row: any) =>
			// 	getLabelByValue(PAYMENT_METHOD_LIST, row.paymentMethod),
		},

		{
			label: "Invoice To",
			key: "address",
			render: (row: any) =>
				<Badge className={`me-2 border-${row.fundColor} px-3 py-2 border-2 fs-9`} isLight color={row.fundColor}>{row.address}</Badge>


		},
		{
			label: "Bank",
			key: "bankName",
		},

		{
			label: "Action",
			key: "action",
			render: (row: any) => (
				<Dropdown>
					<DropdownToggle hasIcon={false}>
						<Button
							icon="MoreHoriz"
							color="dark"
							isLight
							shadow="sm"
							aria-label="More actions"
						/>
					</DropdownToggle>
					<DropdownMenu isAlignmentEnd>
						<DropdownItem>
							<Button
								icon="Edit"
								color="info"
								isLight
								onClick={() =>
									handleOpenEditInvoiceForm(row.invoice)
								}
							>
								Edit
							</Button>
						</DropdownItem>
						<DropdownItem>
							<Button
								icon="delete"
								onClick={() =>
									handleOpenDeleteInvoice(row.invoice)
								}
							>
								Delete
							</Button>
						</DropdownItem>
					</DropdownMenu>
				</Dropdown>
			),
		},
	], []);


	// const getOverallPaidAmount = (paymentList: any[]) => {
	// 	return paymentList.reduce((grandTotal: number, group: any) => {
	// 		const groupTotal = (group.payments || []).reduce(
	// 			(sum: number, p: any) =>
	// 				sum +
	// 				(p?.invoice?.payedInfo || []).reduce(
	// 					(s: number, pi: any) => s + Number(pi?.amount || 0),
	// 					0
	// 				),
	// 			0
	// 		);

	// 		return grandTotal + groupTotal;
	// 	}, 0);
	// };

const overallTotal = useMemo(() => {
	return (filteredPaymentList || []).reduce(
		(grandTotal: number, invoice: any) => {

			const payments = invoice?.payments || [];

			// 1️⃣ Total Paid
			const totalPayed = payments.reduce(
				(sum: number, cur: any) =>
					sum + (Number(cur?.payment?.amount) || 0),
				0
			);

			// 2️⃣ Credit Total
			const creditWallets = payments.map(
				({ creditWallets }: any) => ({ creditWallets })
			);

			const creditTotal = getCreditWalletsByPaymentId(creditWallets).reduce(
				(sum: number, { creditAmount }: any) =>
					sum + (Number(creditAmount) || 0),
				0
			);

			// 3️⃣ Add this invoice total to grand total
			return grandTotal + totalPayed + creditTotal;

		},
		0
	);
}, [filteredPaymentList]);





	const onDownloadExcel = () => {




	}


	/** 🔹 Render */
	return (
		<>
			<div className="row">



				<div className='col-12'>
					<Card className="shadow-3d-primary">
						<CardHeader>
							<CardLabel icon="Receipt">
								<CardTitle tag="div" className="h5">
									Payment History
								</CardTitle>
								<CardActions tag="div" className="text-muted">
									Total records: {filteredPaymentList?.length ?? 0}
								</CardActions>
							</CardLabel>
							<CardActions>
								<label className='text-muted'>Overall:</label><strong className='fs-5'>{priceFormat(overallTotal)}</strong>
							</CardActions>
						</CardHeader>


						<CardBody>

							<DataTable
								fixed={true}
								columns={invoiceColumns}
								data={invoiceTableData}
								isLoading={isLoading}
								pagination={false}
								//   pageSize={10}
								search={false}
								noDataFound="Payment not recorded yet."
							/>

							{/* <table className="table table-modern table-hover">
							<thead>
								<tr>
									<th>Residents Name</th>
									<th>Payment Method</th>
									<th>Payment Date</th>
									<th>Category</th>
									<th>Paid Amount</th>
															<th>Action</th>
								</tr>
							</thead>
							<tbody>{invoiceRows}</tbody>
						</table> */}
						</CardBody>
					</Card>
				</div>
			</div>

			{/* 🔹 Update Payed Modal */}
			<UpdatePayedAmountModal
				isOpen={isEditInvoicePayedModalOpen}
				toggle={handleCloseUpdatePaymentModal}
				invoiceList={editInvoicePayedList}
				invoiceTo={editInvoiceTo}
				isResidentUpdate={isResident}
				reloadInvoiceList={reloadInvoiceList}
				InvoiceCurentPayedInfoList={editInvoiceCurentPayedInfoList}
				credittWalletsPayedInfoList={editCredittWalletsPayedInfoList}
			/>
			<AdvanceCreditForm isOpen={isOpenAddAdvanceModel} toggle={handleToggleCreateAdvanceModal} advanceEditObject={advanceEditObject} />

			{/* 🔹 Resident Invoice Form */}
			{/* <ResidentInvoiceGenerateForm
				isOpen={isInvoiceEditFormOpen}
				toggle={toggleInvoiceEditForm}
				onSave={handleOnInvoiceSave}
				invoiceList={invoiceHistoryListByComapany}
				invoiceEditObject={invoiceEditObject}
				residentData={invoiceEditObject?.residentData}
			/> */}
		</>
	);
};
