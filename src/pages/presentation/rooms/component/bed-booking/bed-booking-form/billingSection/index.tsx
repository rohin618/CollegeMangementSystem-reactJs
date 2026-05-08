import { SALUTATION_LIST } from "../../../../../../../common/data/option";
import { Card, CardBody, CardHeader, CardLabel, CardSubTitle, CardTitle, FormGroup, InputGroup, InputGroupText, Select, Option, Input } from "../../../../../../../components/bootstrap";
import { SearchableSelect } from "../../../../../../../components/common";



export const BillingSection = ({ data, onChange, validator, isSubmited }: any) => (
    <Card>
        <CardHeader>
            <CardLabel icon='Receipt' iconColor='info'>
                <CardTitle tag='div' className='h5'>Billing Details</CardTitle>
                <CardSubTitle tag='div' className='h6'>Billing contact and address</CardSubTitle>
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
									onChange={onChange}
									value={data.billing.salutation} placeholder='Select Salutation' options={SALUTATION_LIST} />
							</FormGroup>
						</InputGroupText>
						<FormGroup id='name' label='Name' isFloating>
                        <Input
                            type='text'
                            placeholder='Name'
                            value={data.billing.name}
                            onChange={onChange}
                            isValid={validator.fieldValid('Billing Name')}
                            isTouched={isSubmited}
                            invalidFeedback={validator.message('Billing Name', data.billing.name, 'required')}
                        />
                    </FormGroup>
					</InputGroup>
				</div>

                <div className='col-md-6'>
                    <FormGroup id='phoneNumber' label='Phone Number' isFloating>
                        <Input
                            type='tel'
                            placeholder='Phone Number'
                            value={data.billing.phoneNumber}
                            onChange={onChange}
                            isValid={validator.fieldValid('Billing Phone')}
                            isTouched={isSubmited}
                            invalidFeedback={validator.message('Billing Phone', data.billing.phoneNumber, 'required|phone')}
                        />
                    </FormGroup>
                </div>
                <div className='col-md-6'>
                    <FormGroup id='email' label='Email' isFloating>
                        <Input
                            type='email'
                            placeholder='Name'
                            value={data.billing.email}
                            onChange={onChange}
                            isValid={validator.fieldValid('Email')}
                            isTouched={isSubmited}
                            invalidFeedback={validator.message('Email', data.billing.email, 'required')}
                        />
                    </FormGroup>
                </div>
                <div className='col-md-12'>
                    <FormGroup id='addressLine1' label='Address Line 1' isFloating>
                        <Input
                            placeholder='Address Line 1'
                            value={data.billing.addressLine1}
                            onChange={onChange}
                            isValid={validator.fieldValid('Address Line 1')}
                            isTouched={isSubmited}
                            invalidFeedback={validator.message('Address Line 1', data.billing.addressLine1, 'required')}
                        />
                    </FormGroup>
                </div>
                <div className='col-md-12'>
                    <FormGroup id='addressLine2' label='Address Line 2' isFloating>
                        <Input
                            placeholder='Address Line 2'
                            value={data.billing.addressLine2}
                            onChange={onChange}
                            // isValid={validator.fieldValid('Address Line 2')}
                            // isTouched={isSubmited}
                            // invalidFeedback={validator.message('Address Line 2', data.billing.addressLine2, 'required')}
                        />
                    </FormGroup>
                </div>
                <div className='col-md-6'>
                    <FormGroup id='townOrCity' label='Town / City' isFloating>
                        <Input
                            placeholder='Town / City'
                            value={data.billing.townOrCity}
                            onChange={onChange}
                            isValid={validator.fieldValid('Town / City')}
                            isTouched={isSubmited}
                            invalidFeedback={validator.message('Town / City', data.billing.townOrCity, 'required')}
                        />
                    </FormGroup>
                </div>
                <div className='col-md-6'>
                    <FormGroup id='county' label='County' isFloating>
                        <Input
                            placeholder='County'
                            value={data.billing.county}
                            onChange={onChange}
                            isValid={validator.fieldValid('County')}
                            isTouched={isSubmited}
                            invalidFeedback={validator.message('County', data.billing.county, 'required')}
                        />
                    </FormGroup>
                </div>
                <div className='col-md-6'>
                    <FormGroup id='postcode' label='Postcode' isFloating>
                        <Input
                            placeholder='Postcode'
                            value={data.billing.postcode}
                            onChange={onChange}
                            isValid={validator.fieldValid('Postcode')}
                            isTouched={isSubmited}
                            invalidFeedback={validator.message('Postcode', data.billing.postcode, 'required')}
                        />
                    </FormGroup>
                </div>
                <div className='col-md-6'>
                    <FormGroup id='country' label='Country' isFloating>
                        <Input
                            placeholder='Country'
                            value={data.billing.country}
                            readOnly
                        />
                    </FormGroup>
                </div>
            </div>
        </CardBody>
    </Card>
);