import { USER_ROLE } from "../../constant/app";

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