import React from 'react';
import { RouteProps } from 'react-router-dom';


import DefaultHeader from '../pages/_layout/_headers/DefaultHeader';
import { authMenu } from '../menu';

const headers: RouteProps[] = [
	{
		path: authMenu.login.path,
		element: null,
	},
	{
		path: authMenu.loginCompany.path,
		element: null,
	},
	{
		path: `*`,
		element: <DefaultHeader />,
	},
];

export default headers;
