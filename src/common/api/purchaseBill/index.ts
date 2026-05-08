import {
	addDoc,
	arrayUnion,
	collection,
	deleteDoc,
	doc,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	updateDoc,
	where,
} from 'firebase/firestore';
import { getUserMappedCompanyId, notifyEntity } from '../../../helpers/helpers';
import { DB_NAME, NOTIFY_TYPE } from '../../constant';
import { auth, db } from '../../../firebase';

const getNextPurchaseBillCode = async (): Promise<{ code: string; seq: number }> => {
	const ref = collection(db, DB_NAME.PURCHASE_BILL);
	const q = query(ref, orderBy('seq', 'desc'), limit(1));
	const snapshot = await getDocs(q);

	let seq = 1000;
	if (!snapshot.empty) {
		const last = snapshot.docs[0].data();
		seq = parseInt(last.seq || seq) + 1;
	}

	return { code: `PB-${seq}`, seq };
};

export const createPurchaseBill = async (body: any) => {
	try {
		const currentUser = auth.currentUser;
		const { companyId } = getUserMappedCompanyId() || {};

		const ref = collection(db, DB_NAME.PURCHASE_BILL);
		const { code, seq } = await getNextPurchaseBillCode();

		const billBody = {
			...body,
			seq,
			code,
			companyId: companyId || '',
			created: {
				date: serverTimestamp(),
				userId: currentUser?.uid || 'system',
			},
		};

		const docRef = await addDoc(ref, billBody);
		notifyEntity('Purchase Bill', NOTIFY_TYPE.CREATE);
		return { id: docRef.id, ...billBody };
	} catch (error) {
		notifyEntity('Purchase Bill', NOTIFY_TYPE.ERROR);
		console.error('Failed to create Purchase Bill:', error);
		throw error;
	}
};

export const updatePurchaseBill = async (id: string, body: any) => {
	try {
		const currentUser = auth.currentUser;
		const ref = doc(db, DB_NAME.PURCHASE_BILL, id);
		delete body.id;

		const updateBody = {
			...body,
			updated: arrayUnion({
				userId: currentUser?.uid || 'system',
				date: new Date(),
			}),
		};

		await updateDoc(ref, updateBody);
		notifyEntity('Purchase Bill', NOTIFY_TYPE.UPDATE);
		return { id, ...updateBody };
	} catch (error) {
		notifyEntity('Purchase Bill', NOTIFY_TYPE.ERROR);
		throw error;
	}
};

export const getAllPurchaseBills = async () => {
	try {
		const { companyId } = getUserMappedCompanyId() || {};
		const ref = collection(db, DB_NAME.PURCHASE_BILL);
		const snapshot = await getDocs(query(ref, where('companyId', '==', companyId)));
		return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
	} catch (error) {
		notifyEntity('Purchase Bill', NOTIFY_TYPE.ERROR);
		throw error;
	}
};

export const getPurchaseBillsByPoId = async (poId: string) => {
	try {
		const { companyId } = getUserMappedCompanyId() || {};
		const ref = collection(db, DB_NAME.PURCHASE_BILL);
		const snapshot = await getDocs(
			query(ref, where('companyId', '==', companyId), where('poId', '==', poId)),
		);
		return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
	} catch (error) {
		console.error('Failed to fetch Purchase Bills by PO:', error);
		throw error;
	}
};

export const deletePurchaseBill = async (id: string) => {
	try {
		await deleteDoc(doc(db, DB_NAME.PURCHASE_BILL, id));
		notifyEntity('Purchase Bill', NOTIFY_TYPE.DELETE);
		return true;
	} catch (error) {
		notifyEntity('Purchase Bill', NOTIFY_TYPE.ERROR);
		throw error;
	}
};
