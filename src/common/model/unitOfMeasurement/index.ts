import { serverTimestamp } from "firebase/firestore";
import { IUnitOfMeasurementModal } from "../../interface/unitOfMeasurement";
import { UNIT_OF_MEASUREMENT_STATUS } from "../../constant";

export const unitOfMeasurementModal:IUnitOfMeasurementModal = {
    name: "",
    status: UNIT_OF_MEASUREMENT_STATUS.ACTIVE,
    code:1000,
    created: {
        date: serverTimestamp(),
        userId: '',
    },
    updated: []
}  