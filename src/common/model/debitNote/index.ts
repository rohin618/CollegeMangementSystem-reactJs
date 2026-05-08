import { serverTimestamp } from 'firebase/firestore';
import { generateUid } from '../../../helpers/helpers';

import { DEBIT_NOTE_STATUS, DEBIT_TYPE } from '../../constant';
import { IDebitNoteModal } from '../../interface/debitNote';

export const debitNoteModel:IDebitNoteModal = {

	companyId: '',
	code: '', // DN-0001
	date: '',

	vendorId: '',

	poId: '', // reference purchase order
	vatMode:'', // 

	type: DEBIT_TYPE.NORMAL, // PRODUCT | SERVICE
	settlementType: '', // REFUND | ADJUSTMENT | mixed

	status: DEBIT_NOTE_STATUS.CREATED, // CREATED | PARTIAL | SETTLED | CANCELLED

	notes: '',

	//----------------------------------
	// Amount Summary
	//----------------------------------

	subTotal: 0,
	vatTotal: 0,
	totalPrice:0,
	debitAmount: 0, // total debit note value

	//----------------------------------
	// Product / Service Items
	//----------------------------------

	items: [
		{
			id: generateUid(),

			productId: '',
			poItemId: '',

			description: '',

			qty: 0,
			unitPrice: 0,


			vatId: '',
			vatRate: 0,

			vatAmount: 0,

			totalAmount: 0,

			//----------------------------------
			// Accounting Mapping
			//----------------------------------

			coaMapping: {
				accountId: '', // chart of accounts id
				type: '', // DEBIT | CREDIT
			},
		},
	],

	//----------------------------------
	// Vendor Refund Payments
	//----------------------------------

	payments: [
		// {
		// 	id: generateUid(),

		// 	paymentRefId: '',

		// 	date: '',

		// 	amount: 0,

		// 	paymentMethod: '', // CASH | BANK | UPI | CHEQUE

		// 	bankId: '',

		// 	referenceNo: '',

		// 	notes: '',

		// 	createdBy: '',
		// 	createdDate: '',
		// },
	],

	//----------------------------------
	// PO Adjustments
	//----------------------------------

	adjustments: [
		// {
		// 	id: generateUid(),
		// 	poId: '',
		// 	appliedAmount: 0, //
		// 	notes: '',

		// },
	],

	//----------------------------------
	// Audit
	//----------------------------------

	created: {
		date: serverTimestamp(),
		userId: '',
	},
	updated: [],
};
