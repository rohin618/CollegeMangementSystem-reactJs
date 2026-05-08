import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
	OffCanvas,
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
	FormGroup,
	Input,
	Button,
	Textarea,
} from '../../../../../components/bootstrap';
import { companyModel } from '../../../../../common/model/company';
import { createCompany, updateCompany } from '../../../../../common/api/company';
import SimpleReactValidator from 'simple-react-validator';
import { useUpdateQueryListById } from '../../../../../hooks';
import { useNavigate } from 'react-router-dom';

export const CompanyForm = ({
	companyList,
	isOpen,
	toggle,
	companyEditObject = null,
	lastLargeNumer = 1001,
}: any) => {
	const [companyData, setCompanyData] = useState<any>({ ...companyModel });
	const [isLoading, setIsLoading] = useState(false);
	const validator = useRef(new SimpleReactValidator());
	const [isSubmited, setIsSubmited] = useState(false);
	const updateCompanyList = useUpdateQueryListById<any>(['companyList']);

	const navigate = useNavigate();

	// 🔹 Fix: Reset form when edit object changes OR when drawer opens
	useEffect(() => {
		if (companyEditObject) {
			setCompanyData({ ...companyEditObject });
		} else {
			if (isOpen) {
				setCompanyData({ ...companyModel, code: lastLargeNumer });
			} else {
				setCompanyData({ ...companyModel, code: 1001 });
			}
		}
	}, [companyEditObject, isOpen]);

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		setCompanyData((prev: any) => ({
			...prev,
			[id]: value,
		}));
	}, []);

	const handleFormSubmit = useCallback(async () => {
		setIsSubmited(true);

		if (!validator.current.allValid()) {
			validator.current.showMessages();
			return;
		}

		setIsLoading(true);

		try {
			const payload = { ...companyData };

			const response = payload.id
				? await updateCompany(payload.id, payload)
				: await createCompany(payload);
			validator.current.hideMessages();
			updateCompanyList(response); // prefer API response
			toggle();

			if (!companyEditObject && response.id) {
				navigate(`/company/${response?.id}?companyName=${response?.name}`);
			}
		} catch (error) {
			console.error('Error saving company:', error);
		} finally {
			setIsLoading(false);
			setIsSubmited(false);
		}
	}, [companyData, updateCompanyList]);

	useEffect(() => {
		if (!isOpen) {
			validator.current.hideMessages();
			setIsSubmited(false);
			setCompanyData({ ...companyModel });
		}
	}, [isOpen]);

	const isTradeNameExist = useMemo(() => {
		// Skip if empty input or no list
		if (!companyData?.tradeName || !companyList?.length) return '';

		const normalizedTradeName = companyData.tradeName.toLowerCase().trim();

		const alreadyExists = companyList.some(
			(c: any) =>
				c.tradeName?.toLowerCase().trim() === normalizedTradeName &&
				c.id !== companyData.id, // skip current company during edit
		);

		return alreadyExists ? `${companyData.tradeName} already exists` : '';
	}, [companyList, companyData?.tradeName, companyData?.id]);

	return (
		<OffCanvas
			id='companyCanvas'
			titleId='companyCanvasLabel'
			placement='end'
			isOpen={isOpen}
			isBackdrop={false}
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='companyCanvasLabel'>
					{companyEditObject ? 'Edit Company' : 'Create Company'}
				</OffCanvasTitle>
			</OffCanvasHeader>

			<OffCanvasBody>
				<div className='row g-3'>
					<div className='col-12'>
						<FormGroup id='name' label='Company Name' className='mb-2' isFloating>
							<Input
								isValid={validator.current.fieldValid('Company Name')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Company Name',
									companyData.name,
									'required',
								)}
								value={companyData.name || ''}
								onChange={handleChange}
								disabled={isLoading}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<FormGroup id='tradeName' label='Trade Name' isFloating>
							<Input
								id='tradeName'
								value={companyData.tradeName || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={
									validator.current.fieldValid('Trade Name') && !isTradeNameExist
								}
								isTouched={isSubmited || !!isTradeNameExist}
								invalidFeedback={
									validator.current.message(
										'Trade Name',
										companyData.tradeName,
										'required',
									) || isTradeNameExist
								}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='shortName' label='Short Name' isFloating>
							<Input
								id='shortName'
								value={companyData.shortName || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Short Name')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Short Name',
									companyData.shortName,
									'required',
								)}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='phone' label='Phone' isFloating>
							<Input
								id='phone'
								placeholder='Enter Phone'
								value={companyData.phone}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Phone')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Phone',
									companyData.phone,
									'required|phone',
								)}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='email' label='Email' isFloating>
							<Input
								id='email'
								placeholder='Enter Email'
								value={companyData.email}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Email')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'email',
									companyData.email,
									'required|email',
								)}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='smtpUser' label='SMTP User' isFloating>
							<Input
								id='smtpUser'
								value={companyData.smtpUser || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('SMTP User')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'SMTP User',
									companyData.smtpUser,
									'required',
								)}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='smtpPass' label='SMTP Password' isFloating>
							<Input
								id='smtpPass'
								value={companyData.smtpPass || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('SMTP Password')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'SMTP Password',
									companyData.smtpPass,
									'required',
								)}
							/>
						</FormGroup>
					</div>
					<div className='col-12'>
						<FormGroup id='buildingNumber' label='Building Number' isFloating>
							<Input
								id='buildingNumber'
								placeholder='Enter Building Number'
								value={companyData.buildingNumber}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Building Number')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Building Number',
									companyData.buildingNumber,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Area */}
					<div className='col-12'>
						<FormGroup id='area' label='Area' isFloating>
							<Input
								id='area'
								placeholder='Enter Area'
								value={companyData.area}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Area')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Area',
									companyData.area,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Post Code */}
					<div className='col-12'>
						<FormGroup id='postCode' label='Post Code' isFloating>
							<Input
								id='postCode'
								placeholder='Enter Post Code'
								value={companyData.postCode}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Post Code')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Post Code',
									companyData.postCode,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Address */}
					<div className='col-12'>
						<FormGroup id='address' label='Address' isFloating>
							<Textarea
								rows={3}
								id='address'
								placeholder='Enter Address'
								value={companyData.address}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Address')}
								isTouched={isSubmited}
								invalidFeedback={validator.current.message(
									'Address',
									companyData.address,
									'required',
								)}></Textarea>
						</FormGroup>
					</div>
				</div>
			</OffCanvasBody>
			<div className='row m-0'>
				<div className='col-12 p-3 pb-0'>
					<Button
						color='info'
						className='w-100'
						onClick={handleFormSubmit}
						isLoading={isLoading}
						isDisable={!!isTradeNameExist || isLoading}>
						{companyData?.id ? 'Update' : 'Save'}
					</Button>
				</div>
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
