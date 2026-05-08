import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { getUserMappedCompanyId, notifyEntity } from "../../../helpers/helpers";
import { DB_NAME,} from "../../constant";
import { db } from "../../../firebase";


export const getAllNotificationByCompanyId = (
	onChange: (notifications: any[]) => void,
	onError?: (error: any) => void,
) => {
	const { companyId } = getUserMappedCompanyId() || {};

	if (!companyId) {
		onChange([]);
		return () => {};
	}

	const notificationRef = collection(db, DB_NAME.NOTIFICATION);
	const q = query(notificationRef, where('companyId', '==', companyId));

	// 🔥 Real-time listener
	const unsubscribe = onSnapshot(
		q,
		(snapshot) => {
			const notifications = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
			onChange(notifications);
		},
		(error) => {
			console.error('Notification snapshot error:', error);
			onError?.(error);
		},
	);

	// ✅ VERY IMPORTANT: cleanup
	return unsubscribe;
};



export const updateInvoiceStatusOnly = async (
	notificationId: string,
	updatedInvoices: any[],
) => {
	const ref = doc(db, DB_NAME.NOTIFICATION, notificationId);

	await updateDoc(ref, {
		invoices: updatedInvoices,
	});
};



