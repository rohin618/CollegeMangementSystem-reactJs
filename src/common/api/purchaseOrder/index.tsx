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
import { auth, db } from '../../../firebase';
import { DB_NAME, NOTIFY_TYPE } from '../../constant';
import {
	getUserMappedCompany,
	getUserMappedCompanyId,
	notifyEntity,
} from '../../../helpers/helpers';
import moment from 'moment';
import { bulkPurchaseOrder, purchaseOrderMail } from '../axios/api.varible';
import { apiCall } from '../axios';

const getNextPurchaseOrderCode = async (): Promise<{ code: string; seq: number }> => {
	const companyDetails = getUserMappedCompany();
	const purchaseOrderRef = collection(db, DB_NAME.PURCHASE_ORDER);
	const year = moment().year(); // 2026
	const day = moment().format('DD');

	const companyShortName =
		companyDetails?.shortName ||
		companyDetails?.name
			?.split(' ')
			?.map((word: any) => word[0]?.toUpperCase())
			?.join('');
	const q = query(purchaseOrderRef, orderBy('seq', 'desc'), limit(1));
	const snapshot = await getDocs(q);

	let seq = 1000;
	if (!snapshot.empty) {
		const last = snapshot.docs[0].data();
		seq = parseInt(last.seq || seq) + 1;
	}

	// final invoice number
	const code = `PO-${companyShortName}${day}${year}${seq}`;

	return { code, seq };
};
export const createPurchaseOrder = async (body: any) => {
	try {
		const currentUser = auth.currentUser;

		const { companyId } = getUserMappedCompanyId() || {};

		const purchaseOrderRef = collection(db, DB_NAME.PURCHASE_ORDER);
		const { code, seq } = await getNextPurchaseOrderCode();

		const purchaseOrderBody = {
			...body,
			seq,
			created: {
				date: serverTimestamp(),
				userId: currentUser?.uid || 'system',
			},
			code,
			companyId: companyId || '',
		};

		const docRef = await addDoc(purchaseOrderRef, purchaseOrderBody);

		notifyEntity('PurchaseOrder', NOTIFY_TYPE.CREATE);

		return { id: docRef.id, ...purchaseOrderBody };
	} catch (error) {
		notifyEntity('PurchaseOrder', NOTIFY_TYPE.ERROR);
		console.error('Failed to create PurchaseOrder:', error);
		throw error;
	}
};

export const updatePurchaseOrder = async (id: string, body: any) => {
	try {
		const currentUser = auth.currentUser;

		const purchaseOrderRef = doc(db, DB_NAME.PURCHASE_ORDER, id);
		
		delete body.id;

		const updateLog = {
			userId: currentUser?.uid || 'system',
			date: new Date(), 
		};
		const updateBody = {
			...body,
			updated: arrayUnion(updateLog),
		};

		await updateDoc(purchaseOrderRef, updateBody);

		notifyEntity('PurchaseOrder', NOTIFY_TYPE.UPDATE);

		return { id, ...updateBody };
	} catch (error) {
		notifyEntity('PurchaseOrder', NOTIFY_TYPE.ERROR);
		throw error;
	}
};

export const getAllPurchaseOrders = async () => {
	try {
		const currentUser = auth.currentUser;
		const { companyId } = getUserMappedCompanyId() || {};

		const purchaseOrderRef = collection(db, DB_NAME.PURCHASE_ORDER);

		const snapshot = await getDocs(
			query(purchaseOrderRef, where('companyId', '==', companyId)),
		);

		return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
	} catch (error) {
		notifyEntity('PurchaseOrder', NOTIFY_TYPE.ERROR);
		console.error('Failed to create PurchaseOrder:', error);
		throw error;
	}
};



export const deletePurchaseOrder = async (id: string) => {
	try {
		const purchaseOrderRef = doc(db, DB_NAME.PURCHASE_ORDER, id);

		await deleteDoc(purchaseOrderRef);

		notifyEntity('PurchaseOrder', NOTIFY_TYPE.DELETE);

		return true;
	} catch (error) {
		notifyEntity('PurchaseOrder', NOTIFY_TYPE.ERROR);
		console.error('Failed to delete Purchase Order:', error);
		throw error;
	}
};





export const postBulkPurchaseOrder = async (body: any) => {
  try {
	const res = await apiCall({
	  ...bulkPurchaseOrder.purchaseOrder,
	  body,
	});

	return res; //  return response
  } catch (error) {
	console.error(error);
	throw error; //  rethrow
  }
};

export const sendPOToSupplier = async (
	purchaseOrderId: string,
	vendorEmail: string,
	companyId: string,
) => {
	return apiCall({
		...purchaseOrderMail.sendToSupplier,
		body: { purchaseOrderId, vendorEmail, companyId },
	});
};

export const notifyManagerForApproval = async (
	purchaseOrderId: string,
	managerEmail: string,
	companyId: string,
) => {
	return apiCall({
		...purchaseOrderMail.notifyManager,
		body: { purchaseOrderId, managerEmail, companyId },
	});
};

export const notifyMDForApproval = async (
	purchaseOrderId: string,
	mdEmail: string,
	companyId: string,
) => {
	return apiCall({
		...purchaseOrderMail.notifyMD,
		body: { purchaseOrderId, mdEmail, companyId },
	});
};