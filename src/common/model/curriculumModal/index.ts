import { CURRICULUM_STATUS } from "../../constant/app";
import { ICurriculum } from "../../interface/curriculum";

export const CurriculumModal: Partial<ICurriculum> = {
	departmentId: undefined,
	academicBatchId: undefined,
	semesterId: undefined,
	subjectId: undefined,
	displayOrder: 1,
	status: CURRICULUM_STATUS.ACTIVE,
};