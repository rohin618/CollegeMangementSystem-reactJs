import { serverTimestamp } from "firebase/firestore";

export const billingPatternModel = {
    name: "",
    description: "",
    billingFormula: "",
    status: 1,
    created: {
        date: serverTimestamp(),
        user: '',
    },
    updated: []
}  