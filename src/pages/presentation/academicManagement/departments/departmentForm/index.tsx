import React, { useEffect, useRef, useState } from 'react';
import SimpleReactValidator from 'simple-react-validator';

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

import { SearchableSelect } from '../../../../../components/common';
import { DEPARTMENT_STATUS_OPTIONS } from '../../../../../common/data/option';
import { IDepartment } from '../../../../../common/interface/departments';

interface DepartmentFormModalProps {
	isOpen: boolean;
	toggle: () => void;
	departmentData: Partial<IDepartment>;
	handleChange: (e: any) => void;
	onSubmit: () => Promise<void>;
	isEdit: boolean;
}

const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
	isOpen,
	toggle,
	departmentData,
	handleChange,
	onSubmit,
	isEdit,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const validator = useRef(new SimpleReactValidator());

	useEffect(() => {
		if (isOpen) {
			setIsSubmitted(false);
			validator.current.hideMessages();
		}
	}, [isOpen]);

	const handleSubmit = async () => {
		setIsSubmitted(true);

		if (!validator.current.allValid()) {
			validator.current.showMessages();
			return;
		}

		try {
			setIsLoading(true);
			await onSubmit();

		} finally {
			setIsLoading(false);
			setIsSubmitted(false);
		}
	};

	return (
		<OffCanvas
			id='departmentCanvas'
			titleId='departmentCanvasLabel'
			placement='end'
			isOpen={isOpen}
			isBackdrop
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='departmentCanvasLabel'>
					{isEdit ? 'Edit Department' : 'Create Department'}
				</OffCanvasTitle>
			</OffCanvasHeader>

			<OffCanvasBody>
				<div className='row g-3'>
					<div className='col-12'>
						<FormGroup id='name' label='Department Name' isFloating>
							<Input
								id='name'
								name='name'
								value={departmentData?.name || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Department Name')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Department Name',
									departmentData?.name,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<FormGroup id='code' label='Department Code' isFloating>
							<Input
								id='code'
								name='code'
								value={departmentData?.code || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Department Code')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Department Code',
									departmentData?.code,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<FormGroup id='description' label='Description' isFloating>
							<Textarea
								id='description'
								name='description'
								rows={3}
								value={departmentData?.description || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid('Description')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Description',
									departmentData?.description,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{isEdit && (
						<div className='col-12'>
							<FormGroup id='status' label='Status' isFloating>
								<SearchableSelect
									id='status'
									name='status'
									value={departmentData?.status}
									onChange={handleChange}
									options={DEPARTMENT_STATUS_OPTIONS}
									labelKey='label'
									valueKey='value'
									renderLabel={(item) => item.label}
									isValid={validator.current.fieldValid('Status')}
									isTouched={isSubmitted}
									invalidFeedback={validator.current.message(
										'Status',
										departmentData?.status,
										'required',
									)}
								/>
							</FormGroup>
						</div>
					)}
				</div>
			</OffCanvasBody>

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

export default DepartmentFormModal;
