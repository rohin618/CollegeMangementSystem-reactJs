import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	Modal,
	ModalHeader,
	ModalTitle,
	ModalBody,
	Card,
	CardBody,
	CardHeader,
	CardTitle,
	Input,
	FormGroup,
	CardFooter,
	Button,
	Badge,
} from '../../../../../components/bootstrap';

import { useQuery } from '@tanstack/react-query';
import { getAllPurchaseOrders, updatePurchaseOrder } from '../../../../../common/api/purchaseOrder';
import { getAllVendors } from '../../../../../common/api/vendor';
import { QUERY_KEY, PURCHASE_ORDER_STATUS } from '../../../../../common/constant';
import {
	generateUid,
	getColorByValue,
	getFirstLetter,
	getLabelByValue,
	priceFormat,
	showAlert,
} from '../../../../../helpers/helpers';
import { SearchableSelect } from '../../../../../components/common';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { IDebitNoteModal } from '../../../../../common/interface/debitNote';
import SimpleReactValidator from 'simple-react-validator';
import { getAllDebitNotes, updateDebitNote } from '../../../../../common/api/debitNote';
import { useUpdateQueryListById } from '../../../../../hooks';
import { PURCHASE_ORDER_STATUS_LIST } from '../../../../../common/data/option';

type Props = {
	isOpen: boolean;
	toggle: () => void;
	debitNote: IDebitNoteModal;
};

const DebitApplyModal: React.FC<Props> = ({ isOpen, toggle, debitNote }) => {
	const [formData, setFormData] = useState<IDebitNoteModal>();
	const [purchaseOrderListData, setPurchaseOrderListData] = useState<any[]>([]);

	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [selectedPOIds, setSelectedPOIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (isOpen) {
			setFormData(debitNote);
		}
	}, [isOpen, debitNote]);

	const { data: vendorList = [] } = useQuery({
		queryKey: [QUERY_KEY.VENDOR_LIST],
		queryFn: getAllVendors,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	const { data: purchaseOrderList = [] } = useQuery({
		queryKey: [QUERY_KEY.PURCHASE_ORDER],
		queryFn: getAllPurchaseOrders,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	const updateDebitNoteQueryList = useUpdateQueryListById<any>([QUERY_KEY.DEBIT_NOTE]);
	const updatePurchaseOrderQueryList = useUpdateQueryListById<any>([QUERY_KEY.PURCHASE_ORDER]);

	const { darkModeStatus } = useDarkMode();
	const validator = useRef(new SimpleReactValidator({ className: 'text-danger' }));

	// It Contains the Matched vedor and Approved PO
	const approvedPurchaseOrder = useMemo(() => {
		return purchaseOrderList.filter((po: any) => {
			return (
				po.vendorId === formData?.vendorId && po.status === PURCHASE_ORDER_STATUS.APPROVED
			);
		});
	}, [purchaseOrderList, formData?.vendorId]);

	// Add the DebitApply to the pending po List with Empty Amount
	useEffect(() => {
		if (!approvedPurchaseOrder) return;
		setPurchaseOrderListData(approvedPurchaseOrder);
	}, [approvedPurchaseOrder, isOpen]);

	useEffect(() => {
		if (!isOpen) {
			setSelectedPOIds(new Set());
		}
	}, [isOpen]);
	const totalDebitApplyAmount = useMemo(() => {
		return purchaseOrderListData.reduce((sum: number, po: any) => {
			const list = po.debitApply?.filter((d: any) => d.isNewDebit) || [];

			return sum + list.reduce((s: any, d: any) => s + d.amount, 0);
		}, 0);
	}, [purchaseOrderListData, formData]);

	const remainingAmount = useMemo(() => {
		// 1. Sum of already applied adjustments (from DB)
		const appliedAdjustmentTotal =
			formData?.adjustments?.reduce(
				(sum: number, adj: any) => sum + (adj.appliedAmount || 0),
				0,
			) || 0;

		// 2. Remaining after previous adjustments
		const ActuallAmount = (formData?.debitAmount || 0) - appliedAdjustmentTotal;

		// 3. Subtract current session applied amount
		const finalRemaining = ActuallAmount - totalDebitApplyAmount;

		return finalRemaining;
	}, [formData?.debitAmount, formData?.adjustments, totalDebitApplyAmount]);

	const handleAmountChange = (poId: string, value: number) => {
		setPurchaseOrderListData((prevList) => {
			// 1. Calculate all Debit Note Applied Amount
			const appliedAdjustmentTotal =
				formData?.adjustments?.reduce(
					(sum: number, adj: any) => sum + (adj.appliedAmount || 0),
					0,
				) || 0;

			const availableDebit = (formData?.debitAmount || 0) - appliedAdjustmentTotal;

			// 2. Total of ALL session entries
			const total = prevList.reduce((sum: number, po: any) => {
				const list = po.debitApply?.filter((d: any) => d.isNewDebit) || [];

				return sum + list.reduce((s: number, d: any) => s + d.amount, 0);
			}, 0);

			return prevList.map((po) => {
				if (po.id !== poId) return po;
				const current = po.debitApply?.find((d: any) => d.isNewDebit);

				const currentAmount = current?.amount || 0;

				// ✅ ONLY subtract current PO amount
				const otherTotal = total - currentAmount;

				// ✅ remaining allowed for THIS PO
				const remainingForThisPO = Math.max(availableDebit - otherTotal, 0);
				const existingApplied =
					po.debitApply
						?.filter((d: any) => !d.isNewDebit)
						.reduce((sum: number, d: any) => sum + (d.amount || 0), 0) || 0;

				const poRemaining = (po.totalPrice || 0) - existingApplied;

				// ✅ MAX allowed for this PO
				const maxAllowed = Math.min(poRemaining, remainingForThisPO);

				let newValue = value;
				if (newValue > maxAllowed) newValue = maxAllowed;
				if (newValue < 0) newValue = 0;

				// console.log(newValue);

				return {
					...po,
					debitApply: po.debitApply.map((d: any) =>
						d.id === current?.id ? { ...d, amount: newValue } : d,
					),
				};
			});
		});
	};

	const handleFormSubmit = async () => {
		debugger;
		setIsSubmitted(true);

		// ✅ FIXED condition
		if (!formData || !formData?.id) return;

		setIsLoading(true);

		try {
			// ✅ 1. Get ONLY selected POs
			const selectedPOs = purchaseOrderListData?.filter((po: any) =>
				selectedPOIds.has(po.id),
			);

			if (selectedPOs.length === 0) {
				showAlert({
					title: 'No Purchase Order Selected',
					text: 'Please select at least one Purchase Order to proceed.',
					icon: 'warning',
				});
				return;
			}

			// ✅ 2. Validate each selected PO amount > 0
			for (const po of selectedPOs) {
				const current = po.debitApply?.find((d: any) => d.isNewDebit);
				if (!current) {
					showAlert({
						title: 'Missing Entry',
						text: `No debit entry found for PO: ${po.code}`,
						icon: 'warning',
					});
					return;
				}

				if (!current || current.amount <= 0) {
					showAlert({
						title: 'Invalid Amount',
						text: `Please enter a valid amount for PO: ${po.code}`,
						icon: 'warning',
					});
					return;
				}
			}

			// ✅ 3. Update selected POs
			for (const po of selectedPOs) {
				const cleanedDebitApply = po?.debitApply?.map((d: any) => ({
					id: d.id,
					debitNoteId: d.debitNoteId,
					amount: d.amount,
				}));
				const res = await updatePurchaseOrder(po.id, {
					...po,
					debitApply: cleanedDebitApply,
				});

				updatePurchaseOrderQueryList(res);
			}

			// ✅ 4. Create adjustments
			const newAdjustments = selectedPOs.map((po: any) => {
				const current = po.debitApply?.find((d: any) => d.isNewDebit);

				return {
					id: current?.id,
					poId: po.id,
					appliedAmount: current?.amount,
					notes: '',
				};
			});

			// ✅ 5. Update Debit Note
			const updatedDebitNote = {
				...formData,
				adjustments: [...(formData.adjustments || []), ...newAdjustments],
			};

			const res = await updateDebitNote(formData.id, updatedDebitNote);
			updateDebitNoteQueryList(res);

			toggle();
		} catch (error) {
			console.error('Apply failed', error);

			// ✅ Optional: better error UX
			showAlert({
				title: 'Something went wrong',
				text: 'Failed to apply debit. Please try again.',
				icon: 'error',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelectPO = (poId: string) => {
		setSelectedPOIds((prev) => {
			const newSet = new Set(prev);
			const isSelected = newSet.has(poId);

			// ✅ Update Set FIRST
			if (isSelected) {
				newSet.delete(poId);
			} else {
				newSet.add(poId);
			}

			// ✅ Then update PO list using SAME decision
			setPurchaseOrderListData((prevList) => {
				return prevList.map((po) => {
					if (po.id !== poId) return po;

					if (isSelected) {
						// UNSELECT
						return {
							...po,
							debitApply: (po.debitApply || []).filter((d: any) => !d.isNewDebit),
						};
					} else {
						// SELECT
						const alreadyExistDebit = po.debitApply?.some((d: any) => d.isNewDebit);

						if (!alreadyExistDebit) {
							const newEntry = {
								id: generateUid(),
								debitNoteId: formData?.id,
								amount: 0,
								isNewDebit: true,
							};

							return {
								...po,
								debitApply: [...(po.debitApply || []), newEntry],
							};
						}

						return po;
					}
				});
			});

			return newSet;
		});
	};

	return (
		<Modal
			setIsOpen={toggle}
			isStaticBackdrop
			isOpen={isOpen}
			fullScreen
			titleId='applyDebitTitle'
			id='applyDebit'>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle id='applyDebitTitle' className='fw-bold fs-4'>
					Apply Debit
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				{/* Top Section */}
				<div className='row mb-5'>
					<div className='col-3'>
						<FormGroup id='vendorId' label='Vendor'>
							<SearchableSelect
								isValid={validator.current.fieldValid('Vendor')}
								// isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Vendor',
									formData?.vendorId,
									'required',
								)}
								disabled={true}
								name='vendorId'
								id='vendorId'
								value={formData?.vendorId}
								// onChange={handleChange}
								// isLoading={isVendorLoading}
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

					{/* Purchase Order Dropdown */}

					<div className='col-9 text-end'>
						{/* ✅ Remaining */}
						<div className='me-4'>
							<div className='fs-4 fw-bold'>Debit Amount</div>
							<h5 className='fw-bold text-danger'>{priceFormat(remainingAmount)}</h5>
						</div>
					</div>
				</div>

				{/* Purchase Order List */}
				<Card shadow='none' className='border'>
					<CardHeader className='d-flex justify-content-between align-items-center'>
						<CardTitle tag='h5' className='mb-0'>
							Purchase Orders
						</CardTitle>
					</CardHeader>

					<CardBody>
						<div className='table-responsive table-scroll'>
							<table className='table align-middle'>
								<thead>
									<tr>
										<th className='wpx-80 text-center'>Select</th>
										<th className='wpx-150'>PO Code</th>
										<th className='wpx-140'>PO Date</th>
										<th className='text-end wpx-140'>VAT Total</th>
										<th className='text-end wpx-140'>Sub Total</th>
										<th className='text-end wpx-160'>Total Price</th>
										<th className='wpx-120'>Status</th>
										<th className='text-end wpx-160'>Apply Amount</th>
									</tr>
								</thead>

								<tbody>
									{purchaseOrderListData?.length > 0 ? (
										purchaseOrderListData.map((po: any) => {
											const currentDebitApplyAmt = po.debitApply?.find(
												(d: any) => d.isNewDebit,
											);

											const poActualTotal =
												(po.totalPrice || 0) -
												(po.debitApply?.reduce(
													(sum: number, d: any) => sum + (d.amount || 0),
													0,
												) || 0);

											return (
												<tr key={po.id}>
													{/* ✅ Selection Checkbox */}
													<td className='text-center'>
														<input
															type='checkbox'
															checked={selectedPOIds.has(po.id)}
															onChange={() => handleSelectPO(po.id)}
															style={{
																width: 18,
																height: 18,
																cursor: 'pointer',
															}}
														/>
													</td>
													{/* PO Code */}
													<td className='fw-semibold'>{po.code}</td>

													{/* Date */}
													<td className='text-muted'>{po.date}</td>

													{/* VAT */}
													<td className='text-end'>
														{priceFormat(po.vatTotal || 0)}
													</td>
													{/* VAT */}
													<td className='text-end'>
														{priceFormat(po.subTotal || 0)}
													</td>

													{/* Total */}
													<td className='text-end fw-semibold'>
														{priceFormat(poActualTotal || 0)}
													</td>

													{/* Status */}
													<td>
														<Badge
															isLight
															color={getColorByValue(
																PURCHASE_ORDER_STATUS_LIST,
																po?.status,
															)}
															className='px-3 py-1 rounded-pill'>
															{getLabelByValue(
																PURCHASE_ORDER_STATUS_LIST,
																po?.status,
															)}
														</Badge>
													</td>

													{/* Amount Input */}
													<td className='text-end'>
														<Input
															type='number'
															min={0}
															className='text-end'
															disabled={!selectedPOIds.has(po.id)} // 🔥 KEY LOGIC
															value={
																currentDebitApplyAmt?.amount || ''
															}
															placeholder='0.00'
															onChange={(e: any) =>
																handleAmountChange(
																	po.id,
																	Number(e.target.value || 0),
																)
															}
														/>
													</td>
												</tr>
											);
										})
									) : (
										<tr>
											<td colSpan={8} className='text-center text-muted py-5'>
												No Approved Purchase Orders
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</CardBody>

					<CardFooter className='d-flex justify-content-end gap-2'>
						<Button
							color='success'
							isLight
							isLoading={isLoading}
							onClick={handleFormSubmit}>
							Apply
						</Button>

						<Button color='danger' isLight onClick={toggle}>
							Close
						</Button>
					</CardFooter>
				</Card>
			</ModalBody>
		</Modal>
	);
};

export default DebitApplyModal;
