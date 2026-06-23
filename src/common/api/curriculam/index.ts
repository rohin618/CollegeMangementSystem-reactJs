
import axios from 'axios';
import api from '../../axios';
import { notifyEntity } from '../../../helpers/helpers';
import { NOTIFY_TYPE } from '../../constant/app';

/* ============================
   TYPES
============================ */

export interface ICreateCurriculumRequest {
	departmentId: number;
	academicBatchId: number;
	semesterId: number;
	subjectIds: number[] | any[];
}


export interface IUpdateCurriculumRequest {
	id: number;
	departmentId: number;
	academicBatchId: number;
	semesterId: number;
	subjectId: number;
}



export interface ICurriculumResponse {
	id: number;

	departmentId: number;
	departmentName: string;

	academicBatchId: number;
	academicBatchName: string;

	semesterId: number;
	semesterName: string;

	subjectId: number;
	subjectName: string;

	displayOrder: number;

	status: string;
}

export interface IGetCurriculumParams {
	page?: number;
	size?: number;
	departmentId?: number;
	academicBatchId?: number;
	semesterId?: number;
}

/* ============================
   ERROR HANDLER
============================ */

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

/* ============================
   CREATE
============================ */

export const createCurriculum = async (
	body: ICreateCurriculumRequest,
): Promise<string> => {
	try {
		const response = await api.post(
			'/curriculum',
			body,
		);

		notifyEntity(
			'Curriculum Created Successfully',
			NOTIFY_TYPE.CREATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(
			error,
			'Failed to create curriculum',
		);
		throw error;
	}
};

/* ============================
   GET LIST
============================ */

export const getPaginatedCurriculum = async ({
	page = 0,
	size = 10,
	departmentId,
	academicBatchId,
	semesterId,
}: IGetCurriculumParams) => {
	try {
		const response = await api.get(
			'/curriculum',
			{
				params: {
					page,
					size,
					departmentId,
					academicBatchId,
					semesterId,
				},
			},
		);

		return response.data;
	} catch (error) {
		handleApiError(
			error,
			'Failed to fetch curriculum',
		);
		throw error;
	}
};

/* ============================
   UPDATE
============================ */

export const updateCurriculum = async (
	body: IUpdateCurriculumRequest,
): Promise<ICurriculumResponse> => {
	try {
		const response = await api.put(
			'/curriculum',
			body,
		);

		notifyEntity(
			'Curriculum Updated Successfully',
			NOTIFY_TYPE.UPDATE,
		);

		return response.data;
	} catch (error) {
		handleApiError(
			error,
			'Failed to update curriculum',
		);
		throw error;
	}
};



/* ============================
   DELETE
============================ */

export const deleteCurriculumById = async (
	id: number | string,
): Promise<string> => {
	try {
		const response = await api.delete(
			`/curriculum/${id}`,
		);

		notifyEntity(
			'Curriculum Deleted Successfully',
			NOTIFY_TYPE.DELETE,
		);

		return response.data;
	} catch (error) {
		handleApiError(
			error,
			'Failed to delete curriculum',
		);
		throw error;
	}
};

