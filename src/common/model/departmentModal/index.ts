import React from 'react'
import { IDepartment } from '../../interface/departments';
import { DEPARTMENT_STATUS } from '../../constant/app';


export const DepartmentModal: Partial<IDepartment> = {
	name: '',
	code: '',
	description: '',
	status: DEPARTMENT_STATUS.ACTIVE,
};