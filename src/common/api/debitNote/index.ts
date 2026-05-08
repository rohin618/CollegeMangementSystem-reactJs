import { addDoc, arrayUnion, collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { getUserMappedCompany, getUserMappedCompanyId, notifyEntity } from "../../../helpers/helpers";
import { DB_NAME, NOTIFY_TYPE } from "../../constant";
import { auth, db } from "../../../firebase";

const getNextDebitNoteCode = async (): Promise<{ code: string; seq: number }> => {

	const debitNoteRef = collection(db, DB_NAME.DEBIT_NOTE);

	const q = query(debitNoteRef, orderBy('seq', 'desc'), limit(1));
	const snapshot = await getDocs(q);

	let seq = 1000;

	if (!snapshot.empty) {
		const last = snapshot.docs[0].data();
		seq = parseInt(last.seq || seq) + 1;
	}

	const code = `DN-${seq}`;

	return { code, seq };
};

export const createDebitNote = async (body: any) => {
	try {
		const currentUser = auth.currentUser;
		const { companyId } = getUserMappedCompanyId() || {};

		const debitNoteRef = collection(db, DB_NAME.DEBIT_NOTE);

		const { code, seq } = await getNextDebitNoteCode();

		const debitNoteBody = {
			...body,
			seq,
			code,
			companyId: companyId || '',
			created: {
				date: serverTimestamp(),
				userId: currentUser?.uid || 'system',
			},
		};

		const docRef = await addDoc(debitNoteRef, debitNoteBody);

		notifyEntity('Debit Note', NOTIFY_TYPE.CREATE);

		return { id: docRef.id, ...debitNoteBody };
	} catch (error) {
		notifyEntity('Debit Note', NOTIFY_TYPE.ERROR);
		console.error('Failed to create Debit Note:', error);
		throw error;
	}
};

export const updateDebitNote = async (id: string, body: any) => {
	try {
		const currentUser = auth.currentUser;

		const debitNoteRef = doc(db, DB_NAME.DEBIT_NOTE, id);

		delete body.id;

		const updateLog = {
			userId: currentUser?.uid || 'system',
			date: new Date(),
		};

		const updateBody = {
			...body,
			updated: arrayUnion(updateLog),
		};

		await updateDoc(debitNoteRef, updateBody);

		notifyEntity('Debit Note', NOTIFY_TYPE.UPDATE);

		return { id, ...updateBody };
	} catch (error) {
		notifyEntity('Debit Note', NOTIFY_TYPE.ERROR);
		throw error;
	}
};

export const getAllDebitNotes = async () => {
	try {
		const { companyId } = getUserMappedCompanyId() || {};

		const debitNoteRef = collection(db, DB_NAME.DEBIT_NOTE);

		const snapshot = await getDocs(
			query(debitNoteRef, where('companyId', '==', companyId)),
		);

		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));
	} catch (error) {
		notifyEntity('Debit Note', NOTIFY_TYPE.ERROR);
		console.error('Failed to fetch Debit Notes:', error);
		throw error;
	}
};

export const deleteDebitNote = async (id: string) => {
	try {
		const debitNoteRef = doc(db, DB_NAME.DEBIT_NOTE, id);

		await deleteDoc(debitNoteRef);

		notifyEntity('Debit Note', NOTIFY_TYPE.DELETE);

		return true;
	} catch (error) {
		notifyEntity('Debit Note', NOTIFY_TYPE.ERROR);
		console.error('Failed to delete Debit Note:', error);
		throw error;
	}
};
