import { serverTimestamp } from "firebase/firestore";
import { IDiscountModel } from "../../interface/discount";
import { DISCOUNT_APPLICABLE_TYPE, DISCOUNT_STATUS, DISCOUNT_TYPE } from "../../constant";

export const discountModel: IDiscountModel = {

    code: "", // DISC10

    name: "", // Summer Offer

    discountType: DISCOUNT_TYPE.PERCENTAGE, // PERCENTAGE | AMOUNT

    discountValue: 0, // 10 or 500

    discountAmount: 0, // optional

    startDate: "",

    endDate: "",

    applicableType: DISCOUNT_APPLICABLE_TYPE.ROOM, // SEAT | ROOM | TICKET | PRODUCT

    usageLimit: 0,

    usedCount: 0,

    status: DISCOUNT_STATUS.ACTIVE,

    createdAt: {
        date: serverTimestamp(),
        userId: '',
    },
    updated: [],
};