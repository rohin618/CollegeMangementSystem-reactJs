import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    updateDoc,
    where
} from "firebase/firestore";
import { auth, db } from "../../../firebase";

import { getUserMappedCompanyId, notifyEntity } from "../../../helpers/helpers";
import { DB_NAME, NOTIFY_TYPE } from "../../constant";


export const createChartOfAccount = async (body: any) => {
  try {
    const currentUser = auth.currentUser;
    const companyInfo = getUserMappedCompanyId();
    const companyId = companyInfo?.companyId;

    if (!companyId) {
      console.warn("Company ID missing");
      return;
    }

    const coaRef = collection(db, DB_NAME.CHART_OF_ACCOUNT);

    // Fetch all documents WITHOUT orderBy
    const snap = await getDocs(
      query(coaRef, where("companyId", "==", companyId))
    );

    // Sort manually (no Firestore index needed)
    const all = snap.docs.map((d) => d.data());
    const last = all.sort((a, b) => Number(b.seq || 0) - Number(a.seq || 0))[0];

    const seq = last ? Number(last.seq) + 1 : 1;
    const padded = String(seq).padStart(4, "0");

    const code = `AC${padded}`;

    const newData = {
      ...body,
      seq,
      code,
      companyId,
      created: {
        date: Date.now(),
        user: currentUser?.uid || "system"
      },
      updated: []
    };

    const docRef = await addDoc(coaRef, newData);

    return { id: docRef.id, ...newData };
  } catch (err) {
    console.error("❌ Error creating Chart of Account:", err);
  }
};




// 🔹 Fetch all chart of accounts
export const getAllChartOfAccounts = async () => {
  try {
    const { companyId } = getUserMappedCompanyId() || {};

    if (!companyId) {
      console.warn("⚠️ No companyId found");
      return [];
    }

    const ref = collection(db, DB_NAME.CHART_OF_ACCOUNT);

    // NO orderBy in Firestore → NO index required
    const snapshot = await getDocs(
      query(ref, where("companyId", "==", companyId))
    );

    // Sort manually
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => Number(a.seq ?? 0) - Number(b.seq ?? 0));
  } catch (err) {
    console.error("❌ Error fetching chart of accounts:", err);
    return [];
  }
};




// 🔹 Update Chart of Account
export const updateChartOfAccount = async (id: string, body: any) => {
  try {
    const currentUser = auth.currentUser;

    const docRef = doc(db, DB_NAME.CHART_OF_ACCOUNT, id);

    delete body?.id; // cleanup

    const updateEntry = {
      user: currentUser?.uid || "system",
      date: new Date(),
    };

    const updateObj = {
      ...body,
      updated: [...(body?.updated || []), updateEntry],
    };

    await updateDoc(docRef, updateObj);

    notifyEntity('Chart Of Accounts', NOTIFY_TYPE.UPDATE);

    return { id, ...updateObj };
  } catch (err) {
    console.error("❌ Error updating chart of account:", err);
    notifyEntity('Chart Of Accounts', NOTIFY_TYPE.ERROR);
    throw err;
  }
};



// 🔹 Delete Chart of Account
export const deleteChartOfAccount = async (id: string) => {
  try {
    const docRef = doc(db, DB_NAME.CHART_OF_ACCOUNT, id);

    await deleteDoc(docRef);

    notifyEntity('Chart Of Accounts', NOTIFY_TYPE.DELETE);
    return id;
  } catch (err) {
    console.error("❌ Error deleting chart of account:", err);
    notifyEntity('Chart Of Accounts', NOTIFY_TYPE.ERROR);
    throw err;
  }
};
