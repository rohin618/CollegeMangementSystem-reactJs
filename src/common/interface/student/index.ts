export interface IStudent {
	id: number;

	registerNumber: string;

	firstName: string;
	lastName: string;

	email: string;
	phoneNumber: string;

	dateOfBirth: string;

	gender: string;

	departmentId: number;
	departmentName?: string;

	academicBatchId: number;
	academicBatchName?: string;

	semesterId: number;
	semesterName?: string;

	status: string;
}