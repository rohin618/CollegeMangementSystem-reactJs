import React, { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../../../firebase';
import {
	Button,
	FormGroup,
	Input,
	Spinner,
} from '../../../../../../components/bootstrap';
import { DateTimePicker } from '../../../../../../components/common';

interface VendorContract {
	id: string;
	vendorId: string;
	companyId: string;
	contractName: string;
	startDate: string;
	endDate: string;
	fileUrl: string;
	fileName: string;
	uploadedAt: any;
}

interface VendorContractsProps {
	vendorId: string;
	companyId: string;
}

const emptyForm = { contractName: '', startDate: '', endDate: '', file: null as File | null };

const VendorContracts: React.FC<VendorContractsProps> = ({ vendorId, companyId }) => {
	const [contracts, setContracts] = useState<VendorContract[]>([]);
	const [isFetching, setIsFetching] = useState(false);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState({ ...emptyForm });
	const [isUploading, setIsUploading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const fetchContracts = async () => {
		setIsFetching(true);
		try {
			const q = query(collection(db, 'vendorContract'), where('vendorId', '==', vendorId));
			const snapshot = await getDocs(q);
			const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as VendorContract));
			setContracts(list);
		} finally {
			setIsFetching(false);
		}
	};

	useEffect(() => {
		if (vendorId) fetchContracts();
	}, [vendorId]);

	const handleFormChange = (e: any) => {
		const { id, value } = e.target;
		setForm((prev) => ({ ...prev, [id]: value }));
		if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }));
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] || null;
		setForm((prev) => ({ ...prev, file }));
		if (errors.file) setErrors((prev) => ({ ...prev, file: '' }));
	};

	const validate = () => {
		const newErrors: Record<string, string> = {};
		if (!form.contractName.trim()) newErrors.contractName = 'Contract name is required';
		if (!form.startDate) newErrors.startDate = 'Start date is required';
		if (!form.endDate) newErrors.endDate = 'End date is required';
		if (!form.file) newErrors.file = 'File is required';
		return newErrors;
	};

	const handleSubmit = async () => {
		const validationErrors = validate();
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}

		setIsUploading(true);
		try {
			const file = form.file!;
			const timestamp = Date.now();
			const storagePath = `vendorContracts/${companyId}/${vendorId}/${timestamp}_${file.name}`;
			const storageRef = ref(storage, storagePath);

			await new Promise<void>((resolve, reject) => {
				const uploadTask = uploadBytesResumable(storageRef, file);
				uploadTask.on('state_changed', null, reject, () => resolve());
			});

			const fileUrl = await getDownloadURL(storageRef);

			await addDoc(collection(db, 'vendorContract'), {
				vendorId,
				companyId,
				contractName: form.contractName,
				startDate: form.startDate,
				endDate: form.endDate,
				fileUrl,
				fileName: file.name,
				uploadedAt: serverTimestamp(),
			});

			setForm({ ...emptyForm });
			setShowForm(false);
			await fetchContracts();
		} finally {
			setIsUploading(false);
		}
	};

	const formatDate = (value: any): string => {
		if (!value) return '—';
		if (typeof value === 'string') return value;
		if (value?.toDate) return value.toDate().toLocaleDateString('en-GB');
		return String(value);
	};

	return (
		<div className='p-3'>
			<div className='d-flex justify-content-between align-items-center mb-3'>
				<span className='fw-bold fs-6'>Contracts</span>
				{!showForm && (
					<Button color='info' size='sm' isOutline onClick={() => setShowForm(true)}>
						+ Add Contract
					</Button>
				)}
			</div>

			{showForm && (
				<div className='border rounded p-3 mb-3 bg-light'>
					<div className='row g-3'>
						<div className='col-12'>
							<FormGroup id='contractName' label='Contract Name' isFloating>
								<Input
									id='contractName'
									value={form.contractName}
									onChange={handleFormChange}
									disabled={isUploading}
								/>
							</FormGroup>
							{errors.contractName && (
								<div className='invalid-feedback d-block'>{errors.contractName}</div>
							)}
						</div>

						<div className='col-12'>
							<FormGroup id='startDate'>
								<DateTimePicker
									id='startDate'
									isFloating
									label='Start Date'
									value={form.startDate}
									onChange={handleFormChange}
									disabled={isUploading}
								/>
							</FormGroup>
							{errors.startDate && (
								<div className='invalid-feedback d-block'>{errors.startDate}</div>
							)}
						</div>

						<div className='col-12'>
							<FormGroup id='endDate'>
								<DateTimePicker
									id='endDate'
									isFloating
									label='End Date'
									value={form.endDate}
									onChange={handleFormChange}
									disabled={isUploading}
								/>
							</FormGroup>
							{errors.endDate && (
								<div className='invalid-feedback d-block'>{errors.endDate}</div>
							)}
						</div>

						<div className='col-12'>
							<label className='form-label fw-semibold'>File (PDF or Word)</label>
							<input
								type='file'
								className='form-control'
								accept='.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
								onChange={handleFileChange}
								disabled={isUploading}
							/>
							{errors.file && (
								<div className='invalid-feedback d-block'>{errors.file}</div>
							)}
						</div>

						<div className='col-12 d-flex gap-2'>
							<Button
								color='info'
								size='sm'
								onClick={handleSubmit}
								isDisable={isUploading}>
								{isUploading ? (
									<>
										<Spinner size='sm' isSmall inButton /> Uploading...
									</>
								) : (
									'Save Contract'
								)}
							</Button>
							<Button
								color='danger'
								size='sm'
								isOutline
								onClick={() => {
									setShowForm(false);
									setForm({ ...emptyForm });
									setErrors({});
								}}
								isDisable={isUploading}>
								Cancel
							</Button>
						</div>
					</div>
				</div>
			)}

			{isFetching ? (
				<div className='text-center py-4'>
					<Spinner color='info' size='2x' />
				</div>
			) : contracts.length === 0 ? (
				<div className='text-muted text-center py-3'>No contracts uploaded yet.</div>
			) : (
				<div className='table-responsive'>
					<table className='table table-sm table-hover align-middle'>
						<thead>
							<tr>
								<th>Contract Name</th>
								<th>Start Date</th>
								<th>End Date</th>
								<th>Uploaded At</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{contracts.map((c) => (
								<tr key={c.id}>
									<td>{c.contractName}</td>
									<td>{formatDate(c.startDate)}</td>
									<td>{formatDate(c.endDate)}</td>
									<td>{formatDate(c.uploadedAt)}</td>
									<td>
										<a
											href={c.fileUrl}
											target='_blank'
											rel='noopener noreferrer'
											className='btn btn-sm btn-outline-info'>
											Download
										</a>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};

export default VendorContracts;
