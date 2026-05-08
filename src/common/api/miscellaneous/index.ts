
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
import { notifyEntity } from '../../../helpers/helpers';
import { MISCELLANEOUS_STATUS } from '../../constant/app';
import { miscellaneousServicesModel } from '../../model/miscellaneous';



export const createMiscellaneousMaster = async (body: any) => {
    try {
        const currentUser = auth.currentUser;

        const miscellaneousRef = collection(db, DB_NAME.MISCELLANEOUS_MASTER);
        // Step 2: Define the room model
        const miscellaneousRefBody = {
            ...body,
            created: {
                date: serverTimestamp(),
                user: currentUser?.uid || "system"
            },
            updated: []
        };

        // Step 3: Add to Firestore
        const docRef = await addDoc(miscellaneousRef, miscellaneousRefBody);
        notifyEntity('Miscellaneous Master', NOTIFY_TYPE.CREATE);

        return { id: docRef.id, ...miscellaneousRefBody };

    } catch (error) {
        // notifyServerError(DB_NAME.COMPANY)
        notifyEntity('Miscellaneous Master', NOTIFY_TYPE.ERROR);
        console.error("Failed to create room:", error);
    }
};

export const updateMiscellaneous = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;

        const miscellaneousRef = doc(db, DB_NAME.MISCELLANEOUS_MASTER, id);
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
        await updateDoc(miscellaneousRef, bodyObj);

        const updatedDoc = { id: id, ...bodyObj };

        notifyEntity('Miscellaneous Master', NOTIFY_TYPE.UPDATE);

        return updatedDoc; // ✅ Return full updated document
    } catch (error) {
        notifyEntity('Miscellaneous Master', NOTIFY_TYPE.ERROR);
        console.error("❌ Failed to update MIS Master:", error);
        throw error;
    }
};






export const getAllMiscellaneousMaster = async () => {
    try {
        const miscellaneousRef = collection(db, DB_NAME.MISCELLANEOUS_MASTER);

        // ✅ Fetch all documents
        const snapshot = await getDocs(miscellaneousRef);

        // ✅ Map data to array of objects with IDs
        const miscellaneousMasters = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })).sort((a: any, b: any) => a.code - b.code);

        return [{...miscellaneousServicesModel,  name: 'Deposit Invoice',
    code: 'D1001',id:"D1001"},...miscellaneousMasters];
    } catch (error) {
        notifyEntity('Miscellaneous Master', NOTIFY_TYPE.ERROR);
        console.error("Failed to get Mis Masters:", error);
        throw error;
    }
};


export const deleteMiscellaneous = async (id: string) => {
    try {
        const currentUser = auth.currentUser;

        const miscellaneousRef = doc(db, DB_NAME.MISCELLANEOUS_MASTER, id);

        // ✅ Prepare update log
        const update = {
            user: currentUser?.uid || "system",
            date: new Date(), // Use actual JS Date
        };

        // ✅ Perform partial update (only status + append to updated array)
        await updateDoc(miscellaneousRef, {
            status: MISCELLANEOUS_STATUS.DELETE,
            updated: arrayUnion(update), // ❗ Needs existing array from Firestore
        });

        // ✅ Optionally fetch the updated document from Firestore

       

        notifyEntity('Miscellaneous Master', NOTIFY_TYPE.DELETE);

       return id
    } catch (error) {
        notifyEntity('Miscellaneous Master', NOTIFY_TYPE.ERROR);
        console.error("❌ Failed to update VAT status:", error);
        throw error;
    }
};