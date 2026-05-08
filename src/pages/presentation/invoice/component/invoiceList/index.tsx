// ─── InvoiceListByCompanyCard.tsx ─────────────────────────────────────────────

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
	FormGroup,
	Popovers,
	Spinner,
} from '../../../../../components/bootstrap';
import {
	deleteInvoiceById,
	invoiceSendSingleMail,
	sendBulkInvoiceMail,
	updateInvoiceStatus,
} from '../../../../../common/api/invoice';
import moment from 'moment';
import {
	getColorByValue,
	getInvoiceOpenBalance,
	getLabelByValue,
	getNearestByEndDateOrTodayOverLap,
	getResidentInvoiceAddress,
	getUserMappedCompanyId,
	isValidRestoreOrVoidInvoice,
	priceFormat,
	showAlert,
} from '../../../../../helpers/helpers';
import {
	INVOICE_TO_TYPE_LIST,
	INVOICE_TYPE_LIST,
	INVOICE_STATUS_TYPE_LIST,
	EMAIL_STATUS_LIST,
} from '../../../../../common/data/option';
import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { InvoiceDetailViewModal } from '../invoiceDetailViewModal';
import { InvoiceCreateAndUpdateForm } from '../invoiceCreateAndUpdateFrom';
import { InvoiceUpdateModal } from '../invoiceUpdateModal';
import {
	INVOICE_MODE_TYPE,
	INVOICE_STATUS,
	INVOICE_TO_TYPE,
	INVOICE_TYPE,
	MAX_BULK_INVOICE_LIMIT,
} from '../../../../../common/constant';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import { ResidentInvoiceGenerateForm } from '../../../resident/component';
import {
	useMultiSearch,
	useRemoveItemQueryListById,
	useUpdateQueryListById,
} from '../../../../../hooks';
import Swal from 'sweetalert2';
import { DataTable, ResidentProfileCard, SearchableSelect } from '../../../../../components/common';
import Icon from '../../../../../components/icon';
import { IInvoiceModel } from '../../../../../common/interface';
import BulkInvoiceSendModal from './bulkInvoiceSendModal';
import { IInvoiceDiscount } from '../../../../../common/interface/invoice';
import { getInvoicePayedAmount } from '../../../../../helpers/invoice';

// ─── Pure module-level helpers ────────────────────────────────────────────────

function getDiscountTotal(inv: any): number {
	const discounts: IInvoiceDiscount[] = inv?.discounts ?? [];
	return discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
}

/**
 * ✅ Discount-aware balance due.
 * Reads stored balanceDue first — this was saved as:
 *   (discountedSubTotal + discountedVAT)  i.e. discount applied pre-VAT.
 * Falls back to live calculation for legacy invoices without balanceDue field.
 */
function getBalanceDue(inv: any): number {
	const paid = (inv?.payedInfo ?? []).reduce(
		(s: number, p: any) => s + (Number(p.amount) || 0),
		0,
	);
	const credits = (inv?.creditApply ?? []).reduce(
		(s: number, p: any) => s + (Number(p.amount) || 0),
		0,
	);

	if (inv?.balanceDue != null) {
		// ✅ balanceDue = (discountedSubTotal + discountedVAT) — saved on create/update
		return Math.max(Number(inv.balanceDue) - paid - credits, 0);
	}

	// Legacy fallback — invoices saved before discount feature had no balanceDue field
	const discTotal = getDiscountTotal(inv);
	const subTotal = Number(inv?.subTotal || 0);
	const vatTotal = Number(inv?.vatTotal || 0);

	if (subTotal > 0 && discTotal > 0) {
		// ✅ Apply discount pre-VAT even in legacy fallback
		const discountedSubTotal = Math.max(subTotal - discTotal, 0);
		const discountRatio = subTotal > 0 ? discountedSubTotal / subTotal : 1;
		const discountedVat = +(vatTotal * discountRatio).toFixed(2);
		const legacyBalance = +(discountedSubTotal + discountedVat).toFixed(2);
		return Math.max(legacyBalance - paid - credits, 0);
	}

	// No subTotal info — fall back to totalPrice minus discount
	return Math.max(Number(inv.totalPrice || 0) - discTotal - paid - credits, 0);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvoiceListByCompanyCardProps {
	localICBList?: any[];
	localAuthorityList?: any[];
	fNCDetails?: any;
	onRelaodInviceList?: () => void;
	isLoading?: boolean;
	invoiceListByComapany?: any[];
	isFilterOpen?: boolean;
	setFilterDataSize: (n: number) => void;
	invoiceListByCompanyNoFilter?: any[];
}

const EMPTY_OBJ = {};
const EMPTY_ARRAY: any[] = [];

// ─── Component ────────────────────────────────────────────────────────────────

export const InvoiceListByCompanyCard = ({
	localICBList = EMPTY_ARRAY,
	localAuthorityList = EMPTY_ARRAY,
	fNCDetails = EMPTY_OBJ,
	onRelaodInviceList = () => {},
	isLoading = false,
	invoiceListByComapany = EMPTY_ARRAY,
	isFilterOpen = true,
	setFilterDataSize,
	invoiceListByCompanyNoFilter = EMPTY_ARRAY,
}: InvoiceListByCompanyCardProps) => {
	const { darkModeStatus } = useDarkMode();

	const [detailInvoiceInfo, setDetailInvoiceInfo] = useState<any>(null);
	const [isDetailInvoiceInfoModal, setIsDetailInvoiceInfoModal] = useState(false);
	const [isInvoiceFormOpenModal, setIsInvoiceFormOpenModall] = useState(false);
	const [isOpenInvoiceBulkUpdateModal, setIsOpenInvoiceBulkUpdateModal] = useState(false);
	const [bulkUploadInovoiceTo, setBulkUploadInovoiceTo] = useState<number>(-1);
	const [invoiceFormObject, setInvoiceFormObject] = useState<any>(null);
	const [invoiceEditObject, setInvoiceEditObject] = useState<any>(null);
	const [isInvoiceEditFormOpen, setIsInvoiceEditFormOpen] = useState(false);
	const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
	const [isLoadingBulkInvoice, setIsLoadingBulkInvoice] = useState(false);
	const [isBulkInvoiceModalOpen, setIsBulkInvoiceModalOpen] = useState(false);
	const [isSingleMailSend, setIsSingleMailSend] = useState('');

	const [filterFromObject, setFilterFromObject] = useState<any>({
		invoiceTo: '',
		status: '',
		type: '',
		emailStatus: '',
		fundTypeId: '',
	});

	const { removeItemById } = useRemoveItemQueryListById<any>({
		queryKey: ['invoiceListByCompany'],
	});
	const updateInvoiceList = useUpdateQueryListById<any>(['invoiceListByCompany']);

	const filteredInvoiceList = useMultiSearch(invoiceListByComapany, filterFromObject);

	useEffect(() => {
		setFilterDataSize(filteredInvoiceList.length);
	}, [filteredInvoiceList.length]);

	// ─── Status helper ────────────────────────────────────────────────────────

	const getInvoiceStatus = (inv: any) => {
		const invoiceDate = moment(inv?.invoiceDate, 'YYYY-MM-DD');
		const dueDate = moment(invoiceDate).add(Number(inv?.dueDay || 0), 'days');
		const today = moment();

		// ✅ FIXED: use getBalanceDue (discount-aware) instead of comparing paid vs totalPrice
		if (getBalanceDue(inv) <= 0) {
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

	// ─── Filter handlers ──────────────────────────────────────────────────────

	const handleFilterChange = (key: string, value: any) => {
		if (key === 'RESET') {
			setFilterFromObject({
				invoiceTo: '',
				status: '',
				type: '',
				emailStatus: '',
				fundTypeId: '',
			});
			return;
		}

		setFilterFromObject((prev: any) => {
			// reset dependent fields
			if (key === 'invoiceTo') {
				return {
					...prev,
					invoiceTo: value,
					fundTypeId: '',
				};
			}
			return { ...prev, [key]: value };
		});
	};

	// ─── Modal / form handlers ────────────────────────────────────────────────

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

	const handleOpenBulkUploadModal = (invoiceTo: number) => {
		setBulkUploadInovoiceTo(invoiceTo);
		setIsOpenInvoiceBulkUpdateModal(true);
	};

	const handleCloseBulkInvoiceModal = () => {
		setBulkUploadInovoiceTo(-1);
		setIsOpenInvoiceBulkUpdateModal(false);
	};

	const handleOnInviceSave = () => {
		setIsInvoiceEditFormOpen(false);
		onRelaodInviceList();
		setInvoiceEditObject(null);
	};

	const toggleInvoiceEditForm = () => {
		setInvoiceEditObject(null);
		setIsInvoiceEditFormOpen((prev) => !prev);
		onRelaodInviceList();
	};

	const handleOpenEditInvoiceDetail = (inv: any) => {
		setInvoiceEditObject(inv);
		setIsInvoiceEditFormOpen(true);
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

	// ─── Invoice status handlers ──────────────────────────────────────────────

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
					if (detailInvoiceInfo)
						setDetailInvoiceInfo({ ...inv, status: INVOICE_STATUS.PENDING });
				} catch (e) {
					console.error('Failed to confirm invoice:', e);
				}
			},
		});
	};

	const handleRestoreVoid = (inv: IInvoiceModel) => {
		if (!guardInvoiceId(inv) || !invoiceListByCompanyNoFilter?.length) return;
		if (!isValidRestoreOrVoidInvoice(invoiceListByCompanyNoFilter, inv)) return;
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

	// ─── Email / bulk handlers ────────────────────────────────────────────────

	const toggleInvoiceSelection = (id: string, invoiceAddress: any, code: string) => {
		setSelectedInvoices((prev) =>
			prev.some((s) => s.id === id)
				? prev.filter((s) => s.id !== id)
				: [...prev, { id, invoiceAddress, code }],
		);
	};

	const handleSendSingleMail = async (inv: any) => {
		if (!inv?.id || !inv?.invoiceAddress) {
			showAlert({
				icon: 'warning',
				title: 'Cannot Send Email',
				text: 'Invoice details or address are missing.',
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
				text: res?.data?.message || 'Invoice email sent successfully.',
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
	};

	const handleBulkSendInvoice = () => {
		if (!selectedInvoices.length) return;
		if (selectedInvoices.length > MAX_BULK_INVOICE_LIMIT) {
			showAlert({
				title: 'Too Many Invoices Selected',
				text: `You selected ${selectedInvoices.length}. Max allowed is ${MAX_BULK_INVOICE_LIMIT}. Deselect ${selectedInvoices.length - MAX_BULK_INVOICE_LIMIT} invoice(s) and try again.`,
			});
			return;
		}
		setIsBulkInvoiceModalOpen(true);
	};

	const confirmBulkInvoiceSend = async () => {
		const companyId = getUserMappedCompanyId()?.companyId || '';
		if (!companyId) {
			showAlert({
				icon: 'warning',
				title: 'Cannot Send Invoices',
				text: 'Company information is missing.',
			});
			return;
		}
		if (selectedInvoices.some((s) => !s?.id || !s?.invoiceAddress || !s?.code)) {
			showAlert({
				icon: 'warning',
				title: 'Cannot Send Invoices',
				text: 'One or more selected invoices are missing required details.',
			});
			return;
		}
		try {
			setIsLoadingBulkInvoice(true);
			if (selectedInvoices.length === 1) {
				await handleSendSingleMail(selectedInvoices[0]);
			} else {
				const res = await sendBulkInvoiceMail({
					invoices: selectedInvoices.map((s) => ({
						id: s.id,
						invoiceAddress: s.invoiceAddress,
						code: s.code,
					})),
					companyId,
				});
				showAlert({
					icon: 'success',
					title: 'Emails Scheduled',
					text: res?.data?.message || 'Invoices sent successfully.',
				});
			}
			setSelectedInvoices([]);
		} catch (error: any) {
			showAlert({
				icon: 'error',
				title: 'Send Failed',
				text:
					error?.response?.data?.error ||
					error?.message ||
					'Failed to send one or more invoices.',
			});
		} finally {
			setIsLoadingBulkInvoice(false);
			setIsBulkInvoiceModalOpen(false);
		}
	};

	// ─── Table data ───────────────────────────────────────────────────────────

	const invoiceTableData = useMemo(() => {
		return filteredInvoiceList.map((inv: any, index: number) => {
			const colorIndex = getColorNameWithIndex(index);
			const paymentColor = getColorByValue(INVOICE_STATUS_TYPE_LIST, inv.status);
			const invoiceAddress = getResidentInvoiceAddress(
				inv.residentData,
				+inv.invoiceTo,
				inv?.fundTypeId,
				{ localAuthorityList, localICBList, fNCDetails },
			);
			const paid = (inv?.payedInfo ?? []).reduce(
				(s: number, p: any) => s + (Number(p?.amount) || 0),
				0,
			);
			const creditApplyAmount = (inv?.creditApply ?? []).reduce(
				(s: number, p: any) => s + (Number(p?.amount) || 0),
				0,
			);
			return {
				id: inv.id,
				invoice: inv,
				colorIndex,
				invoiceAddress,
				payedAmount: getInvoicePayedAmount(inv),
				creditApplyAmount,
				// ✅ discountTotal shown in Discount column for display only
				discountTotal: getDiscountTotal(inv),
				// ✅ balanceDue uses pre-VAT discount model via getBalanceDue
				balanceDue: getInvoiceOpenBalance(inv),
				paymentColor,
				overdueStatus: getInvoiceStatus(inv),
				code: inv?.code,
				invoiceDate: inv?.invoiceDate,
				subTotal: inv?.subTotal,
				vatTotal: inv?.vatTotal,
				totalPrice: inv?.totalPrice,
				emailStatus: getLabelByValue(EMAIL_STATUS_LIST, inv.emailStatus),
				emailStatusColor: getColorByValue(EMAIL_STATUS_LIST, inv?.emailStatus),
				notes: inv?.notes || '',
			};
		});
	}, [filteredInvoiceList, localAuthorityList, localICBList, fNCDetails]);

	const overAllBalanceDue = useMemo(() => {
		return invoiceTableData.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
	}, [invoiceTableData]);

	const selectedInvoiceObjects = useMemo(() => {
		const map = new Map(filteredInvoiceList.map((inv: any) => [inv.id, inv]));
		return selectedInvoices
			.map((sel) => {
				const inv = map.get(sel.id);
				return inv ? { ...inv, invoiceAddress: sel.invoiceAddress } : null;
			})
			.filter(Boolean);
	}, [filteredInvoiceList, selectedInvoices]);

	// ─── Table columns ────────────────────────────────────────────────────────

	const invoiceColumns = useMemo(
		() => [
			{
				label: '',
				key: 'select',
				render: (row: any) => {
					const inv = row?.invoice;
					const isEmailMode =
						inv?.residentData?.admission?.invoiceMode === INVOICE_MODE_TYPE.EMAIL;
					const isPending = inv.status === INVOICE_STATUS.PENDING;
					const isDisabled = !isPending || !isEmailMode;
					const hoverMsg = !isEmailMode
						? "This resident's invoice delivery mode is not set to Email."
						: isPending
							? 'Click to select this invoice.'
							: inv.status === INVOICE_STATUS.DRAFT
								? 'Draft invoices cannot be selected.'
								: inv.status === INVOICE_STATUS.VOID
									? 'Voided invoices are not eligible.'
									: 'This invoice is not eligible for selection.';
					return (
						<Popovers
							trigger='hover'
							placement='top'
							desc={<div className='px-2 py-1 small'>{hoverMsg}</div>}>
							<div>
								<input
									type='checkbox'
									disabled={isDisabled}
									checked={selectedInvoices.some((s) => s.id === inv.id)}
									onChange={() =>
										toggleInvoiceSelection(inv.id, row.invoiceAddress, inv.code)
									}
									style={{
										width: 18,
										height: 18,
										cursor: isDisabled ? 'not-allowed' : 'pointer',
									}}
								/>
							</div>
						</Popovers>
					);
				},
			},

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
				label: 'Category',
				key: 'category',
				render: (row: any) => row.invoiceAddress?.shortName || 'NA',
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

			{ label: 'Notes', key: 'notes' },

			{
				label: 'Email Status',
				key: 'emailStatus',
				render: (row: any) => (
					<Button isLink size='sm' icon='circle' color={row?.emailStatusColor}>
						{row.emailStatus}
					</Button>
				),
			},

			{
				label: 'Weekly Fees',
				key: 'weekPrice',
				render: (row: any) => priceFormat(row.invoice?.items?.[0]?.weekPrice ?? 0),
			},

			{
				label: 'Amount Before VAT',
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
				label: 'Discount',
				key: 'discount',
				sortable: true,
				render: (row: any) => {
					if (row.discountTotal <= 0) return <span className='text-muted'>—</span>;
					const tooltip = (row.invoice.discounts ?? [])
						.map((d: IInvoiceDiscount) => `${d.code}: −${priceFormat(d.amount)}`)
						.join('\n');
					return (
						<strong className='text-success' title={tooltip}>
							−{priceFormat(row.discountTotal)}
						</strong>
					);
				},
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
								{isDraft && (
									<DropdownItem>
										<Button
											icon='Delete'
											color='danger'
											onClick={() => handleOpenDeleteInvoice(inv.id)}>
											Delete
										</Button>
									</DropdownItem>
								)}
							</DropdownMenu>
						</Dropdown>
					);
				},
			},

			// eslint-disable-next-line react-hooks/exhaustive-deps
		],
		[
			darkModeStatus,
			selectedInvoices,
			isSingleMailSend,
			detailInvoiceInfo,
			invoiceListByCompanyNoFilter,
		],
	);

	// ─────────────────────────────────────────────────────────────────────────
	// RENDER
	// ─────────────────────────────────────────────────────────────────────────

	return (
		<>
			{isFilterOpen && (
				<div className='row'>
					<div className='col-12'>
						<Card>
							<CardHeader>
								<div className='d-flex justify-content-between align-items-center w-100'>
									<h5 className='mb-0 d-flex align-items-center gap-2'>
										<Icon icon='FilterAlt' color='primary' />
										Filters
									</h5>
									<Button
										color='link'
										className='text-decoration-none text-primary fw-semibold p-0 d-flex align-items-center gap-1'
										onClick={() => handleFilterChange('RESET', null)}>
										<Icon icon='Refresh' size='lg' className='text-primary' />
										Reset
									</Button>
								</div>
							</CardHeader>
							<CardBody>
								<div className='row mb-4 align-items-center'>
									<div className='col-md-3 mb-2'>
										<FormGroup
											id='filterInvoiceTo'
											label='Invoice To'
											isFloating>
											<SearchableSelect
												id='invoiceTo'
												name='invoiceTo'
												value={filterFromObject.invoiceTo}
												onChange={(e: any) =>
													handleFilterChange('invoiceTo', e.target.value)
												}
												options={INVOICE_TO_TYPE_LIST}
												placeholder='Select Invoice To'
											/>
										</FormGroup>
									</div>

									{/* Local Authority */}
									{+filterFromObject.invoiceTo === INVOICE_TO_TYPE.LA && (
										<div className='col-md-3 mb-2'>
											<FormGroup
												id='fundTypeId'
												label='Local Authority'
												isFloating>
												<SearchableSelect
													id='fundTypeId'
													value={filterFromObject.fundTypeId}
													placeholder='Select Local Authority'
													onChange={(e: any) =>
														handleFilterChange(
															'fundTypeId',
															e.target.value,
														)
													}
													valueKey='id'
													labelKey='name'
													options={localAuthorityList}
												/>
											</FormGroup>
										</div>
									)}

									{/* ICB */}
									{+filterFromObject.invoiceTo === INVOICE_TO_TYPE.CHC && (
										<div className='col-md-3 mb-2'>
											<FormGroup id='fundTypeId' label='ICB' isFloating>
												<SearchableSelect
													id='fundTypeId'
													value={filterFromObject.fundTypeId}
													placeholder='Select ICB'
													onChange={(e: any) =>
														handleFilterChange(
															'fundTypeId',
															e.target.value,
														)
													}
													options={localICBList}
													valueKey='id'
													labelKey='name'
												/>
											</FormGroup>
										</div>
									)}
									<div className='col-md-3 mb-2'>
										<FormGroup id='status' label='Invoice Status' isFloating>
											<SearchableSelect
												name='status'
												id='status'
												value={filterFromObject.status}
												placeholder='Select Status'
												onChange={(e: any) =>
													handleFilterChange('status', e.target.value)
												}
												options={INVOICE_STATUS_TYPE_LIST}
											/>
										</FormGroup>
									</div>
									<div className='col-md-3 mb-2'>
										<FormGroup id='filterType' label='Invoice Type' isFloating>
											<SearchableSelect
												options={INVOICE_TYPE_LIST.filter(
													(el: any) =>
														![
															INVOICE_TYPE.VAT_CREDIT,
															INVOICE_TYPE.CREDIT,
														].includes(el.value),
												)}
												name='type'
												value={filterFromObject.type}
												onChange={(e: any) =>
													handleFilterChange('type', e.target.value)
												}
												placeholder='Invoice Type'
											/>
										</FormGroup>
									</div>
									<div className='col-md-3 mb-2'>
										<FormGroup
											id='filterEmailStatus'
											label='Email Status'
											isFloating>
											<SearchableSelect
												id='emailStatus'
												name='emailStatus'
												value={filterFromObject.emailStatus}
												onChange={(e: any) =>
													handleFilterChange(
														'emailStatus',
														e.target.value,
													)
												}
												options={EMAIL_STATUS_LIST}
												placeholder='Select Email Status'
											/>
										</FormGroup>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				</div>
			)}

			<div className='row h-100'>
				<div className='col-12'>
					<Card className='shadow-3d-primary h-100'>
						<CardHeader>
							<CardLabel icon='Receipt'>
								<CardTitle tag='div' className='h5'>
									Invoice
								</CardTitle>
								<CardActions tag='div' className='text-muted'>
									Total records: {filteredInvoiceList?.length ?? 0}
								</CardActions>
							</CardLabel>
							<CardActions>
								<div className='d-flex justify-content-center mb-3 gap-3 align-items-center'>
									<div>
										Overall Balance Due:{' '}
										<span className='fw-bold'>
											{priceFormat(overAllBalanceDue)}
										</span>
									</div>

									<Dropdown>
										<DropdownToggle hasIcon={false}>
											<Button color='dark' isLight icon='AddToPhotos'>
												Bulk Update
											</Button>
										</DropdownToggle>
										<DropdownMenu isAlignmentEnd>
											{INVOICE_TO_TYPE_LIST?.filter(
												(d: any) =>
													![
														INVOICE_TO_TYPE.CLIENT_CONTRIBUTION,
														INVOICE_TO_TYPE.PRIVATE,
													].includes(d?.value),
											).map((data: any) => (
												<DropdownItem
													key={data.value}
													onClick={() =>
														handleOpenBulkUploadModal(data.value)
													}>
													<Button>{data.label}</Button>
												</DropdownItem>
											))}
										</DropdownMenu>
									</Dropdown>
									{selectedInvoices?.length > 0 && (
										<Button
											isLight
											isLoading={isLoadingBulkInvoice}
											color='success'
											onClick={handleBulkSendInvoice}>
											Send Bulk Invoice ({selectedInvoices.length})
										</Button>
									)}
								</div>
							</CardActions>
						</CardHeader>
						<CardBody>
							<DataTable
								fixed
								columns={invoiceColumns}
								data={invoiceTableData}
								search={false}
								isLoading={isLoading}
								pagination={true}
								pageSize={100}
							/>
						</CardBody>
					</Card>

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
						isResidentUpdate={true}
						fNCDetails={fNCDetails}
						invoiceTo={invoiceFormObject?.invoiceTo}
						fundTypeId={invoiceFormObject?.fundTypeId}
						toggle={handleCloseInvoiceForm}
						localICBList={localICBList}
						localAuthorityList={localAuthorityList}
						detailInvoiceInfo={invoiceFormObject}
						isOpen={isInvoiceFormOpenModal}
					/>

					<InvoiceUpdateModal
						isResidentUpdate={false}
						fNCDetails={fNCDetails}
						localICBList={localICBList}
						localAuthorityList={localAuthorityList}
						invoiceTo={bulkUploadInovoiceTo}
						toggle={handleCloseBulkInvoiceModal}
						isOpen={isOpenInvoiceBulkUpdateModal}
					/>

					{invoiceEditObject?.type !== INVOICE_TYPE.OTHER && (
						<ResidentInvoiceGenerateForm
							residentData={invoiceEditObject?.residentData}
							toggle={toggleInvoiceEditForm}
							isOpen={isInvoiceEditFormOpen}
							onSave={handleOnInviceSave}
							invoiceList={filteredInvoiceList}
							invoiceEditObject={invoiceEditObject}
						/>
					)}

					{invoiceEditObject?.type === INVOICE_TYPE.OTHER && (
						<InvoiceCreateAndUpdateForm
							residentData={invoiceEditObject?.residentData}
							toggle={toggleInvoiceEditForm}
							isOpen={isInvoiceEditFormOpen}
							onSave={handleOnInviceSave}
							invoiceList={filteredInvoiceList}
							invoiceEditObject={invoiceEditObject}
						/>
					)}

					<BulkInvoiceSendModal
						isOpen={isBulkInvoiceModalOpen}
						toggle={() => setIsBulkInvoiceModalOpen(false)}
						selectedInvoices={selectedInvoiceObjects}
						isLoading={isLoadingBulkInvoice}
						onConfirm={confirmBulkInvoiceSend}
					/>
				</div>
			</div>
		</>
	);
};
