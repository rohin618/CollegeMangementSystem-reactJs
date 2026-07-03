import axios from 'axios';
import { notifyEntity } from '../../../helpers/helpers';
import api from '../../axios';
import { NOTIFY_TYPE } from '../../constant/app';
import { IFaculty } from '../../interface/faculty';
export interface ICreateFacultyRequest {
	employeeCode: string;
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	designation: string;
	departmentId: number;
}

export interface IUpdateFacultyRequest {
	id: number;
	employeeCode: string;
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	designation: string;
	departmentId: number;
	status: string;
}

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
 * Create Faculty
 */
export const createFaculty = async (
	body: ICreateFacultyRequest,
): Promise<IFaculty> => {
	try {
		const response = await api.post('/faculties', body);

		notifyEntity(
			'Faculty Created Successfully',
			NOTIFY_TYPE.CREATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to create faculty');
		throw error;
	}
};

/**
 * Get Faculty Pagination
 */
export const getPaginatedFaculties = async ({
	pageParam = 0,
	search = '',
	departmentId,
}: {
	pageParam?: number;
	search?: string;
	departmentId?: number;
}) => {
	try {
		const response = await api.get('/faculties', {
			params: {
				page: pageParam,
				size: 10,
				search,
				departmentId,
			},
		});

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to fetch faculties');
		throw error;
	}
};

/**
 * Get Faculty By Id
 */
export const getFacultyById = async (
	id: number | string,
): Promise<IFaculty> => {
	try {
		const response = await api.get(`/faculties/${id}`);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to fetch faculty');
		throw error;
	}
};

/**
 * Update Faculty
 */
export const updateFaculty = async (
	id: number | string,
	body: IUpdateFacultyRequest,
): Promise<IFaculty> => {
	try {
		const response = await api.put(
			`/faculties/${id}`,
			body,
		);

		notifyEntity(
			'Faculty Updated Successfully',
			NOTIFY_TYPE.UPDATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to update faculty');
		throw error;
	}
};

/**
 * Delete Faculty
 */
export const deleteFacultyById = async (
	id: number | string,
): Promise<void> => {
	try {
		await api.delete(`/faculties/${id}`);

		notifyEntity(
			'Faculty Deleted Successfully',
			NOTIFY_TYPE.DELETE,
		);
	} catch (error) {
		handleApiError(error, 'Failed to delete faculty');
		throw error;
	}
};