import { db, auth } from '../../../firebase';
import {
    collection,
    query,
    getDocs,
    addDoc,
    serverTimestamp,
    where,
    updateDoc,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { DB_NAME, NOTIFY_TYPE } from '../../constant';
import { getUserMappedCompanyId, notifyEntity } from '../../../helpers/helpers';


export const createBankDetails = async (body: any) => {
    try {
        const currentUser = auth.currentUser;
        
        const BankRef = collection(db, DB_NAME.BANK_DETAILS);
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
        const docRef = await addDoc(BankRef, newRoom);

        notifyEntity('Bank Details', NOTIFY_TYPE.CREATE);
        return { id: docRef.id, ...newRoom };
    } catch (error) {
        notifyEntity('Bank Details', NOTIFY_TYPE.ERROR);
        console.error("Failed to create room:", error);
    }
};


export const getAllBankDetailsByCompanyId = async (companyId:string) => {
    try {

        if (!companyId) {
            console.warn("No companyId provided or found in storage");
            return '';
        }

        
       

        const bankRef = collection(db, DB_NAME.BANK_DETAILS);
        const q = query(bankRef, where("companyId", "==", companyId));

          const snapshot = await getDocs(q);


        const bank = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        
        return bank ;
    } catch (error) {
        console.error("Error getting FNM:", error);
        return [];
    }
};

export const updateBankDetails = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;

        const bankDetailsDocRef = doc(db, DB_NAME.BANK_DETAILS, id);
        delete body?.id;

        const update = {
            user: currentUser?.uid || "system",
            date: new Date() // store actual Date, not serverTimestamp()
        };

        const bodyObj = {
            ...body,
            updated: [...(body?.updated || []), update]
        };

        await updateDoc(bankDetailsDocRef, bodyObj);
        notifyEntity('Bank Details', NOTIFY_TYPE.UPDATE);
        return { id, ...bodyObj }
    } catch (error) {
        notifyEntity('Bank Details', NOTIFY_TYPE.ERROR);
        console.error("Failed to update Local Authority:", error);
        throw error;
    }
};


//Delete a bank detail by ID

export const deleteBankDetails = async (id: string): Promise<void> => {
    try {
        if (!id) throw new Error("Bank detail ID is required");

        const bankDoc = doc(db, DB_NAME.BANK_DETAILS, id);
        await deleteDoc(bankDoc);


    } catch (error) {
        console.error("Error deleting bank detail:", error);
        throw error;
    }
};

