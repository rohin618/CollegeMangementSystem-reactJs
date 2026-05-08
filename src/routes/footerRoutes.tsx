import React from 'react';
import { RouteProps } from 'react-router-dom';
import DefaultFooter from '../pages/_layout/_footers/DefaultFooter';
import { authMenu } from '../menu';

const footers: RouteProps[] = [

	{ path: authMenu.login.path, element: null },
	{ path: authMenu.loginCompany.path, element: null },
	{ path: '*', element: <DefaultFooter /> },
];

export default footers;
