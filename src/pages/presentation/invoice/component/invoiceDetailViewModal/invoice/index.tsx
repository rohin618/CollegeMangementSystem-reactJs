import React, { useMemo } from 'react';
import logo from '../../../../../../assets/img/logo.png';

import './invoice.scss';
import {
	INVOICE_STATUS,
	INVOICE_TO_TYPE,
	INVOICE_CATEGORY,
	PRIMARY_ACCOUNT,
	INVOICE_TYPE,
	DISCOUNT_TYPE,
} from '../../../../../../common/constant';
import moment from 'moment';
import {
	getInvoiceOpenBalance,
	getLabelByValue,
	getUserMappedCompany,
	priceFormat,
} from '../../../../../../helpers/helpers';
import { useMasterData } from '../../../../../../contexts/mastersContext';
import { IInvoiceModel } from '../../../../../../common/interface';
import { IInvoiceDiscount, IInvoiceItem, IPayedInfo } from '../../../../../../common/interface/invoice';
import { SALUTATION_LIST } from '../../../../../../common/data/option';
import useDarkMode from '../../../../../../hooks/useDarkMode';
import classNames from 'classnames';
import { useGetHeadOfficeAddress } from '../../../../../../hooks/useGetHeadOfficeAddress';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface IPaymentInfo {
	amount: number | string;
}

interface IInvoiceAddress {
	name?: string;
	addressLine1?: string;
	addressLine2?: string;
	buildingNumber?: string;
	area?: string;
	townOrCity?: string;
	county?: string;
	country?: string;
	postcode?: string;
	postCode?: string;
	shortName?: string;
	salutation?: number;
	address?: string;
	email?: string;
}

interface IInvoiceProps {
	status?: number;
	invoiceNo?: string;
	paymentTerms?: string;
	dueDate?: string | Date | null;
	page?: number;
	totalPages?: number;
	customerName?: string;
	reference?: string;
	address?: string;
	subtotal?: number;
	totalPrice?: number;
	remainingAmount?: number;
	detailInvoiceInfo?: any;
	invoiceAddress?: IInvoiceAddress;
	creditNotesValue?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Invoice: React.FC<IInvoiceProps> = ({
	status = INVOICE_STATUS.PENDING,
	invoiceNo = '',
	paymentTerms = '',
	dueDate = '',
	page = 1,
	totalPages = 1,
	customerName = '',
	reference = '',
	subtotal = 0,
	totalPrice = 0,
	remainingAmount = 0,
	detailInvoiceInfo = {},
	invoiceAddress = {},
	creditNotesValue = 0,
}) => {
	const companyDetails = getUserMappedCompany();
	const { darkModeStatus } = useDarkMode();
	const { miscellaneousList, isLoading: isMasterLoading, bankList } = useMasterData();
	const { data: headOfficeAddress } = useGetHeadOfficeAddress();

	// ── Paid amount ───────────────────────────────────────────────────────────
	const paidAmount = useMemo(() => {
		if (!detailInvoiceInfo?.payedInfo?.length) return 0;
		return detailInvoiceInfo.payedInfo.reduce(
			(total: number, payment: IPayedInfo) => total + (Number(payment.amount) || 0),
			0,
		);
	}, [detailInvoiceInfo?.payedInfo]);

	// ── Credit applied total ──────────────────────────────────────────────────
	const creditTotal = useMemo(() => {
		if (!detailInvoiceInfo?.creditApply?.length) return 0;
		return detailInvoiceInfo.creditApply.reduce(
			(sum: number, { amount }: any) => sum + (Number(amount) || 0),
			0,
		);
	}, [detailInvoiceInfo?.creditApply]);

	// ── Discount total — IInvoiceModel.discounts[] ────────────────────────────
	const discountTotal = useMemo(() => {
		const discounts: IInvoiceDiscount[] = detailInvoiceInfo?.discounts ?? [];
		if (!discounts.length) return 0;
		return discounts.reduce(
			(sum, d) => sum + (Number(d.amount) || 0),
			0,
		);
	}, [detailInvoiceInfo?.discounts]);

	// ── Balance due ───────────────────────────────────────────────────────────
	// ✅ balanceDue on the model = (subTotal − discount) + VAT  (pre-VAT discount)
	//    We then subtract any payments and credits on top of that.
	const balanceDue = useMemo(() => {

		return getInvoiceOpenBalance(detailInvoiceInfo)
	}, [detailInvoiceInfo?.balanceDue, detailInvoiceInfo?.totalPrice, discountTotal, paidAmount, creditTotal]);

	// ── Active bank ───────────────────────────────────────────────────────────
	const activeBankInfo: any = useMemo(
		() => bankList?.find(({ primaryAccount }: any) => primaryAccount === PRIMARY_ACCOUNT.YES),
		[bankList],
	);

	// ── Helpers ───────────────────────────────────────────────────────────────

	const getVatAmount = (total: number, vatRate?: number) => {
		if (!vatRate || vatRate <= 0) return priceFormat(0);
		const vatAmount = total - total / (1 + vatRate / 100);
		return priceFormat(+vatAmount.toFixed(2));
	};

	const getMiscellaneousName = (id: string): string => {
		if (!id || !miscellaneousList?.length) return '';
		try {
			return miscellaneousList?.find(
				(data: { id: string; name: string }) => data.id === id,
			)?.name ?? '';
		} catch {
			return '';
		}
	};

	const getDescription = (item: IInvoiceItem, info: any): string => {
		if (item.category !== INVOICE_CATEGORY.BED) {
			const miscName = getMiscellaneousName(item.miscellaneousId ?? '');
			return `${miscName}${item.description ? ` (${item.description})` : ''}`;
		}

		if (
			+info.type === INVOICE_TYPE.VAT_ARREARS ||
			+info.type === INVOICE_TYPE.ARREARS
		) {
			return item.description ?? '';
		}

		const invoiceTo = Number(info.invoiceTo ?? 0);
		const weekPrice = priceFormat(Number(item.weekPrice || 0));

		const descriptions: Record<number, string> = {
			[INVOICE_TO_TYPE.CLIENT_CONTRIBUTION]: `Monthly Client Contribution @ ${weekPrice} per week`,
			[INVOICE_TO_TYPE.FNC]: `Monthly Funded Nursing Fee @ ${weekPrice} per week`,
			[INVOICE_TO_TYPE.LA]: `Monthly ${invoiceAddress?.shortName} Contribution @ ${weekPrice} per week`,
			[INVOICE_TO_TYPE.CHC]: `Monthly ${invoiceAddress?.shortName} Contribution @ ${weekPrice} per week`,
			[INVOICE_TO_TYPE.PRIVATE]: `Monthly Nursing Fee @ ${weekPrice} per week`,
			[INVOICE_TO_TYPE.INCONT]: `Monthly ${invoiceAddress?.shortName} Contribution @ ${weekPrice} per week`,
			[INVOICE_TO_TYPE.FAMILY_TOPUP]: `Monthly Family TopUp @ ${weekPrice} per week`,
			[INVOICE_TO_TYPE.THIRD_PARTY_TOPUP]: `Monthly Third Party TopUp @ ${weekPrice} per week`,
		};

		return descriptions[invoiceTo] || '';
	};

	const hasAddress = [
		invoiceAddress?.address,
		invoiceAddress?.addressLine1,
		invoiceAddress?.addressLine2,
		invoiceAddress?.buildingNumber,
		invoiceAddress?.area,
		invoiceAddress?.townOrCity,
		invoiceAddress?.county,
		invoiceAddress?.country,
		invoiceAddress?.postcode,
	].some(Boolean);


	type VatSummary = Record<
		string,
		{ vatAmount: number; netAmount: number }
	>;

	const subTotal = detailInvoiceInfo?.subTotal || 0;



const vatSummary: VatSummary = (detailInvoiceInfo?.items || []).reduce(
  (acc:any, item:any) => {
    const rate = item.vatRate || 0;
    const rateKey = rate ? `${rate}%` : 'Exempt';

    const itemNet = item.amount || 0;

    // ✅ distribute global discount
    const itemDiscount =
      subTotal > 0 ? (itemNet / subTotal) * discountTotal : 0;

    const discountedNet = itemNet - itemDiscount;

    const vatAmount = (discountedNet * rate) / 100;

    if (!acc[rateKey]) {
      acc[rateKey] = { vatAmount: 0, netAmount: 0 };
    }

    acc[rateKey].netAmount += discountedNet;
    acc[rateKey].vatAmount += vatAmount;

    return acc;
  },
  {} as VatSummary
);

	// ─────────────────────────────────────────────────────────────────────────
	return (
		<div>
			<div
				className={classNames('invoice-box', {
					'bg-dark text-light': darkModeStatus,
					'bg-white text-dark': !darkModeStatus,
				})}
				id="invoice-box"
			>
				{/* ── Header ──────────────────────────────────────────────── */}
				<div className="invoice-header text-center">
					<h2 className="my-bg">
						{+detailInvoiceInfo.type === INVOICE_TYPE.VAT_ARREARS && 'VAT ONLY'} INVOICE
					</h2>
					{totalPages > 1 && (
						<p className="mb-0 small text-muted">
							Page {page} of {totalPages}
						</p>
					)}
				</div>

				{/* ── Logo ────────────────────────────────────────────────── */}
				<img
					className="logo float-end"
					src={companyDetails?.logo ?? logo}
					style={{ maxHeight: 120, maxWidth: 250 }}
					alt="Company Logo"
				/>

				{/* ── Company info ─────────────────────────────────────────── */}
				<div className="mb-5">
					<p className="mb-0 fw-bold">{companyDetails?.name}</p>
					<p className="mb-0">
						{headOfficeAddress?.buildingNumber && `${headOfficeAddress.buildingNumber}, `}
						{headOfficeAddress?.area} {headOfficeAddress?.address} {headOfficeAddress?.postCode}
					</p>
					<p className="mb-0">Tel: {companyDetails?.phone}</p>
					<p className="mb-0">{companyDetails?.email}</p>
					<p className="mb-0">VAT Registration No.: {companyDetails?.vatRegNo || 'NA'}</p>
				</div>

				{/* ── Invoice / customer info ──────────────────────────────── */}
				<div className="row mb-4">
					<div className="col-6">
						<p className="fw-bold mb-1">Invoice To</p>
						<p className="mb-0">
							{invoiceAddress?.salutation
								? `${getLabelByValue(SALUTATION_LIST, invoiceAddress.salutation)}. ${invoiceAddress?.name || '-'}`
								: invoiceAddress?.name || '-'}
						</p>
						<p className="mb-0">
							Re:{' '}
							{getLabelByValue(SALUTATION_LIST, detailInvoiceInfo?.residentData?.personal?.salutation)}.{' '}
							{detailInvoiceInfo?.residentData?.personal?.name}
						</p>
						{hasAddress && (
							<p className="mb-0">
								{[
									invoiceAddress?.buildingNumber,
									invoiceAddress?.area,
									invoiceAddress?.address,
									invoiceAddress?.addressLine1,
									invoiceAddress?.addressLine2,
								].filter(Boolean).join(' ')}{' '}
								{[
									invoiceAddress?.townOrCity,
									invoiceAddress?.county,
									invoiceAddress?.country,
									invoiceAddress?.postcode,
								].filter(Boolean).join(' ')}
							</p>
						)}
						{invoiceAddress?.email && <p>{invoiceAddress?.email}</p>}
					</div>
					<div className="col-6">
						<table className="table table-borderless table-sm customer-info-table">
							<tbody>
								<tr>
									<td>Invoice No</td>
									<td className="fw-bold">{detailInvoiceInfo?.code || '-'}</td>
								</tr>
								<tr>
									<td>Invoice Date</td>
									<td className="fw-bold">
										{detailInvoiceInfo.invoiceDate
											? moment(detailInvoiceInfo.invoiceDate).format('DD MMM YYYY')
											: '-'}
									</td>
								</tr>
								<tr>
									<td>Payment Terms</td>
									<td className="fw-bold">
										{detailInvoiceInfo?.dueDay ? `Net ${detailInvoiceInfo?.dueDay} Days` : 'NA'}
									</td>
								</tr>
								<tr>
									<td>Due Date</td>
									<td className="fw-bold">
										{detailInvoiceInfo?.dueDay
											? moment(detailInvoiceInfo?.invoiceDate)
												.add(Number(detailInvoiceInfo?.dueDay) || 0, 'days')
												.format('DD MMM YYYY')
											: 'NA'}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* ── Items table ──────────────────────────────────────────── */}
				<table className="table table-bordered text-center">
					<thead
						className="table-light"
						style={{ '--bs-table-bg': '#005884', '--bs-table-color': '#ffffff' } as React.CSSProperties}
					>
						<tr className="tab-border">
							<th>S.No</th>
							<th>Category</th>
							<th>Description</th>
							<th>Period</th>
							<th>VAT %</th>
							<th>Qty</th>
							<th>Rate</th>
							<th>Amount</th>
						</tr>
					</thead>
					<tbody className="tab-borderless">
						{detailInvoiceInfo?.items?.map((item: IInvoiceItem, i: number) => (
							<tr key={item.id ?? i} className="bottom-border">
								<td>{i + 1}</td>
								<td className="text-center">
									{item.category === INVOICE_CATEGORY.MISC
										? 'Miscellaneous'
										: invoiceAddress?.shortName}
								</td>
								<td className="text-start">{getDescription(item, detailInvoiceInfo)}</td>
								<td>
									{item?.period &&
										`${item.period.from ? moment(item.period.from).format('DD.MM.YYYY') : '-'} - ${item.period.to ? moment(item.period.to).format('DD.MM.YYYY') : '-'
										}`}
								</td>
								<td>{item?.vatRate ? `${Number(item.vatRate).toFixed(1)}%` : 'Exempt'}</td>
								<td>{detailInvoiceInfo?.qty || 1}</td>
								<td className="text-end">{priceFormat(item.amount - item.vatAmount)}</td>
								<td className="text-end">{priceFormat(item.amount - item.vatAmount)}</td>
							</tr>
						))}
					</tbody>
				</table>

				{/* ── Totals table ─────────────────────────────────────────── */}
				{/*
				 * ✅ CHANGED: Discount is applied on Sub Total (pre-VAT).
				 * New display order:
				 *   Sub Total (ex VAT)
				 *   Discount(s)         ← moved above VAT
				 *   Discounted Sub Total (if any discount)
				 *   VAT Total
				 *   Total (inc VAT)
				 *   Credit Applied
				 *   Payment
				 *   Balance Due
				 */}
				<table className="table table-borderless totals-table w-50 ms-auto table-fixed">
					<tbody>
						{/* Sub Total (ex VAT) */}
						<tr>
							<td>Sub Total (ex VAT)</td>
							<td className="text-end">{priceFormat(detailInvoiceInfo?.subTotal)}</td>
						</tr>

						{/* ── Discount rows — shown BEFORE VAT ────────────────── */}
						{(detailInvoiceInfo?.discounts ?? []).length > 0 && (
							<>
								{(detailInvoiceInfo.discounts as IInvoiceDiscount[]).map((d, i) => (
									<tr key={d.discountId ?? i}>
										<td className="text-success">
											Discount{' '}
											<small className="text-muted">
												({d.code}
												{d.name ? ` — ${d.name}` : ''},{' '}
												{+d.type === DISCOUNT_TYPE.PERCENTAGE
													? `${d.value}% off`
													: `${priceFormat(d.value)} off`})
											</small>
										</td>
										<td className="text-end text-success">
											−{priceFormat(d.amount)}
										</td>
									</tr>
								))}

								{/* Discount subtotal row if more than one discount */}
								{(detailInvoiceInfo.discounts as IInvoiceDiscount[]).length > 1 && (
									<tr>
										<td className="text-success fw-semibold">Total Discount</td>
										<td className="text-end text-success fw-semibold">
											−{priceFormat(discountTotal)}
										</td>
									</tr>
								)}

								{/* Discounted Sub Total — subTotal minus discounts, before VAT */}
								<tr className="border-top">
									<td className="fw-semibold">Discounted Sub Total (ex VAT)</td>
									<td className="text-end fw-semibold">
										{priceFormat(Math.max((detailInvoiceInfo?.subTotal ?? 0) - discountTotal, 0))}
									</td>
								</tr>
							</>
						)}

						{/* VAT Total — calculated on original items, not reduced by discount */}
						<tr>
							<td>VAT Total</td>
							<td className="text-end">{priceFormat(detailInvoiceInfo?.vatTotal)}</td>
						</tr>

						{/* Total inc VAT (gross, before any discount/credit/payment) */}
						<tr>
							<td>Total (inc VAT)</td>
							{/* <td className="text-end">{priceFormat(detailInvoiceInfo?.totalPrice)}</td> */}
							<td className="text-end">{priceFormat(Math.max((detailInvoiceInfo?.subTotal ?? 0) - discountTotal, 0) + detailInvoiceInfo?.vatTotal)}</td>
						</tr>

						{/* ── Credit applied ──────────────────────────────────── */}
						{creditTotal > 0 && (
							<tr>
								<td>Credit Applied</td>
								<td className="text-end">−{priceFormat(creditTotal)}</td>
							</tr>
						)}

						{/* ── Payment ─────────────────────────────────────────── */}
						{status !== INVOICE_STATUS.PENDING && (
							<tr className="bottom-border">
								<td>Payment</td>
								<td className="text-end">{priceFormat(paidAmount)}</td>
							</tr>
						)}

						{/* ── Balance due ──────────────────────────────────────── */}
						<tr
							className={
								status === INVOICE_STATUS.COMPLITED
									? 'paid-row'
									: status === INVOICE_STATUS.PENDING || status === INVOICE_STATUS.PARTIAL
										? 'pending-row'
										: ''
							}
						>
							<td>Balance Due</td>
							<td className="text-end">{priceFormat(balanceDue)}</td>
						</tr>

						{status === INVOICE_STATUS.COMPLITED && (
							<tr className="paid-row">
								<td></td>
								<td className="text-end fw-bold">PAID</td>
							</tr>
						)}
					</tbody>
				</table>

				{/* ── VAT summary ──────────────────────────────────────────── */}
				<p className="section-title">VAT Summary</p>
				<table className="table table-bordered text-center table-fixed">
					<thead
						className="table-light"
						style={{ '--bs-table-bg': '#005884', '--bs-table-color': '#ffffff' } as React.CSSProperties}
					>
						<tr>
							<th>Rate</th>
							<th>VAT Amount</th>
							<th>NET Amount</th>
						</tr>
					</thead>
					<tbody>
						{/* {detailInvoiceInfo?.items?.map((item: IInvoiceItem, i: number) => (
							<tr key={item.id ?? i}>
								<td>{item.vatRate ? `${item.vatRate}%` : 'Exempt'}</td>
								<td>{priceFormat(item.vatAmount)}</td>
								<td>{priceFormat(item.amount)}</td>
							</tr>
						))} */}
						{(Object.entries(vatSummary) as [string, { vatAmount: number; netAmount: number }][]).map(
							([rate, data], i) => (
								<tr key={i}>
									<td>{rate}</td>
									<td>{priceFormat(data.vatAmount)}</td>
									<td>{priceFormat(data.netAmount)}</td>
								</tr>
							)
						)}
					</tbody>
				</table>

				{/* ── Payment details ──────────────────────────────────────── */}
				<p className="section-title">Payment Details</p>
				<p className="mb-0"><strong>Account Name:</strong> {activeBankInfo?.accountName}</p>
				<p className="mb-0"><strong>Account Number:</strong> {activeBankInfo?.accountNumber}</p>
				<p className="mb-0"><strong>Sort Code:</strong> {activeBankInfo?.sortCode}</p>
				<p className="mb-0"><strong>Bank Name:</strong> {activeBankInfo?.bankName}</p>
				<p className="mb-0"><strong>Email:</strong> {companyDetails?.email}</p>
				<p className="mb-0"><strong>Tel No:</strong> {companyDetails.phone}</p>
			</div>
		</div>
	);
};