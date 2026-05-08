import { serverTimestamp } from "firebase/firestore";
import { PRODUCT_STATUS } from "../../constant";
import { IProductModal } from "../../interface/product";

export const productModal:IProductModal = {
    name: "",
    productCode:"",
    productCodeSlug:'',
    vatId: "",
    description: "",
    categoryId: "",
    unitOfMeasurementId:"",
    status: PRODUCT_STATUS.ACTIVE,
    vendorId:'',
    created: {
        date: serverTimestamp(),
        userId: '',
    },
    updated: []
}  