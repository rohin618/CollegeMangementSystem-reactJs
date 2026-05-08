import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Button,
	FormGroup,
	OffCanvas,
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
	Input,
} from '../../../../../components/bootstrap';
import { DueDateModel } from '../../../../../common/model/dueDate';
import SimpleReactValidator from 'simple-react-validator';
import { createDueDateMaster, updateDueDate } from '../../../../../common/api/dueDate';
import { useUpdateQueryListById } from '../../../../../hooks';

interface DueDateFormProps {
	isOpen: boolean;
	toggle: () => void;
	dueDateEditData?: any;
}

const DueDateForm: React.FC<DueDateFormProps> = ({ isOpen, toggle, dueDateEditData }) => {
	const [formData, setFormData] = useState<any>({ ...DueDateModel });
	const [open, setOpen] = useState(isOpen);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const updateDueDateList = useUpdateQueryListById<any>(['dueDateList']);

	const validator = useRef(new SimpleReactValidator({ autoForceUpdate: this }));
	useEffect(() => {
		setOpen(isOpen);
		if (dueDateEditData) {
			setFormData(dueDateEditData);
		} else {
			setFormData(DueDateModel);
		}
	}, [isOpen, dueDateEditData]);

	useEffect(() => {
		if (!isOpen) {
			setFormData({ ...DueDateModel });
			setIsSubmitted(false);
			validator.current.hideMessages();
		}
	}, [isOpen]);

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const { id, value } = e.target;
		setFormData((prev: any) => ({
			...prev,
			[id]: value,
		}));
	}, []);

	// ✅ Handle Save / Update
	const handleFormSubmit = useCallback(async () => {
		setIsLoading(true);
		setIsSubmitted(true);
		const isValid = validator.current.allValid();
		if (!isValid) {
			validator.current.showMessages();
			setIsLoading(false);
			return;
		}

		try {
			const body: any = {
				...formData,
			};
			const res = formData.id
				? await updateDueDate(body.id, body)
				: await createDueDateMaster(body);
			updateDueDateList(res);
			toggle();
			setIsSubmitted(false);
		} catch (e) {
			console.error('Error in saving Due Date:', e);
		} finally {
			setIsLoading(false);
		}
	}, [formData, toggle]);

	return (
		<OffCanvas isOpen={open} setOpen={toggle} isBackdrop={false}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='companyCanvasLabel'>Due Date</OffCanvasTitle>
			</OffCanvasHeader>
			<OffCanvasBody>
				<p>Due Date Form</p>
				<div className='row'>
					{/* Name Field */}
					<div className='col-12 mb-3'>
						<FormGroup id='name' label='Name' isFloating>
							<Input
								id='name'
								value={formData.name}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('name')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'name',
									formData.name,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Day Field */}

					{/* Date Field */}
					<div className='col-12 mb-3'>
						<FormGroup id='day' label='Due Day' isFloating>
							<Input
								id='day'
								type='number'
								value={formData.day}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('day')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'day',
									formData.day,
									'required',
								)}
							/>
						</FormGroup>
					</div>
				</div>

				{/* Buttons */}
				<div className='row m-0'>
					<div className='col-12 p-3 pb-0'>
						<Button
							color='info'
							className='w-100'
							onClick={handleFormSubmit}
							isLoading={isLoading}
							isDisable={isLoading}>
							{formData.id ? 'Update' : 'Save'}
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
			</OffCanvasBody>
		</OffCanvas>
	);
};

export default DueDateForm;
