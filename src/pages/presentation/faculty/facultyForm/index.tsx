import React, { useEffect, useRef, useState } from 'react';
import SimpleReactValidator from 'simple-react-validator';

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

import { SearchableSelect } from '../../../../components/common';

import { IFaculty } from '../../../../common/interface/faculty';
import { IDepartment } from '../../../../common/interface/departments';
import { FACULTY_STATUS_OPTIONS } from '../../../../common/data/option';

interface FacultyFormProps {
	isOpen: boolean;
	toggleForm: () => void;

	facultyData: Partial<IFaculty>;
	handleChange: (e: any) => void;

	isEditMode: boolean;

	onSubmit: (data: IFaculty) => Promise<void>;

	departmentList: IDepartment[];
}

const FacultyForm: React.FC<FacultyFormProps> = ({
	isOpen,
	toggleForm,
	facultyData,
	handleChange,
	isEditMode,
	onSubmit,
	departmentList,
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

			await onSubmit(facultyData as IFaculty);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal
			setIsOpen={toggleForm}
			isOpen={isOpen}
			fullScreen
			titleId='faculty-modal'
			isStaticBackdrop>
			<ModalHeader setIsOpen={toggleForm}>
				<ModalTitle id='facultyModal'>
					{isEditMode ? 'Edit Faculty' : 'Create Faculty'}
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				<div className='row g-4'>
					{/* Employee Code */}
					<div className='col-md-6'>
						<FormGroup
							id='employeeCode'
							label='Employee Code'>
							<Input
								id='employeeCode'
								name='employeeCode'
								placeholder='Ex: FAC001'
								value={facultyData.employeeCode || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid(
									'Employee Code',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Employee Code',
									facultyData.employeeCode,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* First Name */}
					<div className='col-md-6'>
						<FormGroup
							id='firstName'
							label='First Name'>
							<Input
								id='firstName'
								name='firstName'
								placeholder='Ex: John'
								value={facultyData.firstName || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid(
									'First Name',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'First Name',
									facultyData.firstName,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Last Name */}
					<div className='col-md-6'>
						<FormGroup
							id='lastName'
							label='Last Name'>
							<Input
								id='lastName'
								name='lastName'
								placeholder='Ex: Kumar'
								value={facultyData.lastName || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid(
									'Last Name',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Last Name',
									facultyData.lastName,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Email */}
					<div className='col-md-6'>
						<FormGroup
							id='email'
							label='Email'>
							<Input
								type='email'
								id='email'
								name='email'
								placeholder='Ex: faculty@college.edu'
								value={facultyData.email || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid(
									'Email',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Email',
									facultyData.email,
									'required|email',
								)}
							/>
						</FormGroup>
					</div>

					{/* Phone */}
					<div className='col-md-6'>
						<FormGroup
							id='phoneNumber'
							label='Phone Number'>
							<Input
								id='phoneNumber'
								name='phoneNumber'
								placeholder='Ex: 9876543210'
								value={facultyData.phoneNumber || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid(
									'Phone Number',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Phone Number',
									facultyData.phoneNumber,
									'required|min:10',
								)}
							/>
						</FormGroup>
					</div>

					{/* Designation */}
					<div className='col-md-6'>
						<FormGroup
							id='designation'
							label='Designation'>
							<Input
								id='designation'
								name='designation'
								placeholder='Ex: Assistant Professor'
								value={facultyData.designation || ''}
								onChange={handleChange}
								isValid={validator.current.fieldValid(
									'Designation',
								)}
								isTouched={isSubmitted}
								invalidFeedback={validator.current.message(
									'Designation',
									facultyData.designation,
									'required',
								)}
							/>
						</FormGroup>
					</div>

					{/* Department */}
					<div className='col-md-6'>
						<FormGroup
							id='departmentId'
							label='Department'>
							<SearchableSelect
								id='departmentId'
								name='departmentId'
								placeholder='Select Department'
								value={facultyData.departmentId}
								options={departmentList}
								labelKey='name'
								valueKey='id'
								renderLabel={(item) => item.name}
								onChange={handleChange}
							/>
						</FormGroup>
					</div>

					{/* Status */}
					{isEditMode && (
						<div className='col-md-6'>
							<FormGroup
								id='status'
								label='Status'>
								<SearchableSelect
									id='status'
									name='status'
									value={facultyData.status}
									options={FACULTY_STATUS_OPTIONS}
									labelKey='label'
									valueKey='value'
									renderLabel={(item) =>
										item.label
									}
									onChange={handleChange}
								/>
							</FormGroup>
						</div>
					)}
				</div>
			</ModalBody>

			<ModalFooter>
				<Button
					color='danger'
					isLight
					onClick={toggleForm}
					isDisable={isLoading}>
					Cancel
				</Button>

				<Button
					color='info'
					onClick={handleSubmit}
					isLoading={isLoading}>
					{isEditMode
						? 'Update Faculty'
						: 'Create Faculty'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default FacultyForm;
