import React, { ReactNode, useContext, useEffect, useState } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import Brand from '../../../layout/Brand/Brand';
import Navigation, { NavigationLine } from '../../../layout/Navigation/Navigation';
import User from '../../../layout/User/User';
import {
	// componentPagesMenu,
	pagesMenu,
} from '../../../menu';
import ThemeContext from '../../../contexts/themeContext';

import useDarkMode from '../../../hooks/useDarkMode';
import Aside, { AsideBody, AsideFoot, AsideHead } from '../../../layout/Aside/Aside';
import { getStorage } from '../../../helpers/helpers';
import { EXIST_SESSION_STORAGE_NAMES, USER_TYPE } from '../../../common/constant';
import { useGetCurrentUser } from '../../../hooks';

const DefaultAside = () => {
	const { asideStatus, setAsideStatus } = useContext(ThemeContext);
	const currentUser = useGetCurrentUser();

	const [doc, setDoc] = useState(
		localStorage.getItem('facit_asideDocStatus') === 'true' || false,
	);


 const curentUser = getStorage(EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO);

	const filterMenuByRole = (menu: any, role: number) => {
		const fullAccessRoles:any = [
			USER_TYPE.SUPER_ADMIN,
			USER_TYPE.OPERATIONS_MANAGER,
			USER_TYPE.ACCOUNTS_MANAGER,
			USER_TYPE.FINANCE_EXECUTIVE,
		];

		// 🔹 Purchase Officer → ONLY PO & Debit
		if (role === USER_TYPE.PURCHASE_OFFICER) {
			return {
				purchaseOrder: menu.purchaseOrder,
				debitNote: menu.debitNote,
				masters: menu.masters,
			};
		}

		// 🔹 Full Access
		if (fullAccessRoles.includes(role)) {
			return menu;
		}

		// 🔹 Billing → hide PO & Debit
		if (role === USER_TYPE.BILLING_EXECUTIVE) {
			const { purchaseOrder, debitNote, ...rest } = menu;
			return rest;
		}

		return {};
	};


	 const filteredMenu = filterMenuByRole(pagesMenu, curentUser?.userType);
	 console.log('filteredMenu-===',pagesMenu)


	return (
		<Aside>
			<AsideHead>
				<Brand asideStatus={asideStatus} setAsideStatus={setAsideStatus} />
			</AsideHead>
			<AsideBody>
				{!doc && (
					<>
						<Navigation menu={filteredMenu} id='aside-dashboard' />
						{/* <NavigationLine />
						<Navigation menu={demoPagesMenu} id='aside-demo-pages' />
						<NavigationLine />
						<Navigation menu={pageLayoutTypesPagesMenu} id='aside-menu' /> */}
					</>
				)}




			</AsideBody>
			<AsideFoot>

				<User currentUser={currentUser} />
			</AsideFoot>
		</Aside>
	);
};

export default DefaultAside;
