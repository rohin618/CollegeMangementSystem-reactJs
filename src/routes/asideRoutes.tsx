import React from 'react';
import { RouteProps } from 'react-router-dom';
import DefaultAside from '../pages/_layout/_asides/DefaultAside';
import { authMenu } from '../menu';



const asides: RouteProps[] = [

	{ path:authMenu.login.path, element:null },
	{ path:authMenu.loginCompany.path, element:null },
	{ path: '*', element: <DefaultAside /> },
];

export default asides;
