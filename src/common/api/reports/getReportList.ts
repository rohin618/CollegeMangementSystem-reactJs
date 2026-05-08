import {
  collection,
  getDocs,
  query,
  where,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { getUserMappedCompanyId } from '../../../helpers/helpers';
import { DB_NAME, INVOICE_STATUS } from '../../constant';
import { Timestamp } from 'firebase/firestore';

/* =====================================================
   INTERFACES
===================================================== */

interface GetReportListParams {
  sDate?: string;        // yyyy-MM-dd
  eDate?: string;        // yyyy-MM-dd (As Of Date)
  status?: number;       // DB = number
  invoiceTo?: number;    // DB = string
}

interface Resident {
  id: string;
  companyId: string;
  [key: string]: any;
}

interface Wallet {
  id: string;
  companyId: string;
  residentId: string;
  [key: string]: any;
}

interface Room {
  id: string;
  [key: string]: any;
}

interface Bed {
  id: string;
  [key: string]: any;
}

interface Invoice {
  id: string;
  companyId: string;
  residentId: string;
  sDate?: string;
  eDate?: string;
  status?: number;
  invoiceTo?: string;
  roomId?: string;
  bedId?: string;
  roomData?: Room | null;
  bedData?: Bed | null;
  [key: string]: any;
}

interface Report {
  id: string;
  creditWallets: Wallet[];
  invoices: Invoice[];
  [key: string]: any;
}

/* =====================================================
   HELPERS
===================================================== */

const isValidISODate = (value?: string) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);



const timestampToISO = (ts?: Timestamp): string | null => {
  if (!ts) return null;
  return ts.toDate().toISOString().slice(0, 10); // yyyy-MM-dd
};
/* =====================================================
   API
===================================================== */
export const getReportList = async (
  params?: GetReportListParams
): Promise<Report[]> => {
  try {
    const resolvedCompanyId = getUserMappedCompanyId()?.companyId;

    if (!resolvedCompanyId) {
      console.warn('⚠️ No companyId found');
      return [];
    }

    // ✅ MOVE DATE PARAMS TO TOP
    const sDate = params?.sDate;
    const eDate = params?.eDate;

    /* =====================================================
       STEP 1: FETCH INVOICES & WALLETS
    ===================================================== */

    const [invoiceSnap, walletSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, DB_NAME.INVOICE),
          where('companyId', '==', resolvedCompanyId),
          where("status", "not-in", [
            INVOICE_STATUS.VOID,
            INVOICE_STATUS.CANCELLED,
            INVOICE_STATUS.DRAFT,
          ])
        )
      ),
      getDocs(
        query(
          collection(db, DB_NAME.CREDIT_WALLET),
          where('companyId', '==', resolvedCompanyId)
        )
      ),
    ]);

    /* =====================================================
       STEP 2: WALLET FILTERING
    ===================================================== */

    const allWallets: Wallet[] = walletSnap.docs
      .map(d => {
        const data = d.data() as any;

        return {
          id: d.id,
          ...data,
          __walletDate: data?.created?.date
            ? timestampToISO(data.created.date)
            : null,
        };
      })
      .filter(w => w.__walletDate); // remove invalid ones

    let filteredWallets: Wallet[] = [];

    if (isValidISODate(sDate) && isValidISODate(eDate)) {
      filteredWallets = allWallets.filter(
        w => w.__walletDate >= sDate && w.__walletDate <= eDate
      );
    } else if (isValidISODate(eDate)) {
      filteredWallets = allWallets.filter(
        w => w.__walletDate <= eDate
      );
    } else {
      filteredWallets = allWallets;
    }

    /* =====================================================
       STEP 3: INVOICE FILTERING
    ===================================================== */

    const allInvoices: Invoice[] = invoiceSnap.docs
      .map(d => ({ id: d.id, ...(d.data() as any) }))
      .filter(inv => inv.invoiceDate); // safer filter

    let filteredInvoices: Invoice[] = [];

    if (isValidISODate(sDate) && isValidISODate(eDate)) {
      filteredInvoices = allInvoices.filter(
        inv => inv.invoiceDate >= sDate && inv.invoiceDate <= eDate
      );
    } else if (isValidISODate(eDate)) {
      filteredInvoices = allInvoices.filter(
        inv => inv.invoiceDate <= eDate
      );
    } else {
      filteredInvoices = allInvoices;
    }

    if (params?.status !== undefined) {
      filteredInvoices = filteredInvoices.filter(
        inv => Number(inv.status) === Number(params.status)
      );
    }

    if (params?.invoiceTo !== undefined) {
      filteredInvoices = filteredInvoices.filter(
        inv => String(inv.invoiceTo) === String(params.invoiceTo)
      );
    }

    /* =====================================================
       STEP 4: FETCH MASTER DATA
    ===================================================== */

    const [residentSnap, roomSnap, bedSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, DB_NAME.RESIDENT),
          where('companyId', '==', resolvedCompanyId)
        )
      ),
      getDocs(
        query(
          collection(db, DB_NAME.ROOMS),
          where('companyId', '==', resolvedCompanyId)
        )
      ),
      getDocs(
        query(
          collection(db, DB_NAME.BED),
          where('companyId', '==', resolvedCompanyId)
        )
      ),
    ]);

    const residents = residentSnap.docs.map(d => ({
      id: d.id,
      ...(d.data() as DocumentData),
    }));

    const rooms = roomSnap.docs.map(d => ({
      id: d.id,
      ...(d.data() as DocumentData),
    }));

    const beds = bedSnap.docs.map(d => ({
      id: d.id,
      ...(d.data() as DocumentData),
    }));

    const roomMap = new Map(rooms.map(r => [r.id, r]));
    const bedMap = new Map(beds.map(b => [b.id, b]));

    /* =====================================================
       STEP 5: MAP BY RESIDENT
    ===================================================== */

    const walletMap = new Map<string, Wallet[]>();
    filteredWallets.forEach(w => {
      const list = walletMap.get(w.residentId) || [];
      list.push(w);
      walletMap.set(w.residentId, list);
    });

    const invoiceMap = new Map<string, Invoice[]>();
    filteredInvoices.forEach(inv => {
      const list = invoiceMap.get(inv.residentId) || [];
      list.push({
        ...inv,
        roomData: inv.roomId ? roomMap.get(inv.roomId) || null : null,
        bedData: inv.bedId ? bedMap.get(inv.bedId) || null : null,
      });
      invoiceMap.set(inv.residentId, list);
    });

    /* =====================================================
       FINAL REPORT
    ===================================================== */

    return residents.map(resident => ({
      ...resident,
      creditWallets: (walletMap.get(resident.id) || []).sort(
        (a, b) => (b.seq ?? 0) - (a.seq ?? 0)
      ),
      invoices: (invoiceMap.get(resident.id) || []).sort(
        (a, b) => (b.seq ?? 0) - (a.seq ?? 0)
      ),
    }));

  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    return [];
  }
};

