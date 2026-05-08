import { addDoc, arrayUnion, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { DB_NAME, NOTIFY_TYPE, VENDOR_STATUS } from "../../constant";
import { vendorModal } from "../../model/vendor";
import { getUserMappedCompanyId, notifyEntity } from "../../../helpers/helpers";


const getNextVendorCode = async (): Promise<number> => {
    const vendorRef = collection(db, DB_NAME.VENDOR);

    const q = query(
        vendorRef,
        orderBy('code', 'desc'),
        limit(1)
    );

    const snapshot = await getDocs(q);

    let nextCode = 1001; // default start

    if (!snapshot.empty) {
        const lastVendor = snapshot.docs[0].data();
        const lastCode = Number(lastVendor.code);

        if (!isNaN(lastCode)) {
            nextCode = lastCode + 1;
        }
    }
    return nextCode;

};


export const createVendor = async (body: any) => {
    try {

        const companyId = getUserMappedCompanyId()?.companyId || '';
        if (!companyId) return;
        const currentUser = auth.currentUser;


        const vendorRef = collection(db, DB_NAME.VENDOR);
        const code = await getNextVendorCode();



        const vendorBody = {
            ...vendorModal,
            ...body,
            companyId,
            created: {
                date: serverTimestamp(),
                userId: currentUser?.uid || "system",
            },
            code,
        };

        const docRef = await addDoc(vendorRef, vendorBody);

        notifyEntity('Vendor', NOTIFY_TYPE.CREATE);

        return { id: docRef.id, ...vendorBody };
    } catch (error) {
        notifyEntity('Vendor', NOTIFY_TYPE.ERROR);
        console.error("Failed to create Vendor:", error);
        throw error;
    }
};


export const updateVendor = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;
        const vendorRef = doc(db, DB_NAME.VENDOR, id);

        delete body.id;

        const updateLog = {
            userId: currentUser?.uid || "system",
            date: new Date(), // Use actual JS Date
        };

        const bodyObj = {
            ...body,
            updated: arrayUnion(updateLog),
        };

        await updateDoc(vendorRef, bodyObj);

        notifyEntity('Vendor', NOTIFY_TYPE.UPDATE);

        return { id, ...bodyObj };
    } catch (error) {
        notifyEntity('Vendor', NOTIFY_TYPE.ERROR);
        console.error("Failed to update Vendor:", error);
        throw error;
    }
};


export const getAllVendorsAcrossCompanies = async (companyIds: string[]) => {
    try {
        const chunks: string[][] = [];
        for (let i = 0; i < companyIds.length; i += 10) {
            chunks.push(companyIds.slice(i, i + 10));
        }
        const results: any[] = [];
        for (const chunk of chunks) {
            const vendorRef = collection(db, DB_NAME.VENDOR);
            const q = query(
                vendorRef,
                where('companyId', 'in', chunk),
                where('status', '==', VENDOR_STATUS.ACTIVE),
            );
            const snap = await getDocs(q);
            snap.docs.forEach((d) => results.push({ id: d.id, ...d.data() }));
        }
        return results;
    } catch (error) {
        console.error('Failed to fetch cross-company vendors:', error);
        throw error;
    }
};

export const importVendorToCurrentCompany = async (vendorData: any, newCompanyId: string) => {
    const code = await getNextVendorCode();
    const currentUser = auth.currentUser;
    const vendorRef = collection(db, DB_NAME.VENDOR);

    const { id: _id, code: _code, companyId: _cid, created: _cr, updated: _up, ...rest } = vendorData;

    const newVendor = {
        ...rest,
        companyId: newCompanyId,
        code,
        importedFromCompanyId: vendorData.companyId,
        importedFromVendorId: vendorData.id,
        created: { date: serverTimestamp(), userId: currentUser?.uid || 'system' },
        updated: [],
    };

    const docRef = await addDoc(vendorRef, newVendor);
    return { id: docRef.id, ...newVendor };
};

export const getAllVendors = async () => {
    try {

        const companyId = getUserMappedCompanyId()?.companyId || '';
        if (!companyId) {
            console.warn("No Company Id Fount");
            return [];
        }
        const vendorRef = collection(db, DB_NAME.VENDOR);
        const q = query(vendorRef, where("status", "in", [VENDOR_STATUS.ACTIVE, VENDOR_STATUS.INACTIVE, VENDOR_STATUS.BLOCKED]),where("companyId", "==", companyId));
        const snapshot = await getDocs(q);
        const vendorList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        return vendorList || [];
    } catch (error) {
        console.error("Failed to get Vendors:", error);
        throw error;
    }
}