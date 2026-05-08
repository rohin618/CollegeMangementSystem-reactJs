import React, { useEffect, useState } from 'react';
import {
	Modal,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	FormGroup,
	Textarea,
	ModalTitle,
} from '../../../../../../components/bootstrap';
import { IPurchaseOrderModal } from '../../../../../../common/interface/purchaseOrder';
import { showAlert } from '../../../../../../helpers/alerts';

type PurchaseOrderCommentsProps = {
	isOpen: boolean;
	toggle: () => void;
	purchaseOrder: IPurchaseOrderModal;
	submitForm: (status: number,draftComment:string) => void;
	statusComment: number;
	setPurchaseOrder: (prev: any) => void;
};

const PurchaseOrderComments: React.FC<PurchaseOrderCommentsProps> = ({
	isOpen,
	toggle,
	purchaseOrder,
	submitForm,
	statusComment,
	setPurchaseOrder,
}) => {
	const [draftComment, setDraftComment] = useState('');

	// Prefill when modal opens
	useEffect(() => {
		if (isOpen) {
			setDraftComment(purchaseOrder?.cancelOrPartialCmt || '');
		}
	}, [isOpen, purchaseOrder]);

	// ✅ Save only updates parent
	const handleSave = () => {
		setPurchaseOrder((prev: any) => ({
			...prev,
			cancelOrPartialCmt: draftComment,
		}));
		toggle();
	};

	// ✅ Submit updates parent first, then calls submit
	const handleSubmit = () => {
		showAlert({
title: "Proceed with Submission?",
text: "Please review the details once more. Do you want to check again or proceed with submission?",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Proceed',
			cancelButtonText: 'Review Again',

			onConfirm: async () => {
				await submitForm(statusComment,draftComment);
			},
		});

		toggle();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={toggle} isStaticBackdrop>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle className='fw-bold fs-5' id='modal-title-comment'>
					Purchase Order Comments
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				<FormGroup label='Comments'>
					<Textarea
						value={draftComment}
						onChange={(e: any) =>
							setDraftComment(e.target.value)
						}
						placeholder='Enter cancellation or partial delivery comments...'
					/>
				</FormGroup>
			</ModalBody>

			<ModalFooter>
				<Button color='danger' isLight onClick={toggle}>
					Cancel
				</Button>

				<Button color='primary' isLight onClick={handleSave}>
					Save
				</Button>

				<Button color='success' onClick={handleSubmit} isLight>
					Submit
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default PurchaseOrderComments