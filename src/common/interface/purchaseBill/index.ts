export interface IPurchaseBillModal {
	id?: string;
	companyId: string;
	code: string;
	poId: string;
	poCode: number;
	vendorId: string;
	invoiceNumber: string;
	invoiceDate: string;
	notes: string;
	fileUrl: string;
	items: IPurchaseBillItem[];
	subTotal: number;
	vatTotal: number;
	totalPrice: number;
	status: number;
	vatMode: number;
	created: {
		date: any;
		userId: string;
	};
	updated: any[];
}

export interface IPurchaseBillItem {
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
}
