import React, { useState } from 'react';

import {
	Button,
	FormGroup,
	Input,
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalTitle,
} from '../../../../../components/bootstrap';
import { USER_ROLE_LIST } from '../../../../../common/data/option';
import { useDispatch } from 'react-redux';
import { createBulkUsersThunk } from '../../../../../features/users/userThunk';

interface IUser {
	username: string;
	email: string;
	role: string;
}

interface CreateUsersModalProps {
	isOpen: boolean;
	toggle: () => void;
	onSubmit?: (users: IUser[]) => Promise<void>;
}

const CreateUsersModal: React.FC<CreateUsersModalProps> = ({ isOpen, toggle, onSubmit }) => {
	const [isLoading, setIsLoading] = useState(false);
	const dispatch = useDispatch();

	const [users, setUsers] = useState<IUser[]>([
		{
			username: '',
			email: '',
			role: '',
		},
	]);

	const handleChange = (index: number, field: keyof IUser, value: string) => {
		const updatedUsers = [...users];
		updatedUsers[index][field] = value;
		setUsers(updatedUsers);
	};

	const handleAddUser = () => {
		setUsers([
			...users,
			{
				username: '',
				email: '',
				role: '',
			},
		]);
	};

	const handleRemoveUser = (index: number) => {
		if (users.length === 1) return;

		setUsers(users.filter((_, i) => i !== index));
	};

	const handleSave = async () => {
		try {
			setIsLoading(true);

			await dispatch(createBulkUsersThunk(users) as any);

			setUsers([
				{
					username: '',
					email: '',
					role: '',
				},
			]);

			toggle();
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={toggle} isCentered size='xl' isStaticBackdrop>
			<ModalHeader setIsOpen={toggle}>
				<ModalTitle id='createUsersModal'>Create Multiple Users</ModalTitle>
			</ModalHeader>

			<ModalBody>
				<div className='row g-4'>
					{users.map((user, index) => (
						<div key={index} className='col-12 border rounded p-4'>
							<div className='d-flex justify-content-between align-items-center mb-3'>
								<h6 className='mb-0 fw-bold'>User {index + 1}</h6>

								{users.length > 1 && (
									<Button
										color='danger'
										isLight
										icon='Delete'
										onClick={() => handleRemoveUser(index)}>
										Remove
									</Button>
								)}
							</div>

							<div className='row g-3'>
								<div className='col-md-4'>
									<FormGroup id={`username-${index}`} label='Username' isFloating>
										<Input
											value={user.username}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												handleChange(index, 'username', e.target.value)
											}
											disabled={isLoading}
										/>
									</FormGroup>
								</div>

								<div className='col-md-4'>
									<FormGroup id={`email-${index}`} label='Email' isFloating>
										<Input
											type='email'
											value={user.email}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												handleChange(index, 'email', e.target.value)
											}
											disabled={isLoading}
										/>
									</FormGroup>
								</div>

								<div className='col-md-4'>
									<FormGroup id={`role-${index}`} label='Role' isFloating>
										<select
											className='form-select'
											value={user.role}
											onChange={(e) =>
												handleChange(index, 'role', e.target.value)
											}
											disabled={isLoading}>
											<option value=''>Select Role</option>

											{USER_ROLE_LIST.map((role) => (
												<option key={role.value} value={role.value}>
													{role.label}
												</option>
											))}
										</select>
									</FormGroup>
								</div>
							</div>
						</div>
					))}

					<div className='col-12'>
						<Button
							color='info'
							isLight
							icon='Add'
							onClick={handleAddUser}
							isDisable={isLoading}>
							Add User
						</Button>
					</div>
				</div>
			</ModalBody>

			<ModalFooter>
				<Button color='success' onClick={handleSave} isLoading={isLoading}>
					Create Users
				</Button>

				<Button color='danger' isLight onClick={toggle} isDisable={isLoading}>
					Cancel
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default CreateUsersModal;
