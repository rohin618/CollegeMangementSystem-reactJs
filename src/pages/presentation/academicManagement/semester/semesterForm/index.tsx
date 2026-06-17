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
import { SEMESTER_STATUS_OPTIONS } from '../../../../../common/data/option';
import { ISemester } from '../../../../../common/interface/semester';

interface SemesterFormModalProps {
	isOpen: boolean;
	toggle: () => void;
	semesterData: Partial<ISemester>;
	handleChange: (e: any) => void;
	onSubmit: () => Promise<void>;
	isEdit: boolean;
}

const SemesterFormModal: React.FC<SemesterFormModalProps> = ({
	isOpen,
	toggle,
	semesterData,
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
			id='semesterCanvas'
			titleId='semesterCanvasLabel'
			placement='end'
			isOpen={isOpen}
			isBackdrop
			setOpen={toggle}>
			<OffCanvasHeader setOpen={toggle}>
				<OffCanvasTitle id='semesterCanvasLabel'>
					{isEdit ? 'Edit Semester' : 'Create Semester'}
				</OffCanvasTitle>
			</OffCanvasHeader>

			<OffCanvasBody>
				<div className='row g-3'>
					<div className='col-12'>
						<FormGroup
							id='semesterNumber'
							label='Semester Number'
							isFloating>
							<Input
								type='number'
								id='semesterNumber'
								name='semesterNumber'
								value={semesterData?.semesterNumber || ''}
								onChange={handleChange}
								disabled={isLoading}
								isValid={validator.current.fieldValid(
									'Semester Number',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Semester Number',
									semesterData?.semesterNumber,
									'required|integer|min:1',
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
									value={semesterData?.status}
									onChange={handleChange}
									options={SEMESTER_STATUS_OPTIONS}
									labelKey='label'
									valueKey='value'
									renderLabel={(item) => item.label}
									isValid={validator.current.fieldValid(
										'Status',
									)}
									isTouched={isSubmitted}
									invalidFeedback={validator.current.message(
										'Status',
										semesterData?.status,
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

export default SemesterFormModal;