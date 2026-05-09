import React, { useEffect, useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBulkUsers, updateUser } from '../../../../../common/api/userManagement';
import { SearchableSelect } from '../../../../../components/common';

const QUERY_KEY = {
	USERS: 'USERS',
};

interface IUser {
	id?: number;
	username: string;
	email: string;
	role: string;
	isActive?: boolean;
}

interface CreateUsersModalProps {
	isOpen: boolean;
	toggle: () => void;
	editUserData?: IUser | null;
	onUpdateSuccess?: (user: IUser) => void;
}

const emptyUser: IUser = {
	username: '',
	email: '',
	role: '',
};

const CreateUsersModal: React.FC<CreateUsersModalProps> = ({
	isOpen,
	toggle,
	editUserData,
	onUpdateSuccess,
}) => {
	const queryClient = useQueryClient();

	const [isLoading, setIsLoading] = useState(false);
	const [users, setUsers] = useState<IUser[]>([emptyUser]);

	const isEditMode = !!editUserData;

	useEffect(() => {
		if (!isOpen) return;

		if (editUserData) {
			setUsers([
				{
					id: editUserData.id,
					username: editUserData.username || '',
					email: editUserData.email || '',
					role: editUserData.role || '',
					isActive: editUserData.isActive ?? true,
				},
			]);
		} else {
			setUsers([emptyUser]);
		}
	}, [editUserData, isOpen]);

	const createMutation = useMutation({
		mutationFn: createBulkUsers,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEY.USERS],
			});
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, body }: { id: number; body: any }) => updateUser(id, body),
	});

	const handleChange = <K extends keyof IUser>(index: number, field: K, value: IUser[K]) => {
		setUsers((prev) => {
			const updatedUsers = [...prev];
			updatedUsers[index] = {
				...updatedUsers[index],
				[field]: value,
			};
			return updatedUsers;
		});
	};

	const handleAddUser = () => {
		if (isEditMode) return;

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
		if (users.length === 1 || isEditMode) return;

		setUsers(users.filter((_, i) => i !== index));
	};

	const resetState = () => {
		setUsers([emptyUser]);
	};

	const handleClose = () => {
		resetState();
		toggle();
	};

	const handleSave = async () => {
		try {
			setIsLoading(true);

			if (isEditMode) {
				const user = users[0];

				const updatedUser = {
					id: user.id,
					username: user.username,
					email: user.email,
					role: user.role,
					isActive: user.isActive ?? true,
				};

				await updateMutation.mutateAsync({
					id: user.id!,
					body: updatedUser,
				});

				onUpdateSuccess?.(updatedUser);
			} else {
				await createMutation.mutateAsync(users);
			}

			handleClose();
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} isCentered size='xl' isStaticBackdrop>
			<ModalHeader setIsOpen={handleClose}>
				<ModalTitle id='createUsersModal'>
					{isEditMode ? 'Edit User' : 'Create Multiple Users'}
				</ModalTitle>
			</ModalHeader>

			<ModalBody>
				<div className='row g-4'>
					{users.map((user, index) => (
						<div key={index} className='col-12 border rounded p-4'>
							<div className='d-flex justify-content-between align-items-center mb-3'>
								<h6 className='mb-0 fw-bold'>
									{isEditMode ? 'Edit User' : `User ${index + 1}`}
								</h6>

								{!isEditMode && users.length > 1 && (
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
										<SearchableSelect
											name='role'
											id={`role-${index}`}
											value={user.role}
											options={USER_ROLE_LIST}
											placeholder='Select Role'
											disabled={isLoading}
											onChange={(e: any) =>
												handleChange(index, 'role', e.target.value)
											}
										/>
									</FormGroup>
								</div>
							</div>
						</div>
					))}

					{!isEditMode && (
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
					)}
				</div>
			</ModalBody>

			<ModalFooter>
				<Button color='success' onClick={handleSave} isLoading={isLoading}>
					{isEditMode ? 'Update User' : 'Create Users'}
				</Button>

				<Button color='danger' isLight onClick={handleClose} isDisable={isLoading}>
					Cancel
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default CreateUsersModal;
