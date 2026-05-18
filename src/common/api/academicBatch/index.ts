import axios from 'axios';
import { notifyEntity } from '../../../helpers/helpers';
import api from '../../axios';
import { NOTIFY_TYPE } from '../../constant/app';

/**
 * Academic Batch Interfaces
 */
export interface ICreateAcademicBatchRequest {
	name: string;
	startYear: number;
	endYear: number;
}

export interface IUpdateAcademicBatchRequest {
	name: string;
	startYear: number;
	endYear: number;
}

export interface IAcademicBatchResponse {
	id: number;
	name: string;
	startYear: number;
	endYear: number;
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
 * Create Academic Batch
 */
export const createAcademicBatch = async (
	body: ICreateAcademicBatchRequest,
): Promise<IAcademicBatchResponse> => {
	try {
		const response = await api.post('/academicBatch', body);

		notifyEntity(
			'Academic Batch Created Successfully',
			NOTIFY_TYPE.CREATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(
			error,
			'Failed to create academic batch',
		);
		throw error;
	}
};

/**
 * Get All Academic Batches
 */
export const getAllAcademicBatches = async (): Promise<
	IAcademicBatchResponse[]
> => {
	try {
		const response = await api.get('/academicBatch');
        console.log(response.data,'data---------')
		return response.data || [];
	} catch (error) {
		handleApiError(
			error,
			'Failed to fetch academic batches',
		);
		throw error;
	}
};

/**
 * Update Academic Batch
 */
export const updateAcademicBatch = async (
	id: number | string,
	body: IUpdateAcademicBatchRequest,
): Promise<IAcademicBatchResponse> => {
	try {
		const response = await api.put(
			`/academicBatch/${id}`,
			body,
		);

		notifyEntity(
			'Academic Batch Updated Successfully',
			NOTIFY_TYPE.UPDATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(
			error,
			'Failed to update academic batch',
		);
		throw error;
	}
};

/**
 * Delete Academic Batch
 */
export const deleteAcademicBatchById = async (
	id: number | string,
): Promise<string> => {
	try {
		const response = await api.delete(
			`/academicBatch/${id}`,
		);

		notifyEntity(
			'Academic Batch Deleted Successfully',
			NOTIFY_TYPE.DELETE,
		);

		return response.data;
	} catch (error) {
		handleApiError(
			error,
			'Failed to delete academic batch',
		);
		throw error;
	}
};