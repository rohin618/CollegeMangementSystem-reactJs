import { DEPARTMENT_STATUS, SEMESTER_STATUS, SUBJECT_STATUS, SUBJECT_TYPE, USER_ROLE } from "../../constant/app";

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
