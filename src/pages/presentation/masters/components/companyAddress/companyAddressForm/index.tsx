import React, { useEffect, useRef, useState } from 'react';
import {
	Button,
	FormGroup,
	Input,
	OffCanvas,
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
} from '../../../../../../components/bootstrap';
import SimpleReactValidator from 'simple-react-validator';

interface Props {
	isOpen: boolean;
	toggle: () => void;
	companyAddress: any;
	handleChange: (e: any) => void;
	onSubmit: () => void;
	isEdit: boolean;
}

const CompanyAddressForm: React.FC<Props> = ({
	isOpen,
	toggle,
	companyAddress,
	handleChange,
	onSubmit,
	isEdit,
}) => {
	const validator = useRef(new SimpleReactValidator());
	const [isSubmit, setIsSubmit] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsSubmit(false);
			validator.current.hideMessages();
		}
	}, [isOpen]);

	const handleSubmit = async () => {
		setIsSubmit(true);

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
			setIsSubmit(false);
		}
	};

	return (
		<OffCanvas
			id='companyAddressForm'
			titleId='companyAddressFormLabel'
			placement='end'
			isOpen={isOpen}
			isBackdrop={false}
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='companyAddressFormLabel'>
					{isEdit ? 'Edit Address' : 'Create Address'}
				</OffCanvasTitle>
			</OffCanvasHeader>

			<OffCanvasBody>
				<div className='row g-3'>



					{/* Building Number */}
					<div className='col-12'>
						<FormGroup id='buildingNumber' label='Building Number' isFloating>
							<Input
								value={companyAddress?.buildingNumber || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Building Number')}
								isTouched={isSubmit}
								invalidFeedback={validator.current.message(
									'Building Number',
									companyAddress?.buildingNumber,
									'required'
								)}
							/>
						</FormGroup>
					</div>

					{/* Area */}
					<div className='col-12'>
						<FormGroup id='area' label='Area' isFloating>
							<Input
								value={companyAddress?.area || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Area')}
								isTouched={isSubmit}
								invalidFeedback={validator.current.message(
									'Area',
									companyAddress?.area,
									'required'
								)}
							/>
						</FormGroup>
					</div>

                    					{/* Address */}
					<div className='col-12'>
						<FormGroup id='address' label='Address' isFloating>
							<Input
								value={companyAddress?.address || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Address')}
								isTouched={isSubmit}
								invalidFeedback={validator.current.message(
									'Address',
									companyAddress?.address,
									'required'
								)}
							/>
						</FormGroup>
					</div>

					{/* Post Code */}
					<div className='col-12'>
						<FormGroup id='postCode' label='Post Code' isFloating>
							<Input
								value={companyAddress?.postCode || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Post Code')}
								isTouched={isSubmit}
								invalidFeedback={validator.current.message(
									'Post Code',
									companyAddress?.postCode,
									'required'
								)}
							/>
						</FormGroup>
					</div>

					{/* Country */}
					<div className='col-12'>
						<FormGroup id='country' label='Country' isFloating>
							<Input
                                readOnly
								value={companyAddress?.country || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Country')}
								isTouched={isSubmit}
								invalidFeedback={validator.current.message(
									'Country',
									companyAddress?.country,
									'required'
								)}
							/>
						</FormGroup>
					</div>

					{/* MD Email */}
					<div className='col-12'>
						<FormGroup id='mdEmail' label='MD Email' isFloating>
							<Input
								type='email'
								value={companyAddress?.mdEmail || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid('MD Email')}
								isTouched={isSubmit}
								invalidFeedback={validator.current.message(
									'MD Email',
									companyAddress?.mdEmail,
									'email'
								)}
							/>
						</FormGroup>
					</div>

					{/* Director Email */}
					<div className='col-12'>
						<FormGroup id='directorEmail' label='Director Email' isFloating>
							<Input
								type='email'
								value={companyAddress?.directorEmail || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Director Email')}
								isTouched={isSubmit}
								invalidFeedback={validator.current.message(
									'Director Email',
									companyAddress?.directorEmail,
									'email'
								)}
							/>
						</FormGroup>
					</div>

					{/* Phone */}
					{/* <div className='col-12'>
						<FormGroup id='phone' label='Phone' isFloating>
							<Input
								value={companyAddress?.phone || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Phone')}
								isTouched={isSubmit}
								invalidFeedback={validator.current.message(
									'Phone',
									companyAddress?.phone,
									'required|numeric'
								)}
							/>
						</FormGroup>
					</div> */}

					{/* Email */}
					{/* <div className='col-12'>
						<FormGroup id='email' label='Email' isFloating>
							<Input
								value={companyAddress?.email || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Email')}
								isTouched={isSubmit}
								invalidFeedback={validator.current.message(
									'Email',
									companyAddress?.email,
									'required|email'
								)}
							/>
						</FormGroup>
					</div> */}

				</div>
			</OffCanvasBody>

			{/* Footer */}
			<div className='row m-0'>
				<div className='col-12 p-3 pb-0'>
					<Button
						color='info'
						className='w-100'
						onClick={handleSubmit}
						isLoading={isLoading}>
						{isEdit ? 'Update' : 'Save'}
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

export default CompanyAddressForm;