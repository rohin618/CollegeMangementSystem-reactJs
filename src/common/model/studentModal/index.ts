import { GENDER_TYPE, STUDENT_STATUS } from "../../constant/app";
import { IStudent } from "../../interface/student";


export const StudentModal: Partial<IStudent> = {
	registerNumber: '',

	firstName: '',
	lastName: '',

	email: '',
	phoneNumber: '',

	dateOfBirth: '',

	gender: GENDER_TYPE.MALE,

	departmentId: 0,
	academicBatchId: 0,
	semesterId: 0,

	status: STUDENT_STATUS.ACTIVE,
};