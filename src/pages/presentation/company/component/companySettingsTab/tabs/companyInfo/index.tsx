import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardTitle,
	Button,
	CardActions,
	Input,
	FormGroup,
	Select,
	Option,
} from '../../../../../../../components/bootstrap';
import SimpleReactValidator from 'simple-react-validator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUpdateQueryListById } from '../../../../../../../hooks';
import { CompanyLogoUploader } from './companyLogoUploader';
import { companyModel } from '../../../../../../../common/model/company';
import { getCompanyDetailsById, updateCompany } from '../../../../../../../common/api/company';
import { useMasterData } from '../../../../../../../contexts/mastersContext';
import { SearchableSelect } from '../../../../../../../components/common';

export const CompanyInfoDetails = ({ companyId = '' }: any) => {
	const queryClient = useQueryClient();
	const [companyData, setCompanyData] = useState<any>({ ...companyModel });
	const [isSubmited, setIsSubmited] = useState(false);
	const [isFormLoading, setIsFormLoading] = useState(false);
	const {
		billingPatternList,
		isLoading: isbillingPatternLoading,
		isError: isbillingPatternError,
	} = useMasterData();
	const updateCompanyList = useUpdateQueryListById<any>(['companyList']);

	const validator = useRef(new SimpleReactValidator({ autoForceUpdate: this }));

	const {
		data: companyDetails,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ['companyDetails', companyId], // include companyId in the key
		queryFn: () => getCompanyDetailsById(companyId),
		enabled: !!companyId, // optional: only run if companyId exists
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		if (!isLoading && companyDetails) {
			setCompanyData({ ...companyModel, ...companyDetails });
		}
	}, [isLoading, companyDetails]);

	// Generic input change handler
	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		setCompanyData((prev: any) => ({
			...prev,
			[id]: value,
		}));
	}, []);

	const handleUpdateLogoUrl = (url: string) => {
		setCompanyData((prev: any) => ({
			...prev,
			logo: url,
		}));
	};

	const handleFormSubmit = useCallback(
		async (event?: React.FormEvent) => {
			event?.preventDefault(); // ✅ Stop page reload
			try {
				setIsSubmited(true);
				setIsFormLoading(true);
				const isValid = validator.current.allValid();
				if (!isValid) {
					validator.current.showMessages();
					return;
				}
				const body: any = {
					...companyData,
				};

				const res = await updateCompany(body?.id, body);

				updateCompanyList(res);
			} catch (err) {
				console.error('Error saving company:', err);
			} finally {
				setIsFormLoading(false);
			}
		},
		[companyData],
	);

	return (
		<Card stretch tag='form' noValidate onSubmit={handleFormSubmit}>
			<CardHeader>
				<CardLabel icon='Contacts' iconColor='info'>
					<CardTitle tag='div' className='h5'>
						Information
					</CardTitle>
				</CardLabel>
				<CardActions>
					<Button
						color='info'
						isLight
						type='submit'
						icon='Save'
						isLoading={isFormLoading}
						onClick={handleFormSubmit}>
						Update
					</Button>
				</CardActions>
			</CardHeader>

			<CardBody isScrollable>
				{isLoading && (
					<div className='text-center p-3'>
						<span className='spinner-border spinner-border-sm' /> Loading company
						details...
					</div>
				)}

				{isError && (
					<div className='alert alert-danger'>
						Failed to load Company details: {error?.message || 'Unknown error'}
					</div>
				)}

				{!isLoading && !isError && (
					<div className='row g-3'>
						<div className='col-6'>
							<FormGroup id='name' label='Company Name' isFloating>
								<Input
									id='name'
									value={companyData.name || ''}
									onChange={handleChange}
									disabled={isLoading}
									isValid={validator.current.fieldValid('name')}
									isTouched={isSubmited}
									invalidFeedback={validator.current.message(
										'name',
										companyData.name,
										'required',
									)}
								/>
							</FormGroup>
						</div>
						<div className='col-6'>
							<FormGroup id='tradeName' label='Trade Name' isFloating>
								<Input
									id='tradeName'
									value={companyData.tradeName || ''}
									onChange={handleChange}
									disabled={isLoading}
									isValid={validator.current.fieldValid('Trade Name')}
									isTouched={isSubmited}
									invalidFeedback={validator.current.message(
										'Trade Name',
										companyData.tradeName,
										'required',
									)}
								/>
							</FormGroup>
						</div>
						<div className='col-6'>
							<FormGroup id='vatRegNo' label='VAT Registration No' isFloating>
								<Input
									id='vatRegNo'
									type='number'
									value={companyData?.vatRegNo || ''}
									onChange={handleChange}
									disabled={isLoading}
									isValid={validator.current.fieldValid('VAT Regsitration No')}
									isTouched={isSubmited}
									invalidFeedback={validator.current.message(
										'VAT Regsitration No',
										companyData?.vatRegNo,
										'required',
									)}
								/>
							</FormGroup>
						</div>
						<div className='col-6'>
							<FormGroup id='companyRegNo' label='Company Registration No' isFloating>
								<Input
									id='companyRegNo'
									type='number'
									value={companyData?.companyRegNo || ''}
									onChange={handleChange}
									disabled={isLoading}
									isValid={validator.current.fieldValid(
										'Company Regsitration No',
									)}
									isTouched={isSubmited}
									invalidFeedback={validator.current.message(
										'Company Regsitration No',
										companyData?.companyRegNo,
										'required',
									)}
								/>
							</FormGroup>
						</div>
						<div className='col-6'>
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
						<div className='col-6'>
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
						<div className='col-6'>
							<FormGroup
								id={'ccBillingPattern'}
								label={'Client Contribution Billing Pattern'}
								isFloating>
								<SearchableSelect
									id={'ccBillingPattern'}
									label={'Client Contribution Billing Pattern'}
									value={companyData.ccBillingPattern}
									onChange={handleChange}
									isLoading={isbillingPatternLoading}
									disabled={isbillingPatternLoading} // ✅ disable select while loading
									isValid={validator.current.fieldValid(
										'Client Contribution Billing Pattern',
									)}
									isTouched={isSubmited}
									invalidFeedback={validator.current.message(
										'Client Contribution Billing Pattern',
										companyData.ccBillingPattern,
										'required',
									)}
									options={billingPatternList}
									valueKey='id'
									labelKey='billingFormula'
								/>
							</FormGroup>
						</div>
						<div className='col-6'>
							<FormGroup
								id={'privateBillingPattern'}
								label={'Private Billing Pattern'}
								isFloating>
								<SearchableSelect
									id={'privateBillingPattern'}
									value={companyData.privateBillingPattern}
									onChange={handleChange}
									label={'Private Billing Pattern'}
									isLoading={isbillingPatternLoading}
									disabled={isbillingPatternLoading} // ✅ disable select while loading
									isValid={validator.current.fieldValid(
										'Private Billing Pattern',
									)}
									isTouched={isSubmited}
									invalidFeedback={validator.current.message(
										'Private Billing Pattern',
										companyData.privateBillingPattern,
										'required',
									)}
									options={billingPatternList}
									valueKey='id'
									labelKey='billingFormula'
								/>
							</FormGroup>
						</div>
						<div className='col-6'>
							<FormGroup
								id={'familyTopupPattern'}
								label={'Famil Topup Pattern'}
								isFloating>
								<SearchableSelect
									id={'familyTopupPattern'}
									value={companyData.familyTopupPattern}
									onChange={handleChange}
									disabled={isbillingPatternLoading} // ✅ disable select while loading
									isValid={validator.current.fieldValid('Family Billing Pattern')}
									isTouched={isSubmited}
									invalidFeedback={validator.current.message(
										'Family Billing Pattern',
										companyData.familyTopupPattern,
										'required',
									)}
									options={billingPatternList}
									valueKey='id'
									labelKey='billingFormula'
								/>
								{/* {isbillingPatternLoading ? (
										<Option value='' disabled>
											Loading Billing Pattern...
										</Option>
									) : (
										<>
											<Option value=''>Select Family Billing Pattern</Option>
											{billingPatternList.map((bill: any) => (
												<Option value={bill.id} key={bill.id}>
													{bill?.name} (
													<strong>{bill?.billingFormula}</strong>)
												</Option>
											))}
										</>
									)}
								</Select> */}
							</FormGroup>
						</div>

						<div className='col-6'>
							<FormGroup id='registerManager' label='Register Manager' isFloating>
								<Input
									id='registerManager'
									value={companyData.registerManager || ''}
									onChange={handleChange}
									disabled={isLoading}
									isValid={validator.current.fieldValid('Register Manager')}
									isTouched={isSubmited}
									invalidFeedback={validator.current.message(
										'Register Manager',
										companyData.registerManager,
										'required',
									)}
								/>
							</FormGroup>
						</div>

						<div className='col-6'>
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
						<div className='col-6'>
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
						<div className='col-6'>
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
						<div className='col-6'>
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
						<div className='col-6'>
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
								<Input
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
									)}
								/>
							</FormGroup>
						</div>

						

						<div className='col-12'>
							<CompanyLogoUploader
								onUpdateLogo={handleUpdateLogoUrl}
								logoUrl={companyData.logo}
								companyName={companyData.name}
								fileName={`${companyData.name}_${companyData.id}`}
							/>
						</div>
					</div>
				)}
			</CardBody>
		</Card>
	);
};
