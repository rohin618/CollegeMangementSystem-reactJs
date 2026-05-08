// src/common/api/openBalance.ts
import { db, auth } from '../../../firebase';
import {
	collection,
	addDoc,
	getDocs,
	updateDoc,
	deleteDoc,
	doc,
	query,
	where,
	serverTimestamp,
} from 'firebase/firestore';

import { DB_NAME, NOTIFY_TYPE } from '../../constant';
import { getUserMappedCompanyId, notifyEntity } from '../../../helpers/helpers';
import { getAllResidentByCompanyId } from '../resident';
import { getAllChartOfAccounts } from '../chartAccount';
import { getAllInvoicesList } from '../invoice';
import { getAllByCompanyIdCreditWallet } from '../creditWalet';

export const createOpeningBalance = async (body: any) => {
	try {
		const user = auth.currentUser;
		const company = getUserMappedCompanyId();

		if (!company?.companyId) {
			console.warn('⚠ No companyId found for opening balance create');
			return;
		}

		const record = {
			...body,
			companyId: company.companyId,
			created: {
				user: user?.uid || 'system',
				date: serverTimestamp(),
			},
			updated: [],
		};

		const ref = collection(db, DB_NAME.OPENING_BALANCE);
		const docRef = await addDoc(ref, record);

		notifyEntity('Opening Balance', NOTIFY_TYPE.CREATE);

		return { id: docRef.id, ...record };
	} catch (err) {
		console.error('❌ Error creating opening balance:', err);
		notifyEntity('Opening Balance', NOTIFY_TYPE.ERROR);
		throw err;
	}
};

export const getAllOpeningBalances = async () => {
	try {
		const company = getUserMappedCompanyId();

		if (!company?.companyId) {
			console.warn('⚠ No companyId found for opening balance list');
			return [];
		}

		const q = query(
			collection(db, DB_NAME.OPENING_BALANCE),
			where('companyId', '==', company.companyId),
		);

		const residentList = await getAllResidentByCompanyId();

		const chartOfAccountList = await getAllChartOfAccounts();
		const invoiceList = await getAllInvoicesList();
		const creditWalletList = await getAllByCompanyIdCreditWallet();

		const snap = await getDocs(q);

		return snap.docs.map((d) => {
			const data = d.data();

			const creditWallet: any = creditWalletList.find(
				(credit) => credit.id === data.creditWalletId,
			);

			return {
				id: d.id,
				...data,

				//  Inject fields for UI (IMPORTANT)
				paymentMethod: creditWallet?.paymentMethod || null,
				refNo: creditWallet?.refNo || null,
				bankId: creditWallet?.bankId || null,

				residentData: residentList.find((resident) => resident.id === data.residentId),

				invoiceDetails: invoiceList.find((invoice) => invoice.id === data.invoiceId),

				creditWalletDetails: creditWallet,

				coaMapping: {
					...data.coaMapping,
					chartOfAccountDetail: chartOfAccountList.find(
						(coa) => coa.id === data.coaMapping.accountId,
					),
				},
			};
		});
	} catch (err) {
		console.error('❌ Error fetching opening balance list:', err);
		return [];
	}
};

export const updateOpeningBalance = async (id: string, data: any) => {
	try {
		const ref = doc(db, DB_NAME.OPENING_BALANCE, id);

		const updated = {
			...data,
			updated: [
				...(data.updated || []),
				{
					date: new Date(),
				},
			],
		};

		await updateDoc(ref, updated);
		notifyEntity('Opening Balance', NOTIFY_TYPE.UPDATE);

		return { id, ...updated };
	} catch (err) {
		console.error('❌ Error updating opening balance:', err);
		notifyEntity('Opening Balance', NOTIFY_TYPE.ERROR);
		throw err;
	}
};

export const deleteOpeningBalance = async (id: string) => {
	try {
		const ref = doc(db, DB_NAME.OPENING_BALANCE, id);
		await deleteDoc(ref);
		notifyEntity('Opening Balance', NOTIFY_TYPE.DELETE);
		return id;
	} catch (err) {
		console.error('❌ Error deleting opening balance:', err);
		notifyEntity('Opening Balance', NOTIFY_TYPE.ERROR);
		throw err;
	}
};
