import axios from 'axios';
import { notifyEntity } from '../../../helpers/helpers';
import api from '../../axios';
import { NOTIFY_TYPE } from '../../constant/app';
import { IStudent } from '../../interface/student';

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
export interface ICreateStudentRequest {
	registerNumber: string;
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	dateOfBirth: string;
	gender: string;

	departmentId: number;
	academicBatchId: number;
	semesterId: number;
}

export interface IUpdateStudentRequest {
	id: number;

	registerNumber: string;
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	dateOfBirth: string;
	gender: string;

	departmentId: number;
	academicBatchId: number;
	semesterId: number;

	status: string;
}
/**
 * Create Student
 */
export const createStudent = async (
	body: ICreateStudentRequest,
): Promise<IStudent> => {
	try {
		const response = await api.post('/students', body);

		notifyEntity(
			'Student Created Successfully',
			NOTIFY_TYPE.CREATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to create student');
		throw error;
	}
};

/**
 * Get All Students
 */
export const getAllStudents = async (): Promise<
	IStudent[]
> => {
	try {
		const response = await api.get('/students');

		return response.data || [];
	} catch (error) {
		handleApiError(error, 'Failed to fetch students');
		throw error;
	}
};

/**
 * Update Student
 */
export const updateStudent = async (
	body: IUpdateStudentRequest,
): Promise<IStudent> => {
	try {
		const response = await api.put(
			'/students',
			body,
		);

		notifyEntity(
			'Student Updated Successfully',
			NOTIFY_TYPE.UPDATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to update student');
		throw error;
	}
};
/**
 * Delete Student
 */
export const deleteStudentById = async (
	id: number | string,
): Promise<string> => {
	try {
		const response = await api.delete(
			`/students/${id}`,
		);

		notifyEntity(
			'Student Deleted Successfully',
			NOTIFY_TYPE.DELETE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to delete student');
		throw error;
	}
};

/**
 * Get Paginated Students
 */
export const getPaginatedStudents = async ({
	pageParam = 0,
	search = '',
	departmentId,
	academicBatchId,
	semesterId,
}: {
	pageParam?: number;
	search?: string;
	departmentId?: number;
	academicBatchId?: number;
	semesterId?: number;
}) => {
	try {
		const response = await api.get('/students', {
			params: {
				page: pageParam,
				size: 10,
				search,
				departmentId,
				academicBatchId,
				semesterId,
			},
		});

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to fetch students');
		throw error;
	}
};