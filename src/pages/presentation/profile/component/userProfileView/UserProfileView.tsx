import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
	Card,
	CardBody,
	CardHeader,
	FormGroup,
	Input,
	Select,
	Option,
	Spinner,
	Button,
} from '../../../../../components/bootstrap';
import SimpleReactValidator from 'simple-react-validator';
import { SALUTATION_LIST, USER_STATUS_LIST } from '../../../../../common/data/option';
import { MultiSelect, SearchableSelect } from '../../../../../components/common';
import { userModel } from '../../../../../common/model/user';

interface UserProfileViewProps {
	userEditFormObject?: any;
	isEditMode?: boolean;
	onSave?: (data: any) => Promise<void> | void;
	onCancel?: () => void;
	companyList?: { id: string; name: string }[];
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
	userEditFormObject = {},
	isEditMode = false,
	onSave = async () => {},
	onCancel = () => {},
	companyList = [],
}) => {
	const [userForm, setUserForm] = useState<any>({
		...userModel
	});
	const [isLoading, setIsLoading] = useState(false);
	const validator = useRef(new SimpleReactValidator());

	useEffect(() => {
		if (userEditFormObject) {
			setUserForm({ ...userEditFormObject });
		}
	}, [userEditFormObject]);

	// Handle normal inputs
	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | any) => {
			const { id, value } = e.target;
			setUserForm((prev: any) => ({ ...prev, [id]: value }));
		},
		[],
	);

	// Handle save
	const handleSubmit = useCallback(async () => {
		if (!validator.current.allValid()) {
			validator.current.showMessages();
			return;
		}

		try {
			setIsLoading(true);
			await onSave(userForm);
		} catch (error) {
			console.error('Error saving profile:', error);
		} finally {
			setIsLoading(false);
		}
	}, [userForm, onSave]);

	return (
		<Card className='shadow-sm border-0 h-100'>
			<CardBody className='p-4'>
				{isLoading ? (
					<div className='text-center py-5'>
						<Spinner color='primary' size='3x' />
					</div>
				) : (
					<div className='row g-4'>
						{/* Salutation */}
						<div className='col-md-6'>
							<FormGroup id='salutation' label='Salutation'>
								{isEditMode ? (
									<SearchableSelect
										id='salutation'
										value={userForm.salutation || ''}
										onChange={handleChange} options={SALUTATION_LIST} placeholder='Select Salutation' />
										
								) : (
									<p className='fw-semibold mb-0'>
										{SALUTATION_LIST.find(
											(el) => el.value == userForm.salutation,
										)?.label || '-'}
									</p>
								)}
							</FormGroup>
						</div>

						{/* Name */}
						<div className='col-md-6'>
							<FormGroup id='name' label='Full Name'>
								{isEditMode ? (
									<Input
										id='name'
										value={userForm.name}
										placeholder='Enter full name'
										onChange={handleChange}
									/>
								) : (
									<p className='fw-semibold mb-0'>{userForm.name || '-'}</p>
								)}
							</FormGroup>
						</div>

						{/* Email */}
						<div className='col-md-6'>
							<FormGroup id='email' label='Email Address'>
								
								{isEditMode ? (
									<Input
										type='email'
										id='email'
										value={userForm.email}
										onChange={handleChange}
										readOnly
									/>
								) : (
								<p className='fw-semibold mb-0'>{userForm.email || '-'}</p>
								 )} 
							</FormGroup>
						</div>

						{/* Phone */}
						<div className='col-md-6'>
							<FormGroup id='phone' label='Phone Number'>
								{isEditMode ? (
									<Input
										id='phone'
										value={userForm.phone}
										onChange={handleChange}
									/>
								) : (
									<p className='fw-semibold mb-0'>{userForm.phone || '-'}</p>
								)}
							</FormGroup>
						</div>

						{/* Code */}
						<div className='col-md-6'>
							<FormGroup id='code' label='User Code'>
								{isEditMode ? (
									<Input
										id='code'
										value={userForm.code}
										onChange={handleChange}
									/>
								) : (
									<p className='fw-semibold mb-0'>{userForm.code || '-'}</p>
								)}
							</FormGroup>
						</div>

						{/* Status */}
						<div className='col-md-6 '>
							<FormGroup id='status' label='Account Status'>
								{isEditMode ? (
									<SearchableSelect
										id='status'
										value={userForm.status}
										onChange={handleChange} options={USER_STATUS_LIST} placeholder='Select Account Status'/>
										
								) : (
									<span
										className={`ms-2 badge px-3 py-2 ${
											userForm.status === 'Active'
												? 'bg-success'
												: userForm.status === 'Inactive'
													? 'bg-secondary'
													: 'bg-danger'
										}`}>
										{userForm.status}
									</span>
								)}
							</FormGroup>
						</div>

						<div className='col-12'>
							<hr />
						</div>

						{/* Associated Companies */}
						<div className='col-12'>
							<h6 className='fw-bold mb-3 text-uppercase text-muted'>
								Associated Companies
							</h6>

							{/* if we want edit access then un-commet this one */}
							{/* {isEditMode ? ( 
								 <MultiSelect
									value={userForm.companyIds || []}
									id='companyIds'
									onChange={handleChange}
									labelKey='name'
									valueKey='id'
									options={companyList || []}
									isFloating
								/>
							) :  */}
							{userForm.companyIds?.length ? (
								<ul className='list-group'>
									{userForm.companyIds.map((id: string) => {
										const company = companyList?.find((c) => c.id === id);
										return (
											<li key={id} className='list-group-item'>
												{company?.name || ""}
											</li>
										);
									})}
								</ul>
							) : (
								<p className='text-muted'>No associated companies.</p>
							)}
						</div>

						{/* Action Buttons */}
						{isEditMode && (
							<div className='col-12 text-end mt-4'>
								<Button
									color='primary'
									onClick={handleSubmit}
									isLoading={isLoading}
									>
									Save
								</Button>
								<Button color='secondary' className='ms-2' onClick={onCancel} isDisable={isLoading}	>
									Cancel
								</Button>
							</div>
						)}
					</div>
				)}
			</CardBody>
		</Card>
	);
};
