import { USER_TYPE } from "./common/constant";

export const summaryPageTopMenu = {
	intro: { id: 'intro', text: 'Intro', path: '#intro', icon: 'Vrpano', subMenu: null },
	bootstrap: {
		id: 'bootstrap',
		text: 'Bootstrap Components',
		path: '#bootstrap',
		icon: 'BootstrapFill',
		subMenu: null,
	},
	storybook: {
		id: 'storybook',
		text: 'Storybook',
		path: '#storybook',
		icon: 'CustomStorybook',
		subMenu: null,
	},
	formik: {
		id: 'formik',
		text: 'Formik',
		path: '#formik',
		icon: 'CheckBox',
		subMenu: null,
	},
	apex: {
		id: 'apex',
		text: 'Apex Charts',
		path: '#apex',
		icon: 'AreaChart',
		subMenu: null,
	},
};



export const pagesMenu = {
	// dashboard: {
	// 	id: 'dashboard',
	// 	text: 'Dashboard',
	// 	path: '/dashboard',
	// 	icon: 'Dashboard',
	// 	roles: [
	// 		USER_TYPE.SUPER_ADMIN,
	// 		USER_TYPE.OPERATIONS_MANAGER,
	// 		USER_TYPE.ACCOUNTS_MANAGER,
	// 		USER_TYPE.FINANCE_EXECUTIVE,
	// 		USER_TYPE.BILLING_EXECUTIVE,
	// 	],
	// 	subMenu: null,
	// },

	// organisationSetup: {
	// 	id: 'organisationSetup',
	// 	text: 'Organisation Setup',
	// 	path: 'organisation-setup',
	// 	icon: 'Business',
	// 	roles: [
	// 		USER_TYPE.SUPER_ADMIN,
	// 		USER_TYPE.OPERATIONS_MANAGER,
	// 	],
	// 	subMenu: {
	// 		company: {
	// 			id: 'company',
	// 			text: 'Company',
	// 			path: 'company',
	// 			icon: 'OtherHouses',
	// 			roles: [USER_TYPE.SUPER_ADMIN],
	// 		},
	// 		laAndIcb: {
	// 			id: 'laAndIcb',
	// 			text: 'LA / ICB',
	// 			path: 'laAndIcb',
	// 			icon: 'HomeWork',
	// 			roles: [USER_TYPE.SUPER_ADMIN],
	// 		},
	// 	},
	// },

	// operations: {
	// 	id: 'operations',
	// 	text: 'Operations',
	// 	path: 'operations',
	// 	icon: 'AddBusiness',
	// 	roles: [
	// 		USER_TYPE.SUPER_ADMIN,
	// 		USER_TYPE.OPERATIONS_MANAGER,
	// 		USER_TYPE.BILLING_EXECUTIVE,
	// 	],
	// 	subMenu: {
	// 		rooms: {
	// 			id: 'rooms',
	// 			text: 'Rooms',
	// 			path: 'rooms',
	// 			icon: 'RecentActors',
	// 			roles: [USER_TYPE.OPERATIONS_MANAGER],
	// 		},
	// 		resident: {
	// 			id: 'resident',
	// 			text: 'Residents',
	// 			path: 'resident',
	// 			icon: 'Elderly',
	// 			roles: [
	// 				USER_TYPE.OPERATIONS_MANAGER,
	// 				USER_TYPE.BILLING_EXECUTIVE,
	// 			],
	// 		},
	// 	},
	// },

	// users: {
	// 	id: 'users',
	// 	text: 'Users',
	// 	path: 'users',
	// 	icon: 'PersonSearch',
	// 	roles: [USER_TYPE.SUPER_ADMIN],
	// 	subMenu: null,
	// },


	// reports: {
	// 	id: 'reports',
	// 	text: 'Reports',
	// 	path: 'reports',
	// 	icon: 'StackedBarChart',
	// 	roles: [
	// 		USER_TYPE.SUPER_ADMIN,
	// 		USER_TYPE.ACCOUNTS_MANAGER,
	// 		USER_TYPE.FINANCE_EXECUTIVE,
	// 	],
	// 	subMenu: null,
	// },

	// billingAndInvoicing: {
	// 	id: 'billingAndInvoicing',
	// 	text: 'Billing & Invoicing',
	// 	path: 'billing-and-invoicing',
	// 	icon: 'ReceiptLong',
	// 	roles: [
	// 		USER_TYPE.SUPER_ADMIN,
	// 		USER_TYPE.BILLING_EXECUTIVE,
	// 		USER_TYPE.FINANCE_EXECUTIVE,
	// 	],
	// 	subMenu: {
	// 		invoice: {
	// 			id: 'invoice',
	// 			text: 'Invoice',
	// 			path: 'invoice',
	// 			icon: 'Inventory',
	// 			roles: [
	// 				USER_TYPE.BILLING_EXECUTIVE,
	// 				USER_TYPE.FINANCE_EXECUTIVE,
	// 			],
	// 		},
	// 		creditNotes: {
	// 			id: 'residentCreditNotes',
	// 			text: 'Credit Notes',
	// 			path: 'ResidentCreditNotes',
	// 			icon: 'Undo',
	// 			roles: [USER_TYPE.FINANCE_EXECUTIVE],
	// 		},
	// 		paymentHistory: {
	// 			id: 'paymentHistory',
	// 			text: 'Payment History',
	// 			path: 'paymentHistory',
	// 			icon: 'History',
	// 			roles: [USER_TYPE.FINANCE_EXECUTIVE],
	// 		},
	// 		creditWalet: {
	// 			id: 'creditNotes',
	// 			text: 'Advance Credit',
	// 			path: 'creditNotes',
	// 			icon: 'CreditCard',
	// 			roles: [USER_TYPE.FINANCE_EXECUTIVE],
	// 		},
	// 	},
	// },
	// masters: {
	// 	id: 'masters',
	// 	text: 'Masters',
	// 	path: 'masters',
	// 	icon: 'AutoAwesomeMotion',
	// 	roles: [
	// 		USER_TYPE.SUPER_ADMIN,
	// 		USER_TYPE.OPERATIONS_MANAGER,
	// 		USER_TYPE.ACCOUNTS_MANAGER,
	// 		USER_TYPE.FINANCE_EXECUTIVE,
	// 		USER_TYPE.PURCHASE_OFFICER
	// 	],
	// 	subMenu: null,
	// },

	// financeAndAccounting: {
	// 	id: 'financeAndAccounting',
	// 	text: 'Finance & Accounting',
	// 	path: 'finance-and-accounting',
	// 	icon: 'AccountBalance',
	// 	roles: [
	// 		USER_TYPE.SUPER_ADMIN,
	// 		USER_TYPE.ACCOUNTS_MANAGER,
	// 		USER_TYPE.FINANCE_EXECUTIVE,
	// 	],
	// 	subMenu: {
	// 		chartOfAccount: {
	// 			id: 'chartofAccounts',
	// 			text: 'Chart Of Accounts',
	// 			path: 'chartofAccounts',
	// 			icon: 'ManageAccounts',
	// 			roles: [USER_TYPE.ACCOUNTS_MANAGER],
	// 		},
	// 		openBalance: {
	// 			id: 'openingBalance',
	// 			text: 'Opening Balance',
	// 			path: 'openingBalance',
	// 			icon: 'AccountBalanceWallet',
	// 			roles: [USER_TYPE.ACCOUNTS_MANAGER],
	// 		},
	// 	},
	// },

	// // 🔴 Only Purchase Officer + Full Access Roles
	// purchaseOrder: {
	// 	id: 'purchaseOrder',
	// 	text: 'Purchase Order',
	// 	path: 'purchaseOrder',
	// 	icon: 'ShoppingCart',
	// 	roles: [
	// 		USER_TYPE.SUPER_ADMIN,
	// 		USER_TYPE.OPERATIONS_MANAGER,
	// 		USER_TYPE.ACCOUNTS_MANAGER,
	// 		USER_TYPE.FINANCE_EXECUTIVE,
	// 		USER_TYPE.PURCHASE_OFFICER,
	// 	],
	// 	subMenu: null,
	// },

	// debitNote: {
	// 	id: 'debitNote',
	// 	text: 'Debit Note',
	// 	path: 'debitNote',
	// 	icon: 'RemoveCircle',
	// 	roles: [
	// 		USER_TYPE.SUPER_ADMIN,
	// 		USER_TYPE.OPERATIONS_MANAGER,
	// 		USER_TYPE.ACCOUNTS_MANAGER,
	// 		USER_TYPE.FINANCE_EXECUTIVE,
	// 		USER_TYPE.PURCHASE_OFFICER,
	// 	],
	// 	subMenu: null,
	// },


	userManagement: {
		id: 'userManagement',
		text: 'User Management',
		path: 'userManagement',
		icon: 'People',
		roles: [
			
		],
		subMenu: null,
	}
};

export const authMenu = {


	// auth: {
	// 	id: 'auth',
	// 	text: 'Auth Pages',
	// 	icon: 'Extension',
	// },
	login: {
		id: 'login',
		text: 'Login',
		path: '',
		icon: 'Login',
	},
	loginCompany: {
		id: 'login-company',
		text: 'Login Company',
		path: 'login-company',
		icon: 'Login',
	},
	// signUp: {
	// 	id: 'signUp',
	// 	text: 'Sign Up',
	// 	path: 'auth-pages/sign-up',
	// 	icon: 'PersonAdd',
	// },
	page404: {
		id: 'Page404',
		text: '404 Page',
		path: 'auth-pages/404',
		icon: 'ReportGmailerrorred',
	},
};

export const pageLayoutTypesPagesMenu = {

};


