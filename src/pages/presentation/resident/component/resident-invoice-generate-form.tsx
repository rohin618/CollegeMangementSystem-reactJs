// ─── ResidentInvoiceGenerateForm.tsx ─────────────────────────────────────────
// ✅ Discount applied on subTotal (pre-VAT); VAT recalculated proportionally.
// ✅ Fixed: fundSource/fundType/incontStatus/fncStatus passed from formData
// ✅ Fixed: baseFormData replaced with makeBaseFormData factory fn
// ✅ Fixed: useEffect([isOpen]) reset now uses factory fn (no more ReferenceError)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import { useQuery } from '@tanstack/react-query';
import SimpleReactValidator from 'simple-react-validator';

import {
	Button,
	FormGroup,
	Modal,
	ModalBody,
	ModalHeader,
	ModalTitle,
	Spinner,
} from '../../../../components/bootstrap';
import Icon from '../../../../components/icon';
import { DateTimePicker, SearchableSelect } from '../../../../components/common';
import {
	generateUid,
	getFundTypes,
	getUserMappedCompany,
	getResidentInvoiceAddress,
	mergeArrayOfObjectUniqueByKey,
	getRespiteStatusForPeriod,
	getVatAmount,
	showAlert,
	priceFormat,
} from '../../../../helpers/helpers';
import { invoiceModel } from '../../../../common/model/invoice';
import { getAllDiscounts } from '../../../../common/api/discount';
import { createInvoice, updateInvoice } from '../../../../common/api/invoice';
import { updateCreditWallet } from '../../../../common/api/creditWalet';
import { INVOICE_CATEGORY, INVOICE_TYPE, QUERY_KEY } from '../../../../common/constant';
import { useMasterData } from '../../../../contexts/mastersContext';
import { useUpdateQueryListById } from '../../../../hooks';
import { useGenerateInvoiceRows } from '../../../../hooks/useGenerateInvoiceRows';
import {
	IInvoiceModel,
	IInvoiceDiscount,
	IInvoiceItem,
} from '../../../../common/interface/invoice';
import { InvoiceCard } from './invoice-card';
import { rebuildRowTotals } from '../../../../helpers/invoice/invoiceform.helpers';
import {
	ICreditWalletUpdated,
	IDiscountMaster,
	IInvoiceRow,
	IWalletApplied,
} from '../../../../common/interface/invoice/invoiceform';

interface ResidentInvoiceGenerateFormProps {
	isOpen: boolean;
	toggle: () => void;
	onSave: () => void;
	residentData?: any;
	residentGetDataFetch?: () => void;
	invoiceList?: any[];
	invoiceEditObject?: any;
	localAuthorityList?: any[];
	vatList?: any[];
	localICBList?: any[];
}

// ─── Factory: builds a fresh base formData from residentData ─────────────────
// Extracted outside the component so it can be used in both useState init
// and the isOpen=false reset effect without creating a closure dependency.
const EMPTY_OBJ = {};
const EMPTY_ARRAY: any[] = [];

const makeBaseFormData = (residentData: any) => ({
	...invoiceModel,
	invoiceDate: moment().format('YYYY-MM-DD'),
	roomId: residentData?.roomId,
	bedId: residentData?.bedId,
	residentId: residentData?.id,
	// fund fields (fundSource, fundType, incontStatus, fncStatus) are populated
	// separately via the useEffect that calls getFundTypes, so they start undefined.
});

// ─── Core helper: discount applied pre-VAT ───────────────────────────────────
//
// discountedSubTotal = max(subTotal - discTotal, 0)
// discountRatio      = discountedSubTotal / subTotal
// discountedVat      = vatTotal * discountRatio
// balanceDue         = discountedSubTotal + discountedVat
//
const calcDiscountedBalance = (subTotal: number, vatTotal: number, discTotal: number): number => {
	if (discTotal <= 0) return +(subTotal + vatTotal).toFixed(2);
	const discountedSubTotal = Math.max(subTotal - discTotal, 0);
	const discountRatio = subTotal > 0 ? discountedSubTotal / subTotal : 1;
	const discountedVat = +(vatTotal * discountRatio).toFixed(2);
	return +(discountedSubTotal + discountedVat).toFixed(2);
};

// ─── Summary bar ─────────────────────────────────────────────────────────────
// ✅ Net Payable = sum of row.balanceDue (pre-VAT discount already applied)

const SummaryBar: React.FC<{ rows: IInvoiceRow[] }> = ({ rows }) => {
	const gross = rows.reduce((s, r) => s + (r.totalPrice || 0), 0);

	const discTotal = rows.reduce(
		(s, r) => s + (r.discounts ?? []).reduce((d, x) => d + (Number(x.amount) || 0), 0),
		0,
	);

	// ✅ Use balanceDue per row — already = (discountedSubTotal + discountedVAT)
	const netPayable = +rows
		.reduce((s, r) => s + (Number(r.balanceDue) || Number(r.totalPrice) || 0), 0)
		.toFixed(2);

	const stats = [
		{ label: 'Total Invoices', value: String(rows.length), color: '' },
		{ label: 'Gross Amount', value: priceFormat(gross), color: '' },
		{
			label: 'Total Discount',
			value: discTotal > 0 ? `-${priceFormat(discTotal)}` : '-',
			color: 'text-success',
		},
		{ label: 'Net Payable', value: priceFormat(netPayable), color: 'text-success' },
	];

	return (
		<div className='row g-3 mb-4'>
			{stats.map((s) => (
				<div key={s.label} className='col-3'>
					<div
						className='p-3 rounded-3'
						style={{
							background: 'var(--bs-body-bg)',
							border: '0.5px solid var(--bs-border-color)',
						}}>
						<div
							className='text-muted mb-1'
							style={{
								fontSize: 11,
								textTransform: 'uppercase',
								letterSpacing: '0.05em',
								fontWeight: 500,
							}}>
							{s.label}
						</div>
						<div className={`fw-semibold ${s.color}`} style={{ fontSize: 18 }}>
							{s.value}
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

function initRow(r: any): IInvoiceRow {
	return {
		...r,
		discounts: (r.discounts ?? []) as IInvoiceDiscount[],
		notes: (r.notes ?? '') as string,
		balanceDue: (r.balanceDue ?? r.totalPrice ?? 0) as number,
	};
}

// ─── toApiPayload — recomputes balanceDue from subTotal/vatTotal/discounts ────
function toApiPayload(row: IInvoiceRow, formData: any): Partial<IInvoiceModel> {
	const { invoiceAddress, ...rest } = row as any;

	const discounts = (row.discounts ?? []) as IInvoiceDiscount[];
	const discTotal = discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0);

	// ✅ Always recompute balanceDue from source values to guarantee accuracy
	const balanceDue = calcDiscountedBalance(
		Number(row.subTotal || 0),
		Number(row.vatTotal || 0),
		discTotal,
	);

	return {
		...rest,
		sDate: moment(row.sDate).format('YYYY-MM-DD'),
		eDate: moment(row.eDate).format('YYYY-MM-DD'),
		invoiceDate: formData.invoiceDate,
		dueDay: formData.dueDay,
		code: row.id ? formData.code : '',
		discounts: discounts.map((d: IInvoiceDiscount) => ({
			discountId: d.discountId,
			code: d.code,
			name: d.name,
			type: d.type,
			value: d.value,
			amount: d.amount,
		})),
		// ✅ balanceDue = (discountedSubTotal + discountedVAT)
		balanceDue,
		notes: row.notes ?? '',
	};
}

export const ResidentInvoiceGenerateForm: React.FC<ResidentInvoiceGenerateFormProps> = ({
	isOpen,
	toggle,
	onSave,
	residentData = EMPTY_OBJ,
	residentGetDataFetch = () => { },
	invoiceList = EMPTY_ARRAY,
	invoiceEditObject = null,
	localAuthorityList = EMPTY_ARRAY,
	vatList = EMPTY_ARRAY,
	localICBList = EMPTY_ARRAY,
}) => {
	const { id }: any = residentData;

	const {
		miscellaneousList,
		billingPatternList,
		dueDateList,
		fNCDetails,
		isLoading: isMasterLoading,
	}: any = useMasterData();

	const { data: discountList = [] as IDiscountMaster[], isLoading: isDiscountLoading } = useQuery<
		IDiscountMaster[]
	>({
		queryKey: [QUERY_KEY.DISCOUNT_LIST],
		queryFn: getAllDiscounts,
		staleTime: 5 * 60 * 1000,
	});

	const updateInvoiceList = useUpdateQueryListById<any>(['invoiceList', id]);
	const validator = useRef(new SimpleReactValidator({ className: 'text-danger' }));

	// ── formData — fund fields are undefined on first render, then populated
	// immediately by the useEffect below once residentData/eDate are known.
	const [formData, setFormData] = useState<any>(() => makeBaseFormData(residentData));

	const [isLoadingForm, setIsLoadingForm] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [invoiceRows, setInvoiceRows] = useState<IInvoiceRow[]>([]);
	const [creditWalletAddInvoice, setCreditWalletAddInvoice] = useState<any[]>([]);
	const [creditWalletInput, setCreditWalletInput] = useState<any[]>([]);

	const billingFormula = useMemo(() => {
		const info = getUserMappedCompany();
		return {
			privateBillingFormula: billingPatternList.find(
				(d: any) => d.id === info?.privateBillingPattern,
			)?.billingFormula,
			ccBillingFormula: billingPatternList.find((d: any) => d.id === info?.ccBillingPattern)
				?.billingFormula,
			familyTopupPattern: billingPatternList.find(
				(d: any) => d.id === info?.familyTopupPattern,
			)?.billingFormula,
		};
	}, [billingPatternList]);

	// ── Recompute fund fields whenever eDate or residentData changes ──────────
	// ✅ Safe: dep is formData.eDate (a primitive), not the fund fields themselves,
	//    so there is no risk of an infinite re-render loop.
	useEffect(() => {
		if (!residentData?.id) return;
		const { fundSource, fundType, incontStatus, fncStatus } =
			getFundTypes(residentData, formData.eDate) || {};

		setFormData((prev: any) => {
			if (
				prev.fundSource === fundSource &&
				prev.fundType === fundType &&
				prev.incontStatus === incontStatus &&
				prev.fncStatus === fncStatus
			) {
				return prev;
			}
			return {
				...prev,
				fundSource,
				fncStatus,
				incontStatus,
				fundType,
			};
		});
	}, [residentData, formData.eDate]);

	// ── Pass fund fields from formData into the row-generation hook ──────────
	// ✅ Fixed: previously referenced undefined top-level variables; now reads
	//    from formData which is always in sync via the effect above.
	const invoiceInfoRow: any[] = useGenerateInvoiceRows({
		formData,
		residentData,
		invoiceModel,
		fundSource: formData.fundSource,
		fncStatus: formData.fncStatus,
		incontStatus: formData.incontStatus,
		fundType: formData.fundType,
		localAuthorityList,
		localICBList,
		vatList,
		fNCDetails,
		isOpen,
		billingFormula,
	});

	const respiteCurrentInfoStatus = useMemo(() => {
		const list = residentData?.admission?.respiteStatusList ?? [];
		if (!formData?.sDate || !formData?.eDate) return undefined;
		return getRespiteStatusForPeriod(list, formData.sDate, formData.eDate);
	}, [residentData?.admission?.respiteStatusList, formData?.sDate, formData?.eDate]);

	useEffect(() => {
		if (!isOpen) return;
		const hasEdit = invoiceEditObject && Object.keys(invoiceEditObject).length > 0;

		if (hasEdit) {
			const updatedInvoice = invoiceInfoRow.find(
				(inv: any) =>
					+inv.invoiceTo === +invoiceEditObject.invoiceTo &&
					inv.fundTypeId === invoiceEditObject.fundTypeId,
			);
			const miscItems = (invoiceEditObject?.items ?? []).filter(
				(item: IInvoiceItem) => item.category === INVOICE_CATEGORY.MISC,
			);

			if (!updatedInvoice) {
				setInvoiceRows([
					initRow({
						...invoiceEditObject,
						items: [...(invoiceEditObject.items ?? []), ...miscItems],
					}),
				]);
				return;
			}

			const baseItems =
				invoiceEditObject.type === INVOICE_TYPE.NORMAL
					? (updatedInvoice.items ?? [])
					: (invoiceEditObject.items ?? []);

			setInvoiceRows([
				initRow({
					...invoiceEditObject,
					...updatedInvoice,
					items: [...baseItems, ...miscItems],
					discounts: invoiceEditObject.discounts ?? [],
					notes: invoiceEditObject.notes ?? '',
				}),
			]);
			return;
		}

		setInvoiceRows((invoiceInfoRow ?? []).map(initRow));
	}, [invoiceInfoRow, invoiceEditObject, isOpen]);

	// ── Reset all state when the modal closes ─────────────────────────────────
	// ✅ Fixed: was referencing undefined `baseFormData`; now uses factory fn.
	useEffect(() => {
		if (!isOpen) {
			setFormData(makeBaseFormData(residentData));
			setCreditWalletAddInvoice([]);
			setCreditWalletInput([]);
			setIsSubmitted(false);
		}
	}, [isOpen]);

	// ── Populate formData from invoiceEditObject when editing ─────────────────
	useEffect(() => {
		if (invoiceEditObject && isOpen) setFormData({ ...invoiceModel, ...invoiceEditObject });
	}, [invoiceEditObject, isOpen]);

	const handleChange = (e: any) => {
		const { id, value } = e.target;
		setFormData((prev: any) => ({ ...prev, [id]: value }));
	};

	// ── Misc handlers ─────────────────────────────────────────────────────────

	const handleAddMiscellaneous = (index: number) => {
		setInvoiceRows((prev) => {
			const updated = [...prev];
			const row = { ...updated[index] };
			row.items = [
				...row.items,
				{
					id: generateUid(),
					category: INVOICE_CATEGORY.MISC,
					description: '',
					miscellaneousId: '',
					qty: 1,
					weekPrice: 0,
					amount: 0,
					vatId: '',
					vatRate: 0,
					vatAmount: 0,
					period: { from: '', to: '' },
				} as IInvoiceItem,
			];
			updated[index] = rebuildRowTotals(row, discountList);
			return updated;
		});
	};

	const handleMiscellaneousChange = (
		invoiceIndex: number,
		itemId: string,
		field: string,
		value: any,
	) => {
		setInvoiceRows((prev) => {
			const updated = [...prev];
			const row = { ...updated[invoiceIndex] };
			row.items = row.items.map((item: IInvoiceItem) => {
				if (item.id !== itemId || item.category !== INVOICE_CATEGORY.MISC) return item;
				let u = { ...item };
				if (field === 'amount') u.amount = Number(value) || 0;
				else if (field === 'vatId') {
					const vat = vatList.find((v: any) => v.id === value);
					u.vatId = value;
					u.vatRate = Number(vat?.rate || 0);
				} else if (typeof value === 'object' && !Array.isArray(value)) {
					(u as any)[field] = { ...(u as any)[field], ...value };
				} else {
					(u as any)[field] = value;
				}
				u.vatAmount = getVatAmount(u.amount, u.vatRate);
				return u;
			});
			updated[invoiceIndex] = rebuildRowTotals(row, discountList);
			return updated;
		});
	};

	const handleDeleteMiscellaneous = (invoiceIndex: number, itemId: string) => {
		setInvoiceRows((prev) => {
			const updated = [...prev];
			const row = { ...updated[invoiceIndex] };
			row.items = row.items.filter(
				(item: IInvoiceItem) =>
					!(item.id === itemId && item.category === INVOICE_CATEGORY.MISC),
			);
			updated[invoiceIndex] = rebuildRowTotals(row, discountList);
			validator.current.purgeFields();
			return updated;
		});
	};

	// ── Discount handlers — ✅ discount applied pre-VAT ───────────────────────

	const handleApplyDiscount = (invoiceIndex: number, discount: IInvoiceDiscount) => {
		setInvoiceRows((prev) => {
			const updated = [...prev];
			const row = { ...updated[invoiceIndex] };
			row.discounts = [...(row.discounts ?? []), discount];
			const discTotal = row.discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
			// ✅ balanceDue = (discountedSubTotal + discountedVAT)
			row.balanceDue = calcDiscountedBalance(
				Number(row.subTotal || 0),
				Number(row.vatTotal || 0),
				discTotal,
			);
			updated[invoiceIndex] = row;
			return updated;
		});
	};

	const handleRemoveDiscount = (invoiceIndex: number, discountId: string) => {
		setInvoiceRows((prev) => {
			const updated = [...prev];
			const row = { ...updated[invoiceIndex] };
			row.discounts = (row.discounts ?? []).filter((d) => d.discountId !== discountId);
			const discTotal = row.discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
			// ✅ restore to totalPrice if no discounts remain
			row.balanceDue =
				discTotal > 0
					? calcDiscountedBalance(
						Number(row.subTotal || 0),
						Number(row.vatTotal || 0),
						discTotal,
					)
					: Number(row.totalPrice || 0);
			updated[invoiceIndex] = row;
			return updated;
		});
	};

	// ── Notes ─────────────────────────────────────────────────────────────────

	const handleNotesChange = (invoiceIndex: number, notes: string) => {
		setInvoiceRows((prev) => {
			const updated = [...prev];
			updated[invoiceIndex] = { ...updated[invoiceIndex], notes };
			return updated;
		});
	};

	// ── Credit wallet ─────────────────────────────────────────────────────────

	const handleCreditWalletInputChange = (
		id: string,
		value: string,
		creditTo: number,
		code: string,
		fundTypeId: string,
	) => {
		setCreditWalletInput((prev) =>
			prev.some((x: any) => x.id === id)
				? prev.map((x: any) =>
					x.id === id
						? { ...x, amount: Number(value), creditTo, code, fundTypeId }
						: x,
				)
				: [...prev, { id, amount: Number(value), creditTo, code, fundTypeId }],
		);
	};

	const handleApplyWallet = (id: string, code: string | number, creditTo: number) => {
		const entry = creditWalletInput.find((x: any) => x.id === id);
		const creditApplied = (creditWalletAddInvoice ?? [])
			.filter((c: any) => c?.creditTo === creditTo)
			.reduce((s: number, { amount = 0 }: any) => s + Number(amount), 0);
		const invoiceAmount = (
			invoiceRows.find(({ invoiceTo }) => invoiceTo === creditTo)?.items ?? []
		).reduce((s: number, { amount = 0 }: any) => s + Number(amount), 0);

		if (creditApplied + Number(entry?.amount || 0) > invoiceAmount) {
			showAlert({
				title: 'Credit Exceeded',
				text: `Credit cannot exceed invoice amount (${priceFormat(invoiceAmount)})`,
				icon: 'warning',
			});
			return;
		}
		setCreditWalletAddInvoice((prev) => [...prev, entry]);
		setCreditWalletInput([]);
		validator.current.purgeFields();
	};

	const handleRemoveCredit = (i: number) => {
		setCreditWalletAddInvoice((prev) => prev.filter((_: any, idx: number) => idx !== i));
	};

	const updatedWallets = useMemo((): ICreditWalletUpdated[] => {
		if (!residentData?.creditWallets) return [];
		const withInvoices = residentData.creditWallets.map((wallet: any) => {
			const used = (creditWalletAddInvoice ?? [])
				.filter(({ id }: any) => id === wallet?.id)
				.reduce((s: number, { amount = 0 }: any) => s + Number(amount), 0);
			const avail = (wallet?.creditApply ?? []).reduce(
				(s: number, { amount }: any) => s + Number(amount || 0),
				0,
			);
			return {
				...wallet,
				creditAmountUsed: wallet.creditAmount - avail - used,
				invoice: wallet.invoice ?? invoiceList?.find((x: any) => x.id === wallet.invoiceId),
			};
		});
		const grouped = withInvoices.reduce(
			(acc: Record<string, any[]>, wallet: any) => {
				const creditTo = Number(wallet.creditTo);
				const fundTypeId = String(wallet.fundTypeId);
				const hasMatch = invoiceRows.some(
					(r) => Number(r.invoiceTo) === creditTo && String(r.fundTypeId) === fundTypeId,
				);
				if (!hasMatch) return acc;
				const key = `${creditTo}|${fundTypeId}`;
				acc[key] = [...(acc[key] ?? []), wallet];
				return acc;
			},
			{} as Record<string, any[]>,
		);
		return Object.entries(grouped).map(([key, wallets]) => {
			const [creditTo, fundTypeId] = key.split('|');
			return { creditTo: Number(creditTo), fundTypeId, wallets: wallets as any[] };
		});
	}, [residentData, invoiceList, creditWalletAddInvoice, invoiceRows]);

	const walletApplied = useMemo((): IWalletApplied[] => {
		const result: IWalletApplied[] = [];
		const local = creditWalletAddInvoice.map((w: any) => ({ ...w }));
		invoiceRows.forEach((inv, index) => {
			const base = inv.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
			let remaining = base;
			local
				.filter((w: any) => w.creditTo === inv.invoiceTo && w.fundTypeId === inv.fundTypeId)
				.forEach((wallet: any) => {
					if (remaining <= 0 || wallet.amount <= 0) return;
					const apply = Math.min(wallet.amount, remaining);
					result.push({
						id: wallet.id,
						amount: apply,
						creditTo: inv.invoiceTo as number,
						fundTypeId: inv.fundTypeId,
						applyInvoiceIndex: index,
						code: wallet.code,
					});
					wallet.amount -= apply;
					remaining -= apply;
				});
		});
		return result;
	}, [invoiceRows, creditWalletAddInvoice]);

	// ── Submit ────────────────────────────────────────────────────────────────

	const handleFormSubmit = async () => {
		try {
			setIsSubmitted(true);
			if (!validator.current.allValid()) {
				validator.current.showMessages();
				return;
			}
			setIsLoadingForm(true);

			for (const [index, row] of invoiceRows.entries()) {
				const creditApply = walletApplied
					.filter((w) => w.applyInvoiceIndex === index)
					.map(({ id, amount }) => ({
						id: generateUid(),
						creditWalletId: id,
						amount: Number(amount) || 0,
					}));

				const invoiceAddress: any = getResidentInvoiceAddress(
					residentData,
					+row.invoiceTo,
					row.fundTypeId,
					{ localAuthorityList, localICBList, fNCDetails },
				);

				// ✅ toApiPayload recomputes balanceDue = (discountedSubTotal + discountedVAT)
				const reqData: Partial<IInvoiceModel> = {
					...toApiPayload(row, formData),
					creditApply,
				};

				const action = row.id
					? updateInvoice(row.id, reqData)
					: createInvoice(reqData, invoiceAddress?.shortName);
				const res = await action;
				updateInvoiceList(res);

				if (!res?.id || creditApply.length === 0) continue;

				const walletPromises = (residentData?.creditWallets ?? []).map((wallet: any) => {
					const applied = creditApply
						.filter(({ creditWalletId }) => creditWalletId === wallet.id)
						.map(({ id, amount }) => ({
							invoiceId: res.id,
							id,
							amount: Number(amount),
						}));
					if (!applied.length) return null;
					return updateCreditWallet(wallet.id, {
						...wallet,
						creditApply: wallet.id
							? mergeArrayOfObjectUniqueByKey(wallet.creditApply, applied)
							: [],
					});
				});
				await Promise.all(walletPromises.filter(Boolean));
			}

			validator.current.hideMessages();
			residentGetDataFetch();
			onSave();
		} catch (err) {
			console.error('Error generating invoice:', err);
		} finally {
			setIsLoadingForm(false);
		}
	};

	return (
		<Modal
			isBackdrop={false}
			size='xl'
			fullScreen
			placement='end'
			isOpen={isOpen}
			setIsOpen={toggle}>
			<ModalHeader className='justify-content-between align-items-center'>
				<div className='d-flex align-items-center gap-2'>
					<Icon color='info' icon='Description' size='3x' />
					<div>
						<ModalTitle id='createInvoice' className='h4 mb-0'>
							Invoice Generate Form
						</ModalTitle>
						<small className='text-muted fs-6'>Create and manage your invoices</small>
					</div>
				</div>
				<div className='d-flex gap-2'>
					<Button
						isLight
						color='info'
						icon='Save'
						onClick={handleFormSubmit}
						isLoading={isLoadingForm}>
						{formData?.id ? 'Update' : 'Generate'} Invoice
					</Button>
					<Button
						isLight
						icon='Close'
						color='danger'
						onClick={toggle}
						isDisable={isLoadingForm}>
						Close
					</Button>
				</div>
			</ModalHeader>

			<ModalBody>
				{isMasterLoading ? (
					<Spinner />
				) : (
					<div>
						<div className='row g-3 mb-4'>
							<div className='col-3'>
								<DateTimePicker
									id='invoiceDate'
									label='Invoice Raised Date'
									minDate={residentData?.admission?.admissionDate}
									value={formData.invoiceDate}
									onChange={handleChange}
									isValid={validator.current.fieldValid('Invoice Raised Date')}
									isTouched={isSubmitted}
									invalidFeedback={validator.current.message(
										'Invoice Raised Date',
										formData.invoiceDate,
										'required',
									)}
								/>
							</div>
							<div className='col-3'>
								<DateTimePicker
									id='sDate'
									label='Invoice Start Date'
									minDate={residentData?.admission?.admissionDate}
									maxDate={residentData?.admission?.dateDischargeAndRip || ''}
									value={formData.sDate}
									onChange={handleChange}
									isValid={validator.current.fieldValid('Invoice Start Date')}
									isTouched={isSubmitted}
									invalidFeedback={validator.current.message(
										'Invoice Start Date',
										formData.sDate,
										'required',
									)}
								/>
							</div>
							<div className='col-3'>
								<DateTimePicker
									id='eDate'
									label='Invoice End Date'
									minDate={formData?.sDate}
									maxDate={residentData?.admission?.dateDischargeAndRip || ''}
									value={formData.eDate}
									onChange={handleChange}
									isValid={validator.current.fieldValid('Invoice End Date')}
									isTouched={isSubmitted}
									invalidFeedback={validator.current.message(
										'Invoice End Date',
										formData.eDate,
										'required',
									)}
								/>
							</div>
							<div className='col-3'>
								<FormGroup id='dueDay' label='Invoice Due Day'>
									<SearchableSelect
										id='dueDay'
										placeholder='Select Due Day'
										value={formData.dueDay}
										onChange={handleChange}
										isValid={validator.current.fieldValid('Due Day')}
										isTouched={isSubmitted}
										invalidFeedback={validator.current.message(
											'Due Day',
											formData.dueDay,
											'required',
										)}
										options={dueDateList}
										valueKey='day'
										labelKey='name'
									/>
								</FormGroup>
							</div>
						</div>

						{invoiceRows.length > 0 ? (
							<>
								<SummaryBar rows={invoiceRows} />

								{invoiceRows.map((row, index) => (
									<InvoiceCard
										key={`${row.invoiceTo}_${row.fundTypeId}_${index}`}
										row={row}
										index={index}
										formData={formData}
										residentData={residentData}
										localAuthorityList={localAuthorityList}
										localICBList={localICBList}
										fNCDetails={fNCDetails}
										vatList={vatList}
										miscellaneousList={miscellaneousList}
										isMasterLoading={isMasterLoading}
										billingFormula={billingFormula}
										respiteCurrentInfoStatus={respiteCurrentInfoStatus}
										discountList={discountList}
										isDiscountLoading={isDiscountLoading}
										updatedWallets={updatedWallets}
										walletApplied={walletApplied}
										creditWalletInput={creditWalletInput}
										validator={validator}
										isSubmitted={isSubmitted}
										onAddMiscellaneous={handleAddMiscellaneous}
										onMiscellaneousChange={handleMiscellaneousChange}
										onDeleteMiscellaneous={handleDeleteMiscellaneous}
										onCreditWalletInputChange={handleCreditWalletInputChange}
										onApplyWallet={handleApplyWallet}
										onRemoveCredit={handleRemoveCredit}
										onApplyDiscount={handleApplyDiscount}
										onRemoveDiscount={handleRemoveDiscount}
										onNotesChange={handleNotesChange}
									/>
								))}
							</>
						) : (
							<div
								className='d-flex justify-content-center align-items-center'
								style={{ height: '200px' }}>
								<h6 className='text-muted'>No Data Found</h6>
							</div>
						)}
					</div>
				)}
			</ModalBody>
		</Modal>
	);
};