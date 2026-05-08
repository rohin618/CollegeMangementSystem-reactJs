import { serverTimestamp } from "firebase/firestore";
import { PRODUCT_CATEGORY_STATUS } from "../../constant";
import { IProductCategoryModal } from "../../interface/prouductCategory";

export const productCategoryModal:IProductCategoryModal = {
    name: "",
    code: 1000,
    status: PRODUCT_CATEGORY_STATUS.ACTIVE,
    created: {
        date: serverTimestamp(),
        userId: '',
    },
    updated: []
}  