import React from 'react';
import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardSubTitle,
	CardTitle,
	FormGroup,
	Input,
	Button,
	CardActions,
	InputGroup,
	InputGroupText,
	Select,
	Option,
} from '../../../../../../../components/bootstrap';
import {
	LPA_TYPE_LIST,
	NOK_EMAIL_TYPE_LIST,
	NOK_INVOICE_REQUIRED_LIST,
	SALUTATION_LIST,
} from '../../../../../../../common/data/option';
import {
	LPA_TYPE,
	NOK_EMAIL_TYPE,
	NOK_INVOICE_REQUIRED,
} from '../../../../../../../common/constant';
import { useQuery } from '@tanstack/react-query';
import { getAllRelationships } from '../../../../../../../common/api/relationship';
import { generateUid } from '../../../../../../../helpers/helpers';
import Swal from 'sweetalert2';
import { DateTimePicker, SearchableSelect } from '../../../../../../../components/common';

interface INok {
	id: string;
	name: string;
	email: string;
	phone: string;
	relation: string;
	address: string;
	salutation: number | ''; // allow empty for initial state
	lpa: number | '';
	lpaSdate: string;
	townOrCity: string;
	county: string;
	postcode: string;
	invoiceRequired: number | '';
	emailType: number | string;
}

interface GuardianSectionProps {
	data: { nok: INok[] };
	validator: any;
	isSubmited: boolean;
	onChange: (updatedList: INok[]) => void;
}

export const GuardianSection: React.FC<GuardianSectionProps> = ({
	data,
	validator,
	isSubmited,
	onChange,
}) => {
	const nokList = data.nok || [];

	const {
		data: relationList = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['relationship'],
		queryFn: getAllRelationships,
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});

	const handleChange = (index: number, field: keyof INok, value: string | number | boolean) => {
		let updatedList = [...nokList];
		updatedList[index] = { ...updatedList[index], [field]: value };

		// Special case: If field is LPA and value is not empty
		if (field === 'lpa' && value !== '') {
			const YES_VALUE = Number(value);
			updatedList = updatedList.map((item, i) => {
				if (i === index) return { ...item, invoiceRequired: NOK_INVOICE_REQUIRED.YES };
				return {
					...item,
					lpa: item.lpa === YES_VALUE ? LPA_TYPE.NO : item.lpa,
					invoiceRequired:
						value === LPA_TYPE.YES ? NOK_INVOICE_REQUIRED.NO : item.invoiceRequired,
				};
			});
			validator.purgeFields();
		}

		if (field === 'emailType' && value === NOK_EMAIL_TYPE.PRIMARY) {
			updatedList = updatedList.map((item, i) => {
				if (i === index) {
					return { ...item, emailType: NOK_EMAIL_TYPE.PRIMARY };
				}

				return { ...item, emailType: NOK_EMAIL_TYPE.SECONDARY };
			});
			validator.purgeFields();
		}

		onChange(updatedList);
	};

	const handleAdd = () => {
		onChange([
			...nokList,
			{
				id: generateUid(),
				name: '',
				email: '',
				phone: '',
				relation: '',
				address: '',
				salutation: '',
				lpa: '',
				lpaSdate: '',
				townOrCity: '',
				county: '',
				postcode: '',
				invoiceRequired: '',
				emailType: '',
			},
		]);
	};

	const handleDelete = (index: number) => {
		Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel',
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			customClass: {
				popup: 'my-swal-popup',
				confirmButton: 'btn btn-light-info',
				cancelButton: 'btn btn-light-danger',
			},
		}).then((result) => {
			if (!result.isConfirmed) return;
			const updatedList = nokList.filter((_, i) => i !== index);
			onChange(updatedList);
		});
	};

	const canAdd = nokList.every(
		(nok, index) =>
			nok.name?.trim() &&
			nok.email?.trim() &&
			nok.phone?.trim() &&
			nok.relation?.trim() &&
			nok.address?.trim() &&
			nok.townOrCity?.trim() &&
			nok.county?.trim() &&
			nok.postcode?.trim() &&
			nok.salutation !== '' &&
			nok.lpa !== '' &&
			nok.emailType !== '',
		// validator.fieldValid(`Guardian Name ${index}`) &&
		// validator.fieldValid(`Guardian Email ${index}`) &&
		// validator.fieldValid(`Guardian Phone ${index}`) &&
		// validator.fieldValid(`Guardian Relation ${index}`) &&
		// validator.fieldValid(`Guardian Address ${index}`) &&
		// validator.fieldValid(`Guardian Town / City ${index}`) &&
		// validator.fieldValid(`Guardian County ${index}`) &&
		// validator.fieldValid(`Guardian Postcode ${index}`) &&
		// validator.fieldValid(`Guardian (LPA) Start Date ${index}`) &&
		// validator.fieldValid(`Guardian Invoice Required ${index}`),
	);

	return (
		<Card>
			<CardHeader>
				<CardLabel icon='Phonelink' iconColor='danger'>
					<CardTitle tag='div' className='h5'>
						Next Of Kin
					</CardTitle>
					<CardSubTitle tag='div' className='h6'>
						Next Of Kin contact information
					</CardSubTitle>
				</CardLabel>
				<CardActions>
					<Button color='info' isLight onClick={handleAdd} isDisable={!canAdd}>
						+ Add Next of Kin
					</Button>
				</CardActions>
			</CardHeader>

			<CardBody>
				{nokList.map((nok, index) => (
					<div key={index} className='row g-4 border rounded p-3 mb-3'>
						<div className='col-12 d-flex justify-content-between align-items-center'>
							<h6 className='mb-0'>NOK Details #{index + 1}</h6>
						</div>
						{/* Salutation + Name */}
						<div className='col-md-6'>
							<InputGroup>
								<InputGroupText className='p-0'>
									<FormGroup id={`salutation-${index}`}>
										<SearchableSelect
											id='Salutation'
											value={nok.salutation}
											onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
												handleChange(
													index,
													'salutation',
													e.target.value === ''
														? ''
														: Number(e.target.value),
												)
											}
											options={SALUTATION_LIST}
											placeholder='Select Salutation'
										/>
									</FormGroup>
								</InputGroupText>

								<FormGroup id={`name-${index}`} label='Name of NOK' isFloating>
									<Input
										placeholder='Name of NOK'
										value={nok.name}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											handleChange(index, 'name', e.target.value)
										}
										// isValid={validator.fieldValid(`Guardian Name ${index}`)}
										// isTouched={isSubmited}
										// invalidFeedback={validator.message(`Guardian Name ${index}`, nok.name, "required")}
									/>
								</FormGroup>
							</InputGroup>
						</div>

						{/* Email */}
						<div className='col-md-6'>
							<FormGroup id={`email-${index}`} label='Email' isFloating>
								<Input
									placeholder='Email'
									value={nok.email}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										handleChange(index, 'email', e.target.value)
									}
									// isValid={validator.fieldValid(`Guardian Email ${index}`)}
									// isTouched={isSubmited}
									// invalidFeedback={validator.message(`Guardian Email ${index}`, nok.email, "required|email")}
								/>
							</FormGroup>
						</div>

						<div className='col-md-6'>
							<FormGroup
								id={`emailType-${index}`}
								label='Email Type'
								isFloating>
								<SearchableSelect
									name='emailType'
									value={nok.emailType}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
										handleChange(
											index,
											'emailType',
											e.target.value === '' ? '' : Number(e.target.value),
										)
									}
									options={NOK_EMAIL_TYPE_LIST}
									placeholder='Select Email Type Required'
								/>
							</FormGroup>
						</div>
						{/* Phone */}
						<div className='col-md-6'>
							<FormGroup id={`phone-${index}`} label='Phone' isFloating>
								<Input
									placeholder='Phone'
									value={nok.phone}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										handleChange(index, 'phone', e.target.value)
									}
									// isValid={validator.fieldValid(`Guardian Phone ${index}`)}
									// isTouched={isSubmited}
									// invalidFeedback={validator.message(`Guardian Phone ${index}`, nok.phone, "required|numeric")}
								/>
							</FormGroup>
						</div>

						{/* Relation */}
						<div className='col-md-6'>
							<FormGroup id={`relation-${index}`} label='Relation' isFloating>
								<SearchableSelect
									value={nok.relation}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
										handleChange(index, 'relation', e.target.value)
									}
									// isValid={validator.fieldValid(`Guardian Relation ${index}`)}
									// isTouched={isSubmited}
									// invalidFeedback={validator.message(`Guardian Relation ${index}`, nok.relation, "required")}
									options={relationList}
									valueKey='id'
									labelKey='name'
									placeholder='Select Relation'
								/>
							</FormGroup>
						</div>

						{/* LPA */}
						<div className='col-md-6'>
							<FormGroup
								id={`lpa-${index}`}
								label='Legal Power of Attorney (LPA)'
								isFloating>
								<SearchableSelect
									name='lpa'
									value={nok.lpa}
									label='Legal Power of Attorney (LPA)'
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
										handleChange(
											index,
											'lpa',
											e.target.value === '' ? '' : Number(e.target.value),
										)
									}
									options={LPA_TYPE_LIST}
									placeholder='Select LPA'
								/>
							</FormGroup>
						</div>
						{/* LPA Start Date */}
						{nok.lpa === LPA_TYPE.YES && (
							<div className='col-md-6'>
								{/* <FormGroup
									id={`lpa-sDate-${index}`}
									label='(LPA) Start Date'
									isFloating>
									<Input
										placeholder='(LPA) Start Date'
										value={nok.lpaSdate}
										type='date'
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											handleChange(index, 'lpaSdate', e.target.value)
										}
										// isValid={validator.fieldValid(`Guardian (LPA) Start Date ${index}`)}
										// isTouched={isSubmited}
										// invalidFeedback={validator.message(`Guardian (LPA) Start Date ${index}`, nok.lpaSdate, "required")}
									/>
								</FormGroup> */}
								<DateTimePicker
									id={`lpa-sDate-${index}`}
									label='(LPA) Start Date'
									isFloating
									placeholder='(LPA) Start Date'
									value={nok?.lpaSdate}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										handleChange(index, 'lpaSdate', e.target.value)
									}
									// isValid={validator.fieldValid(`Guardian (LPA) Start Date ${index}`)}
									// isTouched={isSubmited}
									// invalidFeedback={validator.message(`Guardian (LPA) Start Date ${index}`, nok.lpaSdate, "required")}
								/>
							</div>
						)}

						{/* Address */}
						<div className='col-md-12'>
							<FormGroup id={`address-${index}`} label='Address' isFloating>
								<Input
									placeholder='Address'
									value={nok.address}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										handleChange(index, 'address', e.target.value)
									}
									// isValid={validator.fieldValid(`Guardian Address ${index}`)}
									// isTouched={isSubmited}
									// invalidFeedback={validator.message(`Guardian Address ${index}`, nok.address, "required")}
								/>
							</FormGroup>
						</div>

						{/* Town / City */}
						<div className='col-md-6'>
							<FormGroup id={`townOrCity-${index}`} label='Town / City' isFloating>
								<Input
									placeholder='Town / City'
									value={nok.townOrCity}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										handleChange(index, 'townOrCity', e.target.value)
									}
									// isValid={validator.fieldValid(`Guardian Town / City ${index}`)}
									// isTouched={isSubmited}
									// invalidFeedback={validator.message(`Guardian Town / City ${index}`, nok.townOrCity, "required")}
								/>
							</FormGroup>
						</div>

						{/* County */}
						<div className='col-md-6'>
							<FormGroup id={`county-${index}`} label='County' isFloating>
								<Input
									placeholder='County'
									value={nok.county}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										handleChange(index, 'county', e.target.value)
									}
									// isValid={validator.fieldValid(`Guardian County ${index}`)}
									// isTouched={isSubmited}
									// invalidFeedback={validator.message(`Guardian County ${index}`, nok.county, "required")}
								/>
							</FormGroup>
						</div>

						{/* Postcode */}
						<div className='col-md-6'>
							<FormGroup id={`postcode-${index}`} label='Postcode' isFloating>
								<Input
									placeholder='Postcode'
									value={nok.postcode}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										handleChange(index, 'postcode', e.target.value)
									}
									// isValid={validator.fieldValid(`Guardian Postcode ${index}`)}
									// isTouched={isSubmited}
									// invalidFeedback={validator.message(`Guardian Postcode ${index}`, nok.postcode, "required")}
								/>
							</FormGroup>
						</div>

						{/* Invoice Required */}
						{/* <div className="col-6">
              <Checks
                id={`invoiceRequired-${index}`}
                checked={nok.invoiceRequired}
                className="invoice-check"
                label={"Invoice Required"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(index, "invoiceRequired", e.target.checked)
                }
              />
            </div> */}
						<div className='col-md-6'>
							<FormGroup
								id={`invoiceRequired-${index}`}
								label='Invoice Required'
								isFloating>
								<SearchableSelect
									name='invoiceRequired'
									value={nok.invoiceRequired}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
										handleChange(
											index,
											'invoiceRequired',
											e.target.value === '' ? '' : Number(e.target.value),
										)
									}
									// isValid={validator.fieldValid(`Guardian Invoice Required ${index}`)}
									// isTouched={isSubmited}
									// invalidFeedback={validator.message(`Guardian Invoice Required ${index}`, String(nok.invoiceRequired), "required")}
									options={NOK_INVOICE_REQUIRED_LIST}
									placeholder='Select Invoice Required'
								/>
							</FormGroup>
						</div>

						{/* Delete Button */}
						{nokList.length > 1 && (
							<div className='col-12 text-end'>
								<Button
									color='danger'
									isLight
									icon='Delete'
									size='sm'
									onClick={() => handleDelete(index)}>
									Delete
								</Button>
							</div>
						)}
					</div>
				))}
			</CardBody>
		</Card>
	);
};
