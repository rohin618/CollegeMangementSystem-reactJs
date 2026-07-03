import { FACULTY_STATUS } from "../../constant/app";
import { IFaculty } from "../../interface/faculty";


export const FacultyModal: Partial<IFaculty> = {
	employeeCode: '',

	firstName: '',

	lastName: '',

	email: '',

	phoneNumber: '',

	designation: '',

	departmentId: undefined,

	status: FACULTY_STATUS.ACTIVE,
};