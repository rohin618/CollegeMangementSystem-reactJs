
import { db, auth } from '../../../firebase';
import {
  collection,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
  where,
  updateDoc,
  doc
} from "firebase/firestore";
import { DB_NAME, INVOICE_STATUS, NOTIFY_TYPE } from '../../constant';
import { getInvoicePaymentSummary, getUserMappedCompanyId, notifyEntity, } from '../../../helpers/helpers';
import { getAllResidentByCompanyId } from '../resident';
import { getAllInvoicesList } from '../invoice';
import { IResidentModel } from '../../interface';
export const createBed = async (body: any) => {
  try {
    const currentUser = auth.currentUser;

    const bedRef = collection(db, DB_NAME.BED);
    // Step 2: Define the room model
    const newRoom = {
      ...body,
      ...getUserMappedCompanyId(),
      created: {
        date: serverTimestamp(),
        user: currentUser?.uid || "system"
      },
      updated: []
    };

    // Step 3: Add to Firestore
    const docRef = await addDoc(bedRef, newRoom);
    notifyEntity('Bed', NOTIFY_TYPE.CREATE)
    return { id: docRef.id, ...newRoom };

  } catch (error) {
    notifyEntity('Bed', NOTIFY_TYPE.ERROR)
    console.error("Failed to create room:", error);
  }
};


export const updateBed = async (id: string, body: any, isDelete?: boolean) => {
  try {
    const currentUser = auth.currentUser;

    const roomDocRef = doc(db, DB_NAME.BED, id);
    delete body?.id;
    delete body?.history;


    const update = {
      user: currentUser?.uid || "system",
      date: new Date() // store actual Date, not serverTimestamp()
    };

    const bodyObj = {
      ...body,
      updated: [...(body?.updated || []), update]
    };

    await updateDoc(roomDocRef, bodyObj);
    if (isDelete) {
      notifyEntity('Bed', NOTIFY_TYPE.DELETE)
    } else {
      notifyEntity('Bed', NOTIFY_TYPE.UPDATE)
    }

    return { ...bodyObj, id };
  } catch (error) {
    notifyEntity('Bed', NOTIFY_TYPE.ERROR)
    console.error("Failed to update Local Authority:", error);
    throw error;
  }
}

export const getAllBeds = async () => {
  try {
    const bedRef = collection(db, DB_NAME.BED);
    const snapshot = await getDocs(bedRef);

    const rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return rooms;

  } catch (error) {
    console.error("Error getting beds:", error);
    return [];
  }
};


// export const getBedsByRoomId = async (roomId: string) => {
//   try {
//     if (!roomId) throw new Error("Room ID is required");

//     const bedRef = collection(db, DB_NAME.BED);

//     // Filter where 'roomId' field equals the given roomId
//     const q = query(bedRef, where("roomId", "==", roomId));

//     const snapshot = await getDocs(q);

//     const beds = snapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     }));

//     const residentList =await  getAllResidentByCompanyId()


//     return beds;

//   } catch (error: any) {
//     console.error("Error getting beds by roomId:", error.message);
//     return [];
//   }
// };

// export const getBedsByRoomId = async (roomId: string) => {
//   try {
//     if (!roomId) throw new Error("Room ID is required");

//     /* ---------- 1. Fetch Beds ---------- */
//     const bedQuery = query(
//       collection(db, DB_NAME.BED),
//       where("roomId", "==", roomId)
//     );

//     const bedSnapshot = await getDocs(bedQuery);

//     if (bedSnapshot.empty) return [];

//     const beds = bedSnapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     }));

//     /* ---------- 2. Fetch Residents ---------- */
//     const residents = await getAllResidentByCompanyId();
//     if (!residents?.length) return beds.map(b => ({ ...b, history: [] }));

//     /* ---------- 3. Build Bed History Map (O(n)) ---------- */
//     const bedHistoryMap = residents.reduce(
//       (acc: Record<string, any[]>, resident: any) => {

//         if (!resident.roomHistory?.length) return acc;

//         const { id, personal } = resident;

//         resident.roomHistory.forEach((h: any) => {
//           if (h.roomId !== roomId) return;

//           const key = h.bedId;

//           if (!acc[key]) acc[key] = [];

//           acc[key].push({
//             residentId: id,
//             residentName: personal?.name,
//             gender: personal?.gender,
//             bookingType: h.bookingType,
//             sDate: h.sDate,
//             eDate: h.eDate,
//             status: h.status,
//             note: h.note
//           });
//         });

//         return acc;
//       },
//       {}
//     );

//     /* ---------- 4. Attach History to Beds ---------- */
//     return beds.map((bed: any) => ({
//       ...bed,
//       history: bedHistoryMap[bed.id] || []
//     }));

//   } catch (error: any) {
//     console.error("getBedsByRoomId error:", error.message);
//     return [];
//   }
// };

const resolveEndDate = (date?: string | null) =>
  date ? new Date(date) : new Date();

const isOverlapping = (
  hStart: string,
  hEnd: string | null | undefined,
  iStart: string,
  iEnd: string
) => {
  const historyStart = new Date(hStart);
  const historyEnd = resolveEndDate(hEnd);

  const invoiceStart = new Date(iStart);
  const invoiceEnd = new Date(iEnd);

  return historyStart <= invoiceEnd && invoiceStart <= historyEnd;
};


export const getBedsByRoomId = async (roomId: string) => {
  try {
    if (!roomId) throw new Error("Room ID is required");

    /* ---------- 1. Fetch Beds ---------- */
    const bedSnapshot = await getDocs(
      query(collection(db, DB_NAME.BED), where("roomId", "==", roomId))
    );

    if (bedSnapshot.empty) return [];

    const beds = bedSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    /* ---------- 2. Fetch Residents & Invoices ---------- */
    const residents = await getAllResidentByCompanyId();
    const invoices = await getAllInvoicesList();

    /* ---------- 3. Build Bed → History Map ---------- */
    const bedHistoryMap: Record<string, any[]> = {};

    residents.forEach((resident: any) => {
      resident.roomHistory?.forEach((history: any) => {
        if (history.roomId !== roomId) return;

        const bedId = history.bedId;
        if (!bedHistoryMap[bedId]) bedHistoryMap[bedId] = [];

        /* ---------- 4. Match Invoices ---------- */
        const matchedInvoices = invoices.filter(inv =>
          inv.roomId === history.roomId &&
          inv.bedId === history.bedId &&
          isOverlapping(
            history.sDate,
            history.eDate,
            inv.sDate,
            inv.eDate
          )
        );

        /* ---------- 5. Calculate Outstanding FOR THIS HISTORY ---------- */
        const outstandingAmount = matchedInvoices.reduce(
          (sum, inv) => sum + getInvoicePaymentSummary(inv).balanceDue,
          0
        );

        bedHistoryMap[bedId].push({
          residentId: resident.id,
          bookingType: history.bookingType,
          status: history.status,
          sDate: history.sDate,
          eDate: history.eDate ?? null,
          invoices: matchedInvoices.map(inv => ({
            id: inv.id,
            code: inv.code,
            status: inv.status,
            invoiceDate: inv.invoiceDate,
            sDate: inv.sDate,
            eDate: inv.eDate,
            // totalPrice: inv.totalPrice,
            ...getInvoicePaymentSummary(inv)
          })),

          outstandingAmount: Number(outstandingAmount.toFixed(2)),
          residentData: { ...resident },

        });
      });
    });

    /* ---------- 6. Attach History to Beds ---------- */
    return beds.map(bed => ({
      ...bed,
      history: bedHistoryMap[bed.id] || []
    }));

  } catch (error: any) {
    console.error("getBedsByRoomId error:", error.message);
    return [];
  }
};



export const getAllBedsByRoomId = async (roomId: string) => {
  try {
    const bedRef = collection(db, DB_NAME.BED);
    const q = query(bedRef, where("roomId", "==", roomId));
    const snapshot = await getDocs(q);

    const beds = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return beds;

  } catch (error) {
    console.error(`Error getting beds for room ${roomId}:`, error);
    return [];
  }
};