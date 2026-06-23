
export interface ICurriculum {
	id: number;

	departmentId: number;
	departmentName: string;

	academicBatchId: number;
	academicBatchName: string;

	semesterId: number;
	semesterName: string;

	subjectId: number;
	subjectName: string;

	subjectIds?: number[];

	displayOrder: number;

	status: string;
}

