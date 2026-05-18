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
} from '../../../../../components/bootstrap';

import { SearchableSelect } from '../../../../../components/common';
import { ACADEMIC_BATCH_STATUS_OPTIONS } from '../../../../../common/data/option';
import { IAcademicBatch } from '../../../../../common/interface/academicBatch';

interface AcademicBatchFormModalProps {
	isOpen: boolean;
	toggle: () => void;
	academicBatchData: Partial<IAcademicBatch>;
	handleChange: (e: any) => void;
	onSubmit: () => Promise<void>;
	isEdit: boolean;
}

const AcademicBatchFormModal: React.FC<
	AcademicBatchFormModalProps
> = ({
	isOpen,
	toggle,
	academicBatchData,
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
			id='academicBatchCanvas'
			titleId='academicBatchCanvasLabel'
			placement='end'
			isOpen={isOpen}
			isBackdrop
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='academicBatchCanvasLabel'>
					{isEdit
						? 'Edit Academic Batch'
						: 'Create Academic Batch'}
				</OffCanvasTitle>
			</OffCanvasHeader>

			<OffCanvasBody>
				<div className='row g-3'>
					<div className='col-12'>
						<FormGroup
							id='name'
							label='Academic Batch Name'
							isFloating>
							<Input
								id='name'
								name='name'
								value={academicBatchData?.name || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid(
									'Academic Batch Name',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Academic Batch Name',
									academicBatchData?.name,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<FormGroup
							id='startYear'
							label='Start Year'
							isFloating>
							<Input
								id='startYear'
								name='startYear'
								type='number'
								value={academicBatchData?.startYear || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid(
									'Start Year',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Start Year',
									academicBatchData?.startYear,
									'required|numeric',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<FormGroup
							id='endYear'
							label='End Year'
							isFloating>
							<Input
								id='endYear'
								name='endYear'
								type='number'
								value={academicBatchData?.endYear || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid(
									'End Year',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'End Year',
									academicBatchData?.endYear,
									'required|numeric',
								)}
							/>
						</FormGroup>
					</div>

					{isEdit && (
						<div className='col-12'>
							<FormGroup
								id='status'
								label='Status'
								isFloating>
								<SearchableSelect
									id='status'
									name='status'
									value={academicBatchData?.status}
									onChange={handleChange}
									options={
										ACADEMIC_BATCH_STATUS_OPTIONS
									}
									labelKey='label'
									valueKey='value'
									renderLabel={(item) =>
										item.label
									}
									isValid={validator.current.fieldValid(
										'Status',
									)}
									isTouched={isSubmitted}
									invalidFeedback={validator.current.message(
										'Status',
										academicBatchData?.status,
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

export default AcademicBatchFormModal;