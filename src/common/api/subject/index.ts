import axios from 'axios';
import { notifyEntity } from '../../../helpers/helpers';
import api from '../../axios';
import { NOTIFY_TYPE } from '../../constant/app';

export interface ICreateSubjectRequest {
	code: string;
	name: string;
	credits: number;
	type: string;
	description: string;
}

export interface IUpdateSubjectRequest {
	code: string;
	name: string;
	credits: number;
	type: string;
	description: string;
	status: string;
}

export interface ISubjectResponse {
	id: number;
	code: string;
	name: string;
	credits: number;
	type: string;
	description: string;
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

export const createSubject = async (
	body: ICreateSubjectRequest,
): Promise<ISubjectResponse> => {
	try {
		const response = await api.post('/subjects', body);

		notifyEntity(
			'Subject Created Successfully',
			NOTIFY_TYPE.CREATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to create subject');
		throw error;
	}
};

export const updateSubject = async (
	id: number | string,
	body: IUpdateSubjectRequest,
): Promise<ISubjectResponse> => {
	try {
		const response = await api.put(`/subjects/${id}`, body);

		notifyEntity(
			'Subject Updated Successfully',
			NOTIFY_TYPE.UPDATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to update subject');
		throw error;
	}
};

export const deleteSubjectById = async (
	id: number | string,
): Promise<string> => {
	try {
		const response = await api.delete(`/subjects/${id}`);

		notifyEntity(
			'Subject Deleted Successfully',
			NOTIFY_TYPE.DELETE,
		);

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to delete subject');
		throw error;
	}
};

export const getPaginatedSubjects = async ({
	pageParam = 0,
	search = '',
}: {
	pageParam?: number;
	search?: string;
}) => {
	try {
		const response = await api.get('/subjects/pagination', {
			params: {
				page: pageParam,
				size: 10,
				search,
			},
		});

		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to fetch subjects');
		throw error;
	}
};

export const getAllSubjects = async () => {
	try {
		const response = await api.get('/subjects');
		return response.data;
	} catch (error) {
		handleApiError(error, 'Failed to fetch subjects');
		throw error;
	}
};
