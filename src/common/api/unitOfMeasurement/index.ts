import { addDoc, arrayUnion, collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { DB_NAME, NOTIFY_TYPE } from "../../constant";
import { auth, db } from "../../../firebase";
import { notifyEntity } from "../../../helpers/helpers";
import { unitOfMeasurementModal } from "../../model/unitOfMeasurement";

const getNextUnitOfMeasurementCode = async (): Promise<number> => {
    const uomRef = collection(db, DB_NAME.UNIT_OF_MEASUREMENT);

    const q = query(
        uomRef,
        orderBy("code", "desc"),
        limit(1)
    );

    const snapshot = await getDocs(q);

    let nextCode = 1001;

    if (!snapshot.empty) {
        const lastData = snapshot.docs[0].data();
        const lastCode = Number(lastData.code);

        if (!isNaN(lastCode)) {
            nextCode = lastCode + 1;
        }
    }

    return nextCode;
};


const isUnitOfMeasurementExists = async (name: string) => {
    if (!name) return false;

    const q = query(
        collection(db, DB_NAME.UNIT_OF_MEASUREMENT),
        where("name", "==", name.trim()),
        limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

export const createUnitOfMeasurement = async (body: any) => {
    try {
        const currentUser = auth.currentUser;

        const isExists = await isUnitOfMeasurementExists(body?.name);

        if (isExists) {
            notifyEntity(
                "Unit Of Measurement already exists",
                NOTIFY_TYPE.WARNING
            );
            return;
        }

        const uomRef = collection(db, DB_NAME.UNIT_OF_MEASUREMENT);
        const code = await getNextUnitOfMeasurementCode();

        const uomBody = {
            ...unitOfMeasurementModal,
            ...body,
            created: {
                date: serverTimestamp(),
                userId: currentUser?.uid || "system",
            },
            code,
        };

        const docRef = await addDoc(uomRef, uomBody);

        notifyEntity("Unit Of Measurement", NOTIFY_TYPE.CREATE);

        return { id: docRef.id, ...uomBody };
    } catch (error) {
        notifyEntity("Unit Of Measurement", NOTIFY_TYPE.ERROR);
        console.error("Failed to create UOM:", error);
        throw error;
    }
};
export const updateUnitOfMeasurement = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;
        const uomRef = doc(db, DB_NAME.UNIT_OF_MEASUREMENT, id);

        delete body.id;

        const updateLog = {
            userId: currentUser?.uid || "system",
            date: new Date(),
        };

        const updateBody = {
            ...body,
            updated: arrayUnion(updateLog),
        };

        await updateDoc(uomRef, updateBody);

        notifyEntity("Unit Of Measurement", NOTIFY_TYPE.UPDATE);

        return { id, ...updateBody };
    } catch (error) {
        notifyEntity("Unit Of Measurement", NOTIFY_TYPE.ERROR);
        console.error("Failed to update UOM:", error);
        throw error;
    }
};
export const getAllUnitOfMeasurement = async () => {
    try {
        const uomRef = collection(db, DB_NAME.UNIT_OF_MEASUREMENT);

        const q = query(uomRef);
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) || [];
    } catch (error) {
        console.error("Failed to get UOM:", error);
        throw error;
    }
};
export const deleteUnitOfMeasurementById = async (id: string) => {
    try {
        if (!id) {
            throw new Error("Unit Of Measurement ID is required");
        }

        const uomRef = doc(db, DB_NAME.UNIT_OF_MEASUREMENT, id);

        await deleteDoc(uomRef);

        notifyEntity("Unit Of Measurement", NOTIFY_TYPE.DELETE);
        return true;
    } catch (error) {
        notifyEntity("Unit Of Measurement", NOTIFY_TYPE.ERROR);
        console.error("Failed to delete UOM:", error);
        throw error;
    }
};
