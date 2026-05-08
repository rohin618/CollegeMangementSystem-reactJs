import { useEffect, useRef, useState } from 'react';
import {
	Button,
	FormGroup,
	Input,
	OffCanvas,
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
	Textarea,
} from '../../../../../components/bootstrap';
import { VATModel } from '../../../../../common/model/vat';
import SimpleReactValidator from 'simple-react-validator';
import { createVATMaster, updateVAT } from '../../../../../common/api/vat';
import { useUpdateQueryListById } from '../../../../../hooks';
import { DateTimePicker } from '../../../../../components/common';

export const VatForm = ({ isOpen = false, toggle = () => {}, editVatObject = {} }) => {
	const [vatForm, setVatForm] = useState<any>({ ...VATModel });
	const [, forceUpdate] = useState(0);
	const validator = useRef(new SimpleReactValidator());
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isFormLoading, setIsFormLoading] = useState(false);
	const updateVatList = useUpdateQueryListById<any>(['vatList']);

	useEffect(() => {
		if (editVatObject && isOpen) {
			setVatForm({ ...VATModel, ...editVatObject });
		}
	}, [editVatObject, isOpen]);

	useEffect(() => {
		if (!isOpen) {
			setVatForm({ ...VATModel });
			setIsSubmitted(false);
		}
	}, [isOpen]);

	// ✅ Generic change handler
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		setVatForm((prev: any) => ({
			...prev,
			[id]: value,
		}));
	};

	const handleFormSubmit = async () => {
		try {
			setIsSubmitted(true);

			if (!validator.current.allValid()) {
				validator.current.showMessages();
				// forceUpdate((prev) => prev + 1); // re-render to show errors
				return;
			}
			setIsFormLoading(true);

			const reqBody = { ...vatForm };
			const res = vatForm.id
				? await updateVAT(vatForm.id, reqBody)
				: await createVATMaster(reqBody);

			updateVatList(res);
			// ✅ If valid, proceed

			setIsFormLoading(false);
			// TODO: save to Firestore
			toggle();
		} catch (e) {
			setIsFormLoading(false);
		} finally {
			setIsFormLoading(false);
			// setIsSubmitted(false)
		}
	};

	return (
		<OffCanvas
			id='invoiceCanvas'
			titleId='offcanvasExampleLabel'
			placement='end'
			isOpen={isOpen}
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='offcanvasExampleLabel'>
					VAT {vatForm?.id ? 'Update' : 'Create'} Form
				</OffCanvasTitle>
			</OffCanvasHeader>
			<OffCanvasBody>
				<div className='row g-3'>
					{/* VAT Name */}
					<div className='col-12'>
						<FormGroup id='name' label='VAT Name'>
							<Input
								id='name'
								type='text'
								value={vatForm.name}
								onChange={handleChange}
								isValid={validator.current.fieldValid('VAT Name')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'VAT Name',
									vatForm.name,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* VAT Code */}
					<div className='col-12'>
						<FormGroup id='code' label='VAT Code'>
							<Input
								id='code'
								type='text'
								value={vatForm.code}
								onChange={handleChange}
								isValid={validator.current.fieldValid('VAT Code')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'VAT Code',
									vatForm.code,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* VAT Rate */}
					<div className='col-12'>
						<FormGroup id='rate' label='VAT Rate (%)'>
							<Input
								id='rate'
								type='number'
								value={vatForm.rate}
								onChange={handleChange}
								isValid={validator.current.fieldValid('VAT Rate')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'VAT Rate',
									vatForm.rate,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Effective Date From */}
					<div className='col-12'>
						{/* <FormGroup id='efftDateFrom' label='Effective Date From'>
							<Input
								id='efftDateFrom'
								type='date'
								value={vatForm.efftDateFrom}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Effective Date From')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Effective Date From',
									vatForm.efftDateFrom,
									'required',
								)}
							/>
						</FormGroup> */}
						<FormGroup id='efftDateFrom' label='Effective Date From'>
							<DateTimePicker
								id='efftDateFrom'
								value={vatForm.efftDateFrom}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Effective Date From')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Effective Date From',
									vatForm.efftDateFrom,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* VAT Description */}
					<div className='col-12'>
						<FormGroup id='description' label='VAT Description'>
							<Textarea
								id='description'
								value={vatForm.description}
								onChange={handleChange}
								isValid={validator.current.fieldValid('VAT Description')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'VAT Description',
									vatForm.description,
									'max:200',
								)}
							/>
						</FormGroup>
					</div>
				</div>

				{/* Actions */}
				<div className='row m-0'>
					<div className='col-12 p-3 pb-0'>
						<Button
							isLoading={isFormLoading}
							color='info'
							className='w-100'
							onClick={handleFormSubmit}>
							Generate
						</Button>
					</div>
					<div className='col-12 p-3'>
						<Button
							isOutline
							color='danger'
							className='w-100'
							isDisable={isFormLoading}
							onClick={toggle}>
							Close
						</Button>
					</div>
				</div>
			</OffCanvasBody>
		</OffCanvas>
	);
};
