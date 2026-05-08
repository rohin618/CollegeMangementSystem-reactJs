

// Example: Using Firestore
import { db, auth } from '../../../firebase';
import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    arrayUnion,
} from "firebase/firestore";
import { DB_NAME, NOTIFY_TYPE } from '../../constant';
import { notifyEntity,  } from '../../../helpers/helpers';
import { VAT_STATUS } from '../../constant/app';



export const createVATMaster = async (body: any) => {
    try {
        const currentUser = auth.currentUser;

        const vatRef = collection(db, DB_NAME.VAT_MASTER);
        // Step 2: Define the room model
        const vatRoom = {
            ...body,
            created: {
                date: serverTimestamp(),
                user: currentUser?.uid || "system"
            },
            updated: []
        };

        // Step 3: Add to Firestore
        const docRef = await addDoc(vatRef, vatRoom);
        notifyEntity('VAT Master', NOTIFY_TYPE.CREATE);

        return { id: docRef.id, ...vatRoom };

    } catch (error) {
        // notifyServerError(DB_NAME.COMPANY)
        notifyEntity('VAT Master', NOTIFY_TYPE.ERROR);
        console.error("Failed to create room:", error);
    }
};


export const getAllVATMaster = async () => {
    try {
        const vatRef = collection(db, DB_NAME.VAT_MASTER);

        // ✅ Fetch all documents
        const snapshot = await getDocs(vatRef);

        // ✅ Map data to array of objects with IDs
        const vatMasters = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        return vatMasters;
    } catch (error) {
        notifyEntity('VAT Master', NOTIFY_TYPE.ERROR);
        console.error("Failed to get VAT Masters:", error);
        throw error;
    }
};


export const updateVAT = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;

        const vatDocRef = doc(db, DB_NAME.VAT_MASTER, id);
        delete body?.id;

        // ✅ Push update log
        const update = {
            user: currentUser?.uid || "system",
            date: new Date(), // Use actual JS Date
        };

        const bodyObj = {
            ...body,
            updated: [...(body?.updated || []), update],
        };

        // ✅ Perform update
        await updateDoc(vatDocRef, bodyObj);

        const updatedDoc = { id: id, ...bodyObj };

        notifyEntity('VAT Master', NOTIFY_TYPE.UPDATE);

        return updatedDoc; // ✅ Return full updated document
    } catch (error) {
        notifyEntity('VAT Master', NOTIFY_TYPE.ERROR);
        console.error("❌ Failed to update VAT Master:", error);
        throw error;
    }
};


export const deleteVAT = async (id: string) => {
    try {
        const currentUser = auth.currentUser;

        const vatDocRef = doc(db, DB_NAME.VAT_MASTER, id);

        // ✅ Prepare update log
        const update = {
            user: currentUser?.uid || "system",
            date: new Date(), // Use actual JS Date
        };

        // ✅ Perform partial update (only status + append to updated array)
        await updateDoc(vatDocRef, {
            status: VAT_STATUS.DELETE,
            updated: arrayUnion(update), // ❗ Needs existing array from Firestore
        });

        // ✅ Optionally fetch the updated document from Firestore

       

        notifyEntity('VAT Master', NOTIFY_TYPE.DELETE);

       return id
    } catch (error) {
        notifyEntity('VAT Master', NOTIFY_TYPE.ERROR);
        console.error("❌ Failed to update VAT status:", error);
        throw error;
    }
};