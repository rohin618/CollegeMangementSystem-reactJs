import { DEPARTMENT_STATUS, FACULTY_STATUS, GENDER_TYPE, SEMESTER_STATUS, STUDENT_STATUS, SUBJECT_STATUS, SUBJECT_TYPE, USER_ROLE } from "../../constant/app";

// CMS
export const USER_ROLE_LIST = [
  {
    value: USER_ROLE.SUPER_ADMIN,
    label: 'Super Admin',
    color: 'danger',
  },
  {
    value: USER_ROLE.ADMIN,
    label: 'Admin',
    color: 'warning',
  },
  {
    value: USER_ROLE.FACULTY,
    label: 'Faculty',
    color: 'info',
  },
  {
    value: USER_ROLE.STUDENT,
    label: 'Student',
    color: 'success',
  },
];


export const DEPARTMENT_STATUS_OPTIONS = [
  {
    label: 'Active',
    value: DEPARTMENT_STATUS.ACTIVE,
  },
  {
    label: 'Inactive',
    value: DEPARTMENT_STATUS.INACTIVE,
  },
];
export const ACADEMIC_BATCH_STATUS_OPTIONS = [
  {
    label: 'Active',
    value: DEPARTMENT_STATUS.ACTIVE,
  },
  {
    label: 'Inactive',
    value: DEPARTMENT_STATUS.INACTIVE,
  },
];



export const SEMESTER_STATUS_OPTIONS = [
  {
    label: 'Active',
    value: SEMESTER_STATUS.ACTIVE,
  },
  {
    label: 'Inactive',
    value: SEMESTER_STATUS.INACTIVE,
  },
];
export const SUBJECT_STATUS_OPTIONS = [
  {
    label: 'Active',
    value: SUBJECT_STATUS.ACTIVE,
  },
  {
    label: 'Inactive',
    value: SUBJECT_STATUS.INACTIVE,
  },
];
export const SUBJECT_TYPE_OPTIONS = [
  {
    label: 'Theory',
    value: SUBJECT_TYPE.THEORY,
  },
  {
    label: 'Practical',
    value: SUBJECT_TYPE.PRACTICAL,
  },
];




export const STUDENT_STATUS_OPTIONS = [
	{
    label: 'Active',
		value: STUDENT_STATUS.ACTIVE,
		color: 'success',
	},
	{
    label: 'Inactive',
		value: STUDENT_STATUS.INACTIVE,
		color: 'danger',
	},
	{
    label: 'Graduated',
		value: STUDENT_STATUS.GRADUATED,
		color: 'info',
	},
	{
		label: 'Discontinued',
		value: STUDENT_STATUS.DISCONTINUED,
		color: 'warning',
	},
];

export const GENDER_OPTIONS = [
  {
		label: 'Male',
		value: GENDER_TYPE.MALE,
	},
	{
		label: 'Female',
		value: GENDER_TYPE.FEMALE,
	},
	{
    label: 'Other',
		value: GENDER_TYPE.OTHER,
	},
];
export const FACULTY_STATUS_OPTIONS = [
	{
		label: 'Active',
		value: FACULTY_STATUS.ACTIVE,
		color: 'success',
	},
	{
		label: 'Inactive',
		value: FACULTY_STATUS.INACTIVE,
		color: 'secondary',
	},
	{
		label: 'Retired',
		value: FACULTY_STATUS.RETIRED,
		color: 'warning',
	},
	{
		label: 'Resigned',
		value: FACULTY_STATUS.RESIGNED,
		color: 'danger',
	},
];