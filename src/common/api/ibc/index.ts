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
    getDoc,
} from "firebase/firestore";
import { DB_NAME, LA_STATUS, NOTIFY_TYPE } from '../../constant';
import { getUserMappedCompanyId, notifyEntity } from '../../../helpers/helpers';
import { getAllResidentByCompanyId } from '../resident';
import { getAllRoomsWithBeds } from '../room';


export const createICB = async (body: any) => {
    try {
        const currentUser = auth.currentUser;

        const laRef = collection(db, DB_NAME.ICB);
        // Step 2: Define the room model
        const newRoom = {
            ...body,
            ...getUserMappedCompanyId(),
            created: {
                date: serverTimestamp(),
                user: currentUser?.uid || "system"
            },
            updated: []
        };

        // Step 3: Add to Firestore
        const docRef = await addDoc(laRef, newRoom);

        notifyEntity('ICB', NOTIFY_TYPE.CREATE);
        return { id: docRef.id, ...newRoom };

    } catch (error) {
        notifyEntity('ICB', NOTIFY_TYPE.ERROR);
        console.error("Failed to create room:", error);
    }
};


export const getAllICB = async () => {
    try {
        const laRef = collection(db, DB_NAME.ICB);
        const snapshot = await getDocs(laRef);

        const la = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return la;

    } catch (error) {
        console.error("Error getting beds:", error);
        return [];
    }
};

export const getAllICBByCompanyId = async () => {
    try {
        // ✅ fallback to storage if no param is provided
        const companyId = getUserMappedCompanyId()?.companyId;
        if (!companyId) {
            console.warn("No companyId provided or found in storage");
            return [];
        }

        const icbRef = collection(db, DB_NAME.ICB);
        const q = query(icbRef, where("companyId", "==", companyId));

        const snapshot = await getDocs(q);

        const icbList = snapshot.docs.map((doc) => {
            return {
                id: doc.id,
                ...doc.data(),
            };
        });
        return icbList;
    } catch (error) {
        console.error("Error getting ICBs:", error);
        return [];
    }
};

export const getICBById = async (icb: string) => {
    try {
        if (!icb) {
            console.warn("No icb provided or found");
            return [];
        }
        const icbRef = doc(db, DB_NAME.ICB, icb);

        const icbSnapShot = await getDoc(icbRef);

        if (!icbSnapShot.exists()) {
            console.warn("No laid found :", icbRef);
            return null;
        }
        const icbReferenceData: any = { id: icbSnapShot.id, ...icbSnapShot.data() };

        const residentList = await getAllResidentByCompanyId();
        
            const blockHistory = Array.isArray(icbReferenceData.blockBedHistory) ? icbReferenceData.blockBedHistory : [];

            return {
                ...icbReferenceData,
                blockBedHistory: blockHistory?.map((bBed: any) => ({
                    ...bBed,
                    residentData: residentList?.find(res => res.id === bBed?.residentId) || null,
                })),
            };
    } catch (error) {
        console.error("Error getting ICB:", error);
        return [];
    }
};

export const updateICB = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;

        const laDocRef = doc(db, DB_NAME.ICB, id);
        delete body?.id;

        const update = {
            user: currentUser?.uid || "system",
            date: new Date() // store actual Date, not serverTimestamp()
        };

        const bodyObj = {
            ...body,
            updated: [...(body?.updated || []), update]
        };

        await updateDoc(laDocRef, bodyObj);
        notifyEntity('ICB', NOTIFY_TYPE.UPDATE);

        return { id, ...bodyObj }
    } catch (error) {
        notifyEntity('ICB', NOTIFY_TYPE.ERROR);
        console.error("Failed to update Local Authority:", error);
        throw error;
    }
};


export const deleteICB = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;

        const laDocRef = doc(db, DB_NAME.ICB, id);

        const updateEntry = {
            user: currentUser?.uid || "system",
            date: new Date() // store JS Date object
        };

        // Only update the 'status' field and append to 'updated' array
        await updateDoc(laDocRef, {
            status: LA_STATUS.DELETE,
            updated: [...(body?.updated || []), updateEntry] // ❗ Needs existing array from Firestore
        });
        notifyEntity('ICB', NOTIFY_TYPE.DELETE);
        return { ...body, status: LA_STATUS.DELETE }
    } catch (error) {
        notifyEntity('ICB', NOTIFY_TYPE.ERROR);
        console.error("Failed to update Local Authority status:", error);
        throw error;
    }
};