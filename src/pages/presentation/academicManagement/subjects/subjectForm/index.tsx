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
import {
	SUBJECT_STATUS_OPTIONS,
	SUBJECT_TYPE_OPTIONS,
} from '../../../../../common/data/option';
import { ISubject } from '../../../../../common/interface/subject';



interface SubjectFormProps {
	isOpen: boolean;
	toggle: () => void;
	subjectData: Partial<ISubject>;
	handleChange: (e: any) => void;
	onSubmit: () => Promise<void>;
	isEdit: boolean;
}

const SubjectForm: React.FC<SubjectFormProps> = ({
	isOpen,
	toggle,
	subjectData,
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
			id='subjectCanvas'
			titleId='subjectCanvasLabel'
			placement='end'
			isOpen={isOpen}
			isBackdrop
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='subjectCanvasLabel'>
					{isEdit ? 'Edit Subject' : 'Create Subject'}
				</OffCanvasTitle>
			</OffCanvasHeader>

			<OffCanvasBody>
				<div className='row g-3'>
					{/* Subject Code */}
					<div className='col-12'>
						<FormGroup
							id='code'
							label='Subject Code'
							isFloating>
							<Input
								id='code'
								name='code'
								value={subjectData?.code || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid(
									'Subject Code',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Subject Code',
									subjectData?.code,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Subject Name */}
					<div className='col-12'>
						<FormGroup
							id='name'
							label='Subject Name'
							isFloating>
							<Input
								id='name'
								name='name'
								value={subjectData?.name || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid(
									'Subject Name',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Subject Name',
									subjectData?.name,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Credits */}
					<div className='col-12'>
						<FormGroup
							id='credits'
							label='Credits'
							isFloating>
							<Input
								type='number'
								id='credits'
								name='credits'
								value={subjectData?.credits || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid(
									'Credits',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Credits',
									subjectData?.credits,
									'required|integer|min:1',
								)}
							/>
						</FormGroup>
					</div>

					{/* Subject Type */}
					<div className='col-12'>
						<FormGroup
							id='type'
							label='Subject Type'
							isFloating>
							<SearchableSelect
								id='type'
								name='type'
								value={subjectData?.type}
								onChange={handleChange}
								options={SUBJECT_TYPE_OPTIONS}
								labelKey='label'
								valueKey='value'
								renderLabel={(item) => item.label}
								isValid={validator.current.fieldValid(
									'Subject Type',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Subject Type',
									subjectData?.type,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Description */}
					<div className='col-12'>
						<FormGroup
							id='description'
							label='Description'
							isFloating>
							<Textarea
								id='description'
								name='description'
								rows={3}
								value={subjectData?.description || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid(
									'Description',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Description',
									subjectData?.description,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Status */}
					{isEdit && (
						<div className='col-12'>
							<FormGroup
								id='status'
								label='Status'
								isFloating>
								<SearchableSelect
									id='status'
									name='status'
									value={subjectData?.status}
									onChange={handleChange}
									options={SUBJECT_STATUS_OPTIONS}
									labelKey='label'
									valueKey='value'
									renderLabel={(item) => item.label}
									isValid={validator.current.fieldValid(
										'Status',
									)}
									isTouched={isSubmitted}
									invalidFeedback={validator.current.message(
										'Status',
										subjectData?.status,
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

export default SubjectForm;