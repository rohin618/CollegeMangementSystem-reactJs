import {
    addDoc,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";

import { db, auth } from "../../../firebase";
import { DB_NAME, NOTIFY_TYPE } from "../../constant";
import { getUserMappedCompanyId, notifyEntity } from "../../../helpers/helpers";
import { discountModel } from "../../model/discount";
import { IDiscountMaster } from "../../interface/invoice/invoiceform";


const getNextDiscountCode = async (): Promise<string> => {
    const discountRef = collection(db, DB_NAME.DISCOUNT);

    const q = query(
        discountRef,
        orderBy("code", "desc"),
        limit(1)
    );

    const snapshot = await getDocs(q);

    let nextNumber = 10; // starting DISC10

    if (!snapshot.empty) {
        const lastDiscount = snapshot.docs[0].data();
        const lastCode = lastDiscount.code || "";

        const num = Number(lastCode.replace("DISC", ""));

        if (!isNaN(num)) {
            nextNumber = num + 1;
        }
    }

    return `DISC${nextNumber}`;
};
export const createDiscount = async (body: any) => {
    try {

        const currentUser = auth.currentUser;

        const discountRef = collection(db, DB_NAME.DISCOUNT);

        const code = await getNextDiscountCode();

        const payload = {
            ...discountModel,
            ...body,
            code,

            createdAt: {
                date: serverTimestamp(),
                userId: currentUser?.uid || "system",
            },
        };

        const docRef = await addDoc(discountRef, payload);

        notifyEntity("Discount", NOTIFY_TYPE.CREATE);

        return { id: docRef.id, ...payload };

    } catch (error) {

        notifyEntity("Discount", NOTIFY_TYPE.ERROR);
        throw error;

    }
};
export const updateDiscount = async (id: string, body: any) => {

    const currentUser = auth.currentUser;

    const ref = doc(db, DB_NAME.DISCOUNT, id);

    delete body.id;

    const updateLog = {
        userId: currentUser?.uid || "system",
        date: new Date(), // Use actual JS Date
    };

    const payload = {
        ...body,
        updated: arrayUnion(updateLog),
    };

    await updateDoc(ref, payload);

    notifyEntity("Discount", NOTIFY_TYPE.UPDATE);

    return { id, ...payload };
};

export const getAllDiscounts = async (): Promise<IDiscountMaster[]> => {
    const ref      = collection(db, DB_NAME.DISCOUNT);
    const q        = query(ref);
    const snapshot = await getDocs(q);
 
    return snapshot.docs.map((doc) => ({
        ...(doc.data() as Omit<IDiscountMaster, "id">),
        id: doc.id,
    }));
};
 

export const deleteDiscountById = async (id: string) => {
    try {
        if (!id) {
            throw new Error("Discount ID is required");
        }

        const discountRef = doc(db, DB_NAME.DISCOUNT, id);

        await deleteDoc(discountRef);

        notifyEntity("Discount", NOTIFY_TYPE.DELETE);
        return true;

    } catch (error) {

        notifyEntity("Discount", NOTIFY_TYPE.ERROR);
        console.error("Failed to delete Discount:", error);
        throw error;

    }
};