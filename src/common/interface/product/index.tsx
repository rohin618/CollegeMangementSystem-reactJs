export interface IProductModal {
	id?: string;
	name: string;
	productCode:string;
	productCodeSlug:string;
    vatId: string;
	description: string;
	categoryId: string;
	unitOfMeasurementId:string;
	status: number;
	vendorId:string;
	lastPurchasePrice?: number;

	created: {
		date: any;
		userId: string;
	};

	updated: any[];
}
