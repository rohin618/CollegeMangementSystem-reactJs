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
import { getAllRooms, getAllRoomsWithBeds } from '../room';
import { getAllBeds } from '../bed';
import { getAllResidentByCompanyId } from '../resident';


export const createLocalAuthority = async (body: any) => {
    try {
        const currentUser = auth.currentUser;

        const laRef = collection(db, DB_NAME.LOCAL_AUTHORITY);
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
        notifyEntity('Local Authority', NOTIFY_TYPE.CREATE);
        return { id: docRef.id, ...newRoom };


    } catch (error) {
        notifyEntity('Local Authority', NOTIFY_TYPE.ERROR);
        console.error("Failed to create room:", error);
    }
};


export const getAllLocalAuthority = async () => {
    try {
        const laRef = collection(db, DB_NAME.LOCAL_AUTHORITY);
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

export const getAllLocalAuthorityByCompanyId = async () => {
    try {
        // ✅ fallback to storage if no param is provided
        const companyId = getUserMappedCompanyId()?.companyId;

        if (!companyId) {
            console.warn("No companyId provided or found in storage");
            return [];
        }

        const laRef = collection(db, DB_NAME.LOCAL_AUTHORITY);
        const q = query(laRef, where("companyId", "==", companyId));

        const snapshot = await getDocs(q);

        const localAuthorities = snapshot.docs.map((doc) => {
            return {
                id: doc.id,
                ... doc.data(),
            };
        });
        return localAuthorities;
    } catch (error) {
        console.error("Error getting Local Authorities:", error);
        return [];
    }
};
export const getLocalAuthorityById = async (laId: string) => {
    try {
        if (!laId) {
            console.warn("No laId provided or found");
            return [];
        }
        const laRef = doc(db, DB_NAME.LOCAL_AUTHORITY, laId);

        const laSnapShot = await getDoc(laRef);

        if (!laSnapShot.exists()) {
            console.warn("No laid found :", laRef);
            return null;
        }
        const localAuthorityData: any = { id: laSnapShot.id, ...laSnapShot.data() };


        const residentList = await getAllResidentByCompanyId();
        
            const blockHistory = Array.isArray(localAuthorityData.blockBedHistory) ? localAuthorityData.blockBedHistory : [];

            return {
                ...localAuthorityData,
                blockBedHistory: blockHistory?.map((bBed: any) => ({
                    ...bBed,
                    residentData: residentList?.find(res => res.id === bBed?.residentId) || null,
                })),
            };
    } catch (error) {
        console.error("Error getting Local Authorities:", error);
        return [];
    }
};

export const updateLocalAuthority = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;

        const laDocRef = doc(db, DB_NAME.LOCAL_AUTHORITY, id);
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
        notifyEntity('Local Authority', NOTIFY_TYPE.UPDATE);
        return {
            id,
            ...bodyObj,
        }
    } catch (error) {
        console.error("Failed to update Local Authority:", error);
        notifyEntity('Local Authority', NOTIFY_TYPE.ERROR);
        throw error;
    }
};


export const deleteLocalAuthority = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;

        const laDocRef = doc(db, DB_NAME.LOCAL_AUTHORITY, id);
        delete body?.id;
        const updateEntry = {
            user: currentUser?.uid || "system",
            date: new Date() // store JS Date object
        };

        // Only update the 'status' field and append to 'updated' array
        await updateDoc(laDocRef, {
            status: LA_STATUS.DELETE,
            updated: [...(body?.updated || []), updateEntry] // ❗ Needs existing array from Firestore
        });
        notifyEntity('Local Authority', NOTIFY_TYPE.DELETE);
        return { ...body, status: LA_STATUS.DELETE }
    } catch (error) {
        notifyEntity('Local Authority', NOTIFY_TYPE.ERROR);
        console.error("Failed to update Local Authority status:", error);
        throw error;
    }
};