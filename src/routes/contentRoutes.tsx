import React, { lazy } from 'react';
import { RouteProps } from 'react-router-dom';
import { pagesMenu, authMenu } from '../menu';

export type AppRoute = RouteProps & {
	isPublic?: boolean;
	meta?: {
		roles?: string[]; // e.g., ['admin', 'manager']
		title?: string;
	};
};
// 🔹 Auth
const Login = lazy(() => import('../pages/presentation/auth/Login'));
const LoginCompany = lazy(() => import('../pages/presentation/auth/loginCompany'));
const DummyPage = lazy(() => import('../pages/presentation/dummy'));

// 🔹 Dashboar
const presentation: AppRoute[] = [
	{ path: authMenu.login.path, element: <Login />, isPublic: true },
	{ path: authMenu.loginCompany.path, element: <LoginCompany />, isPublic: false },


	// { path: pagesMenu.users.path, element: <Users />, isPublic: false },


	{ path: '/dummypage', element: <DummyPage />, isPublic: false },
];

export default presentation;
