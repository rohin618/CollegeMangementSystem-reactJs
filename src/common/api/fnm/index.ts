import { db, auth } from '../../../firebase';
import {
    collection,
    query,
    getDocs,
    addDoc,
    serverTimestamp,
    where,
    updateDoc,
    doc,
} from "firebase/firestore";
import { DB_NAME, LA_STATUS, NOTIFY_TYPE } from '../../constant';
import { notifyEntity } from '../../../helpers/helpers';
import { IFNCModel } from '../../interface';


export const createFNM = async (body: any) => {
    try {
        const currentUser = auth.currentUser;

        const fnmRef = collection(db, DB_NAME.FNM);
        // Step 2: Define the room model
        const newRoom = {
            ...body,
            created: {
                date: serverTimestamp(),
                user: currentUser?.uid || "system"
            },
            updated: []
        };

        // Step 3: Add to Firestore
        const docRef = await addDoc(fnmRef, newRoom);
        notifyEntity('FNC', NOTIFY_TYPE.CREATE);
        return { id: docRef.id, ...newRoom } as IFNCModel;
        // Step 4: Notify the server about the new room


    } catch (error) {
        notifyEntity('FNC', NOTIFY_TYPE.ERROR);
        console.error("Failed to create room:", error);
    }
};


export const getAllFNM = async (companyId: string) => {
    try {
        // ✅ fallback to storage if no param is provided

        if (!companyId) {
            console.warn("No companyId provided or found in storage");
            return [];
        }

        const fnmRef = collection(db, DB_NAME.FNM);
        const q = query(fnmRef, where("companyId", "==", companyId));

        const snapshot = await getDocs(q);

        const fnmList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        return fnmList;
    } catch (error) {
        console.error("Error getting FNM:", error);
        return [];
    }
};

export const updateFNM = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;

        const fnmDocRef = doc(db, DB_NAME.FNM, id);
        delete body?.id;

        const update = {
            user: currentUser?.uid || "system",
            date: new Date() // store actual Date, not serverTimestamp()
        };

        const bodyObj = {
            ...body,
            updated: [...(body?.updated || []), update]
        };

        await updateDoc(fnmDocRef, bodyObj);
        notifyEntity('FNC', NOTIFY_TYPE.UPDATE);
        return { id, ...bodyObj } as IFNCModel;
    } catch (error) {
        notifyEntity('FNC', NOTIFY_TYPE.ERROR);
        console.error("Failed to update Local Authority:", error);
        throw error;
    }
};


export const deleteFNM = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;

        const fnmDocRef = doc(db, DB_NAME.FNM, id);

        const updateEntry = {
            user: currentUser?.uid || "system",
            date: new Date() // store JS Date object
        };

        // Only update the 'status' field and append to 'updated' array
        await updateDoc(fnmDocRef, {
            status: LA_STATUS.DELETE,
            updated: [...(body?.updated || []), updateEntry] // ❗ Needs existing array from Firestore
        });
        notifyEntity('FNC', NOTIFY_TYPE.DELETE);
        return { ...body, status: LA_STATUS.DELETE }
    } catch (error) {
        notifyEntity('FNC', NOTIFY_TYPE.ERROR);
        console.error("Failed to update Local Authority status:", error);
        throw error;
    }
};


export const getAllFNMByCompany = async (companyId: string) => {
    try {

        if (!companyId) {
            console.warn("No companyId provided or found in storage");
            return [];
        }
        const fnmRef = collection(db, DB_NAME.FNM);

        // Create a query filtering by companyId
        const q = query(fnmRef, where("companyId", "==", companyId));

        const snapshot = await getDocs(q);

        const la = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return la[0] ? la[0] : '';

    } catch (error) {
        console.error("Error getting FNM by company:", error);
        return [];
    }
}