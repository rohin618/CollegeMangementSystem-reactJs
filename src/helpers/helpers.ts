
import showNotification from "../components/extras/showNotification";


export { httpErrorInterceptor } from "./httpErrorInterceptor";
export { showAlert } from "./alerts";

import { NOTIFY_TYPE } from "../common/constant/app";

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








export type NotifyActionType = typeof NOTIFY_TYPE[keyof typeof NOTIFY_TYPE];
export const notifyEntity = (
	entity: string,
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

