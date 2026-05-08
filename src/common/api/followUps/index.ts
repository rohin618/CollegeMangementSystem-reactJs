import { addDoc, arrayUnion, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { DB_NAME, NOTIFY_TYPE } from "../../constant";
import { FOLLOW_UP_BASE } from "../../model/followUps";
import { getUserMappedCompany, getUserMappedCompanyId, notifyEntity } from "../../../helpers/helpers";
export const createFollowUps = async (body: any) => {
    try {
        const currentUser = auth.currentUser;

        const followUpsRef = collection(db, DB_NAME.FOLLOW_UP);

        const followUpsBody = {
            ...FOLLOW_UP_BASE,
            ...body,
            ...getUserMappedCompanyId(),
            created: {
                date: serverTimestamp(),
                userId: currentUser?.uid || "system",
            },
        };

        const docRef = await addDoc(followUpsRef, followUpsBody);

        notifyEntity('Follow Up Notes', NOTIFY_TYPE.CREATE);

        return { id: docRef.id, ...followUpsBody };
    } catch (error) {
        notifyEntity('Follow Up Notes', NOTIFY_TYPE.ERROR);
        console.error("Failed to create Due Date:", error);
        throw error;
    }
};


export const buildFollowUpTree = (followUps: any[]) => {
    const map = new Map<string, any>();
    const parents: any[] = [];

    // Attach empty subFollowUps
    followUps.forEach(fu => {
        map.set(fu.id, { ...fu, subFollowUps: [] });
    });

    // Link children to parents
    followUps.forEach(fu => {
        if (fu.parentFollowUpId) {
            const parent = map.get(fu.parentFollowUpId);
            if (parent) {
                parent.subFollowUps.push(map.get(fu.id));
            }
        } else {
            parents.push(map.get(fu.id));
        }
    });

    return parents;
};



export const updateFollowUps = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;
        const followUpsRef = doc(db, DB_NAME.FOLLOW_UP, id);

        delete body.id;

        const updateLog = {
            userId: currentUser?.uid || "system",
            date: new Date(), // Use actual JS Date
        };

        const bodyObj = {
            ...body,
            updated: arrayUnion(updateLog),
        };

        await updateDoc(followUpsRef, bodyObj);

        notifyEntity('Follow Up', NOTIFY_TYPE.UPDATE);

        return { id, ...bodyObj };
    } catch (error) {
        notifyEntity('Follow Up', NOTIFY_TYPE.ERROR);
        console.error("Failed to update follow Up:", error);
        throw error;
    }
};



type FollowUpQueryOptions = {
    followUpTo?: number | number[];
    followUpToId?: string;
    followUpType?: number;
};

export const getFollowUpsByCompanyId = async (options: FollowUpQueryOptions = {}) => {
    try {
        const followUpsRef = collection(db, DB_NAME.FOLLOW_UP);
        const companyDetails = getUserMappedCompany();

        if (!companyDetails?.id) {
            console.error("Company details missing");
            return [];
        }

        const conditions: any[] = [
            where("companyId", "==", companyDetails.id),
        ];

        // followUpTo (single or array)
        if (Array.isArray(options.followUpTo)) {
            if (options.followUpTo.length === 0) return [];
            conditions.push(where("followUpTo", "in", options.followUpTo));
        } else if (options.followUpTo) {
            conditions.push(where("followUpTo", "==", options.followUpTo));
        }

        // followUpToId
        if (options.followUpToId) {
            conditions.push(where("followUpToId", "==", options.followUpToId));
        }

        // followUpType
        if (options.followUpType) {
            conditions.push(where("followUpType", "==", options.followUpType));
        }


        const q = query(followUpsRef, ...conditions);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

    } catch (error) {
        notifyEntity("FollowUps", NOTIFY_TYPE.ERROR);
        console.error("Failed to get FollowUps:", error);
        throw error;
    }
};



export const deleteFollowUpById = async (id: string) => {
    try {
        if (!id) {
            throw new Error("Follow-up ID is required");
        }

        const followUpRef = doc(db, DB_NAME.FOLLOW_UP, id);

        await deleteDoc(followUpRef);

        notifyEntity("Follow Up Notes", NOTIFY_TYPE.DELETE);
        return true;
    } catch (error) {
        notifyEntity("Follow Up Notes", NOTIFY_TYPE.ERROR);
        console.error("Failed to delete Follow Up:", error);
        throw error;
    }
};
