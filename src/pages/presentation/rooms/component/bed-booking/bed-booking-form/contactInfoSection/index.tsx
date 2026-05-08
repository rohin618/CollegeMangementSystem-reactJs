import {
	Card,
	CardBody,
	CardHeader,
	CardLabel,
	CardSubTitle,
	CardTitle,
	FormGroup,
	InputGroup,
	InputGroupText,
	Select,
	Option,
	Input,
} from '../../../../../../../components/bootstrap';

export const ContactInfoSection = ({ data, onChange, validator, isSubmited }: any) => (
	<Card>
		<CardHeader>
			<CardLabel icon='Phonelink' iconColor='danger'>
				<CardTitle tag='div' className='h5'>
					{' '}
					Resident Information
				</CardTitle>
				<CardSubTitle tag='div' className='h6'>
					{' '}
					Resident contact information
				</CardSubTitle>
			</CardLabel>
		</CardHeader>
		<CardBody>
			<div className='row g-4'>
				<div className='col-md-6'>
					<FormGroup id='email' label='Email address' isFloating>
						<Input
							type='email'
							placeholder='Email address'
							autoComplete='email'
							value={data.personal.email}
							onChange={onChange}
							// isValid={validator.fieldValid('Email address')}
							// isTouched={isSubmited}
							// invalidFeedback={validator.message(
							// 	'Email address',
							// 	data.personal.email,
							// 	'email', 
							// )}
						/>
					</FormGroup>
				</div>

				<div className='col-md-6'>
					<FormGroup id='phone' label='Telephone No' isFloating typeof=''>
						<Input
							type='tel'
							placeholder='Telephone No'
							autoComplete='tel'
							value={data.personal.phone}
							onChange={onChange}
							// isValid={validator.fieldValid('Telephone No')}
							// isTouched={isSubmited}
							// invalidFeedback={validator.message(
							// 	'Telephone No',
							// 	data.personal.phone,
							// 	'regex:^\\d+$',
							// )}
						/>
					</FormGroup>
				</div>

				<div className='col-md-12'>
					<FormGroup id='addres' label='Address' isFloating>
						<Input
							placeholder='Address'
							value={data.personal.addres}
							onChange={onChange}
							// isValid={validator.fieldValid('Addres')}
							// isTouched={isSubmited}
							// invalidFeedback={validator.message('Addres', data.personal.addres, 'required')}
						/>
					</FormGroup>
				</div>
			</div>
		</CardBody>
	</Card>
);
