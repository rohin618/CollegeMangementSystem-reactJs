import React, { useState, useRef, useEffect } from 'react';
import {
	Modal,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	ModalTitle,
} from '../../../../../components/bootstrap';
import { showAlert } from '../../../../../helpers/alerts';

interface BulkPurchaseOrderProps {
	isOpen: boolean;
	toggle: () => void;
	onSubmit: (file: File) => void;
	isSubmitting?: boolean;
}

const BulkPurchaseOrder: React.FC<BulkPurchaseOrderProps> = ({
	isOpen,
	toggle,
	onSubmit,
	isSubmitting = false,
}) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			setSelectedFile(null);
		}
	}, [isOpen]);

	const validateFile = (file: File) => {
		const allowedExtensions = ['xls', 'xlsx'];
		const ext = file.name.split('.').pop()?.toLowerCase();
		return allowedExtensions.includes(ext || '');
	};

	const handleFileChange = (file: File) => {
		if (!validateFile(file)) {
			showAlert({
				title: 'File Not Allowed',
				text: 'Only .xls and .xlsx files are allowed',
				icon: 'warning',
				confirmButtonText: 'OK',
			});
			return;
		}
		setSelectedFile(file);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);

		if (e.dataTransfer.files?.[0]) {
			handleFileChange(e.dataTransfer.files[0]);
		}
	};

	const handleSubmit = () => {
		if (!selectedFile) return;
		onSubmit(selectedFile);
	};


	return (
		<Modal
			setIsOpen={toggle}
			isOpen={isOpen}
			size='lg'
			titleId='bulk-po-modal'
			isCentered
			isStaticBackdrop>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle id='purchase-bulk-title'>Bulk Purchase Order</ModalTitle>
			</ModalHeader>

			<ModalBody className='px-4 py-3'>
				<div className='mb-4'>
					<div className='fw-bold mb-1'>Required Columns</div>
					<small className='text-muted'>
						Product Code, Description, Quantity, Unit Price
					</small>
				</div>

				<div className='rounded-4 p-5'>
					<div
						className='border border-2 rounded-4 text-center py-5 px-4'
						style={{
							borderStyle: 'dashed',
							borderColor: '#d6d6d6',
							cursor: 'pointer',
						}}
						onDragOver={(e) => {
							e.preventDefault();
							setIsDragging(true);
						}}
						onDragLeave={() => setIsDragging(false)}
						onDrop={handleDrop}
						onClick={() => fileInputRef.current?.click()}>
						{/* Icon */}
						<div className='mb-4'>
							<div
								className='mx-auto d-flex align-items-center justify-content-center rounded-3 shadow-sm'
								style={{
									width: 72,
									height: 72,
									background: 'linear-gradient(135deg, #7b2ff7, #5f9cff)',
								}}>
								<span className='text-white fs-3'>📄</span>
							</div>
						</div>
						<h5 className='fw-semibold mb-2'>
							{selectedFile ? selectedFile.name : 'Drop your Excel file here'}
						</h5>

						<div className='text-muted mb-1'>or click to browse</div>
						<small className='text-muted'>Supports .xlsx and .xls files</small>

						<input
							type='file'
							hidden
							accept='.xls,.xlsx'
							ref={fileInputRef}
							onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
						/>
					</div>
					<div className='d-flex justify-content-center mt-4'>
						<Button
							tag='a'
							color='info'
							isLight
							icon='Download'
							href='/files/PurchaseOrderSample.xlsx'
							download>
							Sample Sheet
						</Button>
					</div>
				</div>
			</ModalBody>

			<ModalFooter className='d-flex justify-content-end gap-2'>
				<Button color='danger' onClick={toggle} isLight>
					Close
				</Button>

				<Button
					color='primary'
					isLight
					isDisable={!selectedFile || isSubmitting}
					isLoading={isSubmitting}
					onClick={handleSubmit}>
					Upload Excel
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default BulkPurchaseOrder;
