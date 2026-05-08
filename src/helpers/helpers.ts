// import { TColor } from "../type/color-type";
// import ExcelJS from "exceljs";
import * as XLSX from "xlsx";

import moment, { Moment } from "moment";
import { DB_NAME, EXIST_SESSION_STORAGE_NAMES, FNC_STATUS_TYPE, FUND_SOURCE_STATUS_TYPE, FUND_SOURCE_TYPE, FUND_TYPE, INCONT_STATUS_TYPE, INVOICE_CATEGORY, INVOICE_TO_TYPE, INVOICE_TYPE, NOTIFY_TYPE, PLACEMENT_TYPE, PRICE_PERIOD_STATUS } from "../common/constant";
import showNotification from "../components/extras/showNotification";
import { collection, doc } from "firebase/firestore";
import { db } from "../firebase";
import { LPA_TYPE, NOK_INVOICE_REQUIRED, PAYMENT_STATUS, FAMILY_OR_THIRD_PARTY_TOPUP_STATUS, FUND_SOURCE_TYPE_LABEL, RESPITE_STATUS_TYPE, INVOICE_STATUS } from "../common/constant/app";
export { getResidentInvoiceAddress } from "./residentInvoiceAddress";
export { createInvoiceDataByDate } from "./createInvoiceDataByDate";
export { checkArrearsAndCreditBlockBedInvoice } from "./checkArrearsAndCreditBlockBedInvoice";
export { checkArrearsAndCreditOfInvoice } from "./checkArrearsAndCreditOfInvoice";
export { httpErrorInterceptor } from "./httpErrorInterceptor";
export { showAlert } from "./alerts";
export { isBlockBedsValidation, getActiveFundDetailsByLAOrICB, getActiveBlockBedByFund, getUpdateBlockBedHistory, buildblockBedHistoryEntry, validateBlockBedAdmission } from "./resident";
export { getInvoiceDiscountTotal, getInvoiceOpenBalance, } from './invoice/index'
import {
	PricePeriod,
	Bed,
	BedRef,
	Room,
	RoomReport,
	ProcessedBed,
	ProcessedRoom,
	DateWiseRoomAvailability,
	IInvoiceModel,
	IResidentModel
} from "../common/interface";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FUND_SOURCE_LIST, FUND_SOURCE_STATUS_TYPE_LIST, SALUTATION_LIST } from "../common/data/option";
import { showAlert } from "./alerts";
import { getInvoiceOpenBalance, getInvoicePayedAmount } from "./invoice/index";



export function test() {
	return null;
}

export function getOS() {
	const { userAgent } = window.navigator;
	const { platform } = window.navigator;
	const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
	const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
	const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
	let os = null;

	if (macosPlatforms.indexOf(platform) !== -1) {
		os = 'MacOS';
	} else if (iosPlatforms.indexOf(platform) !== -1) {
		os = 'iOS';
	} else if (windowsPlatforms.indexOf(platform) !== -1) {
		os = 'Windows';
	} else if (/Android/.test(userAgent)) {
		os = 'Android';
	} else if (!os && /Linux/.test(platform)) {
		os = 'Linux';
	}

	// @ts-ignore
	document.documentElement.setAttribute('os', os);
	return os;
}

export const hasNotch = () => {
	/**
	 * For storybook test
	 */
	const storybook = window.location !== window.parent.location;
	// @ts-ignore
	const iPhone = /iPhone/.test(navigator.userAgent) && !window.MSStream;
	const aspect = window.screen.width / window.screen.height;
	const aspectFrame = window.innerWidth / window.innerHeight;
	return (
		(iPhone && aspect.toFixed(3) === '0.462') ||
		(storybook && aspectFrame.toFixed(3) === '0.462')
	);
};

export const mergeRefs = (refs: any[]) => {
	return (value: any) => {
		refs.forEach((ref) => {
			if (typeof ref === 'function') {
				ref(value);
			} else if (ref != null) {
				ref.current = value;
			}
		});
	};
};

export const randomColor = () => {
	const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'danger'];

	const color = Math.floor(Math.random() * colors.length);

	return colors[color];
};

export const priceFormat = (price: number | string): string => {
	let value = typeof price === "string" ? parseFloat(price) : price;

	if (isNaN(value)) return "£0.00"; // fallback

	// 🔹 Fix negative zero issue
	// if (Object.is(value, -0)) value = 0;

	return value.toLocaleString("en-GB", {
		style: "currency",
		currency: "GBP",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

};




export const average = (array: any[]) => array.reduce((a, b) => a + b) / array.length;

export const percent = (value1: number, value2: number) =>
	Number(((value1 / value2 - 1) * 100).toFixed(2));

export const getFirstLetter = (text: string, letterCount = 2): string =>
	// @ts-ignore
	text
		?.toUpperCase()
		?.match(/\b(\w)/g)
		?.join('')
		?.substring(0, letterCount);

export const debounce = (func: (arg0: any) => void, wait = 1000) => {
	let timeout: string | number | NodeJS.Timeout | undefined;

	return function executedFunction(...args: any[]) {
		const later = () => {
			clearTimeout(timeout);
			// @ts-ignore
			func(...args);
		};

		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

export const getColorByValue = (
	list: { value: string | number; color: string | any }[] = [],
	vl: string | number | undefined | null
): any => {
	return list.find(({ value }) => value == vl)?.color || 'secondary';
};
export const getLabelByValue = (
	list: { value: string | number;[key: string]: any }[] = [],
	vl: string | number | undefined | null,
	key: string = 'label',
): any => {
	const found = list.find(item => item.value == vl);
	return found ? found[key] : '';
};


export const getIconByValue = (
	list: { value: string | number; label: string; }[] = [],
	vl: string | number | undefined | null
): any => {
	return list.find(({ value }) => value == vl)?.label || '';
};



export const getIdByName = (list: any[], id: string, returnKey: string = 'name') => {
	if (!Array.isArray(list) || !id || !returnKey) return null;

	const item = list.find((el) =>
		String(el.id).toLowerCase() === String(id).toLowerCase()
	);

	return item ? item[returnKey] : null;
};

export const getFundTypes = (resident: any, eDate?: any) => {
	// ✅ Fall back to today's date when eDate is not provided
	const today = moment(eDate || undefined).format("YYYY-MM-DD");

	const activeFundPeriod = resident?.fundDetails?.find(
		// ✅ Renamed to avoid shadowing the outer `eDate` parameter
		({ status, eDate: recordEDate }: any) =>
			+status === FUND_SOURCE_STATUS_TYPE.ACTIVE &&
			moment(recordEDate).isSameOrAfter(today)
	) ?? {};

	const {
		fundSource,
		incontStatus,
		fncStatus,
		familyTopupStatus,
		thirdPartyTopupStatus,
		clientContribution,
		fundType
	} = activeFundPeriod;

	const isFncApplicable = +fncStatus === FNC_STATUS_TYPE.YES;
	const fundName = getLabelByValue(FUND_SOURCE_LIST, fundSource);
	const isLA = +fundSource == FUND_SOURCE_TYPE?.LOCAL_AUTHORITY
	const isCHC = +fundSource == FUND_SOURCE_TYPE?.CHC

	const fnc = isFncApplicable ? "FNC" : "";

	const familyTopup = +familyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES ? "Family Topup" : "";
	const thirdPartyTopup = +thirdPartyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES && +fundType === FUND_TYPE.PARTIAL && isLA ? "third Party Topup " : "";
	const incont = +incontStatus === INCONT_STATUS_TYPE.YES ? "INCONT" : "";
	const cc = +clientContribution > 0 && +fundType === FUND_TYPE.PARTIAL && isLA ? "CC" : "";

	return {
		fundName,
		fnc,
		familyTopup,
		fundSource,
		thirdPartyTopup,
		incont,
		cc,
		...activeFundPeriod
	};
};


export const getResidetByAllAvilableFundList = (resident: any, alwaysIncludePrivate = true) => {
	const fundDetails = resident?.fundDetails || [];
	const unique: any = {};
	let hasPrivateFund = false;
	for (const fund of fundDetails) {
		const {
			fundSource,
			fncStatus,
			incontStatus,
			familyTopupStatus,
			thirdPartyTopupStatus,
			clientContribution,
			fundType,
			nameOfLa,
			nameIbc
		} = fund;

		const isLA = +fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY;
		const isCHC = +fundSource === FUND_SOURCE_TYPE.CHC;
		const isPrivate = +fundSource === FUND_SOURCE_TYPE.PRIVATE;
		const isFncApplicable = +fncStatus === FNC_STATUS_TYPE.YES;
		const isJointFund = +fundSource === FUND_SOURCE_TYPE.JOINT_FUNDNG;

		const fundKey = `fund_${fundSource}`;
		const label = getLabelByValue(FUND_SOURCE_LIST, fundSource);

		if (isPrivate) {
			hasPrivateFund = true;
		}

		if (label && !isPrivate) {
			if (isJointFund) {
				// ✅ handle as a  LA
				if (nameOfLa) {
					const laKey = `fund_${FUND_SOURCE_TYPE.LOCAL_AUTHORITY}`;
					const laLabel = getLabelByValue(FUND_SOURCE_LIST, FUND_SOURCE_TYPE.LOCAL_AUTHORITY);

					if (!unique[laKey]) {
						unique[laKey] = {
							value: FUND_SOURCE_TYPE.LOCAL_AUTHORITY,
							label: laLabel,
							fundTypeIds: []
						};
					}

					if (!unique[laKey].fundTypeIds.includes(nameOfLa)) {
						unique[laKey].fundTypeIds.push(nameOfLa);
					}
				}

				// ✅ handle as a  ICB
				if (nameIbc) {
					const chcKey = `fund_${FUND_SOURCE_TYPE.CHC}`;
					const chcLabel = getLabelByValue(FUND_SOURCE_LIST, FUND_SOURCE_TYPE.CHC);

					if (!unique[chcKey]) {
						unique[chcKey] = {
							value: FUND_SOURCE_TYPE.CHC,
							label: chcLabel,
							fundTypeIds: []
						};
					}

					if (!unique[chcKey].fundTypeIds.includes(nameIbc)) {
						unique[chcKey].fundTypeIds.push(nameIbc);
					}
				}
			} else {
				// ✅ existing logic unchanged
				if (!unique[fundKey]) {
					unique[fundKey] = {
						value: fundSource,
						label,
						fundTypeIds: []
					};
				}

				const idValue = isLA ? nameOfLa : isCHC ? nameIbc : "";

				if (idValue && !unique[fundKey].fundTypeIds.includes(idValue)) {
					unique[fundKey].fundTypeIds.push(idValue);
				}
			}
		}

		if (isFncApplicable && !unique["FNC"]) {
			unique["FNC"] = {
				value: INVOICE_TO_TYPE.FNC,
				label: "FNC",
				fundTypeIds: []
			};
		}

		if (+incontStatus === INCONT_STATUS_TYPE.YES && !unique["INCONT"]) {
			unique["INCONT"] = {
				value: INVOICE_TO_TYPE.INCONT,
				label: "INCONT",
				fundTypeIds: []
			};
		}

		if (+familyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES && !unique["FAMILY_TOPUP"]) {
			unique["FAMILY_TOPUP"] = {
				value: INVOICE_TO_TYPE.FAMILY_TOPUP,
				label: "Family Top Up",
				fundTypeIds: []
			};
		}

		if (
			+thirdPartyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES &&
			+fundType === FUND_TYPE.PARTIAL &&
			isLA &&
			!unique["THIRD_PARTY_TOPUP"]
		) {
			unique["THIRD_PARTY_TOPUP"] = {
				value: INVOICE_TO_TYPE.THIRD_PARTY_TOPUP,
				label: "Third Party Top Up",
				fundTypeIds: []
			};

			const idValue = nameOfLa;
			if (idValue && !unique["THIRD_PARTY_TOPUP"].fundTypeIds.includes(idValue)) {
				unique["THIRD_PARTY_TOPUP"].fundTypeIds.push(idValue);
			}
		}

		if (
			+clientContribution > 0 &&
			+fundType === FUND_TYPE.PARTIAL &&
			isLA &&
			!unique["CC"]
		) {
			unique["CC"] = {
				value: INVOICE_TO_TYPE.CLIENT_CONTRIBUTION,
				label: "Client Contribution",
				fundTypeIds: []
			};
		}
	}

	// 🔥 ALWAYS ADD PRIVATE
	if (
		alwaysIncludePrivate || (!alwaysIncludePrivate && hasPrivateFund)
	) {
		if (!unique["PRIVATE"]) {
			unique["PRIVATE"] = {
				value: INVOICE_TO_TYPE.PRIVATE,
				label: "Private",
				fundTypeIds: []
			};
		}
	}

	return Object.values(unique);
};

export const getActiveFundList = (resident: any) => {
	const today = moment().format("YYYY-MM-DD");

	// Find active fund period
	const active = resident?.fundDetails?.find(
		({ status, eDate }: any) =>
			+status === FUND_SOURCE_STATUS_TYPE.ACTIVE &&
			moment(eDate).isSameOrAfter(today)
	);

	if (!active) return [];

	const {
		fundSource,
		fncStatus,
		incontStatus,
		familyTopupStatus,
		thirdPartyTopupStatus,
		clientContribution,
		fundType
	} = active;

	const isLA = +fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY;
	const isFncApplicable = +fncStatus === FNC_STATUS_TYPE.YES;

	const dropdown: any[] = [];

	// --- MAIN FUND SOURCE ---
	const sourceLabel = getLabelByValue(FUND_SOURCE_LIST, fundSource);
	if (sourceLabel) {
		dropdown.push({ value: fundSource, label: sourceLabel });
	}

	// --- FNC ---
	if (isFncApplicable) {
		dropdown.push({ value: INVOICE_TO_TYPE.FNC, label: "FNC" });
	}

	// --- INCONT ---
	if (+incontStatus === INCONT_STATUS_TYPE.YES) {
		dropdown.push({ value: INVOICE_TO_TYPE.INCONT, label: "INCONT" });
	}

	// --- FAMILY TOPUP ---
	if (+familyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES) {
		dropdown.push({ value: INVOICE_TO_TYPE.FAMILY_TOPUP, label: "Family Top Up" });
	}

	// --- THIRD PARTY TOPUP ---
	if (
		+thirdPartyTopupStatus === FAMILY_OR_THIRD_PARTY_TOPUP_STATUS.YES &&
		+fundType === FUND_TYPE.PARTIAL &&
		isLA
	) {
		dropdown.push({ value: INVOICE_TO_TYPE.THIRD_PARTY_TOPUP, label: "Third Party Top Up" });
	}

	// --- CLIENT CONTRIBUTION > 0 ---
	if (
		+clientContribution > 0 &&
		+fundType === FUND_TYPE.PARTIAL &&
		isLA
	) {
		dropdown.push({
			value: INVOICE_TO_TYPE.CLIENT_CONTRIBUTION,
			label: "Client Contribution"
		});
	}

	return dropdown;
};



export const getFundTypeByFundId = (resident: any) => {
	const { fundSource, incontStatus, fncStatus } = resident || {};
	const isFncApplicable = fncStatus == FNC_STATUS_TYPE?.YES;
	const fundType =
		fundSource == FUND_SOURCE_TYPE?.LOCAL_AUTHORITY
			? 'Local Authority'
			: fundSource == FUND_SOURCE_TYPE?.CHC
				? 'ICB'
				: fundSource == FUND_SOURCE_TYPE?.PRIVATE
					? 'Private'
					: '';

	const fnc =
		isFncApplicable &&
			(fundSource != FUND_SOURCE_TYPE?.CHC || incontStatus == INCONT_STATUS_TYPE?.YES)
			? 'FNC'
			: '';

	return { fundType, fnc, fncStatus, fundSource };
};






export const resolvePaymentStatus = (invoices: any[]) => {
	const STATUS_PRIORITY = [1, 2, 3];
	const statuses = invoices.map(inv => inv.status);

	for (const priority of STATUS_PRIORITY) {
		if (statuses.includes(priority)) return priority;
	}
	return 'No invoice'; // if no known status
};


export const getActiveFundDetails = (fundDetails: any[] = []) => {
	const today = moment().format("YYYY-MM-DD");

	return fundDetails.find(({ status, eDate }) =>
		+status == FUND_SOURCE_STATUS_TYPE.ACTIVE &&
		moment(eDate, "YYYY-MM-DD").isSameOrAfter(today)
	) || null;
};


export const getActiveFundsWithMaxEDate = (fundDetails: any[]) => {
	if (!fundDetails?.length) return { activeFunds: [], maxEDate: '' };

	const activeFunds = fundDetails.filter((f) => f.status === 1 && f.eDate);

	const maxEDate = activeFunds.reduce((max, fund) => {
		return moment(fund.eDate).isAfter(moment(max)) ? fund.eDate : max;
	}, activeFunds[0]?.eDate || '');

	return { activeFunds, maxEDate };
};

export const getActiveRespiteDetails = (respiteDetails: any[] = []) => {
	const today = moment().format("YYYY-MM-DD");
	return respiteDetails.find(({ eDate }) =>
		moment(eDate, "YYYY-MM-DD").isSameOrAfter(today)) || null;
}


export const getActiveFundBlockBed = (
	blockBeds: any[] = [],
	endDate?: string | null
) => {

	if (endDate === null) return null;

	const checkDate = endDate
		? moment(endDate, "YYYY-MM-DD")
		: moment(); // current date

	return (
		blockBeds.find((item: any) =>
			item.eDate &&
			moment(item.eDate, "YYYY-MM-DD").isSameOrAfter(checkDate, 'day')
		) || null
	);
};
export function getActiveWeekInfoByEndDate(
	priceInfoList: any[] = [],
	date?: string
) {
	const today = date
		? moment(date, "YYYY-MM-DD").startOf("day")
		: moment().startOf("day");

	return (
		priceInfoList.find(item =>
			moment(item.eDate, "YYYY-MM-DD").isSameOrAfter(today, "day")
		) || null
	);
}







export const getActiveBedDetails = (pricePeriods: any[] = [], name?: string) => {

	const today = moment().format("YYYY-MM-DD");
	return pricePeriods.find(({ status, eDate }) =>
		+status == PRICE_PERIOD_STATUS.ACTIVE &&
		moment(eDate, "YYYY-MM-DD").isSameOrAfter(today)
	) || null;
};

export const getActiveResidentRoomPriceDetails = (roomPriceList: any[] = [], name?: string) => {

	const today = moment().format("YYYY-MM-DD");
	return roomPriceList.find(({ status, eDate }) =>
		+status == PRICE_PERIOD_STATUS.ACTIVE &&
		moment(eDate, "YYYY-MM-DD").isSameOrAfter(today)
	) || null;
};

export const getActiveIncontDetailsDetails = (incontDetails: any[] = []) => {

	const today = moment().format("YYYY-MM-DD");

	return incontDetails.find(({ sDate, eDate }) =>
		moment(sDate, "YYYY-MM-DD").isSameOrBefore(today) &&
		moment(eDate, "YYYY-MM-DD").isSameOrAfter(today)
	) || null;
};



export type NotifyActionType = typeof NOTIFY_TYPE[keyof typeof NOTIFY_TYPE];
export type DBNames = typeof DB_NAME[keyof typeof DB_NAME];
export const notifyEntity = (
	entity: DBNames,
	action: NotifyActionType,
	subMessage?: string
) => {
	switch (action) {
		case NOTIFY_TYPE.CREATE:
			showNotification(
				`${entity} Created`,
				subMessage ? subMessage : `${entity} has been created successfully!`,
				"success"
			);
			break;
		case NOTIFY_TYPE.UPDATE:
			showNotification(
				`${entity} Updated`,
				subMessage ? subMessage : `${entity} has been updated successfully!`,
				"success"
			);
			break;
		case NOTIFY_TYPE.DELETE:
			showNotification(
				`${entity} Deleted`,
				subMessage ? subMessage : `${entity} has been deleted successfully!`,
				"success"
			);
			break;
		case NOTIFY_TYPE.ERROR:
			showNotification(
				`Failed to process ${entity}`,
				subMessage ? subMessage : "Something went wrong on the server. Please try again later.",
				"danger"
			);
		case NOTIFY_TYPE.WARNING:
			showNotification(
				`Failed to process ${entity}`,
				subMessage ? subMessage : "Something went wrong on the server. Please try again later.",
				"default"
			);
			break;
	}
};
export const notifyServerError = (entity: string, message: string) => {
	showNotification(
		`Failed to process ${entity}`,
		message,
		"danger"
	);
};


// storage.ts
export const setStorage = (key: string, value: any) => {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.error("Error setting storage:", error);
	}
};

export const getStorage = (key: string) => {
	try {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : null;
	} catch (error) {
		console.error("Error getting storage:", error);
		return null;
	}
};

export const removeStorage = (key: string) => {
	try {
		localStorage.removeItem(key);
	} catch (error) {
		console.error("Error removing storage:", error);
	}
};


export const getUserMappedCompanyId = () => {
	try {
		const company = getStorage(EXIST_SESSION_STORAGE_NAMES.CURENT_COMPANY_ID)
		if (!company) return null;
		return company ? { companyId: company.id } : {};
	} catch (error) {
		console.error("Error parsing storage:", error);
		return null;
	}
};

export const getUserMappedCompany = () => {
	try {
		const company = getStorage(EXIST_SESSION_STORAGE_NAMES.CURENT_COMPANY_ID)
		if (!company) return null;

		return company ? { ...company, companyId: company.id } : {};
	} catch (error) {
		console.error("Error parsing storage:", error);
		return null;
	}
};


export const getInvoiceDisplayCode = (
	type: string,
	code: string | number
): string => {
	const prefixMap: Record<string, string> = {
		[INVOICE_TYPE.NORMAL]: "IN",
		[INVOICE_TYPE.ARREARS]: "INA",
		[INVOICE_TYPE.CREDIT]: "INC",
		[INVOICE_TYPE.OTHER]: "INO",
	};

	const prefix = prefixMap[type] || "";
	return `${prefix}-${code}`;
};


export const getMinStartDate = (dateInfo: any[], index: number) => {
	if (index === 0) return "";
	const prevE = dateInfo[index - 1]?.eDate;
	return prevE ? moment(prevE, "YYYY-MM-DD").add(1, "day").format("YYYY-MM-DD") : "";
};


export const getMonthsBetween = (startDate: any, endDate: any = moment()) => {
	const start = moment(startDate).startOf("month");
	const end = moment(endDate).startOf("month");

	if (!start.isValid() || !end.isValid()) {
		throw new Error("Invalid date(s) provided");
	}

	return end.diff(start, "months") + 1; // +1 to include the start month
};

;

interface Invoice {
	sDate: string;
	eDate: string;
}

interface MissingRange {
	sDate: string;
	eDate: string;
}

/**
 * Get missing invoice ranges between a given period
 * @param invoiceList - Array of existing invoices [{sDate, eDate}]
 * @param startDate - Period start date (YYYY-MM-DD)
 * @param endDate - Period end date (YYYY-MM-DD) (defaults to today)
 * @returns Array of missing ranges [{sDate, eDate}]
 */
export const getMissingInvoiceRanges = (
	invoiceList: any[] = [],
	startDate: any,
	endDate?: any
): MissingRange[] => {
	// ) => {
	const periodStart = moment(startDate);
	const periodEnd = endDate ? moment(endDate) : moment().endOf('month'); // default today

	if (!periodStart.isValid() || !periodEnd.isValid()) {
		throw new Error("Invalid start or end date");
	}

	// Sort invoices
	const sortedInvoices = invoiceList
		.map(inv => ({
			sDate: moment(inv?.sDate),
			eDate: moment(inv?.eDate)
		}))
		.sort((a, b) => a.sDate.valueOf() - b.sDate.valueOf());

	const allRanges: MissingRange[] = [];

	// Track last processed date
	let lastEnd = periodStart.clone().subtract(1, "day");

	const addMonthWiseRange = (start: moment.Moment, end: moment.Moment) => {
		let current = start.clone();
		while (current.isSameOrBefore(end, "month")) {
			const monthStart = current.clone().startOf("month");
			const monthEnd = current.clone().endOf("month");
			const rangeStart = moment.max(current, monthStart);
			const rangeEnd = moment.min(end, monthEnd);

			allRanges.push({
				sDate: rangeStart.format("YYYY-MM-DD"),
				eDate: rangeEnd.format("YYYY-MM-DD")
			});

			current = monthEnd.add(1, "day");
		}
	};

	// Loop through invoices
	for (const inv of sortedInvoices) {
		if (inv.sDate.diff(lastEnd, "days") > 1) {
			// Missing range exists
			addMonthWiseRange(lastEnd.clone().add(1, "day"), inv.sDate.clone().subtract(1, "day"));
		}
		if (inv.eDate.isAfter(lastEnd)) {
			lastEnd = inv.eDate.clone();
		}
	}

	// Check for missing range after last invoice
	if (periodEnd.diff(lastEnd, "days") >= 1) {
		addMonthWiseRange(lastEnd.clone().add(1, "day"), periodEnd.clone());
	}
	return allRanges;
};


export const generateUid = () => doc(collection(db, "_temp")).id;

export interface PaymentInfo {
	id: string;
	date: string;
	[key: string]: any;
}

export interface IInvoice {
	id?: string;
	payedInfo?: PaymentInfo[];
	[key: string]: any;
}

export interface GroupedByPaymentIdAndDate {
	paymentId: string;
	date: string;
	invoiceTo: number | string;
	fundTypeId: string;
	isAdvanceCredit: boolean
	payments: {
		payment: PaymentInfo;
		invoice?: IInvoice;
		creditWallets?: any[]
	}[];
}

export const getMaxActiveFundEDate = (fundDetails: any[] = []): string => {
	const today = moment().format('YYYY-MM-DD');
	const activeFunds = fundDetails.filter(
		({ status, eDate }) =>
			status === FUND_SOURCE_STATUS_TYPE.ACTIVE &&
			moment(eDate, 'YYYY-MM-DD').isSameOrAfter(today)
	);

	return activeFunds.reduce((max, { eDate }) =>
		moment(eDate).isAfter(max) ? eDate : max,
		activeFunds[0]?.eDate ?? ''
	);
};


// export function groupInvoicePaymentsByPaymentIdWithDate(
// 	invoices: IInvoice[],
// 	creditWalletsMap: any[]
// ): GroupedByPaymentIdAndDate[] {
// 	const grouped: Record<string, GroupedByPaymentIdAndDate> = {};

// 	invoices.forEach(invoice => {
// 		invoice.payedInfo?.forEach(payment => {
// 			const key = payment.id; // global paymentId
// 			if (!grouped[key]) {
// 				grouped[key] = {
// 					paymentId: payment.id,
// 					date: payment.date,
// 					invoiceTo: invoice?.invoiceTo ?? "",
// 					fundTypeId: invoice?.fundTypeId ?? "",
// 					payments: []
// 				};
// 			}
// 			grouped[key].payments.push({
// 				payment,
// 				invoice,
// 				creditWallets: creditWalletsMap.filter(({ paymentRefId }) => paymentRefId === key)
// 			});
// 		});
// 	});

// 	return Object.values(grouped);
// };
export function groupInvoicePaymentsByPaymentIdWithDate(
	invoices: IInvoice[],
	creditWalletsMap: any[],
	residentsMap: any[]
): GroupedByPaymentIdAndDate[] {

	const grouped: Record<string, GroupedByPaymentIdAndDate> = {};

	// 1) GROUP FROM INVOICES (existing logic)
	invoices.forEach(invoice => {
		invoice.payedInfo?.forEach(payment => {
			const key = payment.id;

			if (!grouped[key]) {
				grouped[key] = {
					paymentId: key,
					date: payment.date,
					invoiceTo: invoice?.invoiceTo ?? "",
					fundTypeId: invoice?.fundTypeId ?? "",
					isAdvanceCredit: false,
					payments: []
				};
			}

			grouped[key].payments.push({
				payment,
				invoice,
				creditWallets: creditWalletsMap.filter(w => w.paymentRefId === key)
			});
		});
	});


	// if(invoices.length ===0){
	// 2) ADD CREDIT WALLETS THAT DO NOT HAVE ANY INVOICE PAYMENT
	creditWalletsMap.forEach(wallet => {
		const key = wallet.paymentRefId;

		const isAvileInvoice = invoices.some(({ payedInfo = [] }: any) =>
			payedInfo.some((p: any) => p.id === key)
		);



		if (!key || isAvileInvoice) return;

		if (!grouped[key]) {

			// Create a dummy payment object from credit wallet
			grouped[key] = {
				paymentId: key,
				date: wallet.date ?? "",
				invoiceTo: wallet.creditTo ?? "",
				fundTypeId: wallet.fundTypeId ?? "",
				isAdvanceCredit: true,
				payments: []
			};
		}

		grouped[key].payments.push({
			payment: {
				id: key,
				amount: 0,
				date: wallet.date,
				paymentMethod: wallet?.paymentMethod || '',
				bankId: wallet.bankId,
				refNo: wallet?.refNo || ''
			},
			invoice: {
				residentData: residentsMap.find((resident) => resident.id === wallet.residentId) ?? null,
			}, // no invoice → empty object
			creditWallets: [wallet] // only wallet info
		});
	});
	// }



	return Object.values(grouped);
}


export const getCreditWalletsByPaymentId = (creditWalletsMap: any[]): any[] => {

	const filtered = creditWalletsMap.flatMap(item => item.creditWallets);
	const uniqueMap = new Map();
	for (const wallet of filtered) {
		if (!uniqueMap.has(wallet.id)) {
			uniqueMap.set(wallet.id, wallet);
		}
	}
	return Array.from(uniqueMap.values());
};


export function getInvoiceMonthlySummary(data: any[], year: number) {
	if (!data) data = [];

	const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

	// get all unique invoiceTo values
	const invoiceTos = Array.from(new Set(data.map(d => d.invoiceTo).filter(Boolean)));

	// initialize result with all months and invoiceTos with default values
	const result: {
		month: string;
		invoiceTo: number;
		invoices: { totalInvoicePrice: number; payedAmount: number }[];
	}[] = [];

	for (const month of months) {
		for (const invoiceTo of invoiceTos) {
			result.push({
				month,
				invoiceTo,
				invoices: [{ totalInvoicePrice: 0, payedAmount: 0 }]
			});
		}
	}

	// fill actual data
	data.forEach(item => {
		if (!item.sDate || !item.invoiceTo) return;

		const date = new Date(item.sDate);
		if (date.getFullYear() !== year) return;

		const month = months[date.getMonth()];
		const invoiceTo = item.invoiceTo;

		const group = result.find(r => r.month === month && r.invoiceTo === invoiceTo);
		if (group) {
			group.invoices[0].totalInvoicePrice += Number(item.totalPrice) || 0;

			if (Array.isArray(item.payedInfo)) {
				const totalPaid = item.payedInfo.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
				group.invoices[0].payedAmount += totalPaid;
			}
		}
	});

	// finalize with fixed decimals
	return result.map(r => ({
		month: r.month,
		invoiceTo: r.invoiceTo,
		invoices: r.invoices.map(inv => ({
			totalInvoicePrice: Number(inv.totalInvoicePrice.toFixed(2)),
			payedAmount: Number(inv.payedAmount.toFixed(2))
		}))
	}));
};


export const getVatAmount = (amount: number, vatRate: number): number => {
	try {
		return +((amount * vatRate) / (100 + vatRate)).toFixed(2);
	} catch {
		return 0;
	}
};
export const getVatAmountExcluded = (amount: number, vatRate: number) =>
	+(amount * vatRate / 100).toFixed(2);

export const getAgeingBuckets = (invoices: any[] = []) => {
	const today = moment().startOf("day");

	const totals = {
		current: 0,
		days1to30: 0,
		days31to60: 0,
		days61to90: 0,
		days90plus: 0,
	};

	invoices.forEach((invoice) => {
		if (!invoice) return;

		const dueDate = invoice.invoiceDate
			? moment(invoice.invoiceDate, "YYYY-MM-DD").startOf("day").add(Number(invoice.dueDay || 0), "days")
			: null;

		if (!dueDate?.isValid()) return;

		const total = Number(invoice.totalPrice) || 0;
		const paid = (invoice.payedInfo || []).reduce(
			(sum: number, p: any) => sum + (Number(p.amount) || 0),
			0
		);
		const balance = Math.max(total - paid, 0);
		if (balance <= 0) return;

		const diffDays = today.diff(dueDate, "days");

		if (diffDays <= 0) totals.current += balance;
		else if (diffDays <= 30) totals.days1to30 += balance;
		else if (diffDays <= 60) totals.days31to60 += balance;
		else if (diffDays <= 90) totals.days61to90 += balance;
		else totals.days90plus += balance;
	});

	return Object.fromEntries(
		Object.entries(totals).map(([k, v]) => [k, +v.toFixed(2)])
	) as typeof totals;
};




interface Transaction {
	date: string;
	description: string;
	amount: number;
	balance: number;
}
interface Client {
	name: string;
	resident: string;
	address: string;
}
interface Summary {
	current_due: number;
	past_due_1_30: number;
	past_due_31_60: number;
	past_due_61_90: number;
	past_due_90_plus: number;
	total_due: number;
}
interface PaymentDetails {
	account_name: string;
	account_number: string;
	sort_code: string;
	email: string;
	phone: string;
}
interface Statement {
	statement_no: number;
	date: string;
	client: Client;
	summary: Summary;
	transactions: Transaction[];
	payment_details: PaymentDetails;
}
const PURPLE = [126, 0, 85] as const;
const BLACK = [0, 0, 0] as const;
const loadImageAsBase64 = (url: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous"; // 🔥 important
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;

			const ctx = canvas.getContext("2d");
			if (!ctx) return reject("Canvas error");

			ctx.drawImage(img, 0, 0);
			const base64 = canvas.toDataURL("image/png"); // jsPDF safe
			resolve(base64);
		};
		img.onerror = reject;
		img.src = url;
	});
};

export const downloadResidentStatement = async (
	data: Statement,
	residentData: any,
	fileName?: any,
	headOfficeAddress?: any
): Promise<void> => {
	const companyDetails = getUserMappedCompany();
	const doc = new jsPDF();
	const getNokName = () => {
		const nokList = residentData?.nok ?? [];
		const invoiceReq = nokList.find(
			({ invoiceRequired }: any) => invoiceRequired === NOK_INVOICE_REQUIRED.YES,
		);
		const lpa = nokList.find(({ lpa }: any) => lpa === LPA_TYPE.YES);
		if (lpa) return { ...lpa };
		if (invoiceReq) return { ...invoiceReq };
		return { ...residentData?.billing };
	};
	const nokInfo = getNokName();
	doc.setFont("helvetica", "bold");
	doc.setFontSize(12);
	doc.setTextColor(...BLACK);
	doc.text(companyDetails?.tradeName, 14, 15);

	doc.setFont("helvetica", "normal");
	doc.setFontSize(10);
	doc.text(
		`${headOfficeAddress?.buildingNumber ? headOfficeAddress.buildingNumber + ', ' : ''}` +
		`${headOfficeAddress?.area || ''} ` +
		`${headOfficeAddress?.address || ''} ` +
		`${headOfficeAddress?.postCode || ''}`,
		14,
		26
	);
	doc.text(`Tel: ${companyDetails?.phone}`, 14, 31);
	doc.text(`Email: ${companyDetails?.email}`, 140, 0);


	const logoWidth = 35;
	const logoHeight = 18;

	const pageWidth = doc.internal.pageSize.getWidth();

	// 🔥 Load logo from URL
	const logoBase64 = await loadImageAsBase64(companyDetails?.logo);


	// ---------- LEFT SECTION ----------
	doc.setTextColor(...BLACK);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(10);
	doc.text("TO", 14, 40);
	doc.setFont("helvetica", "normal");
	let y = 45;
	doc.text(
		nokInfo?.name
			? `${getLabelByValue(SALUTATION_LIST, nokInfo?.salutation)}. ${nokInfo?.name}`
			: 'NA',
		14,
		y
	);

	doc.text(`Re: ${residentData.personal.name}`, 14, y + 5);
	// const address =
	// 	"14 Highbury Road, Wimbledon, London, WS SW19 7PR GBR";

	// const addressLines = doc.splitTextToSize(address, 80);
	// doc.text(addressLines, 14, y + 10);
	const line1 = [
		nokInfo?.address,
		nokInfo?.addressLine1,
		nokInfo?.addressLine2,
		nokInfo?.buildingNumber,
		nokInfo?.area,
	].filter(Boolean).join(' ');

	const line2 = [
		nokInfo?.townOrCity,
		nokInfo?.county,
		nokInfo?.country,
		nokInfo?.postcode,
	].filter(Boolean).join(' ');

	doc.text(line1 || '', 14, y + 10);
	doc.text(line2, 14, y + 16);



	// / ---------- RIGHT SECTION ----------
	const rightX = 140;
	let ry = 40;
	doc.setFont("helvetica", "bold");
	doc.text("STATEMENT NO.", rightX, ry);
	doc.setFont("helvetica", "normal");
	doc.text(String(data.statement_no), rightX + 40, ry);
	ry += 6;
	doc.setFont("helvetica", "bold");
	doc.text("DATE", rightX, ry);
	doc.setFont("helvetica", "normal");
	doc.text(moment(data?.date).format('DD-MM-YYYY'), rightX + 40, ry);
	ry += 6;
	doc.setFont("helvetica", "bold");
	doc.text("TOTAL DUE", rightX, ry);
	doc.setFont("helvetica", "normal");
	doc.text(`£${data.summary.total_due.toFixed(2)}`, rightX + 40, ry);
	ry += 6;
	doc.setFont("helvetica", "bold");
	doc.text("ENCLOSED", rightX, ry);

	// ---------------- Transaction Table ----------------
	autoTable(doc, {
		startY: 70,
		head: [["Date", "Description", "Amount", "Balance"]],
		body: [...data.transactions]
			.map((t) => [
				moment(t.date).format('DD MMM YYYY'),
				t.description,
				t.amount >= 0
					? `£${t.amount.toFixed(2)}`
					: `(£${Math.abs(t.amount).toFixed(2)})`,
				`£${t.balance.toFixed(2)}`,
			]),
		theme: "striped",
		margin: {              // 👇 Control table padding
			top: 10,             // default 15–20 → reduce to 10 or 5
			bottom: 50,          // space at bottom for footer
			left: 8,             // shrink side margins
			right: 8
		},
		// margin: { bottom: 50 }, // keep space for footer
		didDrawPage: (dataArg) => {
			const pageHeight = doc.internal.pageSize.height;
			const centerX = doc.internal.pageSize.getWidth() / 2;
			doc.addImage(
				logoBase64,
				"PNG",
				pageWidth - 35 - 14,
				10,
				35,
				18
			);

			// ---------------- Footer Aging Summary ----------------
			const footerStartY = pageHeight - 45;
			autoTable(doc, {
				startY: footerStartY,
				theme: "grid",
				styles: {
					halign: "center",
					fontSize: 9,
					cellPadding: 1,
				},
				headStyles: {
					fillColor: [216, 145, 185], // soft magenta like your sample
					textColor: [0, 0, 0],
					//   fontStyle: "noram",
				},
				bodyStyles: {
					textColor: [0, 0, 0],
					//   fontStyle: "bold",
				},
				head: [
					[
						"Current Due",
						"1–30 Days Past Due",
						"31–60 Days Past Due",
						"61–90 Days Past Due",
						"90+ Days Past Due",
						"Amount Due",
					],
				],
				body: [
					[
						`£${data.summary.current_due.toFixed(2)}`,
						`£${data.summary.past_due_1_30.toFixed(2)}`,
						`£${data.summary.past_due_31_60.toFixed(2)}`,
						`£${data.summary.past_due_61_90.toFixed(2)}`,
						`£${data.summary.past_due_90_plus.toFixed(2)}`,
						`£${data.summary.total_due.toFixed(2)}`,
					],
				],
				margin: { left: 10, right: 10 },
				tableWidth: "auto",
			});

			const finalTableY = (doc as any).lastAutoTable.finalY + 6;

			// ---------------- Centered Payment Info ----------------
			doc.setFontSize(8);
			doc.setFont("helvetica", "normal");

			const paymentLines = [
				"Payment details",
				`Account Name: ${data.payment_details.account_name}`,
				`Account Number: ${data.payment_details.account_number}  Sort code: ${data.payment_details.sort_code}`,
				`Email: ${data.payment_details.email}`,
				`Head office Tel: ${data.payment_details.phone}`,
			];

			paymentLines.forEach((line, i) => {
				doc.text(line, centerX, finalTableY + i * 3, { align: "center" });
			});
		},
	});

	// ---------------- Save PDF ----------------
	doc.save(`${fileName}.pdf`);
};



export const downloadResidentStatementExcel = (
	data: Statement,
	residentData: any,
	headOfficeAddress?: any
): void => {
	const companyDetails = getUserMappedCompany();

	const workbook = XLSX.utils.book_new();

	const sheetData: any[][] = [];

	// ---------- COMPANY HEADER ----------
	sheetData.push([companyDetails.tradeName]);
	sheetData.push([`${headOfficeAddress?.buildingNumber}` || '']);
	sheetData.push([`${headOfficeAddress?.area || ''} ${headOfficeAddress?.address || ''}`]);
	sheetData.push([`Tel: ${companyDetails.phone} ${companyDetails.email}`]);
	sheetData.push([]);

	// ---------- RESIDENT INFO ----------
	sheetData.push(["TO"]);
	sheetData.push([residentData.personal.name]);
	sheetData.push([`Re: ${residentData.personal.name}`]);
	sheetData.push([]);

	// ---------- STATEMENT INFO ----------
	sheetData.push(["Statement No", data.statement_no]);
	sheetData.push(["Date", data.date]);
	sheetData.push(["Total Due", `£${data.summary.total_due.toFixed(2)}`]);
	sheetData.push([]);

	// ---------- TRANSACTIONS HEADER ----------
	sheetData.push(["Date", "Description", "Amount", "Balance"]);

	// ---------- TRANSACTIONS ----------
	data.transactions.forEach((t) => {
		sheetData.push([
			moment(t.date).format("DD MMM YYYY"),
			t.description,
			t.amount >= 0
				? `£${t.amount.toFixed(2)}`
				: `(£${Math.abs(t.amount).toFixed(2)})`,
			`£${t.balance.toFixed(2)}`
		]);
	});

	sheetData.push([]);

	// ---------- AGING SUMMARY ----------
	sheetData.push([
		"Current Due",
		"1–30 Days",
		"31–60 Days",
		"61–90 Days",
		"90+ Days",
		"Total Due"
	]);

	sheetData.push([
		`£${data.summary.current_due.toFixed(2)}`,
		`£${data.summary.past_due_1_30.toFixed(2)}`,
		`£${data.summary.past_due_31_60.toFixed(2)}`,
		`£${data.summary.past_due_61_90.toFixed(2)}`,
		`£${data.summary.past_due_90_plus.toFixed(2)}`,
		`£${data.summary.total_due.toFixed(2)}`
	]);

	sheetData.push([]);

	// ---------- PAYMENT DETAILS ----------
	sheetData.push(["Payment Details"]);
	sheetData.push([`Account Name: ${data.payment_details.account_name}`]);
	sheetData.push([
		`Account Number: ${data.payment_details.account_number}`,
		`Sort Code: ${data.payment_details.sort_code}`
	]);
	sheetData.push([`Email: ${data.payment_details.email}`]);
	sheetData.push([`Phone: ${data.payment_details.phone}`]);

	// ---------- CREATE SHEET ----------
	const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

	// Auto column width
	worksheet["!cols"] = [
		{ wch: 20 },
		{ wch: 35 },
		{ wch: 20 },
		{ wch: 20 }
	];

	XLSX.utils.book_append_sheet(workbook, worksheet, "Resident Statement");

	// ---------- DOWNLOAD ----------
	XLSX.writeFile(
		workbook,
		`Statement_${data.statement_no}.xlsx`
	);
};


// export const downloadResidentStatementExcel = async (
//   data: Statement,
//   residentData: any
// ): Promise<void> => {
//   const companyDetails = getUserMappedCompany();

//   const workbook = new ExcelJS.Workbook();
//   const sheet = workbook.addWorksheet("Resident Statement");

//   // ---------------- LOGO ----------------
//   if (companyDetails.logoBase64) {
//     const cleanBase64 = companyDetails.logoBase64.replace(
//       /^data:image\/(png|jpg|jpeg);base64,/,
//       ""
//     );

//     const imageId = workbook.addImage({
//       base64: cleanBase64,
//       extension: "png" // change to 'jpeg' if needed
//     });

//     // Place logo top-right (safe visible area)
//     sheet.addImage(imageId, {
//       tl: { col: 4, row: 0 },
//       ext: { width: 150, height: 70 }
//     });
//   }

//   // ---------------- COLUMN WIDTHS ----------------
//   sheet.columns = [
//     { width: 20 },
//     { width: 40 },
//     { width: 20 },
//     { width: 20 },
//     { width: 20 },
//     { width: 20 }
//   ];

//   // ---------------- COMPANY HEADER ----------------
//   sheet.addRow([companyDetails.tradeName]).font = {
//     bold: true,
//     size: 14
//   };
//   sheet.addRow([companyDetails.buildingNumber]);
//   sheet.addRow([`${companyDetails.area} ${companyDetails.address}`]);
//   sheet.addRow([`Tel: ${companyDetails.phone} ${companyDetails.email}`]);
//   sheet.addRow([]);

//   // ---------------- RESIDENT INFO ----------------
//   sheet.addRow(["TO"]).font = { bold: true };
//   sheet.addRow([residentData.personal.name]);
//   sheet.addRow([`Re: ${residentData.personal.name}`]);
//   sheet.addRow([]);

//   // ---------------- STATEMENT INFO ----------------
//   sheet.addRow(["Statement No", data.statement_no]);
//   sheet.addRow(["Date", data.date]);
//   sheet.addRow([
//     "Total Due",
//     `£${data.summary.total_due.toFixed(2)}`
//   ]);
//   sheet.addRow([]);

//   // ---------------- TRANSACTION TABLE ----------------
//   const headerRow = sheet.addRow([
//     "Date",
//     "Description",
//     "Amount",
//     "Balance"
//   ]);

//   headerRow.font = { bold: true };
//   headerRow.alignment = { horizontal: "center" };

//   data.transactions.forEach((t) => {
//     sheet.addRow([
//       moment(t.date).format("DD MMM YYYY"),
//       t.description,
//       t.amount >= 0
//         ? `£${t.amount.toFixed(2)}`
//         : `(£${Math.abs(t.amount).toFixed(2)})`,
//       `£${t.balance.toFixed(2)}`
//     ]);
//   });

//   sheet.addRow([]);

//   // ---------------- AGING SUMMARY ----------------
//   const agingHeader = sheet.addRow([
//     "Current Due",
//     "1–30 Days",
//     "31–60 Days",
//     "61–90 Days",
//     "90+ Days",
//     "Total Due"
//   ]);
//   agingHeader.font = { bold: true };

//   sheet.addRow([
//     `£${data.summary.current_due.toFixed(2)}`,
//     `£${data.summary.past_due_1_30.toFixed(2)}`,
//     `£${data.summary.past_due_31_60.toFixed(2)}`,
//     `£${data.summary.past_due_61_90.toFixed(2)}`,
//     `£${data.summary.past_due_90_plus.toFixed(2)}`,
//     `£${data.summary.total_due.toFixed(2)}`
//   ]);

//   sheet.addRow([]);

//   // ---------------- PAYMENT DETAILS ----------------
//   sheet.addRow(["Payment Details"]).font = { bold: true };
//   sheet.addRow([
//     `Account Name: ${data.payment_details.account_name}`
//   ]);
//   sheet.addRow([
//     `Account Number: ${data.payment_details.account_number}`,
//     `Sort Code: ${data.payment_details.sort_code}`
//   ]);
//   sheet.addRow([`Email: ${data.payment_details.email}`]);
//   sheet.addRow([`Phone: ${data.payment_details.phone}`]);

//   // ---------------- DOWNLOAD ----------------
//   const buffer = await workbook.xlsx.writeBuffer();
//   const blob = new Blob([buffer], {
//     type:
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//   });

//   const link = document.createElement("a");
//   link.href = URL.createObjectURL(blob);
//   link.download = `Statement_${data.statement_no}.xlsx`;
//   link.click();
// };



export const groupRoomReportsByDate = (
	roomReports: RoomReport[],
	beds: any[],
	rooms: any[]
): DateWiseRoomAvailability[] => {
	// Create lookups for faster access
	const roomMap: Record<string, Room> = Object.fromEntries(rooms.map(r => [r.id, r]));
	const bedMap: Record<string, Bed> = Object.fromEntries(beds.map(b => [b.id, b]));

	// Step 1: Group roomReports by date
	const groupedByDate: Record<string, RoomReport[]> = roomReports.reduce(
		(acc, report) => {
			if (!acc[report.date]) acc[report.date] = [];
			acc[report.date].push(report);
			return acc;
		},
		{} as Record<string, RoomReport[]>
	);

	// Step 2: Build structured output for each date
	const result: DateWiseRoomAvailability[] = Object.entries(groupedByDate).map(
		([date, reports]) => {
			const formattedDate = moment(date).format("YYYY-MM-DD");

			const roomsForDate: ProcessedRoom[] = reports.map(report => {
				const room = roomMap[report.roomId];
				const roomBeds: any[] = (report?.beds || [])
					.map(bedRef => {
						const bed = bedMap[bedRef?.bedId];
						if (!bed) return null;

						// Check if bed price is valid for this date
						const validPeriod = bed.pricePeriods?.find(p =>
							moment(formattedDate).isBetween(moment(p.sDate), moment(p.eDate), null, "[]")
						);

						return {
							bedId: bedRef.bedId,
							bedName: bed.bedName,
							bedStatus: bed.bedStatus,
							status: bedRef.status,
							pricePerWeek: validPeriod?.pricePerWeek ?? '',
							minPricePerWeek: validPeriod?.minPricePerWeek ?? '',
							sDate: validPeriod?.pricePerWeek ?? '',
							eDate: validPeriod?.sDate ?? '',
							// available: bedRef.status === 1
						};
					})
					.filter((b): b is any => Boolean(b));

				return {
					roomId: room?.id,
					roomNumber: room?.roomNumber,
					floor: room?.floor,
					description: room?.description,
					status: room?.status,
					beds: roomBeds
				};
			});

			return {
				date: formattedDate,
				rooms: roomsForDate
			};
		}
	);

	// Optional: sort by date ascending
	result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	return result;
};


export const getGender = (gender: string | any) => {
	if (gender && gender.toLowerCase() === 'female') {
		return {
			subject: 'she',
			possessive: 'her'
		};
	}
	return {
		subject: 'he',
		possessive: 'his'
	};
};

// export const updatePaymentStatus = (totalPrice: number | string, amount: number | string) => {
// 	const total = Number(parseFloat(totalPrice as string).toFixed(2));
// 	const paid = Number(parseFloat(amount as string).toFixed(2));
// 	const EPS = 0.01; // tolerance for floating point
// 	if (Math.abs(paid - total) < EPS) return INVOICE_STATUS.COMPLITED;
// 	if (paid > 0 && paid < total) return INVOICE_STATUS.PARTIAL;
// 	return INVOICE_STATUS.DRAFT;
// };

export const updatePaymentStatus = (
	inv: IInvoiceModel
): number => {
	const target = inv?.balanceDue != null && Number(inv?.balanceDue) > 0
		? Number(parseFloat(String(inv?.balanceDue)).toFixed(2))
		: Number(parseFloat(String(inv?.totalPrice)).toFixed(2));

	const paid = Number(parseFloat(String(getInvoicePayedAmount(inv))).toFixed(2));
	const EPS = 0.01;

	if (paid <= 0 || !paid) {
		// No payment at all and never confirmed → DRAFT
		if (!inv?.status || inv?.status === INVOICE_STATUS.DRAFT) return INVOICE_STATUS.DRAFT;

		// Was confirmed/partial/completed before → PENDING (payment deleted)
		return INVOICE_STATUS.PENDING;
	}

	if (paid >= target || Math.abs(paid - target) < EPS) return INVOICE_STATUS.COMPLITED;
	if (paid > 0 && paid < target) return INVOICE_STATUS.PARTIAL;

	return INVOICE_STATUS.DRAFT;
};

type AnyObject = Record<string, any>;

export const mergeArrayOfObjectUniqueByKey = (
	arr1: AnyObject[] = [],
	arr2: AnyObject[] = [],
	key: string = 'id' // default key
): AnyObject[] => {
	const map: Record<string, AnyObject> = {};

	[...arr1, ...arr2].forEach(item => {
		if (item[key] !== undefined) {
			map[item[key]] = item; // later item overwrites previous
		}
	});

	return Object.values(map);
};



export const formatCreatedAt = (value: any) => {
	if (!value) return "-";

	try {
		// Firestore Timestamp
		if (typeof value?.toDate === "function") {
			return moment(value.toDate()).format("DD MMM YYYY, h:mm:ss A");
		}

		// JS Date object
		if (value instanceof Date) {
			return moment(value).format("DD MMM YYYY, h:mm:ss A");
		}

		// Milliseconds number
		return moment(new Date(value)).format("DD MMM YYYY, h:mm:ss A");
	} catch {
		return "-";
	}
};

export const getMinMaxDatesFromList = (arr: any = []) => {
	try {
		if (!Array.isArray(arr) || arr.length === 0) return { minDate: null, maxDate: null };

		let minDate: any = null;
		let maxDate: any = null;

		arr.forEach((item: any) => {
			const start = moment(item?.period?.from);
			const end = moment(item?.period.to);

			if (start.isValid()) {
				if (!minDate || start.isBefore(minDate)) {
					minDate = start;
				}
			}

			if (end.isValid()) {
				if (!maxDate || end.isAfter(maxDate)) {
					maxDate = end;
				}
			}
		});

		return {
			minDate: minDate ? minDate.format("YYYY-MM-DD") : null,
			maxDate: maxDate ? maxDate.format("YYYY-MM-DD") : null,
		};

	} catch (err) {
		console.error("Error Finding Min/Max Dates:", err);
		return { minDate: null, maxDate: null };
	}
};



export const getRespiteStatusForPeriod = (
	respiteList: any[] = [],
	sDate?: string,
	eDate?: string
) => {
	if (!sDate || !eDate || !respiteList.length) return null;

	const fundStart = moment(sDate);
	const fundEnd = moment(eDate);

	if (!fundStart.isValid() || !fundEnd.isValid()) return null;

	return (
		respiteList.find(({ sDate: rs, eDate: re }) => {
			const start = moment(rs);
			const end = moment(re);

			return (
				start.isValid() &&
				end.isValid() &&
				fundStart.isSameOrAfter(start) &&
				fundEnd.isSameOrBefore(end)
			);
		}) ?? null
	);
};



type FormulaInput = string | undefined;
export const evaluateMonthlyPrice = (
	formula: FormulaInput,
	weekPrice: number,
): number => {
	// prvent the runtime string error
	const price = Number(weekPrice);
	// Fallback: average month (industry standard)
	const fallback = (price * 52) / 12;

	// Basic guards
	if (!formula || !Number.isFinite(price)) {
		return +fallback.toFixed(2);
	}

	// Support comma-separated formulas (take first valid one)
	const formulaParts = formula
		.split(',')
		.map(f => f.trim())
		.filter(Boolean);

	for (const part of formulaParts) {
		try {
			// Only allow weekPrice + math operators
			if (!/^[\d\s()+\-*/.weekPrice]+$/.test(part)) {
				continue;
			}

			const result = new Function(
				'weekPrice',
				`"use strict"; return (${part});`
			)(price);
			if (Number.isFinite(result)) {
				return +Number(result).toFixed(2);
			}
		} catch {
			// try next formula
		}
	}

	return +fallback.toFixed(2);
};


export const findRoomAndBedByid = (roomsList: any[], roomId: any, bedId: any) => {
	const room = roomsList.find((r: any) => r.id === roomId) as any;
	const bed =
		room?.beds.length <= 1 ? null : (room?.beds?.find((b: any) => b.id === bedId) as any);
	return { room, bed };
};


export const getInvoicePaymentSummary = (invoice: any) => {
	const totalPrice = Number(invoice?.totalPrice || 0);

	const paidAmount =
		invoice?.payedInfo?.reduce(
			(sum: number, p: any) => sum + (Number(p.amount) || 0),
			0
		) || 0;

	const creditTotal =
		invoice?.creditApply?.reduce(
			(sum: number, c: any) => sum + (Number(c.amount) || 0),
			0
		) || 0;

	const balanceDue = Math.max(totalPrice - paidAmount - creditTotal, 0);

	return {
		totalPrice,
		paidAmount,
		creditTotal,
		balanceDue: Number(balanceDue.toFixed(2))
	};
};


/**
 * Download PDF from Base64 string
 */
export const downloadPdfBlob = (
	pdfBlob: Blob,
	fileName: string
): void => {
	try {
		// 🔥 SAFETY CHECK
		if (!(pdfBlob instanceof Blob)) {
			throw new Error("Response is not a Blob");
		}



		const url = URL.createObjectURL(pdfBlob);

		// 🔥 TEST: OPEN IN NEW TAB (DEBUG)
		window.open(url);

		// 🔥 DOWNLOAD
		const a = document.createElement("a");
		a.href = url;
		a.download = `${fileName}.pdf`;
		a.click();

		URL.revokeObjectURL(url);
	} catch (error) {
		console.error("❌ PDF download failed:", error);
	}
};
export const formatMoney = (v: any) =>
	Number(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");



export const getInvoiceDescriptions = (invoiceAddress: any, weekPrice: string, invoiceTo: number | any) => {
	// Map invoiceTo to description text
	const descriptions: Record<number, string> = {
		[INVOICE_TO_TYPE.CLIENT_CONTRIBUTION]: `Monthly Client Contribution @ ${weekPrice} per week`,
		[INVOICE_TO_TYPE.FNC]: `Monthly Funded Nursing Care @ ${weekPrice} per week`,
		[INVOICE_TO_TYPE.LA]: `Monthly ${invoiceAddress?.shortName} Contribution @ ${weekPrice} per week`,
		[INVOICE_TO_TYPE.CHC]: `Monthly ${invoiceAddress?.shortName} Contribution @ ${weekPrice} per week`,
		[INVOICE_TO_TYPE.PRIVATE]: `Monthly Nursing Care @ ${weekPrice} per week`,
		[INVOICE_TO_TYPE.INCONT]: `Monthly ${invoiceAddress?.shortName} Contribution @ ${weekPrice} per week`,
		[INVOICE_TO_TYPE.FAMILY_TOPUP]: `Monthly Family TopUp @ ${weekPrice} per week`,
		[INVOICE_TO_TYPE.THIRD_PARTY_TOPUP]: `Monthly Third Party TopUp @ ${weekPrice} per week`,
	};

	return descriptions[invoiceTo] || '';
};

export const getBillingFormulaText = ({
	invoiceTo,
	isMonthStart,
	isMonthEnd,
	residentData,
	respiteCurrentInfoStatus,
	billingFormula
}: any) => {
	const isPermanent =
		+residentData?.admission?.typeOfPlacement === PLACEMENT_TYPE.PERMANENT ||
		+respiteCurrentInfoStatus?.status === RESPITE_STATUS_TYPE.EXTENDED_WITH_PERMANENT;

	if (!isMonthStart || !isMonthEnd || !isPermanent) {
		return "(weekPrice / 7) * days";
	}

	switch (invoiceTo) {
		case INVOICE_TO_TYPE.PRIVATE:
			return billingFormula?.privateBillingFormula || "(weekPrice / 7) * days";
		case INVOICE_TO_TYPE.CLIENT_CONTRIBUTION:
			return billingFormula?.ccBillingFormula || "(weekPrice / 7) * days";
		case INVOICE_TO_TYPE.FAMILY_TOPUP:
			return billingFormula?.familyTopupPattern || "(weekPrice / 7) * days";
		default:
			return "(weekPrice / 7) * days";
	}
};

export const getCurrentRespiteStatus = (
	respiteStatusList: any[] = [],
	startDate?: string,
	endDate?: string
) => {
	if (!startDate || !endDate) return undefined;

	return getRespiteStatusForPeriod(
		respiteStatusList,
		startDate,
		endDate
	);
};




export function getMaxDateBylist(dates: string[]) {
	if (!dates?.length) return null;

	return dates.reduce((max, current) => {
		const maxDate = moment(max, "DD/MM/YYYY");
		const currentDate = moment(current, "DD/MM/YYYY");

		return currentDate.isAfter(maxDate) ? current : max;
	});
}

export function isDateOverlap(
	aStart: string | Date | Moment,
	aEnd: string | Date | Moment,
	bStart: string | Date | Moment,
	bEnd: string | Date | Moment
): boolean {
	const startA = moment(aStart).startOf("day");
	const endA = moment(aEnd).endOf("day");
	const startB = moment(bStart).startOf("day");
	const endB = moment(bEnd).endOf("day");

	if (!startA.isValid() || !endA.isValid() || !startB.isValid() || !endB.isValid()) {
		return false;
	}

	return startA.isSameOrBefore(endB) && startB.isSameOrBefore(endA);
}


export function findOverlappingInvoice(
	invoices: IInvoiceModel[],
	from: string,
	to: string,
	invoiceTo: string | number,
	residentId: string,
	fundTypeId: string
): IInvoiceModel | null {

	for (const inv of invoices) {
		// 1️⃣ Ignore VOID / CANCELLED
		if (
			inv.status === INVOICE_STATUS.VOID ||
			inv.status === INVOICE_STATUS.CANCELLED
		) {
			continue;
		}

		// 2️⃣ Key match
		if (
			inv.invoiceTo !== invoiceTo ||
			inv.residentId !== residentId ||
			inv.fundTypeId !== fundTypeId
		) {
			continue;
		}

		// 3️⃣ Date overlap
		if (isDateOverlap(inv.sDate, inv.eDate, from, to)) {
			return inv; // 👈 first conflict found
		}
	}

	return null;
}




export function isValidRestoreOrVoidInvoice(
	invoiceList: IInvoiceModel[],
	invoice: IInvoiceModel
	// ): { allowed: boolean; conflictCode?: string } {
): boolean {

	const conflictInvoice = findOverlappingInvoice(
		invoiceList,
		invoice.sDate,
		invoice.eDate,
		invoice.invoiceTo,
		invoice.residentId,
		invoice.fundTypeId
	);

	if (conflictInvoice) {
		showAlert({
			title: "Action blocked",
			text: `This invoice overlaps with invoice ${conflictInvoice.code}. Please review the billing period.`,
			icon: "error",
			confirmButtonText: "OK"
		});

		return false

		// return {
		// 	allowed: false,
		// 	conflictCode: conflictInvoice.code
		// };
	}

	return true;
	// if (invoice.status === INVOICE_STATUS.VOID) {
	// 	return {
	// 		allowed: false
	// 	};
	// }

	// return { allowed: true };
}



export const getNokInfo = (residentData: any) => {
	const nokList = residentData?.nok ?? [];
	const invoiceReq = nokList.find(
		({ invoiceRequired }: any) => invoiceRequired === NOK_INVOICE_REQUIRED.YES,
	);
	const lpa = nokList.find(({ lpa }: any) => lpa === LPA_TYPE.YES);
	if (lpa) return { ...lpa };
	if (invoiceReq) return { ...invoiceReq };
	return { ...residentData?.billing };
};


export const imageUrlToBase64 = async (url: string): Promise<string> => {
	const response = await fetch(url, {
		mode: 'cors',
		cache: 'no-cache',
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch image: ${response.status}`);
	}

	const blob = await response.blob();

	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();

		reader.onloadend = () => {
			if (reader.result) {
				resolve(reader.result as string);
			} else {
				reject(new Error('Base64 conversion failed'));
			}
		};

		reader.onerror = () => {
			reject(new Error('FileReader error'));
		};

		reader.readAsDataURL(blob);
	});
};



export function getNearestByEndDateOrTodayOverLap(data: any[]): any | null {
	if (!data || data.length === 0) return null;

	const today = moment().startOf("day");

	let nearestPast = null;

	for (const item of data) {
		if (!item?.sDate || !item?.eDate) continue;

		const start = moment(item.sDate).startOf("day");
		const end = moment(item.eDate).startOf("day");

		// ✅ Case 1: Overlap
		if (today.isBetween(start, end, undefined, "[]")) {
			return item;
		}

		// ✅ Case 2: Only past
		if (end.isBefore(today)) {
			if (
				!nearestPast ||
				end.isAfter(moment(nearestPast.eDate).startOf("day"))
			) {
				nearestPast = item;
			}
		}
	}

  // ✅ Return only past nearest (no future considered)
  return nearestPast || null;
}
