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
  deleteDoc,
  arrayUnion,
  writeBatch,
  DocumentData,

} from "firebase/firestore";
import { DB_NAME, INVOICE_STATUS, INVOICE_TYPE, NOTIFY_TYPE } from '../../constant';
import showNotification from '../../../components/extras/showNotification';
import { downloadPdfBlob, getInvoiceOpenBalance, getUserMappedCompany, getUserMappedCompanyId, groupInvoicePaymentsByPaymentIdWithDate, notifyEntity, updatePaymentStatus } from '../../../helpers/helpers';
import moment from 'moment';
import { IInvoiceModel } from '../../interface';
import { apiCall } from '../axios';
import { downloadInvoiceUrl, invoice, invoiceBulkMail, invoiceSingleMail } from '../axios/api.varible';
import { IInvoiceDiscount } from '../../interface/invoice';

export const createInvoice = async (body: any, fundShortName: string) => {
  try {
    if (!fundShortName) {
      alert('fundShortName is missing')
      return
    }
    delete body?.residentData;
    const currentUser = auth.currentUser;
    const companyDetails = getUserMappedCompany();
    // Step 1: Generate Invoice Number
    const currentYear = moment().year();
    const yy = String(currentYear).slice(-2);

    const invoiceRef = collection(db, DB_NAME.INVOICE);
    const { sDate, eDate, invoiceTo, residentId, type, fundTypeId } = body; // "YYYY-MM-DD" format

    // Firestore query: overlap check
    const qry = query(
      invoiceRef,
      where("invoiceTo", "==", invoiceTo),
      where("residentId", "==", residentId),
      where("fundTypeId", "==", fundTypeId),
      where("status", "not-in", [
        INVOICE_STATUS.VOID,
        INVOICE_STATUS.CANCELLED
      ]),
      where("type", "==", type),
      where("sDate", "<=", eDate), // existing start <= new end
      where("eDate", ">=", sDate)  // existing end >= new start
    );

    const conflictSnap = await getDocs(qry);
    // Check 
    if (!conflictSnap.empty && type === INVOICE_TYPE.NORMAL) {
      showNotification(
        'Invoice already exists',
        'Invoice creation blocked due to overlapping date range.',
        'warning' // red error style
      );
      console.warn("Invoice creation blocked due to overlapping date range.");
      return { error: "Invoice already exists in this date range" };

    };

    const companyShortName = companyDetails?.shortName || companyDetails?.name?.split(' ')?.map((word: any) => word[0]?.toUpperCase())?.join('');

    const isOpeningBalance = INVOICE_TYPE.OPENING_BALANCE === +type;

    const conditions = [
      where("companyId", "==", companyDetails?.id),
      where("fundTypeId", "==", fundTypeId),
      where("invoiceTo", "==", invoiceTo),
    ];

    // ✅ Add type filter ONLY if Opening Balance
    if (isOpeningBalance) {
      conditions.push(where("type", "==", type));
    }

    // ✅ Add invoiceTo only when fundTypeId is empty
    // if (!fundTypeId) {
    //   conditions.push(where("invoiceTo", "==", invoiceTo));
    // }

    const q = query(
      invoiceRef,
      ...conditions,
      orderBy("seq", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);



    let seq = 1;
    if (!snapshot.empty) {
      const last = snapshot.docs[0].data();
      seq = parseInt(last.seq || 0) + 1;
    }

    // pad to 4 digits
    const seq4 = String(seq).padStart(4, "0");

    const prefix = INVOICE_TYPE.OPENING_BALANCE === +type ? 'OB' : 'INV';

    // final invoice number
    const code = `${prefix}-${companyShortName}${fundShortName}${yy}${seq4}`;

    const totalPaid = (body?.payedInfo || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const totalCredits = (body?.creditApply || []).reduce(
      (sum: number, { amount }: any) => sum + (Number(amount) || 0),
      0
    );


    // Step 2: Define the room model
    const newInvoice = {
      ...body,
      code,
      seq,
      ...getUserMappedCompanyId(),
      status: updatePaymentStatus(body),
      created: {
        date: serverTimestamp(),
        user: currentUser?.uid || "system"
      },
      updated: []
    };


    // Step 3: Add to Firestore
    const docRef = await addDoc(invoiceRef, newInvoice);
    return { id: docRef.id, ...newInvoice } as IInvoiceModel;


  } catch (error) {
    console.error("Failed to create room:", error);
  }
};


export const getAllByResidentIdInvoices = async (
  residentId: string,
  statuses?: number[],  // ✅ optional
  invoiceTo?: number  // ✅ optional filter for invoiceTo
): Promise<any[]> => {
  try {
    if (!residentId) {
      console.warn("❌ Resident ID is required");
      return [];
    }

    const invoiceRef = collection(db, DB_NAME.INVOICE);

    // 🔹 Build dynamic filters
    const filters = [where("residentId", "==", residentId)];

    if (Array.isArray(statuses) && statuses.length > 0) {
      filters.push(where("status", "in", statuses));
    }

    if (invoiceTo) {

      filters.push(where("invoiceTo", "==", invoiceTo)); // ✅ filter by invoiceTo field
    }

    const q = query(invoiceRef, ...filters, orderBy("invoiceDate", "desc"));
    const snapshot = await getDocs(q);



    const invoices: any[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        // invoiceTo: data?.invoiceTo ?? {}, // ✅ always ensure invoiceTo exists
      };
    }) as any[];

    return invoices;
  } catch (error) {
    console.error("❌ Error getting invoices:", error);
    return [];
  }
};




type GetInvoicesParams = {
  residentId?: string;
  statuses?: number[];
  invoiceTo?: number;
  sDate?: string;
  eDate?: string;
  fundTypeId?: string
};

export const getAllInvoicesList = async (params?: GetInvoicesParams) => {

  try {
    const resolvedCompanyId = getUserMappedCompanyId()?.companyId;
    if (!resolvedCompanyId) {
      console.warn("⚠️ No companyId provided or found in storage");
      return [];
    }

    // ✅ Fetch all required data in parallel
    const [creditWalletSnapshot, residentSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(db, DB_NAME.CREDIT_WALLET),
          where("companyId", "==", resolvedCompanyId)
        )
      ),
      getDocs(
        query(
          collection(db, DB_NAME.RESIDENT),
          where("companyId", "==", resolvedCompanyId)
        )
      ),
    ]);

    // ✅ Group credit wallets by residentId
    const creditWalletsMap = creditWalletSnapshot.docs.reduce((map, doc) => {
      const data = doc.data();
      const residentId = data.residentId;

      if (!map.has(residentId)) {
        map.set(residentId, []);
      }

      map.get(residentId)!.push({ id: doc.id, ...data });
      return map;
    }, new Map<string, any[]>());



    // ✅ Build residents lookup with attached creditWallets
    const residentsMap = new Map(
      residentSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        const creditWallets = creditWalletsMap.get(doc.id)
        return [
          doc.id,
          {
            id: doc.id,
            ...data,
            creditWallets,
          },
        ];
      })
    );


    // ✅ Build invoice filters dynamically
    const invoiceFilters: any[] = [where("companyId", "==", resolvedCompanyId)];


    if (params?.residentId) {


      invoiceFilters.push(where("residentId", "==", params.residentId));
    }


    if (params?.sDate) {
      invoiceFilters.push(where('sDate', '>=', params.sDate));
    }

    if (params?.eDate) {
      invoiceFilters.push(where('eDate', '<=', params.eDate));
    }

    if (params?.statuses?.length) {
      invoiceFilters.push(where("status", "in", params.statuses));
    }

    if (typeof params?.invoiceTo === "number") {
      invoiceFilters.push(where("invoiceTo", "==", params.invoiceTo));
    }

    if (params?.fundTypeId) {
      invoiceFilters.push(where("fundTypeId", "==", params.fundTypeId));
    }


    // ✅ Fetch invoices
    const invoiceSnapshot = await getDocs(
      query(collection(db, DB_NAME.INVOICE), ...invoiceFilters, orderBy("invoiceDate", "desc"))
    );


    // ✅ Attach resident data efficiently
    const invoices = invoiceSnapshot.docs
      .map((doc) => {
        const invoiceData: any = { id: doc.id, ...doc.data() };
        return {
          ...invoiceData,
          residentData: residentsMap.get(invoiceData.residentId) ?? null,
        };
      })
      .sort((a: any, b: any) => a.code - b.code);


    return invoices;
  } catch (error) {
    console.error("❌ Error getting invoices:", error);
    return [];
  }
};


export const getInvoicesHistoryList = async (params?: GetInvoicesParams) => {
  try {
    const resolvedCompanyId = getUserMappedCompanyId()?.companyId;
    if (!resolvedCompanyId) {
      console.warn("⚠️ No companyId provided or found in storage");
      return [];
    }

    // ✅ Build invoice filters dynamically
    const walletFilters: any[] = [where("companyId", "==", resolvedCompanyId)];

    if (params?.residentId) {
      walletFilters.push(where("residentId", "==", params.residentId));
    }

    if (params?.residentId) {
      walletFilters.push(where("residentId", "==", params.residentId));
    }

    // ✅ Fetch all required data in parallel
    const [creditWalletSnapshot, residentSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(db, DB_NAME.CREDIT_WALLET),
          ...walletFilters
        )
      ),
      getDocs(
        query(
          collection(db, DB_NAME.RESIDENT),
          where("companyId", "==", resolvedCompanyId)
        )
      ),
    ]);




    const creditWalletsMap = creditWalletSnapshot.docs.map((doc: any) => {
      return { id: doc.id, ...doc.data() };
    })


    const residentsMap = residentSnapshot.docs.map((doc: any) => {
      return { id: doc.id, ...doc.data() };
    })


    // ✅ Build invoice filters dynamically
    const invoiceFilters: any[] = [where("companyId", "==", resolvedCompanyId)];

    if (params?.residentId) {
      invoiceFilters.push(where("residentId", "==", params.residentId));
    }

    if (params?.statuses?.length) {
      invoiceFilters.push(where("status", "in", [INVOICE_STATUS.PARTIAL, INVOICE_STATUS.COMPLITED]));
    }

    if (typeof params?.invoiceTo === "number") {
      invoiceFilters.push(where("invoiceTo", "==", params.invoiceTo));
    }

    // ✅ Fetch invoices
    const invoiceSnapshot = await getDocs(
      query(collection(db, DB_NAME.INVOICE), ...invoiceFilters, orderBy("invoiceDate", "desc"))
    );

    // ✅ Attach resident data efficiently
    const invoices = invoiceSnapshot.docs
      .map((doc) => {
        const invoiceData: any = { id: doc.id, ...doc.data() };
        return {
          ...invoiceData,
          residentData: residentsMap.find((resident) => resident.id === invoiceData.residentId) ?? null,
        };
      })
      .sort((a: any, b: any) => a.code - b.code);




    const result = groupInvoicePaymentsByPaymentIdWithDate(invoices, creditWalletsMap, residentsMap);
    return result
  } catch (error) {
    console.error("❌ Error getting invoices:", error);
    return [];
  }
};




export const getAllInvoicesbyResidentGroupList = async () => {
  try {
    const resolvedCompanyId = getUserMappedCompanyId()?.companyId;
    if (!resolvedCompanyId) {
      console.warn("⚠️ No companyId provided or found in storage");
      return [];
    }

    // ✅ Fetch all required data in parallel
    const [creditWalletSnapshot, invoiceSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(db, DB_NAME.CREDIT_WALLET),
          where("companyId", "==", resolvedCompanyId)
        )
      ),
      getDocs(
        query(
          collection(db, DB_NAME.INVOICE),
          where("companyId", "==", resolvedCompanyId),
          orderBy("invoiceDate", "desc")
        )
      ),
    ]);

    // ✅ Group credit wallets by residentId
    const creditWalletsMap = creditWalletSnapshot.docs.reduce((map, doc) => {
      const data = doc.data();
      const residentId = data.residentId;

      if (!map.has(residentId)) {
        map.set(residentId, []);
      }

      map.get(residentId)!.push({ id: doc.id, ...data });
      return map;
    }, new Map<string, any[]>());

    // ✅ Group credit wallets by residentId
    const invoiceMap = invoiceSnapshot.docs.reduce((map, doc) => {
      const data = doc.data();
      const residentId = data.residentId;

      if (!map.has(residentId)) {
        map.set(residentId, []);
      }

      map.get(residentId)!.push({ id: doc.id, ...data });
      return map;
    }, new Map<string, any[]>());


    // ✅ Build invoice filters dynamically
    const invoiceFilters: any[] = [where("companyId", "==", resolvedCompanyId)];


    // ✅ Fetch invoices
    const residentSnapshot = await getDocs(
      query(collection(db, DB_NAME.RESIDENT), ...invoiceFilters)
    );

    // ✅ Attach resident data efficiently
    const residents = residentSnapshot.docs
      .map((doc) => {
        const residents: any = { id: doc.id, ...doc.data() };
        const creditWallets = creditWalletsMap.get(doc.id) ?? [];
        const invoiceList = invoiceMap.get(residents.id) ?? [];
        return {
          ...residents,
          creditWallets,
          invoiceList,
        };
      })



    return residents;
  } catch (error) {
    console.error("❌ Error getting invoices:", error);
    return [];
  }
};





export const updateInvoice = async (id: string, body: any) => {
  try {
    const currentUser = auth.currentUser;

    const invoiceDocRef = doc(db, DB_NAME.INVOICE, id);
    delete body?.id;
    delete body?.residentData;

    const update = {
      user: currentUser?.uid || "system",
      date: new Date() // store actual Date, not serverTimestamp()
    };
    const totalPaid = (body?.payedInfo || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const totalCredits = (body?.creditApply || []).reduce(
      (sum: number, { amount }: any) => sum + (Number(amount) || 0),
      0
    );




    const bodyObj = {
      ...body,
      status: updatePaymentStatus(body),
      updated: [...(body?.updated || []), update]
    };





    const res = await updateDoc(invoiceDocRef, bodyObj);
    notifyEntity('Invoice', NOTIFY_TYPE.UPDATE);

    return { id, ...body };

  } catch (error) {
    console.error("Failed to update Local Authority:", error);
    notifyEntity('Invoice', NOTIFY_TYPE.ERROR);
    throw error;
  }
};


export const updateInvoiceStatus = async (
  id: string,
  status: number
) => {
  try {
    const currentUser = auth.currentUser;

    const invoiceDocRef = doc(db, DB_NAME.INVOICE, id);

    const updateEntry = {
      user: currentUser?.uid || "system",
      date: new Date(),
    };

    const payload = {
      status,
      updated: arrayUnion(updateEntry),
    };

    await updateDoc(invoiceDocRef, payload);

    notifyEntity("Invoice", NOTIFY_TYPE.UPDATE);

    return { id, status };
  } catch (error) {
    console.error("Failed to update invoice status:", error);
    notifyEntity("Invoice", NOTIFY_TYPE.ERROR);
    throw error;
  }
};

// // Helper to chunk array
// const chunkArray = <T>(arr: T[], size: number): T[][] =>
//   Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
//     arr.slice(i * size, i * size + size)
//   );

// export const updateInvoiceFNCID = async () => {
//   try {
//     const currentUser = auth.currentUser;
//     console.log("[updateInvoiceFNCID] Starting FNC ID update...");

//     const invoicesQuery = query(
//       collection(db, DB_NAME.INVOICE),
//       where("invoiceTo", "==", 5)
//     );
//     const fncQuery = query(collection(db, DB_NAME.FNM));

//     const [invoicesSnap, fncSnap] = await Promise.all([
//       getDocs(invoicesQuery),
//       getDocs(fncQuery)
//     ]);

//     console.log(`[updateInvoiceFNCID] Found ${invoicesSnap.size} invoices (invoiceTo=5), ${fncSnap.size} FNC records`);

//     const fncList = fncSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

//     let updatedCount = 0;
//     let skippedCount = 0;

//     // Process in chunks of 50
//     const chunks = chunkArray(invoicesSnap.docs, 50);
//     for (let i = 0; i < chunks.length; i++) {
//       console.log(`[updateInvoiceFNCID] Processing chunk ${i + 1}/${chunks.length}...`);

//       const batch = writeBatch(db);

//       for (const d of chunks[i]) {
//         const invoiceData = d.data();
//         const fnc = fncList.find(({ companyId }) => companyId === invoiceData.companyId);

//         if (!fnc) {
//           console.warn(`[updateInvoiceFNCID] No FNC match for invoice ${d.id} (companyId: ${invoiceData.companyId}) — skipping`);
//           skippedCount++;
//           continue;
//         }

//         batch.update(doc(db, DB_NAME.INVOICE, d.id), { fundTypeId: fnc.id });
//         updatedCount++;
//       }

//       await batch.commit();
//     }

//     console.log(`[updateInvoiceFNCID] Done. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
//     notifyEntity('Invoice', NOTIFY_TYPE.UPDATE);
//     return { success: true, updatedCount, skippedCount };

//   } catch (error) {
//     console.error("[updateInvoiceFNCID] Failed:", error);
//     notifyEntity('Invoice', NOTIFY_TYPE.ERROR);
//     throw error;
//   }
// };



export const deleteInvoiceById = async (id: string) => {

  try {
    if (!id) throw new Error("Bank detail ID is required");
    const bankDoc = doc(db, DB_NAME.INVOICE, id);
    const a = await deleteDoc(bankDoc);
    notifyEntity('Invoice', NOTIFY_TYPE.DELETE);
    return id
  } catch (error) {
    notifyEntity('Invoice', NOTIFY_TYPE.ERROR);
    throw error;
  }
}

export const downloadInvoiceById = async (
  body: any,
  fileName = "invoice.pdf"
): Promise<void> => {
  try {
    const response = await apiCall<any>({
      ...downloadInvoiceUrl.downloadInvoice,
      body,
      responseType: "blob", // 🔥 IMPORTANT
    });


    downloadPdfBlob(response, fileName);
  } catch (error) {
    notifyEntity(
      "Invoice Download",
      NOTIFY_TYPE.ERROR,
      "Failed to download the invoice. Please try again later."
    );
    console.error(error);
  }
};

export const invoiceSendSingleMail = async (body: any) => {
  try {
    const res = await apiCall({
      ...invoiceSingleMail.invoiceMail,
      body,
    });

    return res; //  return response
  } catch (error) {
    console.error(error);
    throw error; // rethrow
  }
};


export const sendBulkInvoiceMail = async (body: any) => {
  try {
    const res = await apiCall({
      ...invoiceBulkMail.invoiceMail,
      body,
    });

    return res; //  return response
  } catch (error) {
    console.error(error);
    throw error; //  rethrow
  }
};


// ── 2. Migration ─────────────────────────────────────────────────────────────

// export const migrateBalanceDue = async () => {
//   try {
//     const invoiceCollectionRef = collection(db, DB_NAME.INVOICE);
//     const snapshot = await getDocs(invoiceCollectionRef);

//     const BATCH_SIZE = 500;
//     let batch = writeBatch(db);
//     let count = 0;
//     let total = 0;

//     for (const docSnap of snapshot.docs) {
//       const body: any = docSnap.data();
//       // ✅ CHANGED: Discount totals — applied on subTotal (pre-VAT), VAT re-added to get balanceDue
//       const discounts = (body.discounts ?? []) as IInvoiceDiscount[];
//       const discTotal = discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
//       const discountedSubTotal = Math.max(body?.subTotal - discTotal, 0);
//       const discountRatio = body?.subTotal > 0 ? discountedSubTotal / body?.subTotal : 1;
//       const discountedVat = +(body?.vatTotal * discountRatio).toFixed(2);
//       const balanceDue = +(discountedSubTotal + discountedVat).toFixed(2);


//       // const balanceDue = getInvoiceOpenBalance(body);

//       batch.update(docSnap.ref, { balanceDue });
//       count++;
//       total++;

//       if (count === BATCH_SIZE) {
//         await batch.commit();
//         console.log(`✅ Committed ${total} invoices...`);
//         batch = writeBatch(db);
//         count = 0;
//       }
//     }

//     if (count > 0) {
//       await batch.commit();
//       console.log(`✅ Committed final ${count} invoices`);
//     }

//     console.log(`🎉 Migration complete. Total updated: ${total}`);
//     return { success: true, total };

//   } catch (error) {
//     console.error("❌ Migration failed:", error);
//     throw error;
//   }
// };