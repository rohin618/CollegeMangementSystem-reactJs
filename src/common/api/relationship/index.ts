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
import { Relationship } from "../../model/relationsWithResident/Relationship";

// -----------------------------
// CREATE
// -----------------------------
export const createRelationship = async (body: any) => {
  try {
    const currentUser = auth.currentUser;
    const relationshipRef = collection(db, DB_NAME.RELATIONSHIP_MASTER);

    const relationshipBody = {
      ...Relationship,
      ...body,
      created: {
        date: serverTimestamp(),
        user: currentUser?.uid || "system",
      },
    };

    const docRef = await addDoc(relationshipRef, relationshipBody);

    notifyEntity('Relationship Master', NOTIFY_TYPE.CREATE);

    return { id: docRef.id, ...relationshipBody };
  } catch (error) {
    notifyEntity('Relationship Master', NOTIFY_TYPE.ERROR);
    console.error("Failed to create Relationship:", error);
    throw error;
  }
};

// -----------------------------
// GET ALL
// -----------------------------
export const getAllRelationships = async () => {
  try {
    const relationshipRef = collection(db, DB_NAME.RELATIONSHIP_MASTER);
    const snapshot = await getDocs(relationshipRef);

    const relationships = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) =>
        (a?.name ?? '').localeCompare(b?.name ?? '')
      );

    return relationships;

  } catch (error) {
    notifyEntity('Relationship Master', NOTIFY_TYPE.ERROR);
    console.error("Failed to get Relationships:", error);
    throw error;
  }
};

// -----------------------------
// UPDATE
// -----------------------------
export const updateRelationship = async (id: string, body: any) => {
  try {
    const currentUser = auth.currentUser;
    const relationshipRef = doc(db, DB_NAME.RELATIONSHIP_MASTER, id);

    delete body.id;

    const updateLog = {
      user: currentUser?.uid || "system",
      date: new Date(),
    };

    const updatedBody = {
      ...body,
      updated: arrayUnion(updateLog),
    };

    await updateDoc(relationshipRef, updatedBody);

    notifyEntity('Relationship Master', NOTIFY_TYPE.UPDATE);

    return { id, ...updatedBody };
  } catch (error) {
    notifyEntity('Relationship Master', NOTIFY_TYPE.ERROR);
    console.error("Failed to update Relationship:", error);
    throw error;
  }
};

// -----------------------------
// DELETE (hard delete from DB)
// -----------------------------
export const deleteRelationship = async (id: string) => {
  try {
    const relationshipRef = doc(db, DB_NAME.RELATIONSHIP_MASTER, id);
    await updateDoc(relationshipRef, { deletedAt: new Date() }); // optional: soft mark
    notifyEntity('Relationship Master', NOTIFY_TYPE.DELETE);

    return id;
  } catch (error) {
    notifyEntity('Relationship Master', NOTIFY_TYPE.ERROR);
    console.error("Failed to delete Relationship:", error);
    throw error;
  }
};
