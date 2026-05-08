export interface IProductCategoryModal {
    id?: string;
    name: string;
    code: number;
    status: number;

    created: {
        date: any;
        userId: string;
    };

    updated: any[];
}