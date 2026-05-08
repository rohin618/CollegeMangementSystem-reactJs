import { serverTimestamp } from 'firebase/firestore';
import { PURCHASE_BILL_STATUS, VAT_MODE_TYPE } from '../../constant';
import { IPurchaseBillModal } from '../../interface/purchaseBill';

export const purchaseBillModel: IPurchaseBillModal = {
	companyId: '',
	code: '',
	poId: '',
	poCode: 0,
	vendorId: '',
	invoiceNumber: '',
	invoiceDate: '',
	notes: '',
	fileUrl: '',
	items: [],
	subTotal: 0,
	vatTotal: 0,
	totalPrice: 0,
	status: PURCHASE_BILL_STATUS.CONFIRMED,
	vatMode: VAT_MODE_TYPE.INCLUDE,
	created: {
		date: serverTimestamp(),
		userId: '',
	},
	updated: [],
};
