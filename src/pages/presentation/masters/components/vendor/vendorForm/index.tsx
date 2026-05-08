import React, { useEffect, useMemo, useRef, useState } from 'react';
import SimpleReactValidator from 'simple-react-validator';
import {
	Button,
	FormGroup,
	Input,
	OffCanvas,
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
	Textarea,
} from '../../../../../../components/bootstrap';
import { VENDOR_STATUS } from '../../../../../../common/constant';
import { SearchableSelect } from '../../../../../../components/common';
import { PAYMENT_METHOD_LIST, VENDOR_STATUS_LIST } from '../../../../../../common/data/option';

const PAYMENT_MODE_OPTIONS = PAYMENT_METHOD_LIST.filter(
	(m) => m.value === 4 || m.value === 8, // Direct Debit (4), BACS (8)
);

interface VendorFormProps {
	isOpen: boolean;
	toggle: () => void;
	vendorData: any;
	handleChange: (e: any) => void;
	onSubmit: () => Promise<void>;
	isEdit: boolean;
	vendorList: any[];
	onEmailsChange: (emails: any[]) => void;
	onPhonesChange: (phones: any[]) => void;
	activeTab?: 'details' | 'contracts' | 'rating';
	setActiveTab?: (tab: 'details' | 'contracts' | 'rating') => void;
	contractsContent?: React.ReactNode;
	ratingContent?: React.ReactNode;
}

const VendorForm: React.FC<VendorFormProps> = ({
	isOpen,
	toggle,
	vendorData,
	handleChange,
	onSubmit,
	isEdit,
	vendorList,
	onEmailsChange,
	onPhonesChange,
	activeTab = 'details',
	setActiveTab,
	contractsContent,
	ratingContent,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const validator = useRef(new SimpleReactValidator());
	const [isSubmited, setIsSubmited] = useState(false);
	const autoFillInputRef = useRef<HTMLInputElement>(null);
	const [isAutoFilling, setIsAutoFilling] = useState(false);
	const [autoFillMessage, setAutoFillMessage] = useState<{ type: string; text: string } | null>(null);

	useEffect(() => {
		if (isOpen) {
			setIsSubmited(false);
		}
	}, [isOpen]);

	const handleSubmit = async () => {
		setIsSubmited(true);

		if (!validator.current.allValid()) {
			validator.current.showMessages();
			return;
		}

		try {
			setIsLoading(true);
			await onSubmit();
			toggle();
		} finally {
			setIsLoading(false);
			setIsSubmited(false);
		}
	};

	const isTradeNameExist = useMemo(() => {
		// Skip if no input or no vendors
		if (!vendorData?.tradeName || !vendorList?.length) return '';

		const alreadyExists = vendorList
			.filter((v: any) => +v.status === VENDOR_STATUS.ACTIVE)
			.some(
				(v: any) =>
					v.tradeName?.toLowerCase().trim() ===
						vendorData.tradeName.toLowerCase().trim() && v.id !== vendorData.id, // ✅ skip same record when editing
			);

		return alreadyExists ? `${vendorData.tradeName} already exists` : '';
	}, [vendorList, vendorData?.tradeName, vendorData?.id]);

	// Email helpers
	const handleEmailChange = (id: string, field: string, value: any) => {
		const emails = (vendorData?.emails || []).map((e: any) => {
			if (field === 'isPrimary' && value === true) {
				return { ...e, isPrimary: e.id === id };
			}
			if (e.id === id) return { ...e, [field]: value };
			return e;
		});
		onEmailsChange(emails);
	};

	const handleAddEmail = () => {
		const emails = vendorData?.emails || [];
		const newEmail = {
			id: Math.random().toString(36).slice(2),
			email: '',
			isPrimary: emails.length === 0,
		};
		onEmailsChange([...emails, newEmail]);
	};

	const handleRemoveEmail = (id: string) => {
		const emails = (vendorData?.emails || []).filter((e: any) => e.id !== id);
		onEmailsChange(emails);
	};

	// Phone helpers
	const handlePhoneChange = (id: string, field: string, value: any) => {
		const phones = (vendorData?.phones || []).map((p: any) => {
			if (field === 'isPrimary' && value === true) {
				return { ...p, isPrimary: p.id === id };
			}
			if (p.id === id) return { ...p, [field]: value };
			return p;
		});
		onPhonesChange(phones);
	};

	const handleAddPhone = () => {
		const phones = vendorData?.phones || [];
		const newPhone = {
			id: Math.random().toString(36).slice(2),
			phone: '',
			isPrimary: phones.length === 0,
		};
		onPhonesChange([...phones, newPhone]);
	};

	const handleRemovePhone = (id: string) => {
		const phones = (vendorData?.phones || []).filter((p: any) => p.id !== id);
		onPhonesChange(phones);
	};

	const handleAutoFillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsAutoFilling(true);
		setAutoFillMessage(null);

		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch(`${import.meta.env.VITE_API_URL}/parse/vendor`, {
				method: 'POST',
				body: formData,
			});

			const result = await response.json();

			if (!result.success) throw new Error(result.message);

			const extracted = result.fields;
			let fieldsFound = 0;

			// Only accept clean single-line text — reject values containing URLs or newlines
			const isCleanText = (val: string) =>
				!!val && !val.includes('\n') && !val.match(/https?:\/\/|www\./i);

			// Direct scalar fields that map 1-to-1 to form fields
			const directFields = [
				'name', 'tradeName', 'postCode',
				'addressLine1', 'addressLine2', 'city',
				'vatRegNo', 'referenceNo',
			];
			directFields.forEach((key) => {
				const val = extracted[key];
				if (!val || !isCleanText(val)) return;
				if (vendorData[key as keyof typeof vendorData]) return; // skip already-filled fields
				handleChange({ target: { id: key, value: val.trim(), type: 'text' } });
				fieldsFound++;
			});

			// emailId / email → emails array (what the UI actually renders)
			const extractedEmail = (extracted.emailId || extracted.email || '').trim();
			if (extractedEmail) {
				const existingEmails: any[] = vendorData?.emails || [];
				const hasEmail = existingEmails.some((e: any) => e.email?.trim());
				if (!hasEmail) {
					onEmailsChange([{
						id: Math.random().toString(36).slice(2),
						email: extractedEmail,
						isPrimary: true,
					}]);
					fieldsFound++;
				}
			}

			// primaryPhone / phone → phones array (what the UI actually renders)
			const extractedPhone = (extracted.primaryPhone || extracted.phone || '').trim();
			if (extractedPhone) {
				const existingPhones: any[] = vendorData?.phones || [];
				const hasPhone = existingPhones.some((p: any) => p.phone?.trim());
				if (!hasPhone) {
					onPhonesChange([{
						id: Math.random().toString(36).slice(2),
						phone: extractedPhone,
						isPrimary: true,
					}]);
					fieldsFound++;
				}
			}

			if (fieldsFound === 0) {
				setAutoFillMessage({
					type: 'warning',
					text: 'No fields detected. Please fill in manually.',
				});
				return;
			}

			setAutoFillMessage({
				type: 'success',
				text: `${fieldsFound} field${fieldsFound > 1 ? 's' : ''} auto-filled. Please review before saving.`,
			});
		} catch (err: any) {
			setAutoFillMessage({ type: 'warning', text: `Auto-fill failed: ${err.message}` });
		} finally {
			setIsAutoFilling(false);
			if (autoFillInputRef.current) autoFillInputRef.current.value = '';
		}
	};

	return (
		<OffCanvas
			id='vendorCanvas'
			titleId='vendorCanvasLabel'
			placement='end'
			isOpen={isOpen}
			isBackdrop={false}
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='vendorCanvasLabel'>
					{isEdit ? 'Edit Vendor' : 'Create Vendor'}
				</OffCanvasTitle>
			</OffCanvasHeader>

			{isEdit && setActiveTab && (
				<div className='d-flex gap-2 px-3 pt-3 pb-0 border-bottom'>
					<button
						className={`btn btn-sm ${activeTab === 'details' ? 'btn-info' : 'btn-outline-secondary'}`}
						onClick={() => setActiveTab('details')}>
						Details
					</button>
					<button
						className={`btn btn-sm ${activeTab === 'contracts' ? 'btn-info' : 'btn-outline-secondary'}`}
						onClick={() => setActiveTab('contracts')}>
						Contracts
					</button>
					<button
						className={`btn btn-sm ${activeTab === 'rating' ? 'btn-info' : 'btn-outline-secondary'}`}
						onClick={() => setActiveTab('rating')}>
						Rating
					</button>
				</div>
			)}

			{activeTab === 'details' ? (
			<OffCanvasBody>
				{/* Smart Auto-Fill */}
				<div className='border rounded p-3 mb-3' style={{ background: '#f8f9ff' }}>
					<div className='fw-bold mb-1 small'>Smart Auto-Fill</div>
					<div className='text-muted mb-2' style={{ fontSize: 12 }}>
						Upload a quotation, invoice or contract — fields will be filled automatically.
					</div>
					<div className='d-flex gap-2 align-items-center'>
						<input
							type='file'
							accept='.pdf,image/*'
							ref={autoFillInputRef}
							style={{ display: 'none' }}
							onChange={handleAutoFillUpload}
						/>
						<Button
							color='info'
							isLight
							icon='Upload'
							size='sm'
							isLoading={isAutoFilling}
							onClick={() => autoFillInputRef.current?.click()}>
							Upload Document
						</Button>
						{autoFillMessage && (
							<small
								className={
									autoFillMessage.type === 'success'
										? 'text-success'
										: 'text-warning'
								}>
								{autoFillMessage.text}
							</small>
						)}
					</div>
				</div>

				<div className='row g-3'>
					{/* Vendor Name */}
					<div className='col-12'>
						<FormGroup id='name' label='Vendor Name' isFloating>
							<Input
								value={vendorData?.name}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Vendor Name')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Vendor Name',
									vendorData?.name,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<FormGroup id='tradeName' label='Trade Name' isFloating>
						<Input
							id='tradeName'
							value={vendorData?.tradeName}
							onChange={handleChange}
							disabled={isLoading}
							isValid={
								validator.current.fieldValid('Trade Name') && !isTradeNameExist
							}
							isTouched={isSubmited || !!isTradeNameExist}
							invalidFeedback={
								validator.current.message(
									'Trade Name',
									vendorData?.tradeName,
									'required',
								) || isTradeNameExist
							}
						/>
					</FormGroup>

					{/* Description */}
					<div className='col-12'>
						<FormGroup id='description' label='Description (Goods/Services)' isFloating>
							<Textarea
								value={vendorData?.description}
								onChange={handleChange}
								disabled={isLoading}
								rows={3}
							/>
						</FormGroup>
					</div>

					{/* Payment Mode */}
					<div className='col-12'>
						<FormGroup id='paymentMode' label='Payment Mode' isFloating>
							<SearchableSelect
								id='paymentMode'
								name='paymentMode'
								value={vendorData?.paymentMode}
								onChange={handleChange}
								options={PAYMENT_MODE_OPTIONS}
								labelKey='label'
								valueKey='value'
							/>
						</FormGroup>
						{isSubmited &&
							validator.current.message(
								'Payment Mode',
								vendorData?.paymentMode,
								'required',
							) && (
								<div className='invalid-feedback d-block'>
									{validator.current.message(
										'Payment Mode',
										vendorData?.paymentMode,
										'required',
									)}
								</div>
							)}
					</div>

					{/* Email Addresses */}
					<div className='col-12'>
						<div className='fw-bold fs-6 mb-2'>Email Addresses</div>
						{(vendorData?.emails || []).map((emailItem: any) => (
							<div
								key={emailItem.id}
								className='d-flex align-items-center gap-2 mb-2'>
								<div className='flex-grow-1'>
									<Input
										value={emailItem.email}
										onChange={(e: any) =>
											handleEmailChange(emailItem.id, 'email', e.target.value)
										}
										disabled={isLoading}
										placeholder='Email address'
									/>
								</div>
								<Button
									color={emailItem.isPrimary ? 'success' : 'light'}
									size='sm'
									onClick={() =>
										handleEmailChange(emailItem.id, 'isPrimary', true)
									}
									isDisable={emailItem.isPrimary}>
									Primary
								</Button>
								<Button
									color='danger'
									size='sm'
									isOutline
									onClick={() => handleRemoveEmail(emailItem.id)}
									isDisable={isLoading || (vendorData?.emails || []).length <= 1}>
									×
								</Button>
							</div>
						))}
						<Button
							color='info'
							size='sm'
							isOutline
							onClick={handleAddEmail}
							isDisable={isLoading}>
							+ Add Email
						</Button>
					</div>

					{/* VAT Register No */}
					<div className='col-12'>
						<FormGroup id='vatRegNo' label='VAT Reg No' isFloating>
							<Input
								value={vendorData?.vatRegNo}
								onChange={handleChange}
								disabled={isLoading}
							/>
						</FormGroup>
					</div>
					{/* Reference No */}
					<div className='col-12'>
						<FormGroup id='referenceNo' label='Reference No' isFloating>
							<Input
								value={vendorData?.referenceNo}
								onChange={handleChange}
								disabled={isLoading}
							/>
						</FormGroup>
					</div>

					{/* Phone Numbers */}
					<div className='col-12'>
						<div className='fw-bold fs-6 mb-2'>Phone Numbers</div>
						{(vendorData?.phones || []).map((phoneItem: any) => (
							<div
								key={phoneItem.id}
								className='d-flex align-items-center gap-2 mb-2'>
								<div className='flex-grow-1'>
									<Input
										value={phoneItem.phone}
										onChange={(e: any) =>
											handlePhoneChange(phoneItem.id, 'phone', e.target.value)
										}
										disabled={isLoading}
										placeholder='Phone number'
									/>
								</div>
								<Button
									color={phoneItem.isPrimary ? 'success' : 'light'}
									size='sm'
									onClick={() =>
										handlePhoneChange(phoneItem.id, 'isPrimary', true)
									}
									isDisable={phoneItem.isPrimary}>
									Primary
								</Button>
								<Button
									color='danger'
									size='sm'
									isOutline
									onClick={() => handleRemovePhone(phoneItem.id)}
									isDisable={isLoading || (vendorData?.phones || []).length <= 1}>
									×
								</Button>
							</div>
						))}
						<Button
							color='info'
							size='sm'
							isOutline
							onClick={handleAddPhone}
							isDisable={isLoading}>
							+ Add Phone
						</Button>
					</div>

					<div className='col-12'>
						<FormGroup id='addressLine1' label='Address Line 1' isFloating>
							<Input
								value={vendorData?.addressLine1}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Address Line 1')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Address Line 1',
									vendorData?.addressLine1,
									'required',
								)}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='addressLine2' label='Address Line 2' isFloating>
							<Input
								value={vendorData?.addressLine2}
								onChange={handleChange}
								disabled={isLoading}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='city' label='City' isFloating>
							<Input
								value={vendorData?.city}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('City')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'City',
									vendorData?.city,
									'required',
								)}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='postCode' label='Post Code' isFloating>
							<Input
								value={vendorData?.postCode}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Post Code')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Post Code',
									vendorData?.postCode,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<FormGroup id='country' label='Country' isFloating>
							<Input value='United Kingdom' disabled />
						</FormGroup>
					</div>

					<div className='col-12 fw-bold fs-6 mt-3 mb-2'>Vendor Bank Details</div>

					<div className='col-12'>
						<FormGroup id='bankName' label='Bank Name' isFloating>
							<Input
								value={vendorData?.bankName}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Bank Name')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Bank Name',
									vendorData?.bankName,
									'required',
								)}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='accountName' label='Account Name' isFloating>
							<Input
								value={vendorData?.accountName}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Account Name')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Account Name',
									vendorData?.accountName,
									'required',
								)}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='accountNumber' label='Account Number' isFloating>
							<Input
								type='number'
								value={vendorData?.accountNumber}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Account Number')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Account Number',
									vendorData?.accountNumber,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<FormGroup id='sortCode' label='Short Code' isFloating>
							<Input
								value={vendorData?.sortCode}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Short Code')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Short Code',
									vendorData?.sortCode,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<FormGroup id='IBAN' label='IBAN' isFloating>
							<Input
								value={vendorData?.IBAN}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('IBAN')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'IBAN',
									vendorData?.IBAN,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<FormGroup id='BIC' label='BIC' isFloating>
							<Input
								value={vendorData?.BIC}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('BIC')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'BIC',
									vendorData?.BIC,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<FormGroup id='bankAddress' label='Bank Address' isFloating>
							<Textarea
								value={vendorData?.bankAddress}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Bank Address')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Bank Address',
									vendorData?.bankAddress,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Status */}
					<div className='col-12'>
						<FormGroup id='status' label='Status' isFloating>
							<SearchableSelect
								id='status'
								name='status'
								value={vendorData?.status}
								onChange={handleChange}
								options={VENDOR_STATUS_LIST}
								labelKey='label'
								valueKey='value'
							/>
						</FormGroup>
					</div>
				</div>
			</OffCanvasBody>
			) : (
				<OffCanvasBody className='p-0'>
					{activeTab === 'contracts' ? contractsContent : ratingContent}
				</OffCanvasBody>
			)}

			{/* Footer */}
			<div className='row m-0'>
				{activeTab === 'details' && (
					<div className='col-12 p-3 pb-0'>
						<Button
							color='info'
							className='w-100'
							onClick={handleSubmit}
							isLoading={isLoading}>
							{vendorData?.id ? 'Update' : 'Save'}
						</Button>
					</div>
				)}

				<div className='col-12 p-3'>
					<Button
						isOutline
						color='danger'
						className='w-100'
						onClick={toggle}
						isDisable={isLoading}>
						Close
					</Button>
				</div>
			</div>
		</OffCanvas>
	);
};

export default VendorForm;
