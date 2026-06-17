import { ISemester } from '../../interface/semester';
import { SEMESTER_STATUS } from '../../constant/app';

export const SemesterModal: Partial<ISemester> = {
	semesterNumber: 1,
	status: SEMESTER_STATUS.ACTIVE,
};