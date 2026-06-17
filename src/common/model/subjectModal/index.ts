import { SUBJECT_STATUS } from "../../constant/app";
import { ISubject } from "../../interface/subject";


export const SubjectModal: Partial<ISubject> = {
	code: '',
	name: '',
	credits: 1,
	type: '',
	description: '',
	status: SUBJECT_STATUS.ACTIVE,
};