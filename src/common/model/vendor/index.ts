import { serverTimestamp } from "firebase/firestore";
import { VENDOR_STATUS } from "../../constant";
import { IVendorModal } from "../../interface/vendor";

export const vendorModal: IVendorModal = {
    name: "",
    code: 1000,
    tradeName: "",
    emailId: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postCode: "",
    country: "United Kingdom",
    primaryContact: "",
    primaryPhone: "",
    secondaryContact: "",
    secondaryPhone: "",
    status: VENDOR_STATUS.ACTIVE,
    vatRegNo: '',
    referenceNo: '',



    bankName: "",
    accountName: "",
    accountNumber: "",
    sortCode: "",
    IBAN: "",
    BIC: "",
    bankAddress: "",

    paymentMode: "",
    description: "",
    emails: [],
    phones: [],


    created: {
        date: serverTimestamp(),
        userId: ""
    },
    updated: []
};

