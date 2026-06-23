import React, { useEffect, useRef, useState } from 'react';
import SimpleReactValidator from 'simple-react-validator';

import { ICurriculum } from '../../../../common/interface/curriculum';

import {
	Button,
	FormGroup,
	Input,
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	Badge,
} from '../../../../components/bootstrap';

import { SearchableSelect } from '../../../../components/common';

interface CurriculumFormModalProps {
	isOpen: boolean;
	toggle: () => void;
	curriculumData: Partial<ICurriculum>;
	handleChange: (e: any) => void;
	onSubmit: () => Promise<void>;
	isEdit: boolean;

	departments: any[];
	academicBatches: any[];
	semesters: any[];
	subjects: any[];
}

const CurriculumFormModal: React.FC<CurriculumFormModalProps> = ({
	isOpen,
	toggle,
	curriculumData,
	handleChange,
	onSubmit,
	isEdit,
	departments,
	academicBatches,
	semesters,
	subjects,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const [selectedSubjects, setSelectedSubjects] = useState<any[]>([]);

	const validator = useRef(new SimpleReactValidator());

	useEffect(() => {
		if (isOpen) {
			setIsSubmitted(false);
			validator.current.hideMessages();

			if (isEdit && curriculumData.subjectId) {
				const selectedSubject = subjects.find(
					(item) => item.id === curriculumData.subjectId,
				);

				setSelectedSubjects(selectedSubject ? [selectedSubject] : []);
			} else {
				setSelectedSubjects([]);
			}
		}
	}, [isOpen, isEdit, curriculumData.subjectId, subjects]);

	const handleAddSubject = (e: any) => {
		const subject = subjects.find((item) => item.id === Number(e.target.value));

		if (!subject) return;

		// EDIT MODE
		if (isEdit) {
			setSelectedSubjects([subject]);

			handleChange({
				target: {
					name: 'subjectId',
					value: subject.id,
				},
			});

			return;
		}

		// CREATE MODE
		const exists = selectedSubjects.some((item) => item.id === subject.id);

		if (exists) return;

		const updatedSubjects = [...selectedSubjects, subject];

		setSelectedSubjects(updatedSubjects);

		handleChange({
			target: {
				name: 'subjectIds',
				value: updatedSubjects.map((item) => item.id),
			},
		});
	};

	const handleRemoveSubject = (id: number) => {
		if (isEdit) {
			setSelectedSubjects([]);

			handleChange({
				target: {
					name: 'subjectId',
					value: null,
				},
			});

			return;
		}

		const updatedSubjects = selectedSubjects.filter((item) => item.id !== id);

		setSelectedSubjects(updatedSubjects);

		handleChange({
			target: {
				name: 'subjectIds',
				value: updatedSubjects.map((item) => item.id),
			},
		});
	};

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
		<Modal isOpen={isOpen} setIsOpen={toggle} size='xl' isCentered isStaticBackdrop>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle id='curriculumModal'>
					{isEdit ? 'Edit Curriculum Mapping' : 'Create Curriculum Mapping'}
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				<div className='row g-4'>
					<div className='col-md-6'>
						<FormGroup id='departmentId' label='Department' isFloating>
							<SearchableSelect
								id='departmentId'
								name='departmentId'
								value={curriculumData.departmentId}
								options={departments}
								labelKey='name'
								valueKey='id'
								renderLabel={(item) => item.name}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Department')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Department',
									curriculumData.departmentId,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					<div className='col-md-6'>
						<FormGroup id='academicBatchId' label='Academic Batch' isFloating>
							<SearchableSelect
								id='academicBatchId'
								name='academicBatchId'
								value={curriculumData.academicBatchId}
								options={academicBatches}
								labelKey='name'
								valueKey='id'
								renderLabel={(item) => item.name}
								onChange={handleChange}
							/>
						</FormGroup>
					</div>

					<div className='col-md-6'>
						<FormGroup id='semesterId' label='Semester' isFloating>
							<SearchableSelect
								id='semesterId'
								name='semesterId'
								value={curriculumData.semesterId}
								options={semesters}
								labelKey='name'
								valueKey='id'
								renderLabel={(item) => item.name}
								onChange={handleChange}
							/>
						</FormGroup>
					</div>

					<div className='col-md-6'>
						<FormGroup id='displayOrder' label='Display Order' isFloating>
							<Input
								type='number'
								id='displayOrder'
								name='displayOrder'
								value={curriculumData.displayOrder || ''}
								onChange={handleChange}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<FormGroup label='Subjects'>
							<SearchableSelect
								id='subjectSelector'
								name='subjectSelector'
								options={
									isEdit
										? subjects
										: subjects.filter(
												(subject) =>
													!selectedSubjects.some(
														(selected) => selected.id === subject.id,
													),
											)
								}
								labelKey='name'
								valueKey='id'
								renderLabel={(item) => `${item.code} - ${item.name}`}
								onChange={handleAddSubject}
							/>
						</FormGroup>
					</div>

					<div className='col-12'>
						<div className='border rounded p-3'>
							<h6 className='mb-3'>Selected Subjects ({selectedSubjects.length})</h6>

							<div className='d-flex flex-wrap gap-2'>
								{selectedSubjects.map((subject) => (
									<Badge key={subject.id} color='primary' className='px-3 py-2'>
										{subject.code} - {subject.name}
										<Button
											size='sm'
											color='light'
											icon='Close'
											className='ms-2'
											onClick={() => handleRemoveSubject(subject.id)}
										/>
									</Badge>
								))}
							</div>
						</div>
					</div>
				</div>
			</ModalBody>

			<ModalFooter>
				<Button color='danger' isLight onClick={toggle} isDisable={isLoading}>
					Cancel
				</Button>

				<Button color='info' onClick={handleSubmit} isLoading={isLoading}>
					{isEdit ? 'Update Curriculum' : 'Create Curriculum'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default CurriculumFormModal;
