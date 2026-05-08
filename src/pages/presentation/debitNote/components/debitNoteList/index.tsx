import React, { useCallback, useMemo, useState } from 'react';

import classNames from 'classnames';
import useDarkMode from '../../../../../hooks/useDarkMode';
import {
	getColorByValue,
	getFirstLetter,
	getLabelByValue,
	priceFormat,
} from '../../../../../helpers/helpers';
import { DEBIT_NOTE_STATUS_LIST } from '../../../../../common/data/option';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '../../../../../components/bootstrap';
import { getColorNameWithIndex } from '../../../../../common/data/enumColors';
import DebitApplyModal from '../debitApplyModal';
import { PurchaseOrderDetailViewModal } from '../../../purchaseOrder/components/purchaseOrderBillModal';
type Props = {
	groupedDebitNotes: any[];
	isLoading: boolean;
	vendorMapById: Record<string, any>;
	purchaseOrderMapById: Record<string, any>;
};
const DebitNoteList: React.FC<Props> = ({
	groupedDebitNotes,
	isLoading,
	vendorMapById,
	purchaseOrderMapById,
}) => {
	const { darkModeStatus } = useDarkMode();

	const [isDebitApplyOpen, setIsDetbitApplyOpen] = useState<boolean>(false);

	const [isPurchaseOrderBillOpen, setIsPurchaseOrderBillOpen] = useState<boolean>(false);
	const [purchaseOrderData, setPurchaseOrderData] = useState<any>(null);
	const togglePurchaseOrderBill = () => {
		setIsPurchaseOrderBillOpen((prev) => !prev);
		setPurchaseOrderData(null);
	};

	const [debitNoteData, setDebitNoteData] = useState<any>(null);
	const toggleDebitApply = () => {
		setIsDetbitApplyOpen((prev) => !prev);
		setDebitNoteData(null);
	};
	const handlOpenDebitApplyModal = (data: any) => {
		setDebitNoteData(data);
		setIsDetbitApplyOpen(true);
	};

	// ✅ Memoized total calculation per group
	const getTotalRemaingDebitAmount = useCallback((notes: any[]) => {
		return notes.reduce((sum, n) => {
			const totalAdjusted = (n.adjustments || []).reduce(
				(s: number, adj: any) => s + (adj.appliedAmount || 0),
				0,
			);

			const remaining = (n.debitAmount || 0) - totalAdjusted;

			return sum + remaining;
		}, 0);
	}, []);

	// const getRemainingDebitAmount = (note: any) => {
	// 	const totalAdjusted = (note.adjustments || []).reduce(
	// 		(sum: number, adj: any) => sum + (adj.appliedAmount || 0),
	// 		0,
	// 	);

	// 	return (note.debitAmount || 0) - totalAdjusted;
	// };
	const handleOpenPurchaseOrder = useCallback(
		(poId: string) => {
			const poData = purchaseOrderMapById[poId];

			if (!poData) return;

			setPurchaseOrderData(poData);
			setIsPurchaseOrderBillOpen(true);
		},
		[purchaseOrderMapById],
	);

	// ✅ Memoized row renderer
	const renderRow = useCallback(
		(note: any) => {
			const purchaseOrder = purchaseOrderMapById[note?.poId];
			const totalAdjusted = (note.adjustments || []).reduce(
				(sum: number, adj: any) => sum + (adj.appliedAmount || 0),
				0,
			);
			const AvailabelDebitAmount = (note.debitAmount || 0) - totalAdjusted;

			// Step 1: extract all poIds from adjustments
			const poIds = (note.adjustments || []).map((adj: any) => adj.poId).filter(Boolean);

			const uniquePoIds = [...new Set(poIds)];

			return (
				<tr key={note.id}>
					{/* Debit Note Code */}
					<td>{note.code || '-'}</td>

					{/* PO Code */}
					<td>{purchaseOrder?.code || '-'}</td>

					{/* Date */}
					<td>{note.date || '-'}</td>
					{/* Date */}
					<td>{note.notes || '-'}</td>

					{/* Subtotal */}
					{/* <td className='text-end'>{priceFormat(note?.subTotal || 0)}</td> */}

					{/* VAT */}
					{/* <td className='text-end'>{priceFormat(note?.vatTotal || 0)}</td> */}

					{/* Debit Amount */}
					<td className='text-end '>{priceFormat(totalAdjusted || 0)}</td>

					{/* Debit Amount */}
					<td className='text-end '>{priceFormat(AvailabelDebitAmount || 0)}</td>

					{/* Status */}
					<td>
						<div
							className={classNames(
								`bg-l${darkModeStatus ? 'o25' : '10'}-${getColorByValue(
									DEBIT_NOTE_STATUS_LIST,
									note?.status,
								)}`,
								`text-${getColorByValue(DEBIT_NOTE_STATUS_LIST, note?.status)}`,
								'fw-bold py-1 px-3 rounded-pill text-center',
							)}>
							{getLabelByValue(DEBIT_NOTE_STATUS_LIST, note.status)}
						</div>
					</td>

					<td>
						{uniquePoIds?.length > 0 ? (
							<div className='d-flex flex-wrap gap-2 '>
								{uniquePoIds.map((poId: any) => {
									const po = purchaseOrderMapById[poId];

									if (!po) return null;

									return (
										<Button
											key={poId}
											isLight
											color='primary'
											size='sm'
											onClick={() => handleOpenPurchaseOrder(poId)}>
											#{po.code}
										</Button>
									);
								})}
							</div>
						) : (
							<span className='text-muted'>No Purchase Bill</span>
						)}
					</td>

					<td>
						<Dropdown>
							<DropdownToggle hasIcon={false}>
								<Button icon='MoreHoriz' color='dark' isLight shadow='sm' />
							</DropdownToggle>

							<DropdownMenu>
								<DropdownItem>
									<Button color='danger' isLight icon='delete'>
										View
									</Button>
								</DropdownItem>
								<DropdownItem>
									<Button
										color='danger'
										isLight
										icon='RemoveCircle'
										onClick={() => handlOpenDebitApplyModal(note)}>
										Apply Debit
									</Button>
								</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					</td>
				</tr>
			);
		},
		[purchaseOrderMapById, darkModeStatus],
	);

	if (isLoading) return <div>Loading...</div>;

	return (
		<>
			<div className='row'>
				{groupedDebitNotes?.length === 0 ? (
					<div className='text-center py-5'>
						<h5 className='text-muted'>No Debit Note Found</h5>
					</div>
				) : (
					groupedDebitNotes.map((group: any, i: number) => {
						const vendor = vendorMapById[group.vendorId];

						const total = getTotalRemaingDebitAmount(group.debitNotes);

						return (
							<div className='col-12 mb-4' key={group.vendorId}>
								<Card>
									<CardHeader>
										<div className='d-flex justify-content-between w-100'>
											{/* Vendor Info */}
											<div className='d-flex align-items-center'>
												<div className='flex-shrink-0'>
													<div
														className='ratio ratio-1x1 me-3'
														style={{ width: 40 }}>
														<div
															className={`bg-l${darkModeStatus ? 'o25' : '25'}-${
																getColorNameWithIndex(i) ||
																'primary'
															}
													text-${getColorNameWithIndex(i) || 'primary'}
													rounded-2 d-flex align-items-center justify-content-center`}>
															<span className='fw-bold'>
																{getFirstLetter(vendor?.name)}
															</span>
														</div>
													</div>
												</div>

												<div className='flex-grow-1'>
													<div className='fw-bold fs-6'>
														{vendor?.name || 'NA'}
													</div>
													<div className='text-muted'>
														<small>{vendor?.emailId || '-'}</small>
													</div>
												</div>
											</div>

											{/* Total */}
											<div>
												<label className='text-muted'>Overall:</label>
												<strong className='fs-5 ms-2'>₹{total}</strong>
											</div>
										</div>
									</CardHeader>

									<CardBody>
										<table className='table table-modern'>
											<thead>
												<tr>
													<th>Debit Code</th>
													<th>PO Code</th>
													<th>Date</th>
													<th>Notes</th>
													{/* <th className='text-end'>Sub Total</th>
													<th className='text-end'>VAT</th> */}
													<th className='text-end'>Debit Applied</th>
													<th className='text-end'>Available Debit</th>
													<th>Status</th>
													<th>Linked Purchase Order</th>
													<th>Action</th>
												</tr>
											</thead>

											<tbody>{group.debitNotes.map(renderRow)}</tbody>
										</table>
									</CardBody>
								</Card>
							</div>
						);
					})
				)}
			</div>
			<DebitApplyModal
				isOpen={isDebitApplyOpen}
				toggle={toggleDebitApply}
				debitNote={debitNoteData}
			/>
			<PurchaseOrderDetailViewModal
				isOpen={isPurchaseOrderBillOpen}
				toggle={togglePurchaseOrderBill}
				purchaseOrderData={purchaseOrderData}
			/>
		</>
	);
};

export default DebitNoteList;
