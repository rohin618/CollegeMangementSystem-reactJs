import axios from 'axios';
import { notifyEntity } from '../../../helpers/helpers';
import api from '../../axios';
import { NOTIFY_TYPE } from '../../constant/app';

export interface IUserRequest {
	username: string;
	email: string;
	role: string;
}

export interface IUpdateUserRequest {
	username: string;
	email: string;
	role: string;
	isActive: boolean;
}

export interface IBulkUserRequest {
	users: IUserRequest[];
};

const handleApiError = (
	error: unknown,
	defaultMessage: string,
) => {
	let message = defaultMessage;

	if (axios.isAxiosError(error)) {
		message =
			error.response?.data?.message ||
			error.message ||
			defaultMessage;
	} else if (error instanceof Error) {
		message = error.message;
	}

	notifyEntity(message, NOTIFY_TYPE.ERROR);
	throw error;
};

/**
 * Create Single User
 */
export const createUser = async (body: IUserRequest) => {
	try {
		const response = await api.post('/users', body);

		notifyEntity('User Created Successfully', NOTIFY_TYPE.CREATE);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to create user');
	}
};

/**
 * Bulk Create Users
 */
export const createBulkUsers = async (users: IUserRequest[]) => {
	try {
		const response = await api.post('/users/bulk', { users });

		notifyEntity('Users Created Successfully', NOTIFY_TYPE.CREATE);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to create users');
	}
};

/**
 * Get All Users
 */
export const getAllUsers = async () => {
	try {
		const response = await api.get('/users');
		return response.data || [];
	} catch (error) {
		handleApiError(error, 'Failed to fetch users');
	}
};

/**
 * Update User
 */
export const updateUser = async (
	id: number | string,
	body: IUpdateUserRequest,
) => {
	try {
		const response = await api.put(`/users/${id}`, body);

		notifyEntity('User Updated Successfully', NOTIFY_TYPE.UPDATE);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to update user');
	}
};

/**
 * Soft Delete User
 */
export const deleteUserById = async (id: number | string) => {
	try {
		const response = await api.delete(`/users/${id}`);

		notifyEntity('User Deleted Successfully', NOTIFY_TYPE.DELETE);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to delete user');
	}
};


export const getPaginatedUsers = async ({
	pageParam = 0,
	search = '',
}: {
	pageParam?: number;
	search?: string;
}) => {
	const response = await api.get('/users/pagination', {
		params: {
			page: pageParam,
			size: 10,
			search,
		},
	});

	return response.data;
};