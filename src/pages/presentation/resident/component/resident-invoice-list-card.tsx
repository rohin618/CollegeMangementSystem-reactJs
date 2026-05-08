// ─── ResidentInvoiceListCard.tsx ──────────────────────────────────────────────

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
} from '../../../../components/bootstrap';
import moment from 'moment';
import {
	INVOICE_TO_TYPE_LIST,
	INVOICE_STATUS_TYPE_LIST,
	EMAIL_STATUS_LIST,
	INVOICE_TYPE_LIST,
} from '../../../../common/data/option';
import useDarkMode from '../../../../hooks/useDarkMode';
import classNames from 'classnames';
import {
	priceFormat,
	getLabelByValue,
	getColorByValue,
	getResidentInvoiceAddress,
	showAlert,
	isValidRestoreOrVoidInvoice,
	getUserMappedCompanyId,
	getInvoiceOpenBalance,
} from '../../../../helpers/helpers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ResidentInvoiceGenerateForm, ResidentInvoiceArrearsCheck } from '../component';
import {
	invoiceSendSingleMail,
	sendBulkInvoiceMail,
	updateInvoiceStatus,
} from '../../../../common/api/invoice';
import {
	InvoiceCreateAndUpdateForm,
	InvoiceDetailViewModal,
	InvoiceUpdateModal,
} from '../../invoice/component';
import { TColor } from '../../../../type/color-type';
import Icon from '../../../../components/icon';
import {
	INVOICE_MODE_TYPE,
	INVOICE_STATUS,
	INVOICE_TO_TYPE,
	INVOICE_TYPE,
	MAX_BULK_INVOICE_LIMIT,
	PRIMARY_ACCOUNT,
} from '../../../../common/constant';
import {
	useInvoiceListByResident,
	useMultiSearch,
	useRemoveItemQueryListById,
	useUpdateQueryListById,
} from '../../../../hooks';
import { ICreditWalletModel, IInvoiceModel } from '../../../../common/interface';
import { getStatementByResdientId } from '../../../../common/api/statement';
import { DataTable, SearchableSelect } from '../../../../components/common';
import { SyncInvoice } from './sync-invoice';
import BulkInvoiceSendModal from '../../invoice/component/invoiceList/bulkInvoiceSendModal';
import { IInvoiceDiscount } from '../../../../common/interface/invoice';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterState {
	invoiceTo: string;
	emailStatus: string;
}

const STATEMENT_START = moment('2000-01-01').format('YYYY-MM-DD');

// ─── Pure helpers (outside component — never re-created) ──────────────────────

function getInvoiceDiscountTotal(inv: any): number {
	return (inv?.discounts ?? ([] as IInvoiceDiscount[])).reduce(
		(s: number, d: IInvoiceDiscount) => s + (Number(d.amount) || 0),
		0,
	);
}

// ✅ CHANGED: balance = (subTotal − discount) + discountedVAT
// Discount is applied pre-VAT; VAT is recalculated proportionally on the discounted sub total.
// Falls back to legacy calculation for invoices saved before discount feature (no balanceDue field).
function getPaymentDue(inv: any): number {
	const paid = (inv?.payedInfo ?? []).reduce(
		(s: number, p: any) => s + (Number(p.amount) || 0),
		0,
	);
	const credits = (inv?.creditApply ?? []).reduce(
		(s: number, p: any) => s + (Number(p.amount) || 0),
		0,
	);

	if (inv?.balanceDue != null) {
		// ✅ balanceDue already stores (discountedSubTotal + discountedVAT) — saved on create/update
		return Math.max(Number(inv.balanceDue) - paid - credits, 0);
	}

	// Legacy fallback: invoices saved before discount feature had no balanceDue field.
	// For these, apply discount against totalPrice (old behaviour).
	const discTotal = getInvoiceDiscountTotal(inv);
	return Math.max(Number(inv.totalPrice || 0) - discTotal - paid - credits, 0);
}

function getInvoiceStatus(inv: any) {
	const invoiceDate = moment(inv?.invoiceDate, 'YYYY-MM-DD');
	const dueDate = moment(invoiceDate).add(Number(inv?.dueDay || 0), 'days');
	const dueFmt = dueDate.format('DD MMM YYYY');
	const today = moment();

	if (getPaymentDue(inv) <= 0) return { label: 'Paid', type: 'success', dueDate: dueFmt };
	if (today.isAfter(dueDate, 'day') && inv.status !== INVOICE_STATUS.VOID) {
		const d = today.diff(dueDate, 'days');
		return { label: `Overdue (${d} day${d > 1 ? 's' : ''})`, type: 'danger', dueDate: dueFmt };
	}
	if (today.isBetween(invoiceDate, dueDate, 'day', '[]'))
		return { label: 'Current', type: 'warning', dueDate: dueFmt };
	return { label: '-', type: 'secondary', dueDate: dueFmt };
}

// ─── PaymentCard — outside parent so it's never re-declared on render ─────────

const PaymentCard = ({
	icon,
	color,
	value,
	label,
}: {
	icon: string;
	color: TColor;
	value: any;
	label: string;
}) => {
	const { darkModeStatus } = useDarkMode();
	return (
		<div className='col-xl-4'>
			<div
				className={`d-flex align-items-center bg-l${darkModeStatus ? 'o25' : '10'}-${color} rounded-2 p-3`}>
				<div className='flex-shrink-0'>
					<Icon icon={icon} size='3x' color={color} />
				</div>
				<div className='flex-grow-1 ms-3'>
					<div className='fw-bold fs-3 mb-0'>{value}</div>
					<div className='text-muted mt-n2 truncate-line-1'>{label}</div>
				</div>
			</div>
		</div>
	);
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ResidentInvoiceListCard = ({
	residentData = {},
	localICBList = [],
	localAuthorityList = [],
	fNCDetails = {},
	residentGetDataFetch = () => {},
	vatList = [],
	bankList = [],
}: any) => {
	const { darkModeStatus } = useDarkMode();

	// ── UI state ──────────────────────────────────────────────────────────────
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [detailInvoiceInfo, setDetailInvoiceInfo] = useState<any>(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [isArrearsModalOpen, setIsArrearsModalOpen] = useState(false);
	const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
	const [invoiceEditObject, setInvoiceEditObject] = useState<any>(null);
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
	const [invoiceFormObject, setInvoiceFormObject] = useState<any>(null);
	const [statement, setStatement] = useState({ openBalance: 0, overDue: 0 });
	const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
	const [isLoadingBulkInvoice, setIsLoadingBulkInvoice] = useState(false);
	const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
	const [isSingleMailSend, setIsSingleMailSend] = useState('');
	const [filterFromObject, setFilterFromObject] = useState<any>({
		invoiceTo: '',
		status: '',
		type: '',
		emailStatus: '',
		fundTypeId: '',
	});

	// ── Data fetching ─────────────────────────────────────────────────────────
	const { id }: any = residentData;

	const {
		data: invoiceList = [] as IInvoiceModel[],
		isLoading,
		refetch: onReloadInvoiceList,
	} = useInvoiceListByResident(id);

	const { removeItemById } = useRemoveItemQueryListById<any>({ queryKey: ['invoiceList', id] });
	const updateInvoiceList = useUpdateQueryListById<any>(['invoiceList', residentData?.id]);
	const filteredInvoiceList = useMultiSearch(invoiceList, filterFromObject);

	// ── Derived values ────────────────────────────────────────────────────────
	const activeBankInfo: any = useMemo(
		() => bankList?.find(({ primaryAccount }: any) => primaryAccount === PRIMARY_ACCOUNT.YES),
		[bankList],
	);

	const isEmailMode = residentData?.admission?.invoiceMode === INVOICE_MODE_TYPE.EMAIL;

	// ── Filters ───────────────────────────────────────────────────────────────
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

	// Replace the dependency on filteredInvoiceList object with a stable fingerprint
	const filteredInvoiceIds = useMemo(
		() => filteredInvoiceList.map((inv: IInvoiceModel) => inv.id).join(','),
		[filteredInvoiceList],
	);
	const creditWallets = residentData?.creditWallets ?? [];
	const creditWalletIds = useMemo(
		() => creditWallets.map((w: ICreditWalletModel) => w.id).join(','),
		[creditWallets],
	);

	// ── Statement fetch ───────────────────────────────────────────────────────
	useEffect(() => {
		setStatement({ openBalance: 0, overDue: 0 });
		if (!filteredInvoiceList?.length || !residentData?.id) return;

		let cancelled = false;

		(async () => {
			try {
				const wallets = (residentData.creditWallets ?? []).filter(
					(cr: ICreditWalletModel) =>
						!filterFromObject.invoiceTo || cr?.creditTo === filterFromObject.invoiceTo,
				);
				const result: any = await getStatementByResdientId(
					filteredInvoiceList,
					wallets,
					activeBankInfo,
					STATEMENT_START,
					moment().add(1, 'year').endOf('year').toDate(),
				);
				if (cancelled) return;
				const s = result?.summary ?? {};
				setStatement({
					openBalance: s.total_due ?? 0,
					overDue:
						(s.past_due_1_30 ?? 0) +
						(s.past_due_31_60 ?? 0) +
						(s.past_due_61_90 ?? 0) +
						(s.past_due_90_plus ?? 0),
				});
			} catch (err) {
				console.error('Statement fetch failed', err);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [
		filteredInvoiceIds, // ✅ stable string, not array reference
		residentData.id,
		creditWalletIds, // ✅ stable string, not array reference
		activeBankInfo?.id,
		filterFromObject.invoiceTo, // ✅ primitives, not object
		filterFromObject.emailStatus,
	]);

	// ── Summary cards ─────────────────────────────────────────────────────────
	const invoiceSummary = useMemo(() => {
		const { creditTotal } = (residentData?.creditWallets ?? []).reduce(
			(acc: { creditTotal: number }, wallet: ICreditWalletModel) => {
				if (filterFromObject.invoiceTo && wallet.creditTo !== filterFromObject.invoiceTo)
					return acc;
				const applied = (wallet.creditApply ?? []).reduce(
					(s: number, i: any) => s + (Number(i.amount) || 0),
					0,
				);
				acc.creditTotal += (Number(wallet.creditAmount) || 0) - applied;
				return acc;
			},
			{ creditTotal: 0 },
		);
		return [
			{
				status: 'Open Balance',
				totalAmount: statement.openBalance,
				icon: 'TrendingUp',
				color: 'success' as TColor,
			},
			{
				status: 'OverDue Payment',
				totalAmount: statement.overDue,
				icon: 'AccessTime',
				color: 'warning' as TColor,
			},
			{
				status: 'Credit',
				totalAmount: creditTotal,
				icon: 'CreditCard',
				color: 'info' as TColor,
			},
		];
	}, [residentData?.creditWallets, statement, filterFromObject.invoiceTo]);

	// ── Table rows ────────────────────────────────────────────────────────────
	const invoiceTableData = useMemo(
		() =>
			filteredInvoiceList.map((inv: IInvoiceModel) => ({
				id: inv.id,
				invoice: inv,
				invoiceAddress: getResidentInvoiceAddress(
					residentData,
					+inv.invoiceTo,
					inv?.fundTypeId,
					{ localAuthorityList, localICBList, fNCDetails },
				),
				code: inv.code,
				invoiceDate: inv.invoiceDate,
				sDate: inv.sDate,
				eDate: inv.eDate,
				totalPrice: inv.totalPrice,
				discountTotal: getInvoiceDiscountTotal(inv),
				// ✅ CHANGED: uses updated getPaymentDue — discount applied pre-VAT via balanceDue
				paymentDue: getInvoiceOpenBalance(inv),
				emailStatus: getLabelByValue(EMAIL_STATUS_LIST, inv.emailStatus),
				emailStatusColor: getColorByValue(EMAIL_STATUS_LIST, inv.emailStatus),
				overdueStatus: getInvoiceStatus(inv),
				paymentColor: getColorByValue(INVOICE_STATUS_TYPE_LIST, inv.status),
				notes: inv?.notes ?? '',
			})),
		[filteredInvoiceList, localAuthorityList, localICBList, fNCDetails, residentData],
	);

	// ── Selected invoice objects ──────────────────────────────────────────────
	const selectedInvoiceObjects = useMemo(() => {
		const map = new Map(filteredInvoiceList.map((inv: any) => [inv.id, inv]));
		return selectedInvoices
			.map((sel) => {
				const inv = map.get(sel.id);
				return inv ? { ...inv, invoiceAddress: sel.invoiceAddress } : null;
			})
			.filter(Boolean);
	}, [filteredInvoiceList, selectedInvoices]);

	// ── Selection toggle ──────────────────────────────────────────────────────
	const toggleInvoiceSelection = useCallback(
		(invoiceId: string, invoiceAddress: any, code: string) => {
			setSelectedInvoices((prev) =>
				prev.some((s) => s.id === invoiceId)
					? prev.filter((s) => s.id !== invoiceId)
					: [...prev, { id: invoiceId, invoiceAddress, code }],
			);
		},
		[],
	);

	// ── Status / cache helpers ────────────────────────────────────────────────
	const updateStatusAndCache = useCallback(
		async (inv: IInvoiceModel, status: number) => {
			await updateInvoiceStatus(inv.id!, status);
			const updated = { ...inv, status };
			updateInvoiceList(updated);
			if (detailInvoiceInfo) setDetailInvoiceInfo(updated);
		},
		[detailInvoiceInfo, updateInvoiceList],
	);

	const guardInvoiceId = (inv?: IInvoiceModel): boolean => {
		if (!inv?.id) {
			console.warn('Invoice ID is missing');
			return false;
		}
		return true;
	};

	// ── Form / modal handlers ─────────────────────────────────────────────────
	const toggleForm = useCallback(() => {
		setInvoiceEditObject(null);
		setIsFormOpen((prev) => !prev);
	}, []);

	const handleOnInvoiceSave = useCallback(() => {
		setIsFormOpen(false);
		onReloadInvoiceList();
		setInvoiceEditObject(null);
	}, [onReloadInvoiceList]);

	const handleOpenInvoiceDetail = useCallback(
		(inv: any) => {
			setDetailInvoiceInfo({ ...inv, residentData });
			setIsDetailModalOpen(true);
		},
		[residentData],
	);

	const handleOpenEditInvoiceDetail = useCallback((inv: any) => {
		setInvoiceEditObject(inv);
		setIsFormOpen(true);
	}, []);

	const handleOpenEditInvoiceFrom = useCallback(
		(inv: any) => {
			setIsPaymentModalOpen(true);
			setInvoiceFormObject({ ...inv, residentData });
		},
		[residentData],
	);

	const handleCloseInvoiceForm = useCallback(() => {
		setIsPaymentModalOpen(false);
		setInvoiceFormObject(null);
	}, []);

	// ── Invoice status actions ────────────────────────────────────────────────
	const handleUpdateInvoiceVoidStatus = useCallback(
		(inv: IInvoiceModel) => {
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
		},
		[updateStatusAndCache],
	);

	const handleRestoreVoid = useCallback(
		(inv: IInvoiceModel) => {
			if (!guardInvoiceId(inv) || !invoiceList?.length) return;
			if (!isValidRestoreOrVoidInvoice(invoiceList, inv)) return;
			showAlert({
				title: 'Restore voided invoice?',
				text: 'This invoice will be restored to draft and included in billing again.',
				confirmButtonText: 'Yes, restore invoice',
				onConfirm: async () => {
					try {
						await updateStatusAndCache(inv, INVOICE_STATUS.DRAFT);
					} catch (e) {
						console.error('Failed to restore invoice:', e);
					}
				},
			});
		},
		[invoiceList, updateStatusAndCache],
	);

	const handleConfirmInvoice = useCallback(
		(inv: IInvoiceModel) => {
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
		},
		[updateStatusAndCache],
	);

	// ── Email handlers ────────────────────────────────────────────────────────
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

	const handleBulkSendInvoice = useCallback(() => {
		if (!selectedInvoices.length) return;
		if (selectedInvoices.length > MAX_BULK_INVOICE_LIMIT) {
			showAlert({
				title: 'Too Many Invoices Selected',
				text: `You selected ${selectedInvoices.length}. Max allowed is ${MAX_BULK_INVOICE_LIMIT}. Deselect ${selectedInvoices.length - MAX_BULK_INVOICE_LIMIT} invoice(s) and try again.`,
			});
			return;
		}
		setIsBulkModalOpen(true);
	}, [selectedInvoices]);

	const confirmBulkInvoiceSend = useCallback(async () => {
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
			setIsBulkModalOpen(false);
		}
	}, [selectedInvoices, handleSendSingleMail]);

	// ── Table columns ─────────────────────────────────────────────────────────
	const invoiceColumns = useMemo(
		() => [
			...(isEmailMode
				? [
						{
							label: '',
							key: 'select',
							render: (row: any) => {
								const inv = row.invoice;
								const isPending = inv.status === INVOICE_STATUS.PENDING;
								const hoverMsg = isPending
									? 'Click to select this pending invoice.'
									: inv.status === INVOICE_STATUS.DRAFT
										? 'Draft invoices cannot be selected.'
										: inv.status === INVOICE_STATUS.VOID
											? 'Voided invoices are not eligible for selection.'
											: 'This invoice is not eligible for selection.';
								return (
									<Popovers
										trigger='hover'
										placement='top'
										desc={<div className='px-2 py-1 small'>{hoverMsg}</div>}>
										<input
											type='checkbox'
											disabled={!isPending}
											checked={selectedInvoices.some((s) => s.id === inv.id)}
											onChange={() =>
												toggleInvoiceSelection(
													inv.id,
													row?.invoiceAddress,
													inv.code,
												)
											}
											style={{
												width: 18,
												height: 18,
												cursor: isPending ? 'pointer' : 'not-allowed',
											}}
										/>
									</Popovers>
								);
							},
						},
					]
				: []),

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
					row.invoiceDate ? moment(row.invoiceDate).format('DD MMM YYYY') : 'NA',
			},
			{
				label: 'Period',
				key: 'period',
				render: (row: any) => (
					<>
						{row.sDate ? moment(row.sDate).format('DD MMM YYYY') : 'NA'}
						<Icon icon='ArrowRightAlt' />
						{row.eDate ? moment(row.eDate).format('DD MMM YYYY') : 'NA'}
					</>
				),
			},
			{
				label: 'Category',
				key: 'category',
				render: (row: any) => row.invoiceAddress?.shortName || 'NA',
			},
			{ label: 'Notes', key: 'notes' },
			{
				label: 'Total',
				key: 'totalPrice',
				sortable: true,
				render: (row: any) => (
					<span className='text-end d-block'>{priceFormat(+row.totalPrice)}</span>
				),
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
						<span className='text-success d-block text-end' title={tooltip}>
							−{priceFormat(row.discountTotal)}
						</span>
					);
				},
			},
			{
				label: 'Payment Due',
				key: 'paymentDue',
				sortable: true,
				render: (row: any) => (
					<span className={`text-end d-block${row.paymentDue > 0 ? ' text-danger' : ''}`}>
						{priceFormat(row.paymentDue)}
					</span>
				),
			},
			{
				label: 'Email Status',
				key: 'emailStatus',
				render: (row: any) => (
					<Button isLink size='sm' icon='circle' color={row.emailStatusColor}>
						{row.emailStatus}
					</Button>
				),
			},
			{
				label: 'Status',
				key: 'status',
				render: (row: any) => {
					if (row.overdueStatus.label.startsWith('Overdue')) {
						return (
							<div
								className={classNames(
									`text-${row.overdueStatus.type}`,
									'fw-bold py-1 px-3 rounded-pill text-center',
								)}>
								{row.overdueStatus.label}
							</div>
						);
					}
					return (
						<div
							className={classNames(
								`bg-l${darkModeStatus ? 'o25' : '10'}-${row.paymentColor}`,
								`text-${row.paymentColor}`,
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
					const inv = row.invoice;
					const isDraft = inv.status === INVOICE_STATUS.DRAFT;
					const isVoid = inv.status === INVOICE_STATUS.VOID;
					const isPend = inv.status === INVOICE_STATUS.PENDING;
					const canPay = !isDraft && !isVoid;

					if (isSingleMailSend === row.id) return <Spinner color='primary' size='lg' />;

					return (
						<Dropdown>
							<DropdownToggle hasIcon={false}>
								<Button icon='MoreHoriz' color='dark' isLight shadow='sm' />
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
									<>
										<DropdownItem>
											<Button
												icon='Cancel'
												onClick={() => handleUpdateInvoiceVoidStatus(inv)}>
												Void
											</Button>
										</DropdownItem>
										<DropdownItem>
											<Button
												icon='Check'
												onClick={() => handleConfirmInvoice(inv)}>
												Confirm
											</Button>
										</DropdownItem>
									</>
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
							</DropdownMenu>
						</Dropdown>
					);
				},
			},

			// eslint-disable-next-line react-hooks/exhaustive-deps
		],
		[
			isEmailMode,
			selectedInvoices,
			darkModeStatus,
			isSingleMailSend,
			toggleInvoiceSelection,
			handleOpenInvoiceDetail,
			handleOpenEditInvoiceDetail,
			handleOpenEditInvoiceFrom,
			handleRestoreVoid,
			handleUpdateInvoiceVoidStatus,
			handleConfirmInvoice,
			handleSendSingleMail,
		],
	);

	// ── Guard (after all hooks) ───────────────────────────────────────────────
	if (!residentData?.id) return null;

	// ─────────────────────────────────────────────────────────────────────────
	// RENDER
	// ─────────────────────────────────────────────────────────────────────────

	return (
		<>
			<div className='row g-4 align-items-center mb-4'>
				{invoiceSummary.map((item) => (
					<PaymentCard
						key={item.status}
						icon={item.icon}
						color={item.color}
						value={priceFormat(item.totalAmount)}
						label={item.status}
					/>
				))}
			</div>

			<Card className='shadow-3d-primary'>
				<CardHeader>
					<CardLabel icon='Receipt'>
						<CardTitle tag='div' className='h5'>
							Invoice
						</CardTitle>
						<CardActions tag='div' className='text-muted'>
							Total records: {filteredInvoiceList?.length ?? 0}
						</CardActions>
					</CardLabel>
					<CardActions tag='div'>
						<div className='d-flex gap-2'>
							{selectedInvoices.length > 0 && (
								<Button
									isLight
									isLoading={isLoadingBulkInvoice}
									color='success'
									onClick={handleBulkSendInvoice}>
									Send Bulk Invoice ({selectedInvoices.length})
								</Button>
							)}
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
								<DropdownMenu>
									<DropdownItem>
										<Button icon='NoteAdd' onClick={toggleForm}>
											Create New Invoice
										</Button>
									</DropdownItem>
									<DropdownItem>
										<Button
											icon='Edit'
											onClick={() => setIsArrearsModalOpen(true)}>
											Check Credit &amp; Arrears Invoice
										</Button>
									</DropdownItem>
									<DropdownItem>
										<Button
											icon='Sync'
											onClick={() => setIsSyncModalOpen(true)}>
											Sync Rates
										</Button>
									</DropdownItem>
								</DropdownMenu>
							</Dropdown>
						</div>
					</CardActions>
				</CardHeader>

				<CardBody>
					<div className='row mb-4 align-items-center'>
						<div className='col-md-3 mb-2'>
							<FormGroup id='filterInvoiceTo' label='Invoice To' isFloating>
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
								<FormGroup id='fundTypeId' label='Local Authority' isFloating>
									<SearchableSelect
										id='fundTypeId'
										value={filterFromObject.fundTypeId}
										placeholder='Select Local Authority'
										onChange={(e: any) =>
											handleFilterChange('fundTypeId', e.target.value)
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
											handleFilterChange('fundTypeId', e.target.value)
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
							<FormGroup id='filterEmailStatus' label='Email Status' isFloating>
								<SearchableSelect
									id='emailStatus'
									name='emailStatus'
									value={filterFromObject.emailStatus}
									onChange={(e: any) =>
										handleFilterChange('emailStatus', e.target.value)
									}
									options={EMAIL_STATUS_LIST}
									placeholder='Select Email Status'
								/>
							</FormGroup>
						</div>
						<div className='col-md-4 d-flex align-items-end'>
							<Button
								color='link'
								className='text-decoration-none text-primary fw-semibold p-0 d-flex align-items-center gap-1'
								onClick={() => handleFilterChange('RESET', null)}>
								<Icon icon='Refresh' size='lg' className='text-primary' />
								Reset
							</Button>
						</div>
					</div>

					<DataTable
						fixed
						columns={invoiceColumns}
						data={invoiceTableData}
						search={false}
						isLoading={isLoading}
						pagination={false}
						noDataFound='No Invoice Found'
					/>
				</CardBody>
			</Card>

			{/* ── Modals ─────────────────────────────────────────────────── */}
			{isDetailModalOpen && (
				<InvoiceDetailViewModal
					invoiceList={filteredInvoiceList}
					fNCDetails={fNCDetails}
					localICBList={localICBList}
					localAuthorityList={localAuthorityList}
					toggle={() => setIsDetailModalOpen(false)}
					residentData={residentData}
					detailInvoiceInfo={detailInvoiceInfo}
					isOpen={isDetailModalOpen}
					handleConfirmInvoice={handleConfirmInvoice}
					handleUpdateInvoiceVoidStatus={handleUpdateInvoiceVoidStatus}
					handleRestoreVoid={handleRestoreVoid}
					showStatusUpdateBtn
				/>
			)}

			{invoiceEditObject?.type !== INVOICE_TYPE.OTHER && (
				<ResidentInvoiceGenerateForm
					residentData={residentData}
					localAuthorityList={localAuthorityList}
					localICBList={localICBList}
					toggle={toggleForm}
					isOpen={isFormOpen}
					onSave={handleOnInvoiceSave}
					invoiceList={filteredInvoiceList}
					residentGetDataFetch={residentGetDataFetch}
					invoiceEditObject={invoiceEditObject}
					vatList={vatList}
				/>
			)}

			{invoiceEditObject?.type === INVOICE_TYPE.OTHER && (
				<InvoiceCreateAndUpdateForm
					residentData={invoiceEditObject?.residentData}
					toggle={toggleForm}
					isOpen={isFormOpen}
					onSave={handleOnInvoiceSave}
					invoiceList={filteredInvoiceList}
					invoiceEditObject={invoiceEditObject}
				/>
			)}

			<InvoiceUpdateModal
				isResidentUpdate
				residentData={residentData}
				fNCDetails={fNCDetails}
				invoiceTo={invoiceFormObject?.invoiceTo}
				toggle={handleCloseInvoiceForm}
				localICBList={localICBList}
				localAuthorityList={localAuthorityList}
				detailInvoiceInfo={invoiceFormObject}
				isOpen={isPaymentModalOpen}
			/>

			{isArrearsModalOpen && (
				<ResidentInvoiceArrearsCheck
					localICBList={localICBList}
					localAuthorityList={localAuthorityList}
					isCredit={false}
					vatList={vatList}
					toggle={() => setIsArrearsModalOpen((prev) => !prev)}
					isOpen={isArrearsModalOpen}
					invoiceList={filteredInvoiceList}
					fNCDetails={fNCDetails}
					residentData={residentData}
				/>
			)}

			{isSyncModalOpen && (
				<SyncInvoice
					localICBList={localICBList}
					localAuthorityList={localAuthorityList}
					vatList={vatList}
					toggle={() => setIsSyncModalOpen((prev) => !prev)}
					isOpen={isSyncModalOpen}
					invoiceList={filteredInvoiceList}
					fNCDetails={fNCDetails}
					residentData={residentData}
				/>
			)}

			<BulkInvoiceSendModal
				isOpen={isBulkModalOpen}
				toggle={() => setIsBulkModalOpen(false)}
				selectedInvoices={selectedInvoiceObjects}
				isLoading={isLoadingBulkInvoice}
				onConfirm={confirmBulkInvoiceSend}
				residentData={residentData}
			/>
		</>
	);
};
