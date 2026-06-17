import axios from 'axios';
import { notifyEntity } from '../../../helpers/helpers';
import api from '../../axios';
import { NOTIFY_TYPE } from '../../constant/app';

/**
 * Semester Interfaces
 */
export interface ICreateSemesterRequest {
	semesterNumber: number;
}

export interface IUpdateSemesterRequest {
	semesterNumber: number;
	status: string;
}

export interface ISemesterResponse {
	id: number;
	name: string;
	semesterNumber: number;
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
 * Create Semester
 */
export const createSemester = async (
	body: ICreateSemesterRequest,
): Promise<ISemesterResponse> => {
	try {
		const response = await api.post('/semesters', body);

		notifyEntity(
			'Semester Created Successfully',
			NOTIFY_TYPE.CREATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to create semester');
		throw error;
	}
};

/**
 * Get All Semesters
 */
export const getAllSemesters = async (): Promise<
	ISemesterResponse[]
> => {
	try {
		const response = await api.get('/semesters');
		return response.data || [];
	} catch (error) {
		handleApiError(error, 'Failed to fetch semesters');
		throw error;
	}
};

/**
 * Update Semester
 */
export const updateSemester = async (
	id: number | string,
	body: IUpdateSemesterRequest,
): Promise<ISemesterResponse> => {
	try {
		const response = await api.put(
			`/semesters/${id}`,
			body,
		);

		notifyEntity(
			'Semester Updated Successfully',
			NOTIFY_TYPE.UPDATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to update semester');
		throw error;
	}
};

/**
 * Delete Semester
 */
export const deleteSemesterById = async (
	id: number | string,
): Promise<string> => {
	try {
		const response = await api.delete(
			`/semesters/${id}`,
		);

		notifyEntity(
			'Semester Deleted Successfully',
			NOTIFY_TYPE.DELETE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to delete semester');
		throw error;
	}
};

/**
 * Get Paginated Semesters
 */
export const getPaginatedSemesters = async ({
	pageParam = 0,
	search = '',
}: {
	pageParam?: number;
	search?: string;
}) => {
	try {
		const response = await api.get(
			'/semesters/pagination',
			{
				params: {
					page: pageParam,
					size: 10,
					search,
				},
			},
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to fetch semesters');
		throw error;
	}
};