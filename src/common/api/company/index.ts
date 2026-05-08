
import { db, auth, storage } from '../../../firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
    collection,
    query,
    getDocs,
    addDoc,
    serverTimestamp,
    where,
    updateDoc,
    doc,
    getDoc
} from "firebase/firestore";
import { DB_NAME, EXIST_SESSION_STORAGE_NAMES } from '../../constant';
import showNotification from '../../../components/extras/showNotification';
import { getUserMappedCompanyId, setStorage } from '../../../helpers/helpers';
const notifyEntity = (entity: string, isCreate: boolean) => {
    showNotification(
        `${entity} ${isCreate ? "Created" : "Updated"}`,
        `${entity} has been ${isCreate ? "created" : "updated"} successfully!`,
        "success"
    );
};

const notifyServerError = (entity: string) => {
    showNotification(
        `Failed to process ${entity}`,
        "Something went wrong on the server. Please try again later.",
        "danger"
    );
};


export const createCompany = async (body: any) => {
    try {
        const currentUser = auth.currentUser;

        const companyRef = collection(db, DB_NAME.COMPANY);
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
        const docRef = await addDoc(companyRef, newRoom);
        notifyEntity('Company', true)
        return { id: docRef.id, ...newRoom };

    } catch (error) {
        notifyServerError('Company')
        console.error("Failed to create room:", error);
    }
};


export const updateCompany = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;
        const resolvedCompanyId = getUserMappedCompanyId()?.companyId;
        const companyDocRef = doc(db, DB_NAME.COMPANY, id);
        delete body?.id;

        // push update log
        const update = {
            user: currentUser?.uid || "system",
            date: new Date(), // keeping consistent with FNM (actual Date instead of serverTimestamp)
        };

        const bodyObj = {
            ...body,
            updated: [...(body?.updated || []), update],
        };

        await updateDoc(companyDocRef, bodyObj);


        if (id === resolvedCompanyId) {
            setStorage(EXIST_SESSION_STORAGE_NAMES.CURENT_COMPANY_ID, { ...bodyObj, id })
        }

        notifyEntity('Company', false);
        return { id, ...bodyObj }
    } catch (error) {
        notifyServerError('Company')
        console.error("❌ Failed to update Company:", error);
        throw error;
    }
};



export const getAllCompany = async (params?: { companyIds?: string[] }) => {
    try {
        let q;

        if (params?.companyIds && params.companyIds.length > 0) {
            // 🔹 Firestore "in" query for multiple IDs
            q = query(
                collection(db, DB_NAME.COMPANY),
                where("__name__", "in", params.companyIds) // __name__ is the document ID
            );
        } else {
            // 🔹 Get all companies
            q = collection(db, DB_NAME.COMPANY);
        }

        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error getting companies:", error);
        return [];
    }
};


export const getCompanyDetailsById = async (companyId: string) => {
    try {
        const docRef = doc(db, DB_NAME.COMPANY, companyId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null; // ✅ clearer than empty object
        }
    } catch (error) {
        console.error("Error getting company:", error);
        return null; // ✅ consistent return type
    }
};


export const updateCompanyLogo = async (
    file: File,
    companyName: string
): Promise<string> => {
    // Always same path, so old logo will be replaced
    const storageRef = ref(storage, `company-logos/${companyName}_logo`);

    // Upload (replaces if already exists)
    await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
};