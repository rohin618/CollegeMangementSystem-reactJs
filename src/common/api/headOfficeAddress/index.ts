import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";

import { auth, db } from "../../../firebase";
import { DB_NAME, NOTIFY_TYPE } from "../../constant";
import { getUserMappedCompanyId, notifyEntity } from "../../../helpers/helpers";
import { companyAddressModal } from "../../model/companyHeadOfficeAddress";



/**
 * CREATE
 */
export const createHeadOfficeAddress = async (body: any) => {
    try {
        const currentUser = auth.currentUser;
        const addressRef = collection(db, DB_NAME.HEAD_OFFICE_ADDRESS);

        const payload = {
            ...companyAddressModal,
            ...body,
            created: {
                date: serverTimestamp(),
                userId: currentUser?.uid || "system",
            },
        };

        const docRef = await addDoc(addressRef, payload);

        notifyEntity("Head Office Address", NOTIFY_TYPE.CREATE);

        return {
            id: docRef.id,
            ...payload
        };

    } catch (error) {
        notifyEntity("Head Office Address", NOTIFY_TYPE.ERROR);
        console.error("Failed to create Head Office Address:", error);
        throw error;
    }
};



/**
 * UPDATE
 */
export const updateHeadOfficeAddress = async (id: string, body: any) => {
    try {
        const addressRef = doc(db, DB_NAME.HEAD_OFFICE_ADDRESS, id);

        delete body.id;

        await updateDoc(addressRef, body);

        notifyEntity("Head Office Address", NOTIFY_TYPE.UPDATE);

        return { id, ...body };

    } catch (error) {
        notifyEntity("Head Office Address", NOTIFY_TYPE.ERROR);
        console.error("Failed to update Head Office Address:", error);
        throw error;
    }
};



/**
 * GET ALL
 */
export const getHeadOfficeAddress = async () => {
	try {

		const addressRef = collection(db, DB_NAME.HEAD_OFFICE_ADDRESS);
		const q = query(addressRef);

		const snapshot = await getDocs(q);

		if (snapshot.empty) return null;

		const docData = snapshot.docs[0];

		return {
			id: docData.id,
			...docData.data(),
		} as any;

	} catch (error) {
		console.error("Failed to get Head Office Address:", error);
		throw error;
	}
};



/**
 * DELETE
 */
export const deleteCompanyAddressById = async (id: string) => {
    try {

        if (!id) {
            throw new Error("Head Office Address ID is required");
        }

        const addressRef = doc(db, DB_NAME.HEAD_OFFICE_ADDRESS, id);

        await deleteDoc(addressRef);

        notifyEntity("Head Office Address", NOTIFY_TYPE.DELETE);

        return true;

    } catch (error) {
        notifyEntity("Head Office Address", NOTIFY_TYPE.ERROR);
        console.error("Failed to delete Head Office Address:", error);
        throw error;
    }
};