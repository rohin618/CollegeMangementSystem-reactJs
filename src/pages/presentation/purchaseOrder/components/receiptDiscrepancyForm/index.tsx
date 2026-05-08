import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Modal,
	ModalHeader,
	ModalTitle,
	ModalBody,
	Button,
	Card,
	CardHeader,
	CardBody,
	CardTitle,
	Input,
	FormGroup,
	Textarea,
	CardFooter,
} from '../../../../../components/bootstrap';

import { IPurchaseOrderModal } from '../../../../../common/interface/purchaseOrder';
import {
	generateUid,
	getFirstLetter,
	getLabelByValue,
	getVatAmount,
	getVatAmountExcluded,
	priceFormat,
	showAlert,
} from '../../../../../helpers/helpers';
import { PURCHASE_ORDER_STATUS, QUERY_KEY, VAT_MODE_TYPE } from '../../../../../common/constant';
import { getAllVendors } from '../../../../../common/api/vendor';
import { useQuery } from '@tanstack/react-query';
import { DateTimePicker, SearchableSelect } from '../../../../../components/common';
import SimpleReactValidator from 'simple-react-validator';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { getAllProduct } from '../../../../../common/api/product';
import { IDebitNoteModal } from '../../../../../common/interface/debitNote';
import { getAllPurchaseOrders } from '../../../../../common/api/purchaseOrder';
import {
	DEBIT_NOTE_SETTLEMENT_TYPE_LIST,
	VAT_MODE_OPTIONS,
} from '../../../../../common/data/option';
import { debitNoteModel } from '../../../../../common/model/debitNote';
import { createDebitNote, getAllDebitNotes } from '../../../../../common/api/debitNote';
import { useMapById } from '../../../../../hooks/useMapById';
import { useUpdateQueryListById } from '../../../../../hooks';

type ReceiptDiscrepancyFormType = {
	isOpen: boolean;
	toggle: () => void;
	purchaseOrderDetail?: IPurchaseOrderModal;
};
const round2 = (value: number) => Number(value.toFixed(2));
const ReceiptDiscrepancyForm: React.FC<ReceiptDiscrepancyFormType> = ({
	isOpen,
	toggle,
	purchaseOrderDetail,
}) => {
	const [formData, setFormData] = useState<IDebitNoteModal>(debitNoteModel);
	const [selectedPO, setSelectedPO] = useState<IPurchaseOrderModal | null>(null);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const validator = useRef(new SimpleReactValidator({ className: 'text-danger' }));
	const { darkModeStatus } = useDarkMode();

	useEffect(() => {
		if (isOpen) {
			setFormData({ ...debitNoteModel });
			setIsSubmitted(false);
		}
	}, [isOpen]);

	const { data: vendorList = [], isLoading: isVendorLoading } = useQuery({
		queryKey: [QUERY_KEY.VENDOR_LIST],
		queryFn: getAllVendors,
		staleTime: 5 * 60 * 1000,
	});

	const { data: productList = [], isLoading: isProductLoading } = useQuery({
		queryKey: [QUERY_KEY.PRODUCT_LIST],
		queryFn: () => getAllProduct(),
		staleTime: 5 * 60 * 1000,
	});
	const { data: purchaseOrderList = [], isLoading: isPurchaseOrderList } = useQuery({
		queryKey: [QUERY_KEY.PURCHASE_ORDER],
		queryFn: () => getAllPurchaseOrders(),
		staleTime: 5 * 60 * 1000,
	});

	const { data: debitNoteList = [] } = useQuery({
		queryKey: [QUERY_KEY.DEBIT_NOTE],
		queryFn: getAllDebitNotes, // make sure this exists
		staleTime: 5 * 60 * 1000,
	});
	const updateDebitNoteList = useUpdateQueryListById<any>([QUERY_KEY.DEBIT_NOTE]);

	const productMap = useMapById<any>(productList);

	// We need to calculate how many qty has been consumed from previous debits for each PO item, to prevent over-debiting
	const consumedQtyMap = useMemo(() => {
		const map: Record<string, number> = {};

		debitNoteList.forEach((debit: any) => {
			// filter only current PO
			if (debit.poId !== selectedPO?.id) return;

			debit.items?.forEach((item: any) => {
				if (!item.poItemId) return;

				map[item.poItemId] = (map[item.poItemId] || 0) + Number(item.qty || 0);
			});
		});

		return map;
	}, [debitNoteList, selectedPO]);

	// useEffect(() => {
	// 	if (!formData.poId) {
	// 		setSelectedPO(null);
	// 		return;
	// 	}

	// 	const po: IPurchaseOrderModal | any = purchaseOrderList.find(
	// 		(p: any) => p.id === formData.poId,
	// 	);
	// 	setSelectedPO(po || null);
	// }, [formData.poId, purchaseOrderList]);
	useEffect(() => {
		if (purchaseOrderDetail) {
			setSelectedPO(purchaseOrderDetail);

			setFormData((prev: any) => ({
				...prev,
				vendorId: purchaseOrderDetail.vendorId,
				poId: purchaseOrderDetail.id,
				vatMode: purchaseOrderDetail?.vatMode,
			}));
		}
	}, [purchaseOrderDetail]);

	// const purchaseOrderListWithMatchVendor = useMemo(() => {
	// 	if (!formData.vendorId) return [];
	// 	return purchaseOrderList.filter((po: any) => {
	// 		return (
	// 			po?.vendorId === formData?.vendorId &&
	// 			(po.status === PURCHASE_ORDER_STATUS.PARTIAL ||
	// 				po.status === PURCHASE_ORDER_STATUS.COMPLETED)
	// 		);
	// 	});
	// }, [formData.vendorId, purchaseOrderList]);

	useEffect(() => {
		let subTotal = 0;
		let vatTotal = 0;
		let totalPrice = 0;

		formData.items.forEach((item) => {
			const lineTotal = Number(item.totalAmount || 0);
			const vatAmount = Number(item.vatAmount || 0);

			totalPrice += lineTotal;
			vatTotal += vatAmount;
			subTotal += lineTotal - vatAmount;
		});

		subTotal = round2(subTotal);
		vatTotal = round2(vatTotal);
		totalPrice = round2(totalPrice);

		const debitAmount = round2(totalPrice);

		setFormData((prev: any) => ({
			...prev,
			subTotal,
			vatTotal,
			totalPrice,
			debitAmount,
		}));
	}, [formData.items]);

	const handleDeleteItem = (itemId: string) => {
		setFormData((prev) => ({
			...prev,
			items: prev.items.filter((item) => item.id !== itemId),
		}));
	};

	const handleChange = (e: any) => {
		const { name, value } = e.target || e;

		setFormData((prev: any) => {
			if (name === 'vendorId') {
				return {
					...prev,
					vendorId: value,
					poId: '',
					items: [],
				};
			}

			if (name === 'poId') {
				const po: any = purchaseOrderList.find((p: any) => p.id === value);

				return {
					...prev,
					poId: value,
					vatMode: po?.vatMode || '',
					items: [],
				};
			}

			return {
				...prev,
				[name]: value,
			};
		});
	};

	const handlePurchaseItemChange = useCallback(
		(itemId: string, field: string, value: any) => {
			setFormData((prev) => {
				return {
					...prev,
					items: prev.items.map((item) => {
						if (item.id !== itemId) return item;

						let updated = { ...item, [field]: value };
						if (field === 'productId' || field === 'poItemId') {
							return {
								...updated,
								description: '',
								qty: 0,
								unitPrice: 0,
								vatId: '',
								vatRate: 0,
								vatAmount: 0,
								totalAmount: 0,
								coaMapping: {
									accountId: '',
									accountName: '',
									type: '',
								},
							};
						}

						// 👉 ONLY recalc when needed
						if (field !== 'qty' && field !== 'unitPrice' && field !== 'vatRate') {
							return updated; // 🚀 IMPORTANT FIX
						}

						const vatMode = prev?.vatMode;
						const isInclude = +vatMode === VAT_MODE_TYPE.INCLUDE;

						if (field === 'qty') {
							const poItem = selectedPO?.items?.find((i) => i.id === item.poItemId);

							const poQty = poItem?.qty || 0;

							//  already used from previous debits
							const usedQty = consumedQtyMap[item.poItemId] || 0;

							//  ALSO include current form qty (exclude current row)
							const currentFormUsed = prev.items
								.filter((i) => i.poItemId === item.poItemId && i.id !== item.id)
								.reduce((sum, i) => sum + Number(i.qty || 0), 0);
							// handling the negative edge case
							const remainingQty = Math.max(0, poQty - usedQty - currentFormUsed);

							let qtyValue = Number(value);

							if (qtyValue < 0) qtyValue = 0;

							if (qtyValue > remainingQty) {
								showAlert({
									title: 'Invalid Quantity',
									html: `
		<div style="line-height:1.6; text-align:left;">
			<p style="margin:0 0 8px;">
				You have already created a debit of <b>${usedQty} qty</b> for this product.
			
				The total quantity in the Purchase Order for this product is <b>${poQty}</b>.
			</p>
			<hr style="margin:10px 0;"/>
			<p style="margin:0; text-align:center;">
				You can only create up to <b>${remainingQty}</b>.
			</p>
		</div>
	`,
									icon: 'warning',
									confirmButtonText: 'OK',
								});

								qtyValue = remainingQty;
							}

							updated.qty = qtyValue;
						}

						const qty = Number(updated.qty) || 0;
						const unitPrice = Number(updated.unitPrice) || 0;
						const vatRate = Number(updated.vatRate) || 0;

						let baseAmount = round2(qty * unitPrice);

						let vatAmount = isInclude
							? getVatAmount(baseAmount, vatRate)
							: getVatAmountExcluded(baseAmount, vatRate);

						vatAmount = round2(vatAmount);

						const totalAmount = isInclude ? baseAmount : round2(baseAmount + vatAmount);

						return {
							...updated,
							totalAmount,
							vatAmount,
						};
					}),
				};
			});
		},
		[selectedPO, formData.vatMode],
	);
	const handleFormSubmit = async () => {
		if (!validator.current.allValid()) {
			validator.current.showMessages();
			setIsSubmitted(true);
			return;
		}

		const invalidItem = formData.items.find((i) => i.qty <= 0);

		if (invalidItem) {
			const poItem: any = selectedPO?.items?.find((p: any) => p.id === invalidItem.poItemId);
			const productName = productMap[poItem?.productId]?.name || 'Unknown Product';
			showAlert({
				title: 'Invalid Quantity',
				html: `Quantity must be greater than 0 for:<br><b>${productName}</b>`,
				icon: 'warning',
				confirmButtonText: 'OK',
			});

			return;
		}
		setIsLoading(true);
		try {
			const payload = {
				...formData,
			};
			const res = await createDebitNote(payload);
			updateDebitNoteList(res);
			toggle(); // close modal
		} catch (error) {
			console.error('Failed to create debit note:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const availablePoItems = useMemo(() => {
		if (!selectedPO) return [];

		return selectedPO.items.filter(
			(poItem: any) => !formData.items.some((item) => item.poItemId === poItem.id),
		);
	}, [selectedPO, formData.items]);

	const handleProductChange = (itemId: string, poItemId: string) => {
		const poItem = selectedPO?.items?.find((i) => i.id === poItemId);
		if (!poItem) return;

		setFormData((prev: any) => ({
			...prev,
			items: prev.items.map((item: any) => {
				if (item.id !== itemId) return item;

				return {
					...item,
					productId: poItem.productId,
					poItemId: poItem.id,

					description: '',
					qty: 0,
					unitPrice: poItem.unitPrice,

					vatId: poItem.vatId,
					vatRate: poItem.vatRate,

					vatAmount: 0,
					totalAmount: 0,

					coaMapping: {
						accountId: poItem?.coaMapping?.accountId,
						type: poItem?.coaMapping?.type,
					},
				};
			}),
		}));
	};
	const handleAddEmptyRow = () => {
		const newItem = {
			id: generateUid(),

			productId: '',
			poItemId: '',

			description: '',
			qty: 0,
			unitPrice: 0,

			vatId: '',
			vatRate: 0,

			vatAmount: 0,
			totalAmount: 0,

			coaMapping: {
				accountId: '',
				accountName: '',
				type: '',
			},
		};

		setFormData((prev: any) => ({
			...prev,
			items: [...prev.items, newItem],
		}));
	};
	const getAvailableItemsForRow = (currentItemId: string) => {
		return (selectedPO?.items || []).filter((poItem: any) => {
			// allow current selected item
			const isCurrent = formData.items.find(
				(i) => i.id === currentItemId && i.poItemId === poItem.id,
			);

			if (isCurrent) return true;

			// prevent duplicates
			return !formData.items.some((i) => i.poItemId === poItem.id);
		});
	};

	const canAddItem = useMemo(() => {
		if (!selectedPO) return false;

		return formData.items.every((item) => {
			return item.poItemId && item.qty > 0 && item.unitPrice >= 0 && item.totalAmount >= 0;
		});
	}, [formData.items, selectedPO]);

	return (
		<Modal
			setIsOpen={toggle}
			isStaticBackdrop
			isOpen={isOpen}
			fullScreen
			titleId='receipt-discrepancy-modal'
			id='receiptDiscrepancy'>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle className='fw-bold fs-4' id='receiptModalTitle'>
					Receipt Discrepancy
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				{/* Vendor Section */}
				<div className='row g-3 mb-4'>
					<div className='col-3'>
						<FormGroup id='vendorId' label='Vendor'>
							<SearchableSelect
								disabled={true}
								isValid={validator.current.fieldValid('Vendor')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Vendor',
									formData?.vendorId,
									'required',
								)}
								name='vendorId'
								id='vendorId'
								value={formData?.vendorId}
								onChange={handleChange}
								isLoading={isVendorLoading}
								options={vendorList}
								placeholder='Select Vendor'
								labelKey='name'
								valueKey='id'
								renderLabel={(vendor: any, i: number) => (
									<div className='d-flex align-items-center'>
										{/* Avatar */}
										<div className='flex-shrink-0'>
											<div
												className='ratio ratio-1x1 me-3'
												style={{ width: 40 }}>
												<div
													className={`bg-l${darkModeStatus ? 'o25' : '25'}-${getColorNameWithIndex(i) || 'primary'}
						text-${getColorNameWithIndex(i) || 'primary'}
						rounded-2 d-flex align-items-center justify-content-center`}>
													<span className='fw-bold'>
														{getFirstLetter(vendor?.name)}
													</span>
												</div>
											</div>
										</div>

										{/* Text */}
										<div className='flex-grow-1'>
											<div className='fw-bold fs-6'>
												{vendor?.name || 'NA'}
											</div>

											<div className='text-muted'>
												<small>{vendor?.emailId || '-'}</small>
											</div>
										</div>
									</div>
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-3'>
						<FormGroup id='poId' label='Purchase Order'>
							<SearchableSelect
								disabled={true}
								name='poId'
								id='poId'
								value={formData.poId}
								onChange={handleChange}
								options={purchaseOrderList}
								placeholder='Select Purchase Order'
								labelKey='code'
								valueKey='id'
								renderLabel={(po: any, i: number) => (
									<div className='d-flex align-items-center'>
										{/* PO Code */}
										<div className='flex-grow-1'>
											<div className='fw-semibold fs-6'>
												{po?.code || 'NA'}
											</div>
										</div>
									</div>
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-3'>
						<FormGroup id='settlementType' label='Settlement Type'>
							<SearchableSelect
								name='settlementType'
								id='settlementType'
								value={formData.settlementType}
								onChange={handleChange}
								options={DEBIT_NOTE_SETTLEMENT_TYPE_LIST}
								placeholder='Select Settlement Type'
								isTouched={isSubmitted}
								isValid={validator.current.fieldValid('settlementType')}
								invalidFeedback={validator.current.message(
									'settlementType',
									formData.settlementType,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-3'>
						<FormGroup id='date' label='Date'>
							<DateTimePicker
								id='date'
								name='date'
								minDate={selectedPO?.date}
								value={formData.date}
								onChange={handleChange}
								isTouched={isSubmitted}
								isValid={validator.current.fieldValid('date')}
								invalidFeedback={validator.current.message(
									'date',
									formData.date,
									'required',
								)}
							/>
						</FormGroup>
					</div>
					<div className='col-3'>
						<FormGroup id='notes' label='Notes'>
							<Textarea
								id='notes'
								name='notes'
								value={formData.notes}
								onChange={handleChange}
								isTouched={isSubmitted}
								isValid={validator.current.fieldValid('notes')}
								invalidFeedback={validator.current.message(
									'notes',
									formData.notes,
									'required|min:1',
								)}
							/>
						</FormGroup>
					</div>
				</div>

				{/* Items */}
				<Card shadow='none' className='border'>
					<CardHeader className='d-flex justify-content-between'>
						<CardTitle tag='h5'>Items</CardTitle>
						<div className='d-flex align-items-center justify-content-between gap-3'>
							<div>
								<span className='fw-bold'>VAT Mode: </span>
								<span className='text-muted fw-semibold'>
									{getLabelByValue(VAT_MODE_OPTIONS, formData?.vatMode) || '-'}
								</span>
							</div>

							<Button
								color='primary'
								isLight
								icon='AddCircle'
								onClick={handleAddEmptyRow}
								isDisable={
									!selectedPO || availablePoItems.length === 0 || !canAddItem
								}>
								Add Items
							</Button>
						</div>
					</CardHeader>

					<CardBody>
						<div className='table-responsive' style={{ overflow: 'visible' }}>
							<table className='table'>
								<thead>
									<tr>
										<th>Product</th>
										<th>Description</th>
										<th className='text-end'>Qty</th>
										<th className='text-end'>Unit Price</th>
										<th className='text-end'>Total</th>
										<th className='text-center'>Action</th>
									</tr>
								</thead>

								<tbody>
									{formData.items.map((item: any, i: number) => {
										const poItem = selectedPO?.items?.find(
											(i) => i.id === item.poItemId,
										);
										const poQty = poItem?.qty || 0;
										const usedQty = consumedQtyMap[item.poItemId] || 0;

										const currentFormUsed = formData.items
											.filter(
												(i) =>
													i.poItemId === item.poItemId &&
													i.id !== item.id,
											)
											.reduce((sum, i) => sum + Number(i.qty || 0), 0);

										const remainingQty = Math.max(
											0,
											poQty - usedQty - currentFormUsed,
										);

										return (
											<tr key={item.id} className='align-middle'>
												{/* Product */}
												<td className='wpx-200'>
													<SearchableSelect
														value={item.poItemId}
														options={getAvailableItemsForRow(item.id)}
														valueKey='id'
														labelKey='id'
														placeholder='Select Product'
														onChange={(e: any) =>
															handleProductChange(
																item.id,
																e.target.value,
															)
														}
														renderLabel={(poItem: any, i: number) => {
															const product =
																productMap[poItem?.productId];

															return (
																<div className='d-flex align-items-center gap-2'>
																	{/* Avatar */}
																	<div className='flex-shrink-0'>
																		<div
																			className='ratio ratio-1x1'
																			style={{ width: 32 }}>
																			<div
																				className={`bg-l${darkModeStatus ? 'o25' : '25'}-${
																					getColorNameWithIndex(
																						i,
																					) || 'primary'
																				}
								text-${getColorNameWithIndex(i) || 'primary'}
								rounded d-flex align-items-center justify-content-center`}>
																				<span className='fw-bold small'>
																					{getFirstLetter(
																						product?.name ||
																							'',
																					)}
																				</span>
																			</div>
																		</div>
																	</div>

																	{/* Text */}
																	<div className='flex-grow-1'>
																		<div className='fw-semibold'>
																			{product?.name || 'NA'}
																		</div>
																		<div className='text-muted small'>
																			{product?.productCode ||
																				''}
																		</div>
																	</div>
																</div>
															);
														}}
													/>
												</td>

												{/* Description */}
												<td className='wpx-250'>
													<Textarea
														id='notes'
														name='notes'
														value={item?.description || ''}
														onChange={(e: any) =>
															handlePurchaseItemChange(
																item.id,
																'description',
																e.target.value,
															)
														}
													/>
												</td>

												{/* Qty (ONLY EDITABLE FIELD) */}
												<td className='text-end wpx-120'>
													<Input
														className='text-end'
														type='number'
														value={item.qty}
														min={0}
														max={remainingQty}
														onChange={(e: any) =>
															handlePurchaseItemChange(
																item.id,
																'qty',
																Number(e.target.value),
															)
														}
													/>
												</td>

												{/* Unit Price (readonly) */}
												<td className='text-end wpx-140 fw-bold'>
													{priceFormat(item?.unitPrice)}
												</td>

												{/* Total Amount (readonly) */}
												<td className='text-end wpx-140 fw-bold'>
													{priceFormat(item?.totalAmount)}
												</td>

												{/* Delete */}
												<td className='text-center wpx-80'>
													<Button
														isLight
														icon='Delete'
														color='danger'
														isDisable={formData.items.length === 1}
														onClick={() => handleDeleteItem(item.id)}
													/>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</CardBody>
					<CardFooter className='d-flex justify-content-end'>
						<div style={{ minWidth: 320 }}>
							<table className='table table-borderless mb-0'>
								<tbody>
									<tr>
										<td className='fw-semibold'>Sub Total</td>
										<td className='text-end fw-semibold'>
											{priceFormat(formData?.subTotal || 0)}
										</td>
									</tr>

									<tr>
										<td className='fw-semibold'>VAT Total</td>
										<td className='text-end fw-semibold'>
											{priceFormat(formData?.vatTotal || 0)}
										</td>
									</tr>

									{/* <tr className='border-top'>
										<td className='fw-bold fs-5'>Grand Total</td>
										<td className='text-end fw-bold fs-5'>
											{priceFormat(formData?.totalPrice || 0)}
										</td>
									</tr> */}

									<tr>
										<td className='fw-bold text-danger fs-4'>Debited Amount</td>
										<td className='text-end fw-bold text-danger fs-4'>
											{priceFormat(formData?.debitAmount)}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</CardFooter>
				</Card>
			</ModalBody>
			<CardFooter>
				<div className='row w-100'>
					<div className='col-12 d-flex justify-content-end gap-2'>
						<Button
							color='success'
							isLight
							isLoading={isLoading}
							onClick={() => handleFormSubmit()}>
							Generate
						</Button>
						<Button color='danger' isLight onClick={toggle}>
							close
						</Button>
					</div>
				</div>
			</CardFooter>
		</Modal>
	);
};

export default ReceiptDiscrepancyForm;
