import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { DB_NAME, NOTIFY_TYPE } from "../../constant";
import { notifyEntity } from "../../../helpers/helpers";
import { DueDateModel } from "../../model/dueDate";
import { DUEDATE_STATUS } from "../../constant/app";

// -----------------------------
// CREATE
// -----------------------------
export const createDueDateMaster = async (body: any) => {
  try {
    const currentUser = auth.currentUser;

    const dueDateRef = collection(db, DB_NAME.DUE_DATE_MASTER);

    const dueDateBody = {
        ...DueDateModel,
      ...body,
      created: {
        date: serverTimestamp(),
        user: currentUser?.uid || "system",
      },
    };

    const docRef = await addDoc(dueDateRef, dueDateBody);

    notifyEntity('Due Date Master', NOTIFY_TYPE.CREATE);

    return { id: docRef.id, ...dueDateBody };
  } catch (error) {
    notifyEntity('Due Date Master', NOTIFY_TYPE.ERROR);
    console.error("Failed to create Due Date:", error);
    throw error;
  }
};

// -----------------------------
// GET ALL
// -----------------------------
export const getAllDueDateMaster = async () => {
  try {
    const dueDateRef = collection(db, DB_NAME.DUE_DATE_MASTER);

    // ✅ Get only active due dates
    const q = query(dueDateRef, where("status", "==", DUEDATE_STATUS.ACTIVE));
    const snapshot = await getDocs(q);

    const dueDates = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return dueDates;
  } catch (error) {
    notifyEntity('Due Date Master', NOTIFY_TYPE.ERROR);
    console.error("Failed to get Due Dates:", error);
    throw error;
  }
};

// -----------------------------
// UPDATE
// -----------------------------
export const updateDueDate = async (id: string, body: any) => {
  try {
    const currentUser = auth.currentUser;
    const dueDateRef = doc(db, DB_NAME.DUE_DATE_MASTER, id);

    delete body.id;

    const updateLog = {
      user: currentUser?.uid || "system",
      date: new Date(), // Use actual JS Date
    };

    const bodyObj = {
      ...body,
      updated: arrayUnion(updateLog),
    };

    await updateDoc(dueDateRef, bodyObj);

    notifyEntity('Due Date Master', NOTIFY_TYPE.UPDATE);

    return { id, ...bodyObj };
  } catch (error) {
    notifyEntity('Due Date Master', NOTIFY_TYPE.ERROR);
    console.error("Failed to update Due Date:", error);
    throw error;
  }
};

// -----------------------------
// DELETE (soft delete)
// -----------------------------
export const deleteDueDate = async (id: string) => {
  try {

    const currentUser = auth.currentUser;
    // Reference to the document
    const dueDateRef = doc(db, DB_NAME.DUE_DATE_MASTER, id);

    // Prepare update log
            const update = {
                user: currentUser?.uid || "system",
                date: new Date(), // Use actual JS Date
            };
    
           
            await updateDoc(dueDateRef, {
                status: DUEDATE_STATUS.DELETE,
                updated: arrayUnion(update), //Needs existing array from Firestore
            });
    // Notify success
    notifyEntity('Due Date Master', NOTIFY_TYPE.DELETE);

    return id; // return deleted document id
  } catch (error) {
    notifyEntity('Due Date Master', NOTIFY_TYPE.ERROR);
    console.error("Failed to delete Due Date:", error);
    throw error;
  }
};
