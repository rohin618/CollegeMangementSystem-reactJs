import axios from 'axios';
import { notifyEntity } from '../../../helpers/helpers';
import api from '../../axios';
import { NOTIFY_TYPE } from '../../constant/app';

/**
 * Department Interfaces
 */
export interface ICreateDepartmentRequest {
	name: string;
	description: string;
	code: string;
}

export interface IUpdateDepartmentRequest {
	name: string;
	description: string;
	code: string;
	status: string;
}

export interface IDepartmentResponse {
	id: number;
	name: string;
	description: string;
	code: string;
	status: string;
}

/**
 * Common API Error Handler
 */
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
 * Create Department
 */
export const createDepartment = async (
	body: ICreateDepartmentRequest,
): Promise<IDepartmentResponse> => {
	try {
		const response = await api.post('/departments', body);

		notifyEntity(
			'Department Created Successfully',
			NOTIFY_TYPE.CREATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to create department');
		throw error;
	}
};

/**
 * Get All Departments
 */
export const getAllDepartments = async (): Promise<
	IDepartmentResponse[]
> => {
	try {
		const response = await api.get('/departments');
		return response.data || [];
	} catch (error) {
		handleApiError(error, 'Failed to fetch departments');
		throw error;
	}
};

/**
 * Update Department
 */
export const updateDepartment = async (
	id: number | string,
	body: IUpdateDepartmentRequest,
): Promise<IDepartmentResponse> => {
	try {
		const response = await api.put(`/departments/${id}`, body);

		notifyEntity(
			'Department Updated Successfully',
			NOTIFY_TYPE.UPDATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to update department');
		throw error;
	}
};

/**
 * Delete Department
 */
export const deleteDepartmentById = async (
	id: number | string,
): Promise<string> => {
	try {
		const response = await api.delete(`/departments/${id}`);

		notifyEntity(
			'Department Deleted Successfully',
			NOTIFY_TYPE.DELETE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to delete department');
		throw error;
	}
};

/**
 * Get Paginated Departments
 */
export const getPaginatedDepartments = async ({
	pageParam = 0,
	search = '',
}: {
	pageParam?: number;
	search?: string;
}) => {
	try {
		const response = await api.get('/departments/pagination', {
			params: {
				page: pageParam,
				size: 10,
				search,
			},
		});

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to fetch departments');
		throw error;
	}
};