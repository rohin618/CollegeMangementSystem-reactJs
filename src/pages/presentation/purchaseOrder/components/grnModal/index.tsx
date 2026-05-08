import React, { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase';
import {
	Button,
	FormGroup,
	Input,
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	Textarea,
} from '../../../../../components/bootstrap';
import { PURCHASE_ORDER_STATUS } from '../../../../../common/constant/app';
import { DB_NAME } from '../../../../../common/constant';
import { IPurchaseOrderModal } from '../../../../../common/interface/purchaseOrder';

interface GrnModalProps {
	isOpen: boolean;
	toggle: () => void;
	itemId: string;
	purchaseOrder: IPurchaseOrderModal;
	setPurchaseOrder: (po: any) => void;
	productList: any[];
	isViewOnly: boolean;
}

const GrnModal: React.FC<GrnModalProps> = ({
	isOpen,
	toggle,
	itemId,
	purchaseOrder,
	setPurchaseOrder,
	productList,
	isViewOnly,
}) => {
	const poItem = purchaseOrder.items?.find((i) => i.id === itemId);
	const product = productList.find((p) => p.id === poItem?.productId);

	const [receivedQty, setReceivedQty] = useState(0);
	const [notes, setNotes] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (isOpen && poItem) {
			setReceivedQty((poItem as any).receivedQty || 0);
			setNotes((poItem as any).grnNotes || '');
		}
	}, [isOpen, itemId]);

	const orderedQty = Number(poItem?.qty ?? 0);
	const outstanding = orderedQty - receivedQty;
	const isFull = receivedQty >= orderedQty && orderedQty > 0;
	const isPartial = receivedQty > 0 && !isFull;

	const handleSave = async () => {
		if (!purchaseOrder.id || !poItem) return;
		setIsLoading(true);
		try {
			const updatedItems = purchaseOrder.items.map((item) =>
				item.id === itemId
					? {
							...item,
							receivedQty,
							grnNotes: notes,
							grnDate: new Date().toISOString().slice(0, 10),
					  }
					: item,
			);

			const allFull = updatedItems.every(
				(i) => (i as any).receivedQty >= Number(i.qty),
			);
			const anyReceived = updatedItems.some((i) => ((i as any).receivedQty || 0) > 0);
			const newStatus = allFull
				? PURCHASE_ORDER_STATUS.COMPLETED
				: anyReceived
				? PURCHASE_ORDER_STATUS.PARTIAL
				: purchaseOrder.status;

			await updateDoc(doc(db, DB_NAME.PURCHASE_ORDER, purchaseOrder.id), {
				items: updatedItems,
				status: newStatus,
			});

			setPurchaseOrder({ ...purchaseOrder, items: updatedItems, status: newStatus });
			toggle();
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={toggle} isCentered>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle id='grnModalTitle'>
					{isViewOnly ? 'View GRN' : 'Update GRN'} — {product?.name || 'Product'}
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				<div className='row g-3'>
					{/* Product info */}
					<div className='col-12'>
						<div className='d-flex justify-content-between py-2 border-bottom'>
							<span className='text-muted small'>Product</span>
							<span className='fw-semibold'>{product?.name || '—'}</span>
						</div>
						<div className='d-flex justify-content-between py-2 border-bottom'>
							<span className='text-muted small'>Ordered Qty</span>
							<span className='fw-semibold'>{orderedQty}</span>
						</div>
						{(poItem as any)?.grnDate && (
							<div className='d-flex justify-content-between py-2 border-bottom'>
								<span className='text-muted small'>GRN Date</span>
								<span className='fw-semibold'>{(poItem as any).grnDate}</span>
							</div>
						)}
					</div>

					{/* Received Qty */}
					<div className='col-12'>
						<FormGroup id='receivedQty' label='Received Quantity' isFloating>
							<Input
								id='receivedQty'
								type='number'
								min={0}
								max={orderedQty}
								value={receivedQty}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									const val = Math.min(
										Math.max(0, Number(e.target.value)),
										orderedQty,
									);
									setReceivedQty(val);
								}}
								disabled={isViewOnly || isLoading}
							/>
						</FormGroup>
					</div>

					{/* Delivery status hint */}
					{receivedQty > 0 && (
						<div className='col-12'>
							{isFull ? (
								<div className='alert alert-success py-2 mb-0'>
									Full delivery confirmed
								</div>
							) : isPartial ? (
								<div className='alert alert-warning py-2 mb-0'>
									Partial delivery — {outstanding} unit{outstanding !== 1 ? 's' : ''} outstanding
								</div>
							) : null}
						</div>
					)}

					{/* Notes */}
					<div className='col-12'>
						<FormGroup id='grnNotes' label='Notes' isFloating>
							<Textarea
								id='grnNotes'
								value={notes}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
									setNotes(e.target.value)
								}
								disabled={isViewOnly || isLoading}
								rows={3}
							/>
						</FormGroup>
					</div>
				</div>
			</ModalBody>

			<ModalFooter>
				{!isViewOnly && (
					<Button
						color='info'
						onClick={handleSave}
						isLoading={isLoading}
						isDisable={isLoading || receivedQty < 0}>
						Save GRN
					</Button>
				)}
				<Button color='danger' isLight onClick={toggle} isDisable={isLoading}>
					{isViewOnly ? 'Close' : 'Cancel'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default GrnModal;
