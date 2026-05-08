import {
	FormGroup,
	Input,
	Modal,
	ModalBody,
	ModalHeader,
	ModalTitle,
	Select,
	Option,
	Checks,
	Button,
	CardBody,
	Card,
	Alert,
} from '../../../../../components/bootstrap';
import { INVOICE_TO_TYPE_LIST, PAYMENT_METHOD_LIST } from '../../../../../common/data/option';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useMultiSearch, useRefetchQueryList, useUpdateQueryListById } from '../../../../../hooks';
import {
	getInvoiceDiscountTotal,
	getInvoiceOpenBalance,
	getLabelByValue,
	getResidentInvoiceAddress,
	getUserMappedCompanyId,
	priceFormat,
	updatePaymentStatus,
} from '../../../../../helpers/helpers';
import {
	CREDIT_TYPE,
	INVOICE_TO_TYPE,
	PAYMENT_METHOD_TYPE,
	PAYMENT_STATUS,
} from '../../../../../common/constant';
import SimpleReactValidator from 'simple-react-validator';
import moment from 'moment';
import { creditWaletModel } from '../../../../../common/model/creditWalet';
import { createCreditWallet, updateCreditWallet } from '../../../../../common/api/creditWalet';
import { updateInvoice } from '../../../../../common/api/invoice';
import { ResidentCreditAvialbleList } from '../../../invoice/component/invoiceUpdateModal/creditCheck';
import { useMasterData } from '../../../../../contexts/mastersContext';
import { ICreditWalletModel } from '../../../../../common/interface';
import { DateTimePicker, SearchableSelect } from '../../../../../components/common';
import { IInvoiceDiscount } from '../../../../../common/interface/invoice';

// ─── Helper ───────────────────────────────────────────────────────────────────

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface InvoiceUpdateModalProps {
	isOpen?: boolean;
	residentData?: any;
	detailInvoiceInfo?: {
		companyId?: string | number;
		residentId: string;
		residentData: any;
		invoiceTo: number;
	} | null;
	toggle?: () => void;
	isResidentUpdate: boolean;
	invoiceTo: number;
	invoiceList: any[];
	InvoiceCurentPayedInfoList: any[];
	credittWalletsPayedInfoList?: any[];
	reloadInvoiceList: () => void;
	refetchResidentInvoiceList?: () => void;
}

interface InvoicePayment {
	id: string;
	value: number;
}

interface InvoiceFormData {
	paymentDate: string;
	paymentMethod: number;
	refNo: string;
	depositTo: string;
	amountReceived: string;
	residentName: string;
	fundType: string | number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const UpdatePayedAmountModal = ({
	isOpen = false,
	detailInvoiceInfo = null,
	toggle = () => {},
	isResidentUpdate = false,
	invoiceTo,
	invoiceList = [],
	InvoiceCurentPayedInfoList = [],
	credittWalletsPayedInfoList = [],
	reloadInvoiceList = () => {},
	refetchResidentInvoiceList = () => {},
}: InvoiceUpdateModalProps) => {
	const companyId: any = detailInvoiceInfo?.companyId ?? getUserMappedCompanyId()?.companyId;
	const residentData = detailInvoiceInfo?.residentData ?? {};
	const fundTypeId = invoiceList?.[0]?.fundTypeId;
	const payedInfoId = InvoiceCurentPayedInfoList?.[0]?.id;
	const refetchInvoiceListByCompany = useRefetchQueryList<any>(['invoiceListByCompany']);
	const {
		localAuthorityList = [],
		localICBList = [],
		fNCDetails = {},
		bankList: bankDetails = [],
		isLoading: isMasterLoading,
	}: any = useMasterData();

	const [, forceUpdate] = useState(0);
	const [isCreditWalletInfoModal, setIsCreditWalletInfoModal] = useState(false);
	const validator = useRef(new SimpleReactValidator({ autoForceUpdate: { forceUpdate } }));

	const [formData, setFormData] = useState<InvoiceFormData>({
		paymentDate: '',
		residentName: '',
		paymentMethod: -1,
		refNo: '',
		depositTo: '',
		amountReceived: '',
		fundType: +invoiceTo,
	});

	const [filterFromData, setFilterFromData] = useState<any>({ fundTypeId });
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isFormLoader, setIsFormLoader] = useState(false);
	const [invoicePayment, setInvoicePayment] = useState<InvoicePayment[]>([]);

	const filteredInvoiceList = useMultiSearch(invoiceList, filterFromData);

	// ── Overall balance — ✅ discount-aware via getInvoiceOpenBalance ─────────
	const overallResidentBalance = useMemo(() => {
		return +filteredInvoiceList
			.reduce((total, invoice) => total + getInvoiceOpenBalance(invoice), 0)
			.toFixed(2);
	}, [filteredInvoiceList]);

	const totalInvoicePaid = useMemo(() => {
		return +(invoicePayment ?? [])
			.reduce((s, item) => s + (Number(item.value) || 0), 0)
			.toFixed(2);
	}, [invoicePayment]);

	// ── Effects ───────────────────────────────────────────────────────────────
	useEffect(() => {
		if (!invoiceTo || !isOpen) return;
		setFilterFromData({ fundTypeId });
	}, [isOpen, invoiceTo]);

	useEffect(() => {
		if (!InvoiceCurentPayedInfoList?.length) return;

		const payInfo = InvoiceCurentPayedInfoList.map((inv) => ({
			value: inv.amount,
			id: inv.invoiceId,
		}));

		const payed = InvoiceCurentPayedInfoList.reduce((prev, cur) => prev + (cur.amount || 0), 0);

		const totalCreditAmount = credittWalletsPayedInfoList.reduce(
			(sum: number, { creditAmount = 0 }) => sum + (Number(creditAmount) || 0),
			0,
		);
		const finalAmountReceived = payed + totalCreditAmount;
		const firstPayment = InvoiceCurentPayedInfoList[0];

		setFormData((prev) => ({
			...prev,
			amountReceived: finalAmountReceived,
			depositTo: firstPayment?.bankId ?? prev.depositTo,
			refNo: firstPayment?.refNo ?? prev.refNo,
			paymentDate: firstPayment?.date ?? prev.paymentDate,
			paymentMethod: +firstPayment?.paymentMethod,
			fundType: Number(invoiceTo),
		}));

		setInvoicePayment(payInfo);
	}, [InvoiceCurentPayedInfoList]);

	useEffect(() => {
		if (!isOpen) {
			setFormData({
				paymentDate: '',
				paymentMethod: PAYMENT_METHOD_TYPE.CASH,
				refNo: '',
				depositTo: '',
				amountReceived: '',
				residentName: '',
				fundType: '',
			});
			setInvoicePayment([]);
			validator.current.hideMessages();
			setIsSubmitted(false);
		}
	}, [isOpen]);

	// ── Handlers ──────────────────────────────────────────────────────────────

	/**
	 * ✅ Open balance per invoice — discount pre-VAT via getInvoiceOpenBalance.
	 * Used for capping per-invoice payment inputs.
	 */
	const getNeedToPay = useCallback((invoice: any): number => {
		return getInvoiceOpenBalance(invoice);
	}, []);

	const handleChangeReceivedPayment = useCallback(
		(id: string, value: number) => {
			setInvoicePayment((prev) => {
				const othersPaid = prev
					.filter((p) => p.id !== id)
					.reduce((s, p) => s + (Number(p.value) || 0), 0);

				const remaining = Number(formData?.amountReceived || 0) - othersPaid;
				const invoice = filteredInvoiceList.find((inv) => inv.id === id);
				if (!invoice) return prev;

				const balance = getNeedToPay(invoice);
				const capped = Math.min(Math.min(value, remaining), balance);
				const exists = prev.some((p) => p.id === id);

				return exists
					? prev.map((p) => (p.id === id ? { ...p, value: capped } : p))
					: [...prev, { id, value: capped }];
			});
		},
		[filteredInvoiceList, formData?.amountReceived, getNeedToPay],
	);

	const distributeAmount = useCallback(
		(amount: number) => {
			let remaining = amount;
			const updatedPayments: InvoicePayment[] = [];

			filteredInvoiceList.forEach((invoice) => {
				if (remaining <= 0) return;
				const balance = getNeedToPay(invoice);
				const applied = Math.min(remaining, balance);
				updatedPayments.push({ id: invoice.id, value: +applied.toFixed(2) });
				remaining -= applied;
			});

			setInvoicePayment(updatedPayments);
		},
		[filteredInvoiceList, getNeedToPay],
	);

	const handleChange = useCallback(
		(field: keyof InvoiceFormData, value: string | number) => {
			if (field === 'amountReceived') {
				const n = Number(value);
				if (n > 0) distributeAmount(n);
			}
			setFormData((prev) => ({ ...prev, [field]: value }));
		},
		[distributeAmount],
	);

	const handleCheckChange = (id: string) => {
		setInvoicePayment((prev) => prev.filter((p) => p.id !== id));
	};

	// ── Submit ────────────────────────────────────────────────────────────────

	const submitInvoice = async () => {
		setIsFormLoader(true);
		setIsCreditWalletInfoModal(false);
		try {
			const updatePromises = invoiceList
				.map(async (invoice) => {
					const payInfo = invoicePayment.find(({ id }) => id === invoice.id);

					const details = {
						id: payedInfoId,
						amount: Number(payInfo?.value) || 0,
						date: formData.paymentDate,
						refNo: formData.refNo,
						paymentMethod: formData.paymentMethod,
						bankId: formData.depositTo,
					};

					const payments = [...(invoice.payedInfo || [])];
					const first = payments[0];
					const isPlaceholder =
						first &&
						!first.date &&
						!first.refNo &&
						!first.paymentRef &&
						(!first.amount || Number(first.amount) === 0);

					if (isPlaceholder) payments[0] = details;
					else payments.push(details);

					const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
					const totalCredits = (invoice.creditApply ?? []).reduce(
						(s: number, { amount }: any) => s + (Number(amount) || 0),
						0,
					);

					// ✅ balanceDue stored = discounted total (pre-payment).
					// updatePaymentStatus compares totalPaid+credits against balanceDue target.
					// If no balanceDue stored (legacy), falls back to totalPrice.
					const balanceDueTarget =
						invoice.balanceDue != null && Number(invoice.balanceDue) > 0
							? Number(invoice.balanceDue)
							: Number(invoice.totalPrice || 0);

					const reqBody = {
						...invoice,
						payedInfo: payments,
						// ✅ pass balanceDue as third param — discount-aware status
						status: updatePaymentStatus(invoice),
					};

					return await updateInvoice(invoice.id, reqBody);
				})
				.filter(Boolean);

			if (updatePromises.length) {
				await Promise.all(updatePromises);
				validator.current.hideMessages();
				reloadInvoiceList();
				if (isResidentUpdate) {
					refetchResidentInvoiceList();
				}
				refetchInvoiceListByCompany?.forceRefetch();
				toggle();
			}
		} catch (err) {
			console.error('Error while updating invoices', err);
		} finally {
			setIsFormLoader(false);
		}
	};

	const handleFormSubmit = async () => {
		setIsSubmitted(true);
		if (!validator.current.allValid()) {
			validator.current.showMessages();
			forceUpdate((i) => i + 1);
			return;
		}

		const amountReceivedBalance = +(+formData.amountReceived - +totalInvoicePaid).toFixed(2);
		const customerBalanceDiff = +(overallResidentBalance - +totalInvoicePaid);
		const shouldShowCreditModal =
			!isResidentUpdate && (amountReceivedBalance > 0 || customerBalanceDiff < 0);
		const exitCreditWalletObj = credittWalletsPayedInfoList.find(
			({ paymentRefId }) => paymentRefId === payedInfoId,
		);
		const creditApplyTotal = credittWalletsPayedInfoList
			.flatMap(({ creditApply = [] }) => creditApply)
			.reduce((sum, { amount }) => sum + (Number(amount) || 0), 0);

		if (shouldShowCreditModal) {
			setIsCreditWalletInfoModal(true);
			return;
		}

		if (creditApplyTotal > 0 && !(amountReceivedBalance >= creditApplyTotal)) {
			alert(
				`If the resident's credit is available, apply ${creditApplyTotal} — a minimum of ${creditApplyTotal} is required.`,
			);
			return;
		}

		if (isResidentUpdate) {
			if (amountReceivedBalance > 0) {
				const reqCreditWallet: ICreditWalletModel = {
					...creditWaletModel,
					...exitCreditWalletObj,
					type: CREDIT_TYPE.ADVANCE_CREDIT,
					creditAmount: amountReceivedBalance.toFixed(2),
					companyId: exitCreditWalletObj?.id
						? exitCreditWalletObj.companyId
						: getUserMappedCompanyId()?.companyId,
					creditTo: invoiceTo,
					residentId: exitCreditWalletObj?.id
						? exitCreditWalletObj.residentId
						: (invoiceList[0]?.residentId ?? ''),
					bankId: formData.depositTo,
					date: formData.paymentDate,
					paymentRefId: payedInfoId,
					fundTypeId: fundTypeId ? fundTypeId : filterFromData?.fundTypeId,
				};
				const creditNotesAddress: any = getResidentInvoiceAddress(
					residentData,
					+invoiceTo,
					reqCreditWallet?.fundTypeId,
					{ localAuthorityList, localICBList, fNCDetails },
				);
				await (exitCreditWalletObj?.id
					? updateCreditWallet(exitCreditWalletObj.id, reqCreditWallet)
					: createCreditWallet(reqCreditWallet, creditNotesAddress.shortName));
				await submitInvoice();
				return;
			}
			if (customerBalanceDiff < 0) {
				await submitInvoice();
				return;
			}
		}

		await submitInvoice();
	};

	// ── Render ────────────────────────────────────────────────────────────────

	const amountReceivedNum = Number(formData.amountReceived || 0);

	return (
		<>
			<Modal
				setIsOpen={() => {}}
				isOpen={isOpen}
				fullScreen
				titleId='transfer-modal'
				id='invoiceUpdate'>
				<ModalHeader setIsOpen={toggle}>
					<ModalTitle id='transfer-modal'>Receive Payment</ModalTitle>
				</ModalHeader>

				<ModalBody>
					<div>
						{/* ── Top: filter + balance summary ──────────────── */}
						<div className='row mb-4'>
							<div className='col-8'>
								<div className='row'>
									{(invoiceTo === INVOICE_TO_TYPE.LA ||
										invoiceTo === INVOICE_TO_TYPE.CHC) && (
										<div className='col-4'>
											<FormGroup
												id={
													invoiceTo === INVOICE_TO_TYPE.LA
														? 'localAuthority'
														: 'icb'
												}
												label={
													invoiceTo === INVOICE_TO_TYPE.LA
														? 'Local Authority'
														: 'ICB'
												}>
												<SearchableSelect
													id={
														invoiceTo === INVOICE_TO_TYPE.LA
															? 'localAuthority'
															: 'icb'
													}
													value={filterFromData.fundTypeId}
													onChange={(e: any) =>
														setFilterFromData((prev: any) => ({
															...prev,
															fundTypeId: e.target.value,
														}))
													}
													placeholder={`Select ${invoiceTo === INVOICE_TO_TYPE.LA ? 'Local Authority' : 'ICB'}`}
													options={
														(invoiceTo === INVOICE_TO_TYPE.LA
															? localAuthorityList
															: localICBList) || []
													}
													labelKey='name'
													valueKey='id'
												/>
											</FormGroup>
										</div>
									)}
								</div>
							</div>
							<div className='col-4 text-end'>
								<h5 className='h5'>Amount Received</h5>
								<h2 className='fw-bold fs-3 mb-0'>
									{priceFormat(amountReceivedNum)}
								</h2>
								<h5 className='h5 mt-3'>Customer Balance</h5>
								<span className='fs-4'>{priceFormat(overallResidentBalance)}</span>
							</div>
						</div>

						{/* ── Payment form ──────────────────────────────────── */}
						<div className='row mb-4'>
							<div className='col-3'>
								<DateTimePicker
									id='paymentDate'
									label='Payment Date'
									maxDate={moment().format('YYYY-MM-DD')}
									value={formData.paymentDate}
									onChange={(e: any) =>
										handleChange('paymentDate', e.target.value)
									}
									isValid={validator.current.fieldValid('Payment Date')}
									isTouched={isSubmitted}
									invalidFeedback={validator.current.message(
										'Payment Date',
										formData.paymentDate,
										'required',
									)}
								/>
							</div>
						</div>

						<div className='row'>
							<div className='col-3'>
								<FormGroup id='paymentMethod' label='Payment Method'>
									<SearchableSelect
										value={formData.paymentMethod}
										onChange={(e: any) =>
											handleChange('paymentMethod', e.target.value)
										}
										isValid={validator.current.fieldValid('Payment Method')}
										isTouched={isSubmitted}
										invalidFeedback={validator.current.message(
											'Payment Method',
											formData.paymentMethod,
											'required',
										)}
										options={PAYMENT_METHOD_LIST}
									/>
								</FormGroup>
							</div>
							<div className='col-3'>
								<FormGroup id='refNo' label='Reference No.'>
									<Input
										type='text'
										value={formData.refNo}
										onChange={(e: any) => handleChange('refNo', e.target.value)}
									/>
								</FormGroup>
							</div>
							<div className='col-3'>
								<FormGroup id='depositTo' label='Deposit To'>
									<SearchableSelect
										options={bankDetails}
										value={formData.depositTo}
										onChange={(e: any) =>
											handleChange('depositTo', e.target.value)
										}
										isValid={validator.current.fieldValid('Deposit To')}
										isTouched={isSubmitted}
										invalidFeedback={validator.current.message(
											'Deposit To',
											formData.depositTo,
											'required',
										)}
										labelKey='bankName'
										valueKey='id'
										placeholder='Select Bank'
									/>
								</FormGroup>
							</div>
							<div className='col-3'>
								<FormGroup id='amountReceived' label='Amount Received'>
									<Input
										type='number'
										value={formData.amountReceived}
										onChange={(e: any) =>
											handleChange('amountReceived', e.target.value)
										}
										isValid={validator.current.fieldValid('Amount Received')}
										isTouched={!!formData.amountReceived}
										invalidFeedback={validator.current.message(
											'Amount Received',
											formData.amountReceived,
											'required|numeric|min:1,num',
										)}
									/>
								</FormGroup>
							</div>
						</div>

						{/* ── Outstanding invoices table ────────────────────── */}
						<div className='row mt-5'>
							<div className='col-md-12 mb-4'>
								<h1>Outstanding Transaction</h1>
							</div>
							<div className='col-md-12'>
								{filteredInvoiceList.length === 0 ? (
									<p className='text-center text-muted py-3'>
										No pending or partial invoices found.
									</p>
								) : (
									<div className='table-responsive'>
										<table className='table table-modern table-hover mb-5'>
											<thead>
												<tr>
													<th>Invoice No</th>
													<th>Invoice Date</th>
													<th>Invoice Period</th>
													<th>Fund Type</th>
													<th>Original Amount</th>
													{/* ✅ Discount column */}
													<th className='text-success'>Discount</th>
													<th>Open Balance</th>
													<th>Payment</th>
												</tr>
											</thead>
											<tbody>
												{filteredInvoiceList.map((invoice, i) => {
													const value =
														invoicePayment.find(
															(p) => p.id === invoice.id,
														)?.value ?? 0;
													const discountTotal =
														getInvoiceDiscountTotal(invoice);
													const openBalance = Math.max(
														getNeedToPay(invoice) - value,
														0,
													);

													return (
														<tr key={invoice.id}>
															<td>
																<div className='d-flex align-items-center'>
																	<div className='flex-shrink-0'>
																		<div
																			className='ratio ratio-1x1 me-3'
																			style={{ width: 40 }}>
																			<Checks
																				className='invoice-check mx-auto mt-2'
																				disabled={
																					!Boolean(value)
																				}
																				onChange={() =>
																					Boolean(
																						value,
																					) &&
																					handleCheckChange(
																						invoice.id,
																					)
																				}
																				checked={Boolean(
																					value,
																				)}
																				color='success'
																				ariaLabel='Select Invoice'
																			/>
																		</div>
																	</div>
																	<div className='flex-grow-1'>
																		<div className='fs-6 fw-bold'>
																			{
																				invoice
																					?.residentData
																					?.personal?.name
																			}
																		</div>
																		<div className='text-muted'>
																			<small>
																				{invoice.code}
																			</small>
																		</div>
																	</div>
																</div>
															</td>
															<td>
																{invoice.invoiceDate
																	? moment(
																			invoice.invoiceDate,
																		).format('DD MMM YYYY')
																	: ''}
															</td>
															<td>
																{moment(invoice.sDate).format(
																	'DD MMM YYYY',
																)}{' '}
																To{' '}
																{moment(invoice.eDate).format(
																	'DD MMM YYYY',
																)}
															</td>
															<td>
																{getLabelByValue(
																	INVOICE_TO_TYPE_LIST,
																	invoice?.invoiceTo,
																) || '—'}
															</td>
															<td>
																{priceFormat(invoice.totalPrice)}
															</td>
															{/* ✅ Discount cell */}
															<td className='text-success'>
																{discountTotal > 0 ? (
																	<span
																		title={(
																			invoice.discounts ?? []
																		)
																			.map(
																				(
																					d: IInvoiceDiscount,
																				) =>
																					`${d.code}: −${priceFormat(d.amount)}`,
																			)
																			.join('\n')}>
																		−
																		{priceFormat(discountTotal)}
																	</span>
																) : (
																	<span className='text-muted'>
																		—
																	</span>
																)}
															</td>
															<td>{priceFormat(openBalance)}</td>
															<td>
																<Input
																	type='number'
																	value={value}
																	disabled={
																		value === 0 &&
																		+totalInvoicePaid >=
																			amountReceivedNum
																	}
																	isValid={validator.current.fieldValid(
																		`Payment-${i}`,
																	)}
																	isTouched={!!value}
																	invalidFeedback={validator.current.message(
																		`Payment-${i}`,
																		value,
																		`required|numeric|min:0,num|max:${getNeedToPay(invoice)},num`,
																	)}
																	onChange={(e: any) =>
																		handleChangeReceivedPayment(
																			invoice.id,
																			Number(
																				e.target.value,
																			) || 0,
																		)
																	}
																/>
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								)}
							</div>
						</div>

						{/* ── Footer ────────────────────────────────────────── */}
						{formData.amountReceived && filteredInvoiceList.length > 0 && (
							<div className='row sticky-bottom'>
								<div className='col-12'>
									<Card>
										<CardBody>
											<div className='row'>
												<div className='col-8 text-end'>
													{(!(
														+totalInvoicePaid ===
														+formData.amountReceived
													) ||
														+formData.amountReceived -
															overallResidentBalance >
															0) && (
														<Alert
															icon='error'
															className='py-0 mb-0'
															isLight
															color='danger'>
															Resolved amount is £{totalInvoicePaid},
															but you entered £
															{Number(
																formData.amountReceived,
															).toFixed(2)}
															. The remaining £
															{Math.abs(
																+formData.amountReceived -
																	+totalInvoicePaid,
															).toFixed(2)}{' '}
															will be saved to credit balance.
														</Alert>
													)}
												</div>
												<div className='col-4 text-end'>
													<Button
														color='danger'
														className='me-2'
														isDisable={isFormLoader}
														onClick={toggle}>
														Cancel
													</Button>
													<Button
														color='info'
														isLoading={isFormLoader}
														isDisable={
															isFormLoader ||
															Number(totalInvoicePaid) >
																Number(formData.amountReceived)
														}
														onClick={handleFormSubmit}>
														Update
													</Button>
												</div>
											</div>
										</CardBody>
									</Card>
								</div>
							</div>
						)}
					</div>
				</ModalBody>
			</Modal>

			<ResidentCreditAvialbleList
				fundTypeId={filterFromData?.fundTypeId}
				invoiceTo={invoiceTo}
				availCredit={+(+formData.amountReceived - +totalInvoicePaid).toFixed(2)}
				isOpen={isCreditWalletInfoModal}
				onUpdateWithCreditNotes={submitInvoice}
				toggle={() => setIsCreditWalletInfoModal((p) => !p)}
				invoiceList={invoiceList}
				invoicePayment={invoicePayment}
				formData={formData}
				paymentId={payedInfoId}
				credittWalletsPayedInfoList={credittWalletsPayedInfoList}
				localICBList={localICBList}
				localAuthorityList={localAuthorityList}
				fNCDetails={fNCDetails}
			/>
		</>
	);
};
