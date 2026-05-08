import { GENDER_LIST, SALUTATION_LIST } from '../../../../../../../common/data/option';
import { DateTimePicker, SearchableSelect } from '../../../../../../../components/common';
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
import moment from 'moment';

export const PersonalInfoSection = ({ data, onChange, validator, isSubmited }: any) => (
	<Card>
		<CardHeader>
			<CardLabel icon='Person' iconColor='success'>
				<CardTitle tag='div' className='h5'>
					Personal Information
				</CardTitle>
				<CardSubTitle tag='div' className='h6'>
					Resident Credentials
				</CardSubTitle>
			</CardLabel>
		</CardHeader>
		<CardBody>
			<div className='row g-4'>
				<div className='col-md-6'>
					<InputGroup>
						<InputGroupText className='p-0'>
							<FormGroup id='salutation'>
								<SearchableSelect
									id='salutation'
									// className='shadow-none'
									onChange={onChange}
									value={data.personal.salutation} placeholder='Select Salutation' options={SALUTATION_LIST} />
								{/* {SALUTATION_LIST.map((sal) => (
										<Option key={sal.value} value={sal.value}>
											{sal.label}
										</Option>
									))}
								</Select> */}
							</FormGroup>
						</InputGroupText>
						<FormGroup id='name' label='Name of the Resident' isFloating>
							<Input
								placeholder='Name of the Resident'
								value={data.personal.name}
								onChange={onChange}
								isValid={
									validator.fieldValid('Name of the Resident') &&
									validator.fieldValid('Salutation')
								}
								isTouched={isSubmited}
								invalidFeedback={
									validator.message(
										'Name of the Resident',
										data.personal.name,
										'required',
									) ||
									validator.message(
										'Salutation',
										data.personal.salutation,
										'required',
									)
								}
							/>
						</FormGroup>
					</InputGroup>
				</div>

				<div className='col-6'>
					<FormGroup id='gender' label='Gender' isFloating>
						<SearchableSelect
							id='gender'
							onChange={onChange}
							value={data.personal.gender}
							isValid={validator.fieldValid('Gender')}
							isTouched={isSubmited}
							invalidFeedback={validator.message(
								'Gender',
								data.personal.gender,
								'required',
							)} options={GENDER_LIST} placeholder='Select Gender'/>
							
					</FormGroup>
				</div>

				<div className='col-6'>
					{/* <FormGroup id='dob' label='DOB' isFloating>
						<Input
							type='date'
							onKeyDown={(e) => e.preventDefault()}
							autoComplete='bday'
							placeholder='DOB'
							value={data.personal.dob}
							onChange={onChange}
							isValid={validator.fieldValid('DOB')}
							isTouched={isSubmited}
							invalidFeedback={validator.message(
								'DOB',
								data.personal.dob,
								'required',
							)}
						/>
					</FormGroup> */}
					<DateTimePicker id='dob' label='DOB' isFloating


						placeholder='DOB'
						value={data.personal.dob}
						onChange={onChange}
						isValid={validator.fieldValid('DOB')}
						isTouched={isSubmited}
						invalidFeedback={validator.message(
							'DOB',
							data.personal.dob,
							'required',
						)} />
				</div>
			</div>
		</CardBody>
	</Card>
);
