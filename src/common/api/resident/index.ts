// Example: Using Firestore
import { db, auth } from '../../../firebase';
import {
    collection,
    query,
    getDocs,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    updateDoc,
    where,
    arrayUnion,
    orderBy,
    limit
} from "firebase/firestore";
import { BED_STATUS, DB_NAME, ROOM_STATUS } from '../../constant';
import showNotification from '../../../components/extras/showNotification';
import { getActiveFundBlockBed, getActiveFundDetails, getUserMappedCompany, getUserMappedCompanyId, } from '../../../helpers/helpers';
import { BLOCK_BEDS_STATUS, BLOCK_BEDS_TYPE, BOOKING_TYPE, FUND_SOURCE_TYPE, PREBOOK_TYPE, RESIDENT_STATUS } from '../../constant/app';
import { updateBed } from '../bed';
import moment from 'moment';
import { getLocalAuthorityById } from '../localAuthority';
import { getICBById } from '../ibc';
import { BlockBedReportModel } from '../../model/blockBedReport';

const notifyResident = (isCreate: boolean) => {
    showNotification(
        isCreate ? 'Resident Created' : 'Resident Updated',
        isCreate
            ? 'Resident has been created successfully!'
            : 'Resident has been updated successfully!',
        'success' // type
    );
};

const notifyServerError = () => {
    showNotification(
        'Internal Server Error',
        'Something went wrong on the server. Please try again later.',
        'danger' // red error style
    );
};
export const updateRoomPrivateStatus = async (
    roomId: string,
    selectedBedId: string | null,
    bookingType: number,
    bedStatus:number,
) => {
    try {
        if (!roomId) throw new Error("Room ID is required");

        if (bookingType === BOOKING_TYPE.PRIVATE) {
            const bedRef = collection(db, DB_NAME.BED);
            //Need to optimize the query
            const q = query(bedRef, where("roomId", "==", roomId));
            const snapshot = await getDocs(q);

            const updatePromises = snapshot.docs.map(async (bedDoc) => {
                const bedId = bedDoc.id;
                const bedData = bedDoc.data();

                let newStatus;

                if (bedId === selectedBedId) {
                    newStatus = bedStatus;
                } else if (bookingType === BOOKING_TYPE.PRIVATE && selectedBedId) {
                    newStatus = BED_STATUS.PRIVATE_OCCUPIED;
                } else {
                    newStatus = BED_STATUS.AVAILABLE;
                }


                if (bedData.bedStatus !== newStatus) {
                    const bedDocRef = doc(db, DB_NAME.BED, bedId);
                    await updateDoc(bedDocRef, { bedStatus: newStatus });
                }
            });

            await Promise.all(updatePromises);
        }

        const roomDocRef = doc(db, DB_NAME.ROOMS, roomId);
        const roomStatus =
            bookingType === BOOKING_TYPE.PRIVATE && selectedBedId
                ? ROOM_STATUS.PRIVATE_OCCUPIED
                : ROOM_STATUS.ACTIVE;

        await updateDoc(roomDocRef, { status: roomStatus });
    } catch (error) {
        console.error("Failed to update private status:", error);
        throw error;
    }
};




export const createResident = async (body: any, fromResidentForm?: boolean) => {
    try {
        const companyData = getUserMappedCompanyId();
        const companyDetails = getUserMappedCompany();
        const currentYear = moment().year();
        const yy = String(currentYear).slice(-2);
        const companyId = companyData?.companyId || "unknown";
        const currentUser = auth.currentUser;
        const today = moment().format("YYYY-MM-DD"); // YYYY-MM-DD
        const activeFund = getActiveFundDetails(body?.fundDetails); // correct
        // Step 1: Prepare Firestore references
        const residentRef = collection(db, DB_NAME.RESIDENT);
        const bedRef = doc(db, DB_NAME.BED, body?.bedId);

        const isLiving = +body?.admission?.residentStatus === RESIDENT_STATUS.LIVING;


        // Logic of Code create
        const q = query(residentRef, orderBy("seq", "desc"), limit(1));
        const snapshot = await getDocs(q);


        const companyShortName = companyDetails?.shortName || companyDetails?.name?.split(' ')?.map((word: any) => word[0]?.toUpperCase())?.join('');



        let seq = 1;
        if (!snapshot.empty) {
            const last = snapshot.docs[0].data();
            seq = parseInt(last.seq || 0) + 1;
        }

        // pad to 4 digits
        const seq4 = String(seq).padStart(4, "0");

        // final invoice number
        const code = `RN-${companyShortName}${yy}${seq4}`;



        // Step 2: Build new resident object
        const newResident = {
            ...body,
            ...companyData,
            code,
            seq,
            created: {
                date: serverTimestamp(),
                user: currentUser?.uid || "system"
            },
            updated: []
        };
        // FromResidentForm or RIP/left 
        if (fromResidentForm || !isLiving) {
            const residentDoc = await addDoc(residentRef, newResident);
            notifyResident(true);
            return { id: residentDoc.id, ...newResident };
        }

        const bedStatus = +activeFund?.blockBedStatus === BLOCK_BEDS_TYPE.YES
            ? BED_STATUS.BLOCK_BED_OCCUPIED
            : BED_STATUS.OCCUPIED

        // Step 3: Update bed or room status
        if (+newResident?.admission?.bookingType === BOOKING_TYPE.PRIVATE) {
            await updateRoomPrivateStatus(newResident.roomId, newResident.bedId, +newResident?.admission?.bookingType, bedStatus);
        } else {
            await updateDoc(bedRef, {
                bedStatus: bedStatus
            });
        }




        // Step 4: Add resident to Firestore
        const residentDoc = await addDoc(residentRef, newResident);

        // Step 5: Create or skip room report
        const reportQuery = query(
            collection(db, DB_NAME.ROOM_REPORT),
            where("roomId", "==", body.roomId),
            where("date", "==", today)
        );

        const existingReportSnapshot = await getDocs(reportQuery);
        if (existingReportSnapshot.empty) {
            const reportBody = {
                date: today,
                companyId,
                roomId: body.roomId,
                roomStatus: BED_STATUS.OCCUPIED,
                beds: [{
                    bedId: body.bedId,
                    status: bedStatus || "Unknown",
                    residentId: residentDoc.id
                }],
                created: { date: serverTimestamp(), user: "system" },
                updated: []
            };
            await addDoc(collection(db, DB_NAME.ROOM_REPORT), reportBody);
        } else {
            // 🔄 Update existing report — merge bed into beds[]
            const reportDoc = existingReportSnapshot.docs[0];
            const reportData = reportDoc.data();
            const beds = reportData.beds || [];

            // Check if bed already exists in report
            const bedIndex = beds.findIndex((b: any) => b.bedId === body.bedId);

            if (bedIndex === -1) {
                // Add new bed to array
                beds.push({
                    bedId: body.bedId,
                    status: bedStatus || "Unknown",
                    residentId: residentDoc.id
                });
            } else {
                // Update existing bed status if found
                beds[bedIndex].status = bedStatus || "Unknown";
            }
            const updateLog = {
                user: currentUser?.uid || "system",
                date: new Date(), // Use actual JS Date
            };

            await updateDoc(reportDoc.ref, {
                beds,
                "updated": arrayUnion(updateLog),
            });
        }


        // Step 6: Notify success
        notifyResident(true);
        return { id: residentDoc.id, ...newResident };

    } catch (error) {
        console.error("❌ Failed to create resident:", error);
        notifyServerError();
        throw error;
    }
};

export const updateBlockBedReport = async (
    activeFund: any,
    authorityData: any
): Promise<void> => {
    const currentUser = auth.currentUser;
    if (+activeFund?.blockBedStatus !== BLOCK_BEDS_TYPE.YES) return;
    if (!authorityData) return;
    // ✅ Always use startOf('day') to avoid timezone bugs
    const today = moment().startOf('day');

    const fundSourceType =
        activeFund?.fundSource === FUND_SOURCE_TYPE.LOCAL_AUTHORITY
            ? FUND_SOURCE_TYPE.LOCAL_AUTHORITY
            : FUND_SOURCE_TYPE.CHC;

    const authorityId =
        fundSourceType === FUND_SOURCE_TYPE.LOCAL_AUTHORITY
            ? activeFund?.nameOfLa
            : activeFund?.nameIbc;

    if (!authorityId) return;

    const activeBlockBed = getActiveFundBlockBed(authorityData.blockBeds, activeFund?.eDate);
    if (!activeBlockBed) return;

    const blockBedId = activeBlockBed.id;
    const totalBlockBeds = Number(activeBlockBed.noOfBlockBed || 0);

    // ✅ SAFE date comparison using moment
    const usedBlockBeds =
        authorityData?.blockBedHistory?.filter((history: any) => {
            if (
                history.status !== BLOCK_BEDS_STATUS.ACTIVE ||
                history.blockBedId !== blockBedId ||
                !history.sDate
            ) {
                return false;
            }

            const startDate = moment(history.sDate).startOf('day');
            const endDate = history.eDate
                ? moment(history.eDate).startOf('day')
                : null;

            return (
                startDate.isSameOrBefore(today) &&
                (!endDate || endDate.isSameOrAfter(today))
            );
        }).length || 0;

    const remainingBlockBeds = Math.max(
        0,
        totalBlockBeds - usedBlockBeds
    );

    const payload = {
        companyId: authorityData.companyId,
        authorityId,
        authorityName: authorityData.name,
        authorityType: fundSourceType,
        date: today.format('YYYY-MM-DD'),
        blockBedId,
        totalBlockBeds,
        usedBlockBeds,
        remainingBlockBeds,
        perWeek: Number(activeBlockBed.perWeek || 0),
    };

    try {
        const blockBedQuery = query(
            collection(db, DB_NAME.BLOCK_BED_REPORT),
            where('authorityId', '==', authorityId),
            where('date', '==', payload.date)
        );

        const snapshot = await getDocs(blockBedQuery);

        if (snapshot.empty) {

            await addDoc(
                collection(db, DB_NAME.BLOCK_BED_REPORT),
                {
                    ...BlockBedReportModel,
                    ...payload,
                    created: {
                        date: serverTimestamp(),
                        user: currentUser?.uid || "system"
                    },
                    updated: [],
                }
            );
        } else {
            const updateLog = {
                user: currentUser?.uid || "system",
                date: new Date(), // Use actual JS Date
            };
            await updateDoc(snapshot.docs[0].ref, {
                ...payload,
                updated: arrayUnion(updateLog),
            });
        }
    } catch (error) {
        console.error('Failed to update block bed report:', error);
        throw error;
    }
};


export const getAllResident = async () => {
    try {
        const residentRef = collection(db, DB_NAME.RESIDENT);
        const snapshot = await getDocs(residentRef);

        const rooms = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return rooms;

    } catch (error) {
        console.error("Error getting beds:", error);
        notifyServerError();
        return [];
    }
};

export const getAllResidentByCompanyId = async () => {
    try {
        // ✅ Get companyId from localStorage
        const companyId = getUserMappedCompanyId()?.companyId;
        if (!companyId) {
            console.warn("No companyId found in storage");
            return [];
        }

        // ✅ Query residents by company
        const residentRef = collection(db, DB_NAME.RESIDENT);
        const residentQuery = query(residentRef, where("companyId", "==", companyId));
        const snapshot = await getDocs(residentQuery);

        const residents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        return residents;
    } catch (error) {
        console.error("Error getting residents:", error);
        notifyServerError();
        return [];
    }
};

export const getAllResidentWithInvoice = async () => {
    try {
        // ✅ Get companyId from storage
        const companyId = getUserMappedCompanyId()?.companyId;
        if (!companyId) {
            console.warn("No companyId found in storage");
            return [];
        }

        // ✅ Fetch residents by company
        const residentRef = collection(db, DB_NAME.RESIDENT);
        const residentQuery = query(residentRef, where("companyId", "==", companyId));
        const residentSnapshot = await getDocs(residentQuery);
        const creditWalletSnapshot = await getDocs(
            query(
                collection(db, DB_NAME.CREDIT_WALLET),
                where("companyId", "==", companyId)
            )
        );
        const creditWalletsMap = creditWalletSnapshot.docs.map((doc: any) => {
            return { id: doc.id, ...doc.data() };
        })

        const residents = residentSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // ✅ Fetch invoices by company
        const invoiceRef = collection(db, DB_NAME.INVOICE);
        const invoiceQuery = query(invoiceRef, where("companyId", "==", companyId));
        const invoiceSnapshot = await getDocs(invoiceQuery);

        const invoices = invoiceSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // ✅ Attach invoices to residents
        const residentsWithInvoices = residents.map(resident => ({
            ...resident,
            invoices: invoices.filter((invoice: any) => invoice.residentId === resident.id),
            creditWallets: creditWalletsMap.filter((wallet: any) => wallet.residentId === resident.id),
        }));
        return residentsWithInvoices;
    } catch (error) {
        console.error("Error getting residents with invoices:", error);
        notifyServerError();
        return [];
    }
};

export const getResidentById = async (residentId: string) => {
    try {
        // Fetch resident
        const residentRef = doc(db, DB_NAME.RESIDENT, residentId);
        const snapshot = await getDoc(residentRef);

        if (!snapshot.exists()) {
            console.warn("No resident found with ID:", residentId);
            return null;
        }

        const residentData: any = { id: snapshot.id, ...snapshot.data() };

        // --- Fetch related Room Details ---
        let roomDetails = null;
        if (residentData.roomId) {
            const roomRef = doc(db, DB_NAME.ROOMS, residentData.roomId);
            const roomSnap = await getDoc(roomRef);
            if (roomSnap.exists()) {
                roomDetails = { id: roomSnap.id, ...roomSnap.data() };
            }
        }

        // --- Fetch related Bed Details ---
        let bedDetails = null;
        if (residentData.bedId) {
            const bedRef = doc(db, DB_NAME.BED, residentData.bedId);
            const bedSnap = await getDoc(bedRef);
            if (bedSnap.exists()) {
                bedDetails = { id: bedSnap.id, ...bedSnap.data() };
            }
        };

        const creditRef = collection(db, DB_NAME.CREDIT_WALLET);
        const creditQ = query(creditRef, where("residentId", "==", residentId));

        const creditSnapshot = await getDocs(creditQ);

        const creditWallets = creditSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        return {
            ...residentData,
            roomDetails,
            bedDetails,
            creditWallets
        };
    } catch (error) {
        notifyServerError();
        console.error("Error getting resident by ID:", error);
        return null;
    }
};

// export const updateResident = async (id: string, body: any, prevResidentData: any) => {
//     try {
//         const currentUser = auth.currentUser;
//         delete body?.id;
//         delete body?.roomDetails;
//         delete body?.bedDetails;
//         delete body?.creditWallets;

//         const residentRef = doc(db, DB_NAME.RESIDENT, id);
//         const bedRef = doc(db, DB_NAME.BED, body?.bedId);

//         const updateEntry = {
//             user: currentUser?.uid || "system",
//             date: new Date()
//         };

//         const prevRoomId = prevResidentData?.roomId;
//         const currRoomId = body?.roomId;
//         const prevBedId = prevResidentData?.bedId;
//         const currBedId = body?.bedId;

//         const prevBookingType = +prevResidentData?.admission?.bookingType;
//         const newBookingType = +body?.admission?.bookingType;

//         const prevResidentStatus = +prevResidentData?.admission?.residentStatus;
//         const residentStatus = +body?.admission?.residentStatus;


//         // this only works for RIP/LEFT -> LIVING 
//         if ( prevResidentStatus !== RESIDENT_STATUS.LIVING &&
//              residentStatus === RESIDENT_STATUS.LIVING){
//             if(newBookingType === BOOKING_TYPE.SHARED)await updateBed(currBedId, { bedStatus: BED_STATUS.OCCUPIED });
//             else await updateRoomPrivateStatus(currRoomId, currBedId, BOOKING_TYPE.PRIVATE); 
//         }
//         // This only works for rooms change with status as living
//         else if (residentStatus === RESIDENT_STATUS.LIVING) {
//             // shared to shared
//             // same room , diff room
//             if (prevBookingType === BOOKING_TYPE.SHARED && newBookingType === BOOKING_TYPE.SHARED) {
//                 await updateBed(prevBedId, { bedStatus: BED_STATUS.AVAILABLE });
//                 await updateBed(currBedId, { bedStatus: BED_STATUS.OCCUPIED });
//             }

//             // private to private
//             // only diff room
//             else if (prevBookingType === BOOKING_TYPE.PRIVATE && newBookingType === BOOKING_TYPE.PRIVATE) {
//                 await updateRoomPrivateStatus(prevRoomId, null, BOOKING_TYPE.PRIVATE);  //prev
//                 await updateRoomPrivateStatus(currRoomId, currBedId, BOOKING_TYPE.PRIVATE); // curr
//             }

//             //private to shared
//             //same room , diff room
//             else if (prevBookingType === BOOKING_TYPE.PRIVATE && newBookingType === BOOKING_TYPE.SHARED) {
//                 await updateRoomPrivateStatus(prevRoomId, null, BOOKING_TYPE.PRIVATE); // prev
//                 await updateBed(currBedId, { bedStatus: BED_STATUS.OCCUPIED }); //curr
//             }

//             // shared to private
//             //same room.  , diff room 
//             else if (prevBookingType === BOOKING_TYPE.SHARED && newBookingType === BOOKING_TYPE.PRIVATE) {
//                 await updateBed(prevBedId, { bedStatus: BED_STATUS.AVAILABLE }); //prev
//                 await updateRoomPrivateStatus(currRoomId, currBedId, BOOKING_TYPE.PRIVATE); //curr
//             }
//         }
//         // this works for RIP and LEFT
//         else {
//             // For RIP/LEFT now: release only if previous status wasn't already RIP/LEFT
//             const wasAlreadyClosed =
//                 prevResidentStatus === RESIDENT_STATUS.LEFT_FROM_ROOM ||
//                 prevResidentStatus === RESIDENT_STATUS.RIP;

//             if (!wasAlreadyClosed) {
//                 if (prevBookingType === BOOKING_TYPE.SHARED) {
//                     await updateBed(prevBedId, { bedStatus: BED_STATUS.AVAILABLE });
//                 } else {
//                     await updateRoomPrivateStatus(prevRoomId, null, BOOKING_TYPE.PRIVATE);
//                 }
//             }
//         }

//         //Need to write api for prebook bed status change


//         //  Update resident info
//         await updateDoc(residentRef, {
//             ...body,
//             updated: [...(body?.updated || []), updateEntry]
//         });

//         notifyResident(false);
//         return { id, ...body };

//     } catch (error) {
//         notifyServerError();
//         console.error("❌ Failed to update resident:", error);
//         throw error;
//     }
// };


export const updateResident = async (id: string, body: any, prevResidentData: any) => {
    try {
        const currentUser = auth.currentUser;

        delete body?.id;
        delete body?.roomDetails;
        delete body?.bedDetails;
        delete body?.creditWallets;

        const residentRef = doc(db, DB_NAME.RESIDENT, id);

        const updateEntry = {
            user: currentUser?.uid || "system",
            date: new Date()
        };

        const prevRoomId = prevResidentData?.roomId;
        const currRoomId = body?.roomId;
        const prevBedId = prevResidentData?.bedId;
        const currBedId = body?.bedId;

        const prevBookingType = +prevResidentData?.admission?.bookingType;
        const newBookingType = +body?.admission?.bookingType;

        const prevResidentStatus = +prevResidentData?.admission?.residentStatus;
        const residentStatus = +body?.admission?.residentStatus;

        const isLiving = residentStatus === RESIDENT_STATUS.LIVING;
        const wasLiving = prevResidentStatus === RESIDENT_STATUS.LIVING;

        const locationChanged =
            prevRoomId !== currRoomId || prevBedId !== currBedId;

        const bookingChanged =
            prevBookingType !== newBookingType;

        const currActiveFund = getActiveFundDetails(body?.fundDetails);
        const bedStatus = +currActiveFund?.blockBedStatus === BLOCK_BEDS_TYPE.YES
            ? BED_STATUS.BLOCK_BED_OCCUPIED : BED_STATUS.OCCUPIED;
        /* =====================================================
           CASE 1: RIP / LEFT  →  LIVING
           ===================================================== */
        if (!wasLiving && isLiving) {
            if (newBookingType === BOOKING_TYPE.SHARED) {
                if (currBedId) {
                    await updateBed(currBedId, { bedStatus: bedStatus });
                }
            } else {
                await updateRoomPrivateStatus(
                    currRoomId,
                    currBedId,
                    BOOKING_TYPE.PRIVATE,
                    bedStatus
                );
            }
        }

        /* =====================================================
           CASE 2: LIVING → LIVING (ONLY if something changed)
           ===================================================== */
        else if (isLiving && (locationChanged || bookingChanged)) {

            // 🔻 Release previous occupancy
            if (prevBookingType === BOOKING_TYPE.SHARED) {
                if (prevBedId) {
                    await updateBed(prevBedId, { bedStatus: BED_STATUS.AVAILABLE });
                }
            } else {
                await updateRoomPrivateStatus(
                    prevRoomId,
                    null,
                    BOOKING_TYPE.PRIVATE,
                    bedStatus
                );
            }

            // 🔺 Assign new occupancy
            if (newBookingType === BOOKING_TYPE.SHARED) {
                if (currBedId) {
                    await updateBed(currBedId, { bedStatus: bedStatus });
                }
            } else {
                await updateRoomPrivateStatus(
                    currRoomId,
                    currBedId,
                    BOOKING_TYPE.PRIVATE,
                    bedStatus
                );
            }
        }

        /* =====================================================
           CASE 3: LIVING → RIP / LEFT
           ===================================================== */
        else if (
            wasLiving &&
            (residentStatus === RESIDENT_STATUS.RIP ||
                residentStatus === RESIDENT_STATUS.LEFT_FROM_ROOM)
        ) {
            if (prevBookingType === BOOKING_TYPE.SHARED) {
                if (prevBedId) {
                    await updateBed(prevBedId, { bedStatus: BED_STATUS.AVAILABLE });
                }
            } else {
                await updateRoomPrivateStatus(
                    prevRoomId,
                    null,
                    BOOKING_TYPE.PRIVATE,
                    bedStatus
                );
            }
        }

        /* =====================================================
           UPDATE RESIDENT DOCUMENT
           ===================================================== */
        await updateDoc(residentRef, {
            ...body,
            updated: [...(body?.updated || []), updateEntry]
        });

        notifyResident(false);
        return { id, ...body };

    } catch (error) {
        notifyServerError();
        console.error("❌ Failed to update resident:", error);
        throw error;
    }
};





export const updateResidentFields = async (
    residentId: string,
    residentData: any
) => {
    try {
        if (!residentId) throw new Error("Resident ID is required");

        const currentUser = auth.currentUser;
        const residentRef = doc(db, DB_NAME.RESIDENT, residentId);

        // Prevent accidental overwrite of ID
        delete residentData.id;

        const updateEntry = {
            user: currentUser?.uid || "system",
            date: new Date(),
        };

        await updateDoc(residentRef, {
            ...residentData,
            updated: arrayUnion(updateEntry),
        });

        return { id: residentId, ...residentData };

    } catch (error) {
        notifyServerError();
        console.error("❌ Failed to update resident:", error);
        throw error;
    }
};


// import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

// export const updateRoomHistoryEDate = async () => {
//     const companyId = getUserMappedCompanyId()?.companyId;

//     const q = query(
//         collection(db, DB_NAME.RESIDENT),
//         // where("companyId", "==", companyId),
//         where("admission.residentStatus", "in", [2, 3])
//     );

//     const snapshot = await getDocs(q);

//     const updates = snapshot.docs.reduce<Promise<void>[]>((acc, docSnap) => {
//         const { residentName, code, admission, roomHistory = [] } = docSnap.data();
//         const dischargeDate = admission?.dateDischargeAndRip;

//         if (!dischargeDate || !roomHistory.length) {
//             return acc;
//         }

//         // Get the entry with max eDate
//         const maxHistory = roomHistory.reduce((max: any, curr: any) => {
//             return curr.eDate > max.eDate ? curr : max;
//         });

//         if (maxHistory.eDate === dischargeDate) {
//             return acc;
//         }


//         // Update only the max eDate entry
//         const updatedRoomHistory = roomHistory.map((history: any) =>
//             history.id === maxHistory.id
//                 ? { ...history, eDate: dischargeDate }
//                 : history
//         );

//         acc.push(
//             updateDoc(doc(db, DB_NAME.RESIDENT, docSnap.id), {
//                 roomHistory: updatedRoomHistory,
//             })
//         );

//         return acc;
//     }, []);

//     await Promise.all(updates);
// };


export const updateRoomHistoryEDate = async () => {
    const companyId = getUserMappedCompanyId()?.companyId;

    const q = query(
        collection(db, DB_NAME.RESIDENT),
        // where("companyId", "==", companyId),
        // where("admission.residentStatus", "in", [2, 3])
    );

    const snapshot = await getDocs(q);

    const updates = snapshot.docs.reduce<Promise<void>[]>((acc, docSnap) => {
        const { residentName, code, admission, roomHistory = [] } = docSnap.data();
        const admissionDate = admission?.admissionDate;

        if (!admissionDate || !roomHistory.length) {
            return acc;
        }

        // Get min sDate entry (first history = admission)
        const minHistory = roomHistory.reduce((min: any, curr: any) => {
            return curr.sDate < min.sDate ? curr : min;
        });

        const updatedRoomHistory = roomHistory.map((history: any) => {
            if (history.id === minHistory.id) {
                return { ...history, sDate: admissionDate };
            }
            return history;
        });


        acc.push(
            updateDoc(doc(db, DB_NAME.RESIDENT, docSnap.id), {
                roomHistory: updatedRoomHistory,
            })
        );

        return acc;
    }, []);

    await Promise.all(updates);
};