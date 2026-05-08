export interface IDiscountModel {
    id?: string;

    code: string;
    name: string;

    discountType: string | number;
    discountValue: number;

    discountAmount: number;

    startDate: string;
    endDate: string;

    applicableType: string | number;

    usageLimit: number;
    usedCount: number;

    status: string | number;

    createdAt: {
        date: any;
        userId: string;
    };

    updated: any[];
}