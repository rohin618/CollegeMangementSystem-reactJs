import React, { useEffect, useRef, useState } from 'react';
import {
	Modal,
	ModalHeader,
	ModalTitle,
	ModalBody,
	ModalFooter,
	Button,
	Badge,
	Card,
	CardBody,
	CardHeader,
	CardTitle,
	CardFooter,
	FormGroup,
	Input,
	Textarea,
} from '../../../../../components/bootstrap';
import { IPurchaseOrderModal } from '../../../../../common/interface/purchaseOrder';
import { IPurchaseBillModal, IPurchaseBillItem } from '../../../../../common/interface/purchaseBill';
import { purchaseBillModel } from '../../../../../common/model/purchaseBill';
import {
	createPurchaseBill,
	getPurchaseBillsByPoId,
	updatePurchaseBill,
} from '../../../../../common/api/purchaseBill';
import { updatePurchaseOrder } from '../../../../../common/api/purchaseOrder';
import { uploadFileToStorage } from '../../../../../common/api/fileUpload';
import { generateUid, priceFormat, showAlert } from '../../../../../helpers/helpers';
import { PURCHASE_ORDER_STATUS, QUERY_KEY, VAT_MODE_TYPE } from '../../../../../common/constant';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllProduct } from '../../../../../common/api/product';
import SimpleReactValidator from 'simple-react-validator';
import moment from 'moment';

type Props = {
	isOpen: boolean;
	toggle: () => void;
	purchaseOrder: IPurchaseOrderModal | null;
};

const round2 = (v: number) => Number(v.toFixed(2));

const ConvertToBillModal: React.FC<Props> = ({ isOpen, toggle, purchaseOrder }) => {
	const queryClient = useQueryClient();
	const validator = useRef(new SimpleReactValidator({ className: 'text-danger' }));
	const initialized = useRef(false);

	// ── Create invoice state ──────────────────────────────────────────────────
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
	const [formData, setFormData] = useState<IPurchaseBillModal>({ ...purchaseBillModel });
	const [receivedQtyOverrides, setReceivedQtyOverrides] = useState<Record<number, number>>({});

	// ── Existing invoices UI state ────────────────────────────────────────────
	const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

	// ── Edit invoice state ────────────────────────────────────────────────────
	const [editingBill, setEditingBill] = useState<any | null>(null);
	const [editForm, setEditForm] = useState({ invoiceNumber: '', invoiceDate: '', notes: '' });
	const [editItems, setEditItems] = useState<IPurchaseBillItem[]>([]);
	const [editSubTotal, setEditSubTotal] = useState(0);
	const [editVatTotal, setEditVatTotal] = useState(0);
	const [editTotalPrice, setEditTotalPrice] = useState(0);
	const [editFile, setEditFile] = useState<File | null>(null);
	const [isSavingEdit, setIsSavingEdit] = useState(false);
	const [editIsSubmitted, setEditIsSubmitted] = useState(false);

	// ── Queries ───────────────────────────────────────────────────────────────
	const { data: productList = [] } = useQuery({
		queryKey: [QUERY_KEY.PRODUCT_LIST],
		queryFn: () => getAllProduct(),
		staleTime: 5 * 60 * 1000,
	});

	const { data: existingBills = [], isLoading: billsLoading } = useQuery({
		queryKey: [QUERY_KEY.PURCHASE_BILL, 'byPo', purchaseOrder?.id],
		queryFn: () => getPurchaseBillsByPoId(purchaseOrder!.id!),
		enabled: isOpen && !!purchaseOrder?.id,
		staleTime: 0,
	});

	const productMap = new Map(productList.map((p: any) => [p.id, p]));

	// Map: poItemId → total qty already billed across all existing bills
	const billedQtyMap = new Map<string, number>();
	for (const bill of existingBills as any[]) {
		for (const item of bill.items || []) {
			const prev = billedQtyMap.get(item.poItemId) || 0;
			billedQtyMap.set(item.poItemId, prev + (item.qty || 0));
		}
	}

	// Effective received qty:
	//   GRN path → grnQty
	//   No-GRN   → billedSoFar + newDeliveryQty (user input for this invoice)
	const getEffectiveReceivedQty = (poItem: any, idx: number): number => {
		const grnQty = (poItem as any).receivedQty ?? 0;
		if (grnQty > 0) return grnQty;
		const billed = billedQtyMap.get((poItem as any).id || '') || 0;
		return billed + (receivedQtyOverrides[idx] || 0);
	};

	// ── Init guard: only seed state once per modal open ───────────────────────
	useEffect(() => {
		if (!isOpen) initialized.current = false;
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen || !purchaseOrder || billsLoading) return;
		if (initialized.current) return;
		initialized.current = true;

		setIsSubmitted(false);
		setInvoiceFile(null);
		setEditingBill(null);
		validator.current.hideMessages();
		setReceivedQtyOverrides({});

		const isExcluded = purchaseOrder.vatMode === VAT_MODE_TYPE.EXCLUDE;

		const billItems: IPurchaseBillItem[] = (purchaseOrder.items || []).map((item, idx) => {
			const receivedQty = getEffectiveReceivedQty(item, idx);
			const billedQty = billedQtyMap.get(item.id || '') || 0;
			const qty = Math.max(0, receivedQty - billedQty);
			const unitPrice = item.unitPrice ?? 0;
			const vatRate = item.vatRate ?? 0;

			let vatAmount = 0;
			let totalAmount = 0;
			if (isExcluded) {
				vatAmount = round2((unitPrice * qty * vatRate) / 100);
				totalAmount = round2(unitPrice * qty + vatAmount);
			} else {
				vatAmount = round2((unitPrice * qty * vatRate) / (100 + vatRate));
				totalAmount = round2(unitPrice * qty);
			}

			return {
				id: generateUid(),
				productId: item.productId,
				poItemId: item.id || '',
				description: item.description,
				qty,
				unitPrice,
				vatId: item.vatId,
				vatRate,
				vatAmount,
				totalAmount,
			};
		});

		const subTotal = round2(billItems.reduce((s, i) => s + (i.totalAmount - i.vatAmount), 0));
		const vatTotal = round2(billItems.reduce((s, i) => s + i.vatAmount, 0));

		setFormData({
			...purchaseBillModel,
			poId: purchaseOrder.id || '',
			poCode: purchaseOrder.code,
			vendorId: purchaseOrder.vendorId,
			vatMode: purchaseOrder.vatMode,
			invoiceDate: moment().format('YYYY-MM-DD'),
			items: billItems,
			subTotal,
			vatTotal,
			totalPrice: round2(subTotal + vatTotal),
		});
	}, [isOpen, purchaseOrder, billsLoading, existingBills]);

	// ── Handlers: create invoice ──────────────────────────────────────────────
	const handleReceivedQtyOverrideChange = (itemIndex: number, value: string) => {
		const poItem = purchaseOrder?.items[itemIndex];
		const orderedQty = Number(poItem?.qty ?? 0);
		const alreadyBilled = billedQtyMap.get(poItem?.id || '') || 0;
		const maxNew = Math.max(0, orderedQty - alreadyBilled);
		const parsed = parseFloat(value);
		const newDeliveryQty = isNaN(parsed) ? 0 : Math.min(Math.max(0, parsed), maxNew);
		setReceivedQtyOverrides((prev) => ({ ...prev, [itemIndex]: newDeliveryQty }));
		handleQtyChange(itemIndex, String(newDeliveryQty), alreadyBilled + newDeliveryQty);
	};

	const handleQtyChange = (itemIndex: number, value: string, effectiveReceivedQtyOverride?: number) => {
		const poItem = purchaseOrder?.items[itemIndex];
		const receivedQty =
			effectiveReceivedQtyOverride !== undefined
				? effectiveReceivedQtyOverride
				: getEffectiveReceivedQty(poItem, itemIndex);
		const billedQty = billedQtyMap.get(poItem?.id || '') || 0;
		const maxQty = Math.max(0, receivedQty - billedQty);
		let qty = parseFloat(value) || 0;
		if (qty > maxQty) qty = maxQty;
		if (qty < 0) qty = 0;

		const isExcluded = formData.vatMode === VAT_MODE_TYPE.EXCLUDE;
		const unitPrice = formData.items[itemIndex].unitPrice;
		const vatRate = formData.items[itemIndex].vatRate;
		let vatAmount = 0;
		let totalAmount = 0;
		if (isExcluded) {
			vatAmount = round2((unitPrice * qty * vatRate) / 100);
			totalAmount = round2(unitPrice * qty + vatAmount);
		} else {
			vatAmount = round2((unitPrice * qty * vatRate) / (100 + vatRate));
			totalAmount = round2(unitPrice * qty);
		}

		const updatedItems = formData.items.map((item, idx) =>
			idx === itemIndex ? { ...item, qty, vatAmount, totalAmount } : item,
		);
		const subTotal = round2(updatedItems.reduce((s, i) => s + (i.totalAmount - i.vatAmount), 0));
		const vatTotal = round2(updatedItems.reduce((s, i) => s + i.vatAmount, 0));
		setFormData((prev) => ({
			...prev,
			items: updatedItems,
			subTotal,
			vatTotal,
			totalPrice: round2(subTotal + vatTotal),
		}));
	};

	const handleSubmit = async () => {
		setIsSubmitted(true);
		if (!validator.current.allValid()) {
			validator.current.showMessages();
			return;
		}
		if (!formData.items.some((i) => i.qty > 0)) {
			showAlert({
				title: 'No Quantity',
				text: 'Please enter at least one item quantity greater than 0.',
				icon: 'warning',
				confirmButtonText: 'OK',
			});
			return;
		}
		try {
			setIsLoading(true);
			let fileUrl = '';
			if (invoiceFile) {
				fileUrl = await uploadFileToStorage(invoiceFile, `purchaseBill/${purchaseOrder?.id}`);
			}
			const billItems = formData.items.filter((i) => i.qty > 0);
			const subTotal = round2(billItems.reduce((s, i) => s + (i.totalAmount - i.vatAmount), 0));
			const vatTotal = round2(billItems.reduce((s, i) => s + i.vatAmount, 0));

			await createPurchaseBill({
				...formData,
				fileUrl,
				items: billItems,
				subTotal,
				vatTotal,
				totalPrice: round2(subTotal + vatTotal),
			});

			const mergedBilledQty = new Map<string, number>(billedQtyMap);
			for (const item of billItems) {
				mergedBilledQty.set(item.poItemId, (mergedBilledQty.get(item.poItemId) || 0) + item.qty);
			}

			const allBilled = (purchaseOrder!.items || []).every((poItem) => {
				const orderedQty = Number(poItem.qty ?? 0);
				if (orderedQty === 0) return true;
				return (mergedBilledQty.get(poItem.id || '') || 0) >= orderedQty;
			});

			if (allBilled && purchaseOrder!.status === PURCHASE_ORDER_STATUS.PARTIAL) {
				await updatePurchaseOrder(purchaseOrder!.id!, { status: PURCHASE_ORDER_STATUS.COMPLETED });
				queryClient.invalidateQueries({ queryKey: [QUERY_KEY.PURCHASE_ORDER] });
			}

			queryClient.invalidateQueries({ queryKey: [QUERY_KEY.PURCHASE_BILL] });
			toggle();
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	// ── Handlers: edit invoice ────────────────────────────────────────────────
	const handleStartEdit = (bill: any) => {
		setEditingBill(bill);
		setEditForm({
			invoiceNumber: bill.invoiceNumber || '',
			invoiceDate: bill.invoiceDate || '',
			notes: bill.notes || '',
		});
		const items: IPurchaseBillItem[] = bill.items || [];
		setEditItems(items);
		setEditSubTotal(bill.subTotal || 0);
		setEditVatTotal(bill.vatTotal || 0);
		setEditTotalPrice(bill.totalPrice || 0);
		setEditIsSubmitted(false);
		setEditFile(null);
		setExpandedBillId(null);
	};

	const handleCancelEdit = () => {
		setEditingBill(null);
		setEditFile(null);
		setEditIsSubmitted(false);
	};

	// Max qty for an item while editing: ordered qty minus what OTHER bills (not this one) have billed
	const getEditItemMaxQty = (poItemId: string, originalQty: number): number => {
		const totalBilled = billedQtyMap.get(poItemId) || 0;
		const otherBilled = totalBilled - originalQty;
		const poItem = (purchaseOrder?.items || []).find((pi: any) => pi.id === poItemId);
		const orderedQty = Number(poItem?.qty ?? 0);
		return Math.max(0, orderedQty - otherBilled);
	};

	const handleEditItemQtyChange = (itemIndex: number, value: string) => {
		const item = editItems[itemIndex];
		const originalQty = editingBill.items?.[itemIndex]?.qty ?? 0;
		const maxQty = getEditItemMaxQty(item.poItemId, originalQty);
		let qty = parseFloat(value) || 0;
		qty = Math.min(Math.max(0, qty), maxQty);

		const isExcluded = editingBill.vatMode === VAT_MODE_TYPE.EXCLUDE;
		const { unitPrice, vatRate } = item;
		let vatAmount = 0;
		let totalAmount = 0;
		if (isExcluded) {
			vatAmount = round2((unitPrice * qty * vatRate) / 100);
			totalAmount = round2(unitPrice * qty + vatAmount);
		} else {
			vatAmount = round2((unitPrice * qty * vatRate) / (100 + vatRate));
			totalAmount = round2(unitPrice * qty);
		}

		const updatedItems = editItems.map((it, idx) =>
			idx === itemIndex ? { ...it, qty, vatAmount, totalAmount } : it,
		);
		const sub = round2(updatedItems.reduce((s, i) => s + (i.totalAmount - i.vatAmount), 0));
		const vat = round2(updatedItems.reduce((s, i) => s + i.vatAmount, 0));
		setEditItems(updatedItems);
		setEditSubTotal(sub);
		setEditVatTotal(vat);
		setEditTotalPrice(round2(sub + vat));
	};

	const handleSaveEdit = async () => {
		setEditIsSubmitted(true);
		const errors: string[] = [];
		if (!editForm.invoiceNumber.trim()) errors.push('Invoice Number is required.');
		if (!editForm.invoiceDate) errors.push('Invoice Date is required.');
		if (!editItems.some((i) => i.qty > 0)) errors.push('At least one item must have a quantity greater than 0.');
		if (errors.length) {
			showAlert({
				title: 'Validation Error',
				text: errors.join('\n'),
				icon: 'warning',
				confirmButtonText: 'OK',
			});
			return;
		}
		try {
			setIsSavingEdit(true);
			let fileUrl = editingBill.fileUrl || '';
			if (editFile) {
				fileUrl = await uploadFileToStorage(editFile, `purchaseBill/${purchaseOrder?.id}`);
			}
			await updatePurchaseBill(editingBill.id, {
				invoiceNumber: editForm.invoiceNumber.trim(),
				invoiceDate: editForm.invoiceDate,
				notes: editForm.notes,
				fileUrl,
				items: editItems,
				subTotal: editSubTotal,
				vatTotal: editVatTotal,
				totalPrice: editTotalPrice,
			});
			queryClient.invalidateQueries({ queryKey: [QUERY_KEY.PURCHASE_BILL] });
			initialized.current = false;
			setEditingBill(null);
			setEditFile(null);
			setEditIsSubmitted(false);
		} catch (error) {
			console.error(error);
		} finally {
			setIsSavingEdit(false);
		}
	};

	if (!purchaseOrder) return null;

	const isFullyBilled =
		!billsLoading &&
		(purchaseOrder.items || []).every((item) => {
			const orderedQty = Number(item.qty ?? 0);
			return orderedQty === 0 || (billedQtyMap.get(item.id || '') || 0) >= orderedQty;
		});

	return (
		<Modal
			setIsOpen={toggle}
			isOpen={isOpen}
			fullScreen
			titleId='convert-to-bill-modal'
			isStaticBackdrop>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle id='convert-to-bill-modal'>
					{editingBill ? (
						<>
							Edit Invoice —{' '}
							<Badge color='secondary' isLight className='fs-6'>
								{editingBill.code}
							</Badge>
						</>
					) : (
						<>
							Purchase Invoices — PO #{purchaseOrder.code}
							{(existingBills as any[]).length > 0 && (
								<Badge color='info' isLight className='ms-2 fs-6'>
									{(existingBills as any[]).length} invoice
									{(existingBills as any[]).length !== 1 ? 's' : ''}
								</Badge>
							)}
						</>
					)}
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				{/* ── Fully billed banner ── */}
				{isFullyBilled && !editingBill && (
					<div className='alert alert-success d-flex align-items-center gap-2 mb-3'>
						<span className='fw-bold fs-5'>✓</span>
						<span>
							This PO is fully billed across{' '}
							<strong>
								{(existingBills as any[]).length} invoice
								{(existingBills as any[]).length !== 1 ? 's' : ''}
							</strong>
							.
						</span>
					</div>
				)}

				{/* ── Existing Invoices table ── */}
				{(existingBills as any[]).length > 0 && (
					<Card shadow='sm' className='mb-3'>
						<CardHeader>
							<CardTitle tag='h5'>
								Existing Invoices
								<Badge color='info' className='ms-2'>
									{(existingBills as any[]).length}
								</Badge>
							</CardTitle>
						</CardHeader>
						<CardBody className='p-0'>
							<div className='table-responsive'>
								<table className='table table-modern table-hover mb-0'>
									<thead>
										<tr>
											<th style={{ width: 36 }} />
											<th>Bill Code</th>
											<th>Vendor Invoice #</th>
											<th>Date</th>
											<th className='text-center'>Items</th>
											<th className='text-end'>Sub Total</th>
											<th className='text-end'>VAT</th>
											<th className='text-end'>Grand Total</th>
											<th className='text-center'>File</th>
											<th className='text-center'>Actions</th>
										</tr>
									</thead>
									<tbody>
										{(existingBills as any[]).map((bill) => {
											const isExpanded = expandedBillId === bill.id;
											return (
												<React.Fragment key={bill.id}>
													<tr
														style={{ cursor: 'pointer' }}
														onClick={() =>
															setExpandedBillId(isExpanded ? null : bill.id)
														}>
														<td className='text-center text-muted fw-bold'>
															{isExpanded ? '▲' : '▼'}
														</td>
														<td>
															<Badge color='secondary' isLight>
																{bill.code}
															</Badge>
														</td>
														<td className='fw-semibold'>
															{bill.invoiceNumber || '—'}
														</td>
														<td className='text-muted'>{bill.invoiceDate || '—'}</td>
														<td className='text-center'>
															<Badge color='info' isLight>
																{(bill.items || []).length}
															</Badge>
														</td>
														<td className='text-end'>{priceFormat(bill.subTotal || 0)}</td>
														<td className='text-end text-muted'>
															{priceFormat(bill.vatTotal || 0)}
														</td>
														<td className='text-end fw-bold'>
															{priceFormat(bill.totalPrice || 0)}
														</td>
														<td className='text-center'>
															{bill.fileUrl ? (
																<Button
																	color='info'
																	isLight
																	size='sm'
																	icon='Visibility'
																	onClick={(e: any) => {
																		e.stopPropagation();
																		window.open(bill.fileUrl, '_blank');
																	}}>
																	View
																</Button>
															) : (
																<span className='text-muted'>—</span>
															)}
														</td>
														<td className='text-center'>
															<Button
																color='info'
																isLight
																size='sm'
																icon='Edit'
																onClick={(e: any) => {
																	e.stopPropagation();
																	handleStartEdit(bill);
																}}>
																Edit
															</Button>
														</td>
													</tr>
													{isExpanded && (
														<tr>
															<td colSpan={10} className='p-0'>
																<div className=' border-top px-4 py-3'>
																	<table className='table table-sm table-modern mb-0'>
																		<thead>
																			<tr>
																				<th>#</th>
																				<th>Product</th>
																				<th className='text-center'>Qty</th>
																				<th className='text-end'>Unit Price</th>
																				<th className='text-end'>VAT %</th>
																				<th className='text-end'>VAT Amt</th>
																				<th className='text-end'>Total</th>
																			</tr>
																		</thead>
																		<tbody>
																			{(bill.items || []).map(
																				(item: any, i: number) => (
																					<tr key={item.id || i}>
																						<td className='text-muted'>{i + 1}</td>
																						<td className='fw-semibold'>
																							{productMap.get(item.productId)
																								?.name ||
																								item.description ||
																								'—'}
																						</td>
																						<td className='text-center fw-bold text-info'>
																							{item.qty}
																						</td>
																						<td className='text-end'>
																							{priceFormat(item.unitPrice)}
																						</td>
																						<td className='text-end text-muted'>
																							{item.vatRate}%
																						</td>
																						<td className='text-end text-muted'>
																							{priceFormat(item.vatAmount)}
																						</td>
																						<td className='text-end fw-semibold'>
																							{priceFormat(item.totalAmount)}
																						</td>
																					</tr>
																				),
																			)}
																		</tbody>
																	</table>
																	{bill.notes && (
																		<p className='text-muted small mt-2 mb-0'>
																			<strong>Notes:</strong> {bill.notes}
																		</p>
																	)}
																</div>
															</td>
														</tr>
													)}
												</React.Fragment>
											);
										})}
									</tbody>
								</table>
							</div>
						</CardBody>
					</Card>
				)}

				{/* ── Edit invoice form ── */}
				{editingBill && (
					<>
						<Card shadow='sm' className='mb-3 border border-warning'>
							<CardHeader>
								<CardTitle tag='h5'>
									Edit Invoice Details —{' '}
									<Badge color='secondary' isLight>
										{editingBill.code}
									</Badge>
								</CardTitle>
							</CardHeader>
							<CardBody>
								<div className='row g-3'>
									<div className='col-md-4'>
										<FormGroup id='editInvoiceNumber' label='Invoice Number *'>
											<Input
												id='editInvoiceNumber'
												placeholder='Enter vendor invoice number'
												value={editForm.invoiceNumber}
												isValid={editIsSubmitted ? !!editForm.invoiceNumber.trim() : undefined}
												isTouched={editIsSubmitted}
												invalidFeedback='Invoice Number is required.'
												onChange={(e: any) =>
													setEditForm((p) => ({
														...p,
														invoiceNumber: e.target.value,
													}))
												}
											/>
										</FormGroup>
									</div>
									<div className='col-md-4'>
										<FormGroup id='editInvoiceDate' label='Invoice Date *'>
											<Input
												id='editInvoiceDate'
												type='date'
												value={editForm.invoiceDate}
												isValid={editIsSubmitted ? !!editForm.invoiceDate : undefined}
												isTouched={editIsSubmitted}
												invalidFeedback='Invoice Date is required.'
												onChange={(e: any) =>
													setEditForm((p) => ({
														...p,
														invoiceDate: e.target.value,
													}))
												}
											/>
										</FormGroup>
									</div>
									<div className='col-md-4'>
										<FormGroup
											id='editInvoiceFile'
											label={
												editingBill.fileUrl
													? 'Replace Invoice File (optional)'
													: 'Upload Invoice File (optional)'
											}>
											<Input
												id='editInvoiceFile'
												type='file'
												accept='.pdf,.jpg,.jpeg,.png'
												onChange={(e: any) =>
													setEditFile(e.target.files?.[0] || null)
												}
											/>
										</FormGroup>
										{editingBill.fileUrl && !editFile && (
											<a
												href={editingBill.fileUrl}
												target='_blank'
												rel='noreferrer'
												className='small text-info d-block mt-1'>
												View existing file
											</a>
										)}
										{editFile && (
											<small className='text-muted d-block mt-1'>
												{editFile.name}
											</small>
										)}
									</div>
									<div className='col-12'>
										<FormGroup id='editNotes' label='Notes (optional)'>
											<Textarea
												id='editNotes'
												placeholder='Add any notes...'
												value={editForm.notes}
												onChange={(e: any) =>
													setEditForm((p) => ({ ...p, notes: e.target.value }))
												}
											/>
										</FormGroup>
									</div>
								</div>
							</CardBody>
						</Card>

						{/* ── Edit items table ── */}
						<Card shadow='sm' className='mb-3'>
							<CardHeader>
								<CardTitle tag='h5'>
									Items — Billing Tracker
									<small className='text-muted ms-2 fw-normal fs-6'>
										Qty cannot exceed the amount available for this invoice
									</small>
								</CardTitle>
							</CardHeader>
							<CardBody className='p-0'>
								<div className='table-responsive'>
									<table className='table table-modern align-middle mb-0'>
										<thead>
											<tr>
												<th>#</th>
												<th>Product</th>
												<th className='text-center'>Ordered</th>
												<th className='text-center'>Max Qty</th>
												<th className='text-center' style={{ minWidth: 110 }}>
													Bill Qty *
												</th>
												<th className='text-end'>Unit Price</th>
												<th className='text-end'>VAT</th>
												<th className='text-end'>Total</th>
											</tr>
										</thead>
										<tbody>
											{editItems.map((item, idx) => {
												const originalQty = editingBill.items?.[idx]?.qty ?? 0;
												const maxQty = getEditItemMaxQty(item.poItemId, originalQty);
												const poItem = (purchaseOrder?.items || []).find(
													(pi: any) => pi.id === item.poItemId,
												);
												const orderedQty = Number(poItem?.qty ?? 0);
												const productName =
													productMap.get(item.productId)?.name ||
													item.description ||
													'—';
												const isInvalid = editIsSubmitted && item.qty <= 0 && editItems.every((i) => i.qty <= 0);
												return (
													<tr key={item.id || idx}>
														<td className='text-muted'>{idx + 1}</td>
														<td>
															<div className='fw-semibold'>{productName}</div>
															{item.description && item.description !== productName && (
																<small className='text-muted'>{item.description}</small>
															)}
														</td>
														<td className='text-center fw-semibold'>{orderedQty}</td>
														<td className='text-center'>
															<Badge color={maxQty > 0 ? 'danger' : 'secondary'} isLight>
																{maxQty}
															</Badge>
														</td>
														<td className='text-center'>
															<Input
																type='number'
																min={0}
																max={maxQty}
																value={item.qty}
																disabled={maxQty === 0}
																isValid={isInvalid ? false : undefined}
																isTouched={editIsSubmitted}
																onChange={(e: any) =>
																	handleEditItemQtyChange(idx, e.target.value)
																}
															/>
														</td>
														<td className='text-end'>{priceFormat(item.unitPrice)}</td>
														<td className='text-end text-muted'>{item.vatRate}%</td>
														<td className='text-end fw-semibold'>
															{priceFormat(item.totalAmount)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</CardBody>
							<CardFooter className='d-flex justify-content-end'>
								<table
									className='table table-borderless mb-0'
									style={{ maxWidth: 300 }}>
									<tbody>
										<tr>
											<td className='text-muted py-1'>Sub Total</td>
											<td className='text-end py-1 fw-semibold'>
												{priceFormat(editSubTotal)}
											</td>
										</tr>
										<tr>
											<td className='text-muted py-1'>VAT Total</td>
											<td className='text-end py-1 fw-semibold'>
												{priceFormat(editVatTotal)}
											</td>
										</tr>
										<tr className='border-top'>
											<td className='fw-bold fs-5 py-2'>Grand Total</td>
											<td className='text-end fw-bold fs-5 py-2 text-success'>
												{priceFormat(editTotalPrice)}
											</td>
										</tr>
									</tbody>
								</table>
							</CardFooter>
						</Card>
					</>
				)}

				{/* ── Create invoice form (hidden while editing) ── */}
				{!editingBill && (
					<>
						<Card shadow='sm' className='mb-3'>
							<CardHeader>
								<CardTitle tag='h5'>New Invoice Details</CardTitle>
							</CardHeader>
							<CardBody>
								<div className='row g-3'>
									<div className='col-md-4'>
										<FormGroup id='invoiceNumber' label='Invoice Number *'>
											<Input
												id='invoiceNumber'
												placeholder='Enter vendor invoice number'
												value={formData.invoiceNumber}
												onChange={(e: any) =>
													setFormData((p) => ({
														...p,
														invoiceNumber: e.target.value,
													}))
												}
												isValid={validator.current.fieldValid('Invoice Number')}
												isTouched={isSubmitted}
												invalidFeedback={validator.current.message(
													'Invoice Number',
													formData.invoiceNumber,
													'required',
												)}
												disabled={isFullyBilled}
											/>
										</FormGroup>
									</div>
									<div className='col-md-4'>
										<FormGroup id='invoiceDate' label='Invoice Date *'>
											<Input
												id='invoiceDate'
												type='date'
												value={formData.invoiceDate}
												onChange={(e: any) =>
													setFormData((p) => ({
														...p,
														invoiceDate: e.target.value,
													}))
												}
												isValid={validator.current.fieldValid('Invoice Date')}
												isTouched={isSubmitted}
												invalidFeedback={validator.current.message(
													'Invoice Date',
													formData.invoiceDate,
													'required',
												)}
												disabled={isFullyBilled}
											/>
										</FormGroup>
									</div>
									<div className='col-md-4'>
										<FormGroup
											id='invoiceFile'
											label='Upload Invoice File (optional)'>
											<Input
												id='invoiceFile'
												type='file'
												accept='.pdf,.jpg,.jpeg,.png'
												onChange={(e: any) =>
													setInvoiceFile(e.target.files?.[0] || null)
												}
												disabled={isFullyBilled}
											/>
										</FormGroup>
										{invoiceFile && (
											<small className='text-muted d-block mt-1'>
												{invoiceFile.name}
											</small>
										)}
									</div>
									<div className='col-12'>
										<FormGroup id='notes' label='Notes (optional)'>
											<Textarea
												id='notes'
												placeholder='Add any notes...'
												value={formData.notes}
												onChange={(e: any) =>
													setFormData((p) => ({
														...p,
														notes: e.target.value,
													}))
												}
												disabled={isFullyBilled}
											/>
										</FormGroup>
									</div>
								</div>
							</CardBody>
						</Card>

						{/* Billing Tracker */}
						<Card shadow='sm'>
							<CardHeader>
								<CardTitle tag='h5'>
									Items — Billing Tracker
									{!isFullyBilled && (
										<small className='text-muted ms-2 fw-normal fs-6'>
											Bill Qty cannot exceed Remaining qty
										</small>
									)}
								</CardTitle>
							</CardHeader>
							<CardBody className='p-0'>
								<div className='table-responsive'>
									<table className='table table-modern align-middle mb-0'>
										<thead>
											<tr>
												<th>#</th>
												<th>Product</th>
												<th className='text-center'>Ordered</th>
												<th className='text-center'>Received</th>
												<th className='text-center'>Billed</th>
												<th className='text-center'>Remaining</th>
												<th className='text-center' style={{ minWidth: 110 }}>
													Bill Qty
												</th>
												<th className='text-end'>Unit Price</th>
												<th className='text-end'>VAT</th>
												<th className='text-end'>Total</th>
											</tr>
										</thead>
										<tbody>
											{formData.items.map((billItem, idx) => {
												const poItem = purchaseOrder.items[idx];
												const grnReceivedQty =
													(poItem as any)?.receivedQty ?? 0;
												const hasGrn = grnReceivedQty > 0;
												const billedQtyForItem =
													billedQtyMap.get(poItem?.id || '') || 0;
												const orderedQty = Number(poItem?.qty ?? 0);
												const receivedQty = getEffectiveReceivedQty(
													poItem,
													idx,
												);
												const remainingQty = Math.max(
													0,
													receivedQty - billedQtyForItem,
												);
												const productName =
													productMap.get(billItem.productId)?.name ||
													billItem.description ||
													'—';
												const isItemFullyBilled =
													billedQtyForItem >= orderedQty;
												const needsMoreReceived =
													!isItemFullyBilled &&
													!hasGrn &&
													remainingQty === 0;

												return (
													<tr
														key={billItem.id}
														className={
															isItemFullyBilled
																? 'bg-l25-success'
																: ''
														}>
														<td className='text-muted'>{idx + 1}</td>
														<td>
															<div className='fw-semibold'>
																{productName}
															</div>
															{billItem.description &&
																billItem.description !==
																	productName && (
																	<small className='text-muted'>
																		{billItem.description}
																	</small>
																)}
														</td>
														<td className='text-center fw-semibold'>
															{orderedQty}
														</td>
														<td
															className='text-center'
															style={{ minWidth: 120 }}>
															{hasGrn ? (
																<span className='fw-bold text-success'>
																	{grnReceivedQty}
																</span>
															) : (
																<>
																	{billedQtyForItem > 0 && (
																		<div className='text-info small mb-1'>
																			Prev: {billedQtyForItem} +
																		</div>
																	)}
																	<Input
																		type='number'
																		min={0}
																		max={Math.max(
																			0,
																			orderedQty - billedQtyForItem,
																		)}
																		value={
																			receivedQtyOverrides[idx] ??
																			0
																		}
																		placeholder='0'
																		onChange={(e: any) =>
																			handleReceivedQtyOverrideChange(
																				idx,
																				e.target.value,
																			)
																		}
																	/>
																	<small
																		className='d-block mt-1 text-warning'
																		style={{ fontSize: '0.7rem' }}>
																		New delivery qty
																	</small>
																</>
															)}
														</td>
														<td className='text-center'>
															{billedQtyForItem > 0 ? (
																<Badge color='info' isLight>
																	{billedQtyForItem}
																</Badge>
															) : (
																<span className='text-muted'>—</span>
															)}
														</td>
														<td className='text-center'>
															{isItemFullyBilled ? (
																<Badge color='success'>Done</Badge>
															) : needsMoreReceived ? (
																<span className='text-muted'>—</span>
															) : (
																<span
																	className={`fw-bold ${
																		remainingQty > 0
																			? 'text-warning'
																			: 'text-muted'
																	}`}>
																	{remainingQty}
																</span>
															)}
														</td>
														<td className='text-center'>
															<Input
																type='number'
																min={0}
																max={remainingQty}
																value={billItem.qty}
																onChange={(e: any) =>
																	handleQtyChange(
																		idx,
																		e.target.value,
																	)
																}
																disabled={remainingQty === 0}
															/>
														</td>
														<td className='text-end'>
															{priceFormat(billItem.unitPrice)}
														</td>
														<td className='text-end text-muted'>
															{billItem.vatRate}%
														</td>
														<td className='text-end fw-semibold'>
															{priceFormat(billItem.totalAmount)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</CardBody>
							<CardFooter className='d-flex justify-content-end'>
								<table
									className='table table-borderless mb-0'
									style={{ maxWidth: 300 }}>
									<tbody>
										<tr>
											<td className='text-muted py-1'>Sub Total</td>
											<td className='text-end py-1 fw-semibold'>
												{priceFormat(formData.subTotal)}
											</td>
										</tr>
										<tr>
											<td className='text-muted py-1'>VAT Total</td>
											<td className='text-end py-1 fw-semibold'>
												{priceFormat(formData.vatTotal)}
											</td>
										</tr>
										<tr className='border-top'>
											<td className='fw-bold fs-5 py-2'>Grand Total</td>
											<td className='text-end fw-bold fs-5 py-2 text-success'>
												{priceFormat(formData.totalPrice)}
											</td>
										</tr>
									</tbody>
								</table>
							</CardFooter>
						</Card>
					</>
				)}
			</ModalBody>

			<ModalFooter>
				{editingBill ? (
					<>
						<Button
							color='light'
							icon='ArrowBack'
							isLight
							onClick={handleCancelEdit}
							isDisable={isSavingEdit}>
							Cancel
						</Button>
						<Button
							color='info'
							icon='Save'
							isLight
							onClick={handleSaveEdit}
							isDisable={isSavingEdit}>
							{isSavingEdit ? 'Saving...' : 'Save Changes'}
						</Button>
					</>
				) : (
					<>
						<Button color='light' icon='Close' onClick={toggle} isDisable={isLoading}>
							Close
						</Button>
						{!isFullyBilled && (
							<Button
								color='success'
								icon='ReceiptLong'
								isLight
								onClick={handleSubmit}
								isDisable={isLoading || billsLoading}>
								{isLoading ? 'Saving...' : 'Create Invoice'}
							</Button>
						)}
					</>
				)}
			</ModalFooter>
		</Modal>
	);
};

export default ConvertToBillModal;
