import { db, auth } from '../../../firebase';
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    addDoc,
    serverTimestamp,
    where,
    updateDoc,
    doc,
    deleteDoc
} from "firebase/firestore";
import { CREDIT_TYPE, DB_NAME, INVOICE_TO_TYPE, NOTIFY_TYPE } from '../../constant';
import { getUserMappedCompany, getUserMappedCompanyId, notifyEntity } from '../../../helpers/helpers';
import moment from 'moment';
// ✅ Build a fast lookup map (residentId -> creditWallets)
interface CreditWallet {
    id: string;
    residentId?: string;
    companyId: string;
    creditAmount: number;
    [key: string]: any; // Allow other Firestore fields
    invoices: any[]
}

interface Resident {
    id: string;
    code?: number;
    [key: string]: any;
}
type GetCreditWalletParams = {
    isGroupByResident?: boolean;
};

export const createCreditWallet = async (body: any, fundShortName: string) => {
    try {
        if (!fundShortName) {
            alert('fundShortName is missing')
            return
        }
        const currentUser = auth.currentUser;
        const companyDetails = getUserMappedCompany();
        // Step 1: Generate Invoice Number
        const currentYear = moment().year();
        const yy = String(currentYear).slice(-2);
        const creditWalletRef = collection(db, DB_NAME.CREDIT_WALLET);



        const companyShortName = companyDetails?.shortName || companyDetails?.name?.split(' ')?.map((word: any) => word[0]?.toUpperCase())?.join('');




        const q = query(creditWalletRef, where("fundTypeId", "==", body?.fundTypeId), orderBy("seq", "desc"), limit(1));
        const snapshot = await getDocs(q);



        let seq = 1;
        if (!snapshot.empty) {
            const last = snapshot.docs[0].data();
            seq = parseInt(last.seq || 0) + 1;
        };

        // pad to 4 digits
        const seq4 = String(seq).padStart(4, "0");

        const prifix = +body?.type === CREDIT_TYPE.ADVANCE_CREDIT ? 'AJ' : +body?.type === CREDIT_TYPE.OPENING_BALANCE_CREDIT ? 'OB' : 'CN';
        // final invoice number
        const code = `${prifix}-${companyShortName}${fundShortName}${yy}${seq4}`;




        // Step 2: Define the room model
        const newRoom = {
            date: moment().format("YYYY-MM-DD"),
            ...body,
            code,
            seq,
            ...getUserMappedCompanyId(),
            created: {
                date: serverTimestamp(),
                user: currentUser?.uid || "system"
            },
            updated: []
        };

        // Step 3: Add to Firestore
        const docRef = await addDoc(creditWalletRef, newRoom);
        notifyEntity('Credit Wallet', NOTIFY_TYPE.CREATE);
        return { id: docRef.id, ...newRoom };
        // Step 4: Notify the server about the new room


    } catch (error) {
        notifyEntity('Credit Wallet', NOTIFY_TYPE.ERROR);
        console.error("Failed to create room:", error);
    }
};


export const updateCreditWallet = async (id: string, body: any) => {
    try {

        const currentUser = auth.currentUser;

        const creditWaletDocRef = doc(db, DB_NAME.CREDIT_WALLET, id);
        delete body?.id;

        const update = {
            user: currentUser?.uid || "system",
            date: new Date() // store actual Date, not serverTimestamp()
        };


        const bodyObj = {
            ...body,
            creditApply: body?.creditApply, // ✅ correct
            updated: [...(body?.updated || []), update],
        };


        await updateDoc(creditWaletDocRef, bodyObj);
        notifyEntity('Credit Wallet', NOTIFY_TYPE.UPDATE);
        return { id, ...bodyObj }
    } catch (error) {
        notifyEntity('Credit Wallet', NOTIFY_TYPE.ERROR);
        console.error("Failed to update Local Authority:", error);
        throw error;
    }
};




// // Optimized function
export const getAllByCompanyIdCreditWallet = async (
    creditWalletParams?: GetCreditWalletParams
) => {
    try {
        const resolvedCompanyId = getUserMappedCompanyId()?.companyId;
        if (!resolvedCompanyId) {
            console.warn("⚠️ No companyId provided or found in storage");
            return [];
        }

        // ── Prepare queries ───────────────────────────────────────────────────
        const walletsQuery = query(
            collection(db, DB_NAME.CREDIT_WALLET),
            where("companyId", "==", resolvedCompanyId),
            orderBy("date", "desc")
        );
        const invoiceQuery = query(
            collection(db, DB_NAME.INVOICE),
            where("companyId", "==", resolvedCompanyId)
        );
        const residentQuery = query(
            collection(db, DB_NAME.RESIDENT),
            where("companyId", "==", resolvedCompanyId)
        );

        // ── Fetch all three collections in parallel ────────────────────────
        const [creditWalletSnap, invoiceSnapshot, residentSnap] = await Promise.all([
            getDocs(walletsQuery),
            getDocs(invoiceQuery),
            getDocs(residentQuery),
        ]);

        if (creditWalletSnap.empty) return [];

        // ── Build invoice index by walletId ───────────────────────────────
        const invoices: any[] = invoiceSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        const invoiceByWalletId = new Map<string, any[]>();
        for (const inv of invoices) {
            const creditApplyArr = Array.isArray(inv.creditApply) ? inv.creditApply : [];
            for (const ca of creditApplyArr) {
                if (!ca?.creditWalletId) continue;
                const arr = invoiceByWalletId.get(ca.creditWalletId) ?? [];
                arr.push(inv);
                invoiceByWalletId.set(ca.creditWalletId, arr);
            }
        }

        // ── Build creditWallets with attached invoices ────────────────────
        const creditWallets: (CreditWallet & { invoices: any[] })[] = creditWalletSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
            invoices: invoiceByWalletId.get(d.id) ?? [],
        }));

        // ── If no residents, return flat list ─────────────────────────────
        if (residentSnap.empty) {
            return creditWallets.map((w) => ({ ...w, residentData: undefined }));
        }

        // ── Build resident map ────────────────────────────────────────────
        const residents: Resident[] = residentSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Resident[];
        const residentById = new Map<string, Resident>();
        for (const r of residents) residentById.set(r.id, r);

        // ── Build walletMap: residentId → wallets ─────────────────────────
        const walletMap = new Map<string, (CreditWallet & { invoices: any[] })[]>();
        for (const wallet of creditWallets) {
            const resId = wallet.residentId;
            if (!resId) continue;
            const list = walletMap.get(resId) ?? [];
            list.push(wallet);
            walletMap.set(resId, list);
        }

        // ── No-resident wallets grouped by fundTypeId ─────────────────────
        const noResidentWallets = creditWallets.filter(
            (w) => !w.residentId || !residentById.has(w.residentId)
        );

        const noResidentByFundType = new Map<string, (CreditWallet & { invoices: any[] })[]>();
        for (const wallet of noResidentWallets) {
            const fundKey = wallet.fundTypeId || '__NO_FUND__';
            const arr = noResidentByFundType.get(fundKey) ?? [];
            arr.push(wallet);
            noResidentByFundType.set(fundKey, arr);
        }

        const noResidentGroups = Array.from(noResidentByFundType.entries()).map(([fundTypeId, wallets]) => ({
            id: '',
            code: null,
            fundTypeId,
            personal: { name: 'No Resident' },
            creditWallets: wallets,
        }));

        // ── Merge residents with wallets ──────────────────────────────────
        const residentGroups = residents
            .map((r) => ({
                ...r,
                creditWallets: walletMap.get(r.id) ?? [],
            }))
            .filter((r) => r.creditWallets.length > 0)
            .sort((a: any, b: any) => Number(a.code ?? 0) - Number(b.code ?? 0));

        const result = [...residentGroups, ...noResidentGroups];

        // ── Flat list with residentData attached (non-grouped mode) ───────
        const creditWalletsList = creditWallets.map((w) => ({
            ...w,
            residentData: w.residentId ? residentById.get(w.residentId) : undefined,
        }));

        if (creditWalletParams?.isGroupByResident) {
            return result;
        } else {
            return creditWalletsList;
        }

    } catch (error) {
        console.error("❌ Error getting Wallet:", error);
        return [];
    }
};
// export const getAllByCompanyIdCreditWallet = async (
//     creditWalletParams?: GetCreditWalletParams
// ) => {
//     try {
//         const resolvedCompanyId = getUserMappedCompanyId()?.companyId;
//         if (!resolvedCompanyId) {
//             console.warn("⚠️ No companyId provided or found in storage");
//             return [];
//         }

//         const walletsQuery = query(
//             collection(db, DB_NAME.CREDIT_WALLET),
//             where("companyId", "==", resolvedCompanyId),
//             where("creditAmount", ">", 0),
//             orderBy("date", "desc")
//         );
//         const invoiceQuery = query(
//             collection(db, DB_NAME.INVOICE),
//             where("companyId", "==", resolvedCompanyId)
//         );
//         const residentQuery = query(
//             collection(db, DB_NAME.RESIDENT),
//             where("companyId", "==", resolvedCompanyId)
//         );
//         const laQuery = query(
//             collection(db, DB_NAME.LOCAL_AUTHORITY),
//             where("companyId", "==", resolvedCompanyId)
//         );
//         const icbQuery = query(
//             collection(db, DB_NAME.ICB),
//             where("companyId", "==", resolvedCompanyId)
//         );
//         const fncQuery = query(
//             collection(db, DB_NAME.FNM),
//             where("companyId", "==", resolvedCompanyId)
//         );

//         const [
//             creditWalletSnap,
//             invoiceSnapshot,
//             residentSnap,
//             laSnap,
//             icbSnap,
//             fncSnap
//         ] = await Promise.all([
//             getDocs(walletsQuery),
//             getDocs(invoiceQuery),
//             getDocs(residentQuery),
//             getDocs(laQuery),
//             getDocs(icbQuery),
//             getDocs(fncQuery),
//         ]);

//         if (creditWalletSnap.empty) return [];

//         // ── Build invoice index by walletId ───────────────────────────────────
//         const invoices: any[] = invoiceSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

//         const invoiceByWalletId = new Map<string, any[]>();
//         for (const inv of invoices) {
//             const creditApplyArr = Array.isArray(inv.creditApply) ? inv.creditApply : [];
//             for (const ca of creditApplyArr) {
//                 if (!ca?.creditWalletId) continue;
//                 const arr = invoiceByWalletId.get(ca.creditWalletId) ?? [];
//                 arr.push(inv);
//                 invoiceByWalletId.set(ca.creditWalletId, arr);
//             }
//         }

//         // ── Build credit wallets ──────────────────────────────────────────────
//         const creditWallets: (CreditWallet & { invoices: any[] })[] = creditWalletSnap.docs.map((d) => ({
//             id: d.id,
//             ...(d.data() as any),
//             invoices: invoiceByWalletId.get(d.id) ?? [],
//         }));

//         // ── Build resident index ──────────────────────────────────────────────
//         const residents: Resident[] = residentSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Resident[];
//         const residentById = new Map<string, Resident>();
//         for (const r of residents) residentById.set(r.id, r);

//         // ── Build LA index ────────────────────────────────────────────────────
//         const laList: any[] = laSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
//         const laById = new Map<string, any>();
//         for (const la of laList) laById.set(la.id, la);

//         // ── Build ICB index ───────────────────────────────────────────────────
//         const icbList: any[] = icbSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
//         const icbById = new Map<string, any>();
//         for (const icb of icbList) icbById.set(icb.id, icb);

//         const fncList: any[] = fncSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
//         const fncById = new Map<string, any>();
//         for (const fnc of fncList) fncById.set(fnc.id, fnc);

//         // ── Resolve fundData — only when residentId is empty ──────────────────
//         const resolveFundData = (wallet: any): any | undefined => {
//             const { creditTo, fundTypeId } = wallet;
//             switch (creditTo) {
//                 case INVOICE_TO_TYPE.LA:
//                     return fundTypeId ? laById.get(fundTypeId) : undefined;
//                 case INVOICE_TO_TYPE.CHC:
//                     return fundTypeId ? icbById.get(fundTypeId) : undefined;
//                 case INVOICE_TO_TYPE.FNC:
//                 case INVOICE_TO_TYPE.INCONT:
//                     return fundTypeId
//                         ? laById.get(fundTypeId) ?? icbById.get(fundTypeId)
//                         : undefined;
//                 default:
//                     return undefined;
//             }
//         };

//         // ── Flat list — residentData OR fundData, never both ──────────────────
//         const creditWalletsList = creditWallets.map((w) => ({
//             ...w,
//             // has residentId → resident details, no fund
//             residentData: w.residentId ? residentById.get(w.residentId) : undefined,
//             // no residentId → fund details only
//             fundData: !w.residentId ? resolveFundData(w) : undefined,
//         }));

//         // ── Grouped by resident ───────────────────────────────────────────────
//         if (creditWalletParams?.isGroupByResident) {

//             // Wallets WITH residentId → group under resident
//             const walletMap = new Map<string, (CreditWallet & { invoices: any[] })[]>();
//             for (const wallet of creditWallets) {
//                 if (!wallet.residentId) continue;
//                 const list = walletMap.get(wallet.residentId) ?? [];
//                 list.push(wallet);
//                 walletMap.set(wallet.residentId, list);
//             }

//             const residentGrouped = residents
//                 .map((r) => ({
//                     ...r,
//                     creditWallets: walletMap.get(r.id) ?? [],
//                 }))
//                 .filter((r) => r.creditWallets.length > 0)
//                 .sort((a: any, b: any) => Number(a.code ?? 0) - Number(b.code ?? 0));

//             // Wallets WITHOUT residentId → fund wallets group
//             const noResidentWallets = creditWallets
//                 .filter((w) => !w.residentId)
//                 .map((w) => ({
//                     ...w,
//                     residentData: undefined,
//                     // ✅ only no-resident wallets get fundData
//                     fundData: resolveFundData(w),
//                 }));

//             const noResidentGroup = noResidentWallets.length > 0
//                 ? [{
//                         id: "no-resident",
//                         code: null,
//                         personal: { name: "No Resident" },
//                         creditWallets: noResidentWallets,
//                 }]
//                 : [];

//                              console.log('creditWalletsList-----------',[...residentGrouped, ...noResidentGroup])

//             return [...residentGrouped, ...noResidentGroup];

//         }

//         // ── Flat list (default) ───────────────────────────────────────────────
       
//         return creditWalletsList;

//     } catch (error) {
//         console.error("❌ Error getting Wallet:", error);
//         return [];
//     }
// };

export const deleteCreditWallet = async (id: string) => {
    try {
        if (!id) throw new Error("Credit Wallet ID is required for deletion");

        const creditWalletRef = doc(db, DB_NAME.CREDIT_WALLET, id);

        // Delete the document
        const res = await deleteDoc(creditWalletRef);

        // Notify the system (same as in create)
        notifyEntity('Credit Wallet', NOTIFY_TYPE.DELETE);

        return { success: true, id };
    } catch (error) {
        notifyEntity('Credit Wallet', NOTIFY_TYPE.ERROR);
        console.error("Failed to delete credit wallet:", error);
        return { success: false, error };
    }
};