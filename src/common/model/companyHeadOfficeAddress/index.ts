import { serverTimestamp } from "firebase/firestore";

export const companyAddressModal = {
    address: "",
    postCode: "",
    buildingNumber: "",
    area: "",
    country: "United Kingdom",
    mdEmail: "",
    directorEmail: "",
    created: {
        date: serverTimestamp(),
        user: ""
    },
    updated: [],
}