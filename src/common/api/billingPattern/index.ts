import {
    addDoc,
    arrayUnion,
    collection,
    doc,
    getDocs,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { DB_NAME, NOTIFY_TYPE } from "../../constant";
import { notifyEntity } from "../../../helpers/helpers";

// -----------------------------
// CREATE
// -----------------------------
export const createBillingPatternMaster = async (body: any) => {
    try {
        const currentUser = auth.currentUser;

        const billingRef = collection(db, DB_NAME.BILLING_PATTERN_MASTER);

        const billingBody = {

            ...body,
            created: {
                date: serverTimestamp(),
                user: currentUser?.uid || "system",
            },
        };

        const docRef = await addDoc(billingRef, billingBody);

        notifyEntity('Billing Pattern Master', NOTIFY_TYPE.CREATE);

        return { id: docRef.id, ...billingBody };
    } catch (error) {
        notifyEntity('Billing Pattern Master', NOTIFY_TYPE.ERROR);
        console.error("Failed to create Due Date:", error);
        throw error;
    }
};

// -----------------------------
// GET ALL
// -----------------------------
export const getAllBillingPatternMaster = async () => {
  try {
    const billingRef = collection(db, DB_NAME.BILLING_PATTERN_MASTER);
    const snapshot = await getDocs(billingRef);

    const billingPattern = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }));

    return billingPattern;
  } catch (error) {
    notifyEntity('Billing Pattern Master', NOTIFY_TYPE.ERROR);
    console.error("Failed to get BILLING_PATTERN_MASTER:", error);
    throw error;
  }
};


// -----------------------------
// UPDATE
// -----------------------------
export const updateBillingPatternMaster = async (id: string, body: any) => {
  try {
    const currentUser = auth.currentUser;
    const billingRef = doc(db, DB_NAME.BILLING_PATTERN_MASTER, id);

    delete body.id;

    const updateLog = {
      user: currentUser?.uid || "system",
      date: new Date(), // Use actual JS Date
    };

    const bodyObj = {
      ...body,
      updated: arrayUnion(updateLog),
    };

    await updateDoc(billingRef, bodyObj);

    notifyEntity('Billing Pattern Master', NOTIFY_TYPE.UPDATE);

    return { id, ...bodyObj };
  } catch (error) {
    notifyEntity('Billing Pattern Master', NOTIFY_TYPE.ERROR);
    console.error("Failed to update BILLING_PATTERN_MASTER:", error);
    throw error;
  }
};
