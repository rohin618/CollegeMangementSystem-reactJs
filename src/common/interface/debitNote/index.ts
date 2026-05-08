import { Timestamp } from "firebase/firestore";

export interface ICoaMapping {
	accountId: string;
	type: string; // DEBIT | CREDIT
}

export interface IDebitNoteItem {
	id: string;

	productId: string;
	poItemId: string;

	description: string;

	qty: number;
	unitPrice: number;

	vatId: string;
	vatRate: number;

	vatAmount: number;

	totalAmount: number;

	coaMapping: ICoaMapping;
}

export interface IDebitNotePayment {
	id: string;

	paymentRefId: string;

	date: string;

	amount: number;

	paymentMethod: string; // CASH | BANK | UPI | CHEQUE

	bankId: string;

	referenceNo: string;

	notes: string;

	createdBy: string;
	createdDate: string;
}

export interface IDebitNoteAdjustment {
	id: string;

	poId: string;
	appliedAmount: number;
	notes: string;
}

export interface IAuditCreated {
	date: Timestamp | any;
	userId: string;
}

export interface IAuditUpdated {
	date?: Timestamp | any;
	userId?: string;
}

export interface IDebitNoteModal { 
    id?:string;    
	companyId: string;
	code: string;
	date: string;

	vendorId: string;

	poId: string;
	vatMode: string;

	type: string | number; // PRODUCT | SERVICE
	settlementType: string; // REFUND | ADJUSTMENT | MIXED

	status: string | number; // CREATED | PARTIAL | SETTLED | CANCELLED

	notes: string;

	//----------------------------------
	// Amount Summary
	//----------------------------------

	subTotal: number;
	vatTotal: number;
	totalPrice: number;
	debitAmount: number;

	//----------------------------------
	// Product / Service Items
	//----------------------------------

	items: IDebitNoteItem[];

	//----------------------------------
	// Vendor Refund Payments
	//----------------------------------

	payments: IDebitNotePayment[];

	//----------------------------------
	// Invoice Adjustments
	//----------------------------------

	adjustments: IDebitNoteAdjustment[];

	//----------------------------------
	// Audit
	//----------------------------------

	created: IAuditCreated;
	updated: IAuditUpdated[];
}