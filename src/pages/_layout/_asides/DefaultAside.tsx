import React, { useContext, useState } from 'react';
import Brand from '../../../layout/Brand/Brand';
import Navigation from '../../../layout/Navigation/Navigation';
import User from '../../../layout/User/User';
import { pagesMenu } from '../../../menu';
import ThemeContext from '../../../contexts/themeContext';
import Aside, { AsideBody, AsideFoot, AsideHead } from '../../../layout/Aside/Aside';
import { useGetCurrentUser } from '../../../hooks';
import { USER_ROLE } from '../../../common/constant/app';

const DefaultAside = () => {
	const { asideStatus, setAsideStatus } = useContext(ThemeContext);
	const currentUser = useGetCurrentUser();

	const [doc] = useState(
		localStorage.getItem('facit_asideDocStatus') === 'true' || false,
	);

	const filterMenuByRole = (menu: any, role?: string) => {
		if (!role) return {};

		// Super Admin -> full access
		if (role === USER_ROLE.SUPER_ADMIN) {
			return menu;
		}

		// Admin -> almost full access
		if (role === USER_ROLE.ADMIN) {
			return {
				dashboard: menu.dashboard,
				students: menu.students,
				faculty: menu.faculty,
				courses: menu.courses,
				departments: menu.departments,
				attendance: menu.attendance,
			};
		}

		// Faculty access
		if (role === USER_ROLE.FACULTY) {
			return {
				dashboard: menu.dashboard,
				students: menu.students,
				attendance: menu.attendance,
				courses: menu.courses,
			};
		}

		// Student access
		if (role === USER_ROLE.STUDENT) {
			return {
				dashboard: menu.dashboard,
				courses: menu.courses,
				attendance: menu.attendance,
				profile: menu.profile,
			};
		}

		return {};
	};

	const filteredMenu = filterMenuByRole(pagesMenu, currentUser?.role);

	return (
		<Aside>
			<AsideHead>
				<Brand asideStatus={asideStatus} setAsideStatus={setAsideStatus} />
			</AsideHead>

			<AsideBody>
				{!doc && <Navigation menu={filteredMenu} id='aside-dashboard' />}
			</AsideBody>

			<AsideFoot>
				<User currentUser={currentUser} />
			</AsideFoot>
		</Aside>
	);
};

export default DefaultAside;