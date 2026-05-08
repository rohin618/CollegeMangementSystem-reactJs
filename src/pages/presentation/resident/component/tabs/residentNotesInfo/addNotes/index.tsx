import React, { useEffect, useRef, useState } from 'react';
import {
	Button,
	Checks,
	FormGroup,
	Input,
	Modal,
	ModalBody,
	ModalHeader,
	Textarea,
} from '../../../../../../../components/bootstrap';
import { DateTimePicker, SearchableSelect } from '../../../../../../../components/common';
import { FOLLOW_UP_PRIORITY_LIST } from '../../../../../../../common/data/option';
import SimpleReactValidator from 'simple-react-validator';
import moment from 'moment';
interface IfollowUpParams {
	isOpen: boolean;
	toggle: () => void;

	notesFormData: any;
	onChangeFollowupNotes: (e: any) => void;

	onSubmit: () => Promise<void>;

	title?: string;
	isEdit?: boolean;
	minDateFromParent?: string;
}

const AddFollowUpNotes: React.FC<IfollowUpParams> = ({
	isOpen,
	toggle,
	notesFormData,
	onChangeFollowupNotes,
	onSubmit,
	title = 'Add Follow-up Note',
	isEdit = false,
	minDateFromParent,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const validator = useRef(new SimpleReactValidator());
	const [isSubmitted, setIsSubmitted] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsSubmitted(false);
			validator.current?.purgeFields();
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
			toggle();
		} finally {
			setIsLoading(false);
			setIsSubmitted(false);
		}
	};

	const followUpDateRule = notesFormData.requiresReview ? 'required' : '';

	return (
		<Modal isOpen={isOpen} setIsOpen={toggle} size='lg'>
			<ModalHeader setIsOpen={toggle}>
				<strong>{title}</strong>
			</ModalHeader>

			<ModalBody>
				<div className='row g-3'>
					<div className='col-md-6'>
						<FormGroup label='Follow-up Date' isFloating>
							<DateTimePicker
								minDate={
									minDateFromParent
										? moment(minDateFromParent)
												.add(1, 'days')
												.format('YYYY-MM-DD')
										: ''
								}
								isFloating
								placeholder='Follow-Up Date'
								id='followUpDate'
								value={notesFormData.followUpDate}
								onChange={onChangeFollowupNotes}
								isValid={validator.current.fieldValid('Follow-up Date')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Follow-up Date',
									notesFormData.followUpDate,
									followUpDateRule,
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-md-6'>
						<FormGroup label='Priority' isFloating>
							<SearchableSelect
								id='priority'
								value={notesFormData.priority}
								onChange={onChangeFollowupNotes}
								options={FOLLOW_UP_PRIORITY_LIST}
								isValid={validator.current.fieldValid('Priority')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Priority',
									notesFormData.priority,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<FormGroup label='Notes' isFloating>
							<Textarea
								id='notes'
								value={notesFormData.notes}
								onChange={onChangeFollowupNotes}
								isValid={validator.current.fieldValid('Notes')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Notes',
									notesFormData.notes,
									'required|min:1',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<Checks
							id='requiresReview'
							type='checkbox'
							checked={notesFormData.requiresReview}
							onChange={onChangeFollowupNotes}
							label='Requires Review'
						/>
					</div>

					<div className='col-12 d-flex justify-content-end gap-2'>
						<Button isLight color='danger' onClick={toggle}>
							Cancel
						</Button>

						<Button
							isLight
							color='primary'
							isLoading={isLoading}
							onClick={handleSubmit}>
							{isEdit ? 'Update' : 'Add'} Note
						</Button>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default AddFollowUpNotes;
