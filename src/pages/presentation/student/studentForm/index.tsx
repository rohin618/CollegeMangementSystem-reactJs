import React, { useEffect, useRef, useState } from 'react';
import SimpleReactValidator from 'simple-react-validator';

import { IStudent } from '../../../../common/interface/student';
import { IDepartment } from '../../../../common/interface/departments';
import { ISemester } from '../../../../common/interface/semester';
import { IAcademicBatch } from '../../../../common/interface/academicBatch';

import {
	Button,
	FormGroup,
	Input,
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../../../components/bootstrap';

import { DateTimePicker, SearchableSelect } from '../../../../components/common';

import { GENDER_OPTIONS, STUDENT_STATUS_OPTIONS } from '../../../../common/data/option';

interface StudentFormProps {
	isOpen: boolean;
	toggleForm: () => void;

	studentData: Partial<IStudent>;
	handleChange: (e: any) => void;

	isEditMode: boolean;

	onSubmit: (data: IStudent) => Promise<void>;
	onDelete: (id: number) => Promise<void>;

	departmentList: IDepartment[];
	semesterList: ISemester[];
	academicBatchList: IAcademicBatch[] | any[];
}

const StudentForm: React.FC<StudentFormProps> = ({
	isOpen,
	toggleForm,
	studentData,
	handleChange,
	isEditMode,
	onSubmit,
	departmentList,
	semesterList,
	academicBatchList,
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
			await onSubmit(studentData as IStudent);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal
			setIsOpen={toggleForm}
			isOpen={isOpen}
			fullScreen
			titleId='transfer-modal'
			isStaticBackdrop={true}>
			<ModalHeader setIsOpen={toggleForm}>
				<ModalTitle id='studentModal'>
					{isEditMode ? 'Edit Student' : 'Create Student'}
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				<div className='row g-4'>
					{/* Register Number */}
					<div className='col-md-6'>
						<FormGroup id='registerNumber' label='Register Number'>
							<Input
								placeholder='Ex: CSE2026001'
								id='registerNumber'
								name='registerNumber'
								value={studentData.registerNumber || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Register Number')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Register Number',
									studentData.registerNumber,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* First Name */}
					<div className='col-md-6'>
						<FormGroup id='firstName' label='First Name'>
							<Input
								id='firstName'
								name='firstName'
								placeholder='Ex: Ranvir'
								value={studentData.firstName || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid('First Name')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'First Name',
									studentData.firstName,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Last Name */}
					<div className='col-md-6'>
						<FormGroup id='lastName' label='Last Name'>
							<Input
								id='lastName'
								name='lastName'
								placeholder='Ex: Kumar'
								value={studentData.lastName || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Last Name')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Last Name',
									studentData.lastName,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Email */}
					<div className='col-md-6'>
						<FormGroup id='email' label='Email'>
							<Input
								type='email'
								id='email'
								name='email'
								placeholder='Ex: rohini@gmail.com'
								value={studentData.email || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Email')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Email',
									studentData.email,
									'required|email',
								)}
							/>
						</FormGroup>
					</div>

					{/* Phone Number */}
					<div className='col-md-6'>
						<FormGroup id='phoneNumber' label='Phone Number'>
							<Input
								id='phoneNumber'
								name='phoneNumber'
								placeholder='Ex: 9876543210'
								value={studentData.phoneNumber || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid('Phone Number')}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Phone Number',
									studentData.phoneNumber,
									'required|min:10',
								)}
							/>
						</FormGroup>
					</div>

					{/* DOB */}
					<div className='col-md-6'>
						<FormGroup id='dateOfBirth' label='Date Of Birth'>
							<DateTimePicker
								placeholder='Select Date of Birth'
								id='dateOfBirth'
								name='dateOfBirth'
								value={studentData.dateOfBirth || ''}
								onChange={handleChange}
							/>
						</FormGroup>
					</div>

					{/* Gender */}
					<div className='col-md-6'>
						<FormGroup id='gender' label='Gender'>
							<SearchableSelect
								id='gender'
								name='gender'
								value={studentData.gender}
								options={GENDER_OPTIONS}
								labelKey='label'
								valueKey='value'
								renderLabel={(item) => item.label}
								onChange={handleChange}
							/>
						</FormGroup>
					</div>

					{/* Department */}
					<div className='col-md-6'>
						<FormGroup id='departmentId' label='Department'>
							<SearchableSelect
								placeholder='Select Department'
								id='departmentId'
								name='departmentId'
								value={studentData.departmentId}
								options={departmentList}
								labelKey='name'
								valueKey='id'
								renderLabel={(item) => item.name}
								onChange={handleChange}
							/>
						</FormGroup>
					</div>

					{/* Academic Batch */}
					<div className='col-md-6'>
						<FormGroup id='academicBatchId' label='Academic Batch'>
							<SearchableSelect
								placeholder='Select Academic Batch'
								id='academicBatchId'
								name='academicBatchId'
								value={studentData.academicBatchId}
								options={academicBatchList}
								labelKey='name'
								valueKey='id'
								renderLabel={(item) => item.name}
								onChange={handleChange}
							/>
						</FormGroup>
					</div>

					{/* Semester */}
					<div className='col-md-4'>
						<FormGroup id='semesterId' label='Semester'>
							<SearchableSelect
								placeholder='Select Semester'
								id='semesterId'
								name='semesterId'
								value={studentData.semesterId}
								options={semesterList}
								labelKey='name'
								valueKey='id'
								renderLabel={(item) => item.semesterNumber}
								onChange={handleChange}
							/>
						</FormGroup>
					</div>

					{/* Status */}
					{isEditMode && (
						<div className='col-md-6'>
							<FormGroup id='status' label='Status'>
								<SearchableSelect
									id='status'
									name='status'
									value={studentData.status}
									options={STUDENT_STATUS_OPTIONS}
									labelKey='label'
									valueKey='value'
									renderLabel={(item) => item.label}
									onChange={handleChange}
								/>
							</FormGroup>
						</div>
					)}
				</div>
			</ModalBody>

			<ModalFooter>
				<Button color='danger' isLight onClick={toggleForm} isDisable={isLoading} >
					Cancel
				</Button>

				<Button color='info' onClick={handleSubmit} isLoading={isLoading} isLight>
					{isEditMode ? 'Update Student' : 'Create Student'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default StudentForm;
