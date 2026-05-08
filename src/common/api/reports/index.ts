// import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
// import { db, } from '../../../firebase';
// import { DB_NAME, BED_STATUS, ROOM_STATUS, RESIDENT_STATUS } from '../../constant';
// import { getUserMappedCompanyId } from '../../../helpers/helpers';

// // ----------------------------------------------------------------
// // Constants
// // ----------------------------------------------------------------
// const ACTIVE_STATUS = 1;

// // ----------------------------------------------------------------
// // Types
// // ----------------------------------------------------------------
// export interface RoomReportQuery {
//     sDate?: string;
//     eDate?: string;
// }

// interface DateStatus {
//     date: string;
//     status: number;
// }

// interface OccupancyEntry {
//     residentId: string;
//     residentData: any | null;
//     data: DateStatus[];
// }

// interface BedOutput {
//     bedId: string;
//     bedName: string;
//     bedMasterStatus: number;
//     pricePeriods: any[];
//     occupancies: OccupancyEntry[];
// }

// interface RoomOutput {
//     roomId: string;
//     roomNumber: string;
//     floor: string;
//     description: string;
//     roomMasterStatus: number;
//     roomStatus: number;
//     beds: BedOutput[];
// }

// interface BlockBedOutput {
//     authorityId: string;
//     authorityName: string;
//     authorityType: "LA" | "ICB";
//     blockBedId: string;
//     totalBlockBeds: number;
//     usedBlockBeds: number;
//     remainingBlockBeds: number;
//     perWeek: number;
// }

// export interface LiveReportOutput {
//     roomReport: RoomOutput[];
//     blockBedReports: BlockBedOutput[];
// }

// // ----------------------------------------------------------------
// // Helper: Calculate Room Status
// // ----------------------------------------------------------------
// const calculateRoomStatus = (beds: any[]): number => {
//     if (!beds.length) return BED_STATUS.AVAILABLE;

//     let hasOccupied = false;
//     let hasBlock = false;

//     for (const bed of beds) {
//         switch (bed.status ?? bed.bedStatus) {
//             case BED_STATUS.PRIVATE_OCCUPIED:
//                 return BED_STATUS.PRIVATE_OCCUPIED;
//             case BED_STATUS.OCCUPIED:
//                 hasOccupied = true;
//                 break;
//             case BED_STATUS.BLOCK_BED_OCCUPIED:
//                 hasBlock = true;
//                 break;
//             default:
//                 break;
//         }
//     }

//     if (hasOccupied) return BED_STATUS.OCCUPIED;
//     if (hasBlock) return BED_STATUS.BLOCK_BED_OCCUPIED;
//     return BED_STATUS.AVAILABLE;
// };

// // ----------------------------------------------------------------
// // Helper: Generate Date Range Array
// // ----------------------------------------------------------------
// const getDateRange = (startDate: string, endDate: string): string[] => {
//     const dates: string[] = [];
//     const current = new Date(startDate);
//     const end = new Date(endDate);

//     while (current <= end) {
//         dates.push(current.toISOString().split("T")[0]);
//         current.setDate(current.getDate() + 1);
//     }

//     return dates;
// };

// // ----------------------------------------------------------------
// // Helper: Filter dates by sDate / eDate query range
// // ----------------------------------------------------------------
// const filterByDateRange = (
//     dates: DateStatus[],
//     sDate?: string,
//     eDate?: string
// ): DateStatus[] => {
//     if (!sDate && !eDate) return dates;

//     return dates.filter(({ date }) => {
//         if (sDate && date < sDate) return false;
//         if (eDate && date > eDate) return false;
//         return true;
//     });
// };

// // ----------------------------------------------------------------
// // Helper: Build Live Block Bed Reports
// // ----------------------------------------------------------------
// // const buildBlockBedReport = async (companyId: string): Promise<BlockBedOutput[]> => {
// //     const today = new Date().toISOString().split("T")[0];

// //     const [laSnap, icbSnap] = await Promise.all([
// //         getDocs(query(
// //             collection(db, DB_NAME.LOCAL_AUTHORITY),
// //             where("companyId", "==", companyId)
// //         )),
// //         getDocs(query(
// //             collection(db, DB_NAME.ICB),
// //             where("companyId", "==", companyId)
// //         ))
// //     ]);

// //     const blockBedReports: BlockBedOutput[] = [];

// //     const processAuthority = (docs: any[], type: "LA" | "ICB") => {
// //         for (const doc of docs) {
// //             const authority = { id: doc.id, ...doc.data() };
// //             const blockBeds = authority.blockBeds || [];
// //             const blockBedHistory = authority.blockBedHistory || [];

// //             for (const block of blockBeds) {
// //                 const totalBlockBeds = Number(block.noOfBlockBed || 0);

// //                 const isActiveBlock =
// //                     block.status === ACTIVE_STATUS &&
// //                     totalBlockBeds > 0 &&
// //                     block.sDate &&
// //                     block.sDate <= today &&
// //                     (!block.eDate || block.eDate >= today);

// //                 if (!isActiveBlock) continue;

// //                 const usedBlockBeds = blockBedHistory.filter((h: any) =>
// //                     h.status === ACTIVE_STATUS &&
// //                     h.blockBedId === block.id &&
// //                     h.sDate &&
// //                     h.sDate <= today &&
// //                     (!h.eDate || h.eDate >= today)
// //                 ).length;

// //                 blockBedReports.push({
// //                     authorityId: authority.id,
// //                     authorityName: authority.name,
// //                     authorityType: type,
// //                     blockBedId: block.id,
// //                     totalBlockBeds,
// //                     usedBlockBeds,
// //                     remainingBlockBeds: totalBlockBeds - usedBlockBeds,
// //                     perWeek: Number(block.perWeek || 0)
// //                 });
// //             }
// //         }
// //     };

// //     processAuthority(laSnap.docs, "LA");
// //     processAuthority(icbSnap.docs, "ICB");

// //     return blockBedReports;
// // };
// const buildBlockBedReport = async (companyId: string): Promise<BlockBedOutput[]> => {
//     const today = new Date().toISOString().split("T")[0];

//     const [laSnap, icbSnap] = await Promise.all([
//         getDocs(query(
//             collection(db, DB_NAME.LOCAL_AUTHORITY),
//             where("companyId", "==", companyId)
//         )),
//         getDocs(query(
//             collection(db, DB_NAME.ICB),
//             where("companyId", "==", companyId)
//         ))
//     ]);

//     const blockBedReports: BlockBedOutput[] = [];

//     const processAuthority = (docs: any[], type: "LA" | "ICB") => {
//         for (const doc of docs) {
//             const authority = { id: doc.id, ...doc.data() };
//             const blockBeds: any[] = authority.blockBeds || [];
//             const blockBedHistory: any[] = authority.blockBedHistory || [];

//             for (const block of blockBeds) {
//                 const totalBlockBeds = Number(block.noOfBlockBed || 0);

//                 // ✅ Block is active if:
//                 // - status is ACTIVE
//                 // - has beds > 0
//                 // - today is within block's sDate → eDate window
//                 const isActiveBlock =
//                     block.status === ACTIVE_STATUS &&
//                     totalBlockBeds > 0 &&
//                     block.sDate &&
//                     block.sDate <= today &&
//                     (!block.eDate || block.eDate >= today);

//                 if (!isActiveBlock) continue;

//                 // ✅ Count used beds from blockBedHistory:
//                 // - status is ACTIVE
//                 // - blockBedId matches this block
//                 // - history sDate is within block's sDate → eDate window
//                 // - history eDate is empty (still active) or >= today
//                 const usedBlockBeds = blockBedHistory.filter((history: any) => {
//                     return (
//                         history.status === ACTIVE_STATUS &&
//                         history.blockBedId === block.id &&
//                         history.sDate &&
//                         history.sDate >= block.sDate &&               // within block window start
//                         (!block.eDate || history.sDate <= block.eDate) && // within block window end
//                         history.sDate <= today &&                     // resident has started
//                         (!history.eDate || history.eDate >= today)    // resident still active
//                     );
//                 }).length;

//                 blockBedReports.push({
//                     authorityId: authority.id,
//                     authorityName: authority.name,
//                     authorityType: type,
//                     blockBedId: block.id,
//                     totalBlockBeds,
//                     usedBlockBeds,
//                     remainingBlockBeds: totalBlockBeds - usedBlockBeds,
//                     perWeek: Number(block.perWeek || 0)
//                 });
//             }
//         }
//     };

//     processAuthority(laSnap.docs, "LA");
//     processAuthority(icbSnap.docs, "ICB");

//     return blockBedReports;
// };
// // ----------------------------------------------------------------
// // Helper: Build Live Room Report
// // ----------------------------------------------------------------
// const buildRoomReport = (
//     rooms: any[],
//     beds: any[],
//     residents: any[],
//     sDate?: string,
//     eDate?: string
// ): RoomOutput[] => {
//     const today = new Date().toISOString().split("T")[0];
//     const residentMap = new Map<string, any>(residents.map(r => [r.id, r]));
//     const result: RoomOutput[] = [];

//     for (const room of rooms) {
//         const roomBeds = beds.filter(b => b.roomId === room.id);

//         if (!roomBeds.length) {
//             result.push({
//                 roomId: room.id,
//                 roomNumber: room.roomNumber,
//                 floor: room.floor,
//                 description: room.description,
//                 roomMasterStatus: room.status,
//                 roomStatus: calculateRoomStatus([]),
//                 beds: []
//             });
//             continue;
//         }

//         const bedOutputs: (BedOutput & { _hasResident?: boolean })[] = [];

//         for (const bed of roomBeds) {
//             const occupancies: OccupancyEntry[] = [];

//             // Search ALL residents' roomHistory for entries matching this room + bed
//             for (const resident of residents) {
//                 const history: any[] = resident.roomHistory || [];

//                 const relevantHistory = history.filter(
//                     (h: any) => h.roomId === room.id && h.bedId === bed.id
//                 );

//                 if (!relevantHistory.length) continue;

//                 relevantHistory.sort((a: any, b: any) =>
//                     (a.sDate || "").localeCompare(b.sDate || "")
//                 );

//                 for (const histEntry of relevantHistory) {
//                     const startDate = histEntry.sDate || today;
//                     const endDate = histEntry.eDate || today;

//                     if (startDate > endDate) continue;

//                     const fullDateRange: DateStatus[] = getDateRange(startDate, endDate)
//                         .map(date => ({
//                             date,
//                             status: bed.bedStatus ?? BED_STATUS.AVAILABLE
//                         }));

//                     const filteredData = filterByDateRange(fullDateRange, sDate, eDate);
//                     if (!filteredData.length) continue;

//                     occupancies.push({
//                         residentId: resident.id,
//                         residentData: residentMap.get(resident.id) ?? null,
//                         data: filteredData
//                     });
//                 }
//             }

//             // No history matched → empty bed
//             if (!occupancies.length) {
//                 const emptyData: DateStatus[] = [
//                     { date: today, status: bed.bedStatus ?? BED_STATUS.AVAILABLE }
//                 ];
//                 const filteredData = filterByDateRange(emptyData, sDate, eDate);
//                 occupancies.push({
//                     residentId: "",
//                     residentData: null,
//                     data: filteredData.length ? filteredData : emptyData
//                 });
//             }

//             const hasResident = occupancies.some(o => !!o.residentId);

//             bedOutputs.push({
//                 bedId: bed.id,
//                 bedName: bed.bedName ?? "",
//                 bedMasterStatus: bed.bedStatus ?? BED_STATUS.AVAILABLE,
//                 pricePeriods: bed.pricePeriods ?? [],
//                 occupancies,
//                 _hasResident: hasResident
//             });
//         }

//         bedOutputs.sort((a, b) => {
//             if (a._hasResident !== b._hasResident) return a._hasResident ? -1 : 1;
//             return (a.bedName ?? "").localeCompare(b.bedName ?? "");
//         });

//         for (const bed of bedOutputs) delete bed._hasResident;

//         const roomStatus = calculateRoomStatus(
//             roomBeds.map(b => ({ status: b.bedStatus }))
//         );

//         result.push({
//             roomId: room.id,
//             roomNumber: room.roomNumber,
//             floor: room.floor,
//             description: room.description,
//             roomMasterStatus: room.status,
//             roomStatus,
//             beds: bedOutputs
//         });
//     }

//     result.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
//     return result;
// };

// // ----------------------------------------------------------------
// // Main: Get Live Room Report + Block Bed Report
// // ----------------------------------------------------------------
// export const getRoomReportLive = async (
//     queryParams?: RoomReportQuery
// ): Promise<LiveReportOutput> => {
//     try {
//         const { sDate, eDate } = queryParams || {};

//         const resolvedCompanyId = getUserMappedCompanyId()?.companyId;

//         if (!resolvedCompanyId) {
//             console.warn("⚠️ No companyId found");
//             return { roomReport: [], blockBedReports: [] };
//         }

//         // ── Fetch rooms, beds, residents in parallel ──────────────────────
//         const [roomsSnap, bedsSnap, residentsSnap] = await Promise.all([

//             // ✅ FIX: Added companyId filter on rooms.
//             // Previously fetching ALL rooms across ALL companies (274 rooms)
//             // caused wrong Total Rooms count in the report.
//             // Firestore requires the inequality field (status) to be ordered first,
//             // so we keep orderBy("status") before orderBy("roomNumber").
//             getDocs(query(
//                 collection(db, DB_NAME.ROOMS),
//                 where("companyId", "==", resolvedCompanyId),  // ✅ NEW
//                 where("status", "!=", ROOM_STATUS.DELETE),
//                 orderBy("status"),
//                 orderBy("roomNumber")
//             )),

//             // Beds: already filtered by companyId
//             getDocs(query(
//                 collection(db, DB_NAME.BED),
//                 where("companyId", "==", resolvedCompanyId)
//             )),

//             // Residents: LIVING only, filtered by companyId
//             getDocs(query(
//                 collection(db, DB_NAME.RESIDENT),
//                 where("companyId", "==", resolvedCompanyId),
//                 where("admission.residentStatus", "==", RESIDENT_STATUS.LIVING)
//             ))
//         ]);

//         const rooms = roomsSnap.docs
//             .map(doc => ({ id: doc.id, ...doc.data() })) as any[];

//         const beds = bedsSnap.docs
//             .map(doc => ({ id: doc.id, ...doc.data() })) as any[];

//         const residents = residentsSnap.docs
//             .map(doc => ({ id: doc.id, ...doc.data() })) as any[];

//         const [blockBedReports] = await Promise.all([
//             buildBlockBedReport(resolvedCompanyId)
//         ]);

//         const roomReport = buildRoomReport(rooms, beds, residents, sDate, eDate);

//         return { roomReport, blockBedReports };

//     } catch (error) {
//         console.error("❌ Error getting live report:", error);
//         return { roomReport: [], blockBedReports: [] };
//     }
// };


import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from '../../../firebase';
import { DB_NAME, BED_STATUS, ROOM_STATUS, RESIDENT_STATUS } from '../../constant';
import { getUserMappedCompanyId } from '../../../helpers/helpers';

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------
const ACTIVE_STATUS = 1;

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
export interface RoomReportQuery {
    sDate?: string;
    eDate?: string;
}

interface DateStatus {
    date: string;
    status: number;
}

interface OccupancyEntry {
    residentId: string;
    residentData: any | null;
    data: DateStatus[];
}

interface BedOutput {
    bedId: string;
    bedName: string;
    bedMasterStatus: number;
    pricePeriods: any[];
    occupancies: OccupancyEntry[];
}

interface RoomOutput {
    roomId: string;
    roomNumber: string;
    floor: string;
    description: string;
    roomMasterStatus: number;
    roomStatus: number;
    beds: BedOutput[];
}

interface BlockBedOutput {
    date: string;               // ✅ NEW - per date record
    authorityId: string;
    authorityName: string;
    authorityType: "LA" | "ICB";
    blockBedId: string;
    totalBlockBeds: number;
    usedBlockBeds: number;
    remainingBlockBeds: number;
    perWeek: number;
}
export interface LiveReportOutput {
    roomReport: RoomOutput[];
    blockBedReports: BlockBedOutput[];
}

// ----------------------------------------------------------------
// Helper: Calculate Room Status
// ----------------------------------------------------------------
const calculateRoomStatus = (beds: any[]): number => {
    if (!beds.length) return BED_STATUS.AVAILABLE;

    let hasOccupied = false;
    let hasBlock = false;

    for (const bed of beds) {
        switch (bed.status ?? bed.bedStatus) {
            case BED_STATUS.PRIVATE_OCCUPIED:
                return BED_STATUS.PRIVATE_OCCUPIED;
            case BED_STATUS.OCCUPIED:
                hasOccupied = true;
                break;
            case BED_STATUS.BLOCK_BED_OCCUPIED:
                hasBlock = true;
                break;
            default:
                break;
        }
    }

    if (hasOccupied) return BED_STATUS.OCCUPIED;
    if (hasBlock) return BED_STATUS.BLOCK_BED_OCCUPIED;
    return BED_STATUS.AVAILABLE;
};

// ----------------------------------------------------------------
// Helper: Generate Date Range Array
// ----------------------------------------------------------------
const getDateRange = (startDate: string, endDate: string): string[] => {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
        dates.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
};
// ----------------------------------------------------------------
// Helper: Filter dates by sDate / eDate query range
// ----------------------------------------------------------------
const filterByDateRange = (
    dates: DateStatus[],
    sDate?: string,
    eDate?: string
): DateStatus[] => {
    if (!sDate && !eDate) return dates;

    return dates.filter(({ date }) => {
        if (sDate && date < sDate) return false;
        if (eDate && date > eDate) return false;
        return true;
    });
};

// ----------------------------------------------------------------
// Helper: Build Live Block Bed Report (no Firestore save)
// ----------------------------------------------------------------
// ----------------------------------------------------------------
// Helper: Get all dates in range
// ----------------------------------------------------------------


// ----------------------------------------------------------------
// Helper: Build Block Bed Report with DATE RANGE support
// ----------------------------------------------------------------
const buildBlockBedReport = async (
    companyId: string,
    sDate?: string,
    eDate?: string
): Promise<BlockBedOutput[]> => {
    const today = new Date().toISOString().split("T")[0];
    const reportStart = sDate || today;
    const reportEnd = eDate || today;

    const dateRange = getDateRange(reportStart, reportEnd);

    const [laSnap, icbSnap] = await Promise.all([
        getDocs(query(
            collection(db, DB_NAME.LOCAL_AUTHORITY),
            where("companyId", "==", companyId)
        )),
        getDocs(query(
            collection(db, DB_NAME.ICB),
            where("companyId", "==", companyId)
        ))
    ]);

    // ✅ Return flat per-date records — one entry per authority per date
    const blockBedReports: BlockBedOutput[] = [];

    const splitHistoryAcrossBlocks = (
        history: any,
        blockBeds: any[]
    ): { blockBedId: string; sDate: string; eDate: string }[] => {
        const result: { blockBedId: string; sDate: string; eDate: string }[] = [];

        const sortedBlocks = [...blockBeds]
            .filter((b: any) => Number(b.noOfBlockBed || 0) > 0 && b.sDate)
            .sort((a: any, b: any) => a.sDate.localeCompare(b.sDate));

        const residentStart = history.sDate;
        const residentEnd = history.eDate && history.eDate !== ""
            ? history.eDate
            : "9999-12-31";

        for (const block of sortedBlocks) {
            const blockStart = block.sDate;
            const blockEnd = block.eDate && block.eDate !== ""
                ? block.eDate
                : "9999-12-31";

            const overlapStart = residentStart > blockStart ? residentStart : blockStart;
            const overlapEnd = residentEnd < blockEnd ? residentEnd : blockEnd;

            if (overlapStart <= overlapEnd) {
                result.push({
                    blockBedId: block.id,
                    sDate: overlapStart,
                    eDate: overlapEnd === "9999-12-31" ? "" : overlapEnd
                });
            }
        }
        return result;
    };

    const processAuthority = (docs: any[], type: "LA" | "ICB") => {
        for (const doc of docs) {
            const authority = { id: doc.id, ...doc.data() };
            const blockBeds: any[] = authority.blockBeds || [];
            const blockBedHistory: any[] = authority.blockBedHistory || [];

            // ✅ For each date in range, create one record per authority
            for (const date of dateRange) {

                // Find which block is active on THIS date
                const activeBlock = blockBeds.find((block: any) => {
                    const totalBeds = Number(block.noOfBlockBed || 0);
                    return (
                        block.status === ACTIVE_STATUS &&
                        totalBeds > 0 &&
                        block.sDate &&
                        block.sDate <= date &&
                        (!block.eDate || block.eDate === "" || block.eDate >= date)
                    );
                });

                if (!activeBlock) continue;

                const totalBlockBeds = Number(activeBlock.noOfBlockBed || 0);

                // ✅ Count residents using this block ON THIS DATE
                let usedBlockBeds = 0;

                for (const history of blockBedHistory) {
                    // if (
                    //     history.status !== ACTIVE_STATUS ||
                    //     !history.sDate ||
                    //     history.sDate > date ||
                    //     (history.eDate && history.eDate !== "" && history.eDate < date)
                    // ) continue;

                    // Split history across blocks to handle old blockBedId
                    const splitEntries = splitHistoryAcrossBlocks(history, blockBeds);

                    const activeOnDate = splitEntries.some((entry) =>
                        entry.blockBedId === activeBlock.id &&
                        entry.sDate <= date &&
                        (!entry.eDate || entry.eDate === "" || entry.eDate >= date)
                    );

                    if (activeOnDate) usedBlockBeds++;
                }

                const remainingBlockBeds = Math.max(0, totalBlockBeds - usedBlockBeds);

                // ✅ Push ONE record per date per authority
                // This matches what blockBedSummaryMap expects: item.date
                blockBedReports.push({
                    date,                              // ✅ component uses item.date
                    authorityId: authority.id,
                    authorityName: authority.name,
                    authorityType: type,
                    blockBedId: activeBlock.id,
                    totalBlockBeds,
                    usedBlockBeds,
                    remainingBlockBeds,
                    perWeek: Number(activeBlock.perWeek || 0)
                });
            }
        }
    };

    processAuthority(laSnap.docs, "LA");
    processAuthority(icbSnap.docs, "ICB");

    return blockBedReports;
};

// ----------------------------------------------------------------
// Helper: Build Live Room Report
// ----------------------------------------------------------------
const buildRoomReport = (
    rooms: any[],
    beds: any[],
    residents: any[],
    sDate?: string,
    eDate?: string
): RoomOutput[] => {
    const today = new Date().toISOString().split("T")[0];
    const residentMap = new Map<string, any>(residents.map(r => [r.id, r]));
    const result: RoomOutput[] = [];

    for (const room of rooms) {
        const roomBeds = beds.filter(b => b.roomId === room.id && b.status !== BED_STATUS.AVAILABLE) ;

        if (!roomBeds.length) {
            result.push({
                roomId: room.id,
                roomNumber: room.roomNumber,
                floor: room.floor,
                description: room.description,
                roomMasterStatus: room.status,
                roomStatus: calculateRoomStatus([]),
                beds: []
            });
            continue;
        }

        const bedOutputs: (BedOutput & { _hasResident?: boolean })[] = [];

        for (const bed of roomBeds) {
            const occupancies: OccupancyEntry[] = [];

            // Search ALL residents' roomHistory for entries matching this room + bed
            for (const resident of residents) {
                const history: any[] = resident.roomHistory || [];

                const relevantHistory = history.filter(
                    (h: any) => h.roomId === room.id && h.bedId === bed.id
                );

                if (!relevantHistory.length) continue;

                relevantHistory.sort((a: any, b: any) =>
                    (a.sDate || "").localeCompare(b.sDate || "")
                );

                for (const histEntry of relevantHistory) {
                    const startDate = histEntry.sDate || today;
                    const endDate = histEntry.eDate || today;

                    if (startDate > endDate) continue;

                    const fullDateRange: DateStatus[] = getDateRange(startDate, endDate)
                        .map(date => ({
                            date,
                            status: bed.bedStatus ?? BED_STATUS.AVAILABLE
                        }));

                    const filteredData = filterByDateRange(fullDateRange, sDate, eDate);
                    if (!filteredData.length) continue;

                    occupancies.push({
                        residentId: resident.id,
                        residentData: residentMap.get(resident.id) ?? null,
                        data: filteredData
                    });
                }
            }

            // No history matched → empty bed
            if (!occupancies.length) {
                const emptyData: DateStatus[] = [
                    { date: today, status: bed.bedStatus ?? BED_STATUS.AVAILABLE }
                ];
                const filteredData = filterByDateRange(emptyData, sDate, eDate);
                occupancies.push({
                    residentId: "",
                    residentData: null,
                    data: filteredData.length ? filteredData : emptyData
                });
            }

            const hasResident = occupancies.some(o => !!o.residentId);

            bedOutputs.push({
                bedId: bed.id,
                bedName: bed.bedName ?? "",
                bedMasterStatus: bed.bedStatus ?? BED_STATUS.AVAILABLE,
                pricePeriods: bed.pricePeriods ?? [],
                occupancies,
                _hasResident: hasResident
            });
        }

        // Sort: beds with residents first, then alphabetically
        bedOutputs.sort((a, b) => {
            if (a._hasResident !== b._hasResident) return a._hasResident ? -1 : 1;
            return (a.bedName ?? "").localeCompare(b.bedName ?? "");
        });

        for (const bed of bedOutputs) delete bed._hasResident;

        const roomStatus = calculateRoomStatus(
            roomBeds.map(b => ({ status: b.bedStatus }))
        );

        result.push({
            roomId: room.id,
            roomNumber: room.roomNumber,
            floor: room.floor,
            description: room.description,
            roomMasterStatus: room.status,
            roomStatus,
            beds: bedOutputs
        });
    }

    // Sort rooms by roomNumber
    result.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
    return result;
};

// ----------------------------------------------------------------
// Main: Get Live Room Report + Block Bed Report
// ----------------------------------------------------------------
export const getRoomReportLive = async (
    queryParams?: RoomReportQuery
): Promise<LiveReportOutput> => {
    try {
        const { sDate, eDate } = queryParams || {};
        const resolvedCompanyId = getUserMappedCompanyId()?.companyId;

        if (!resolvedCompanyId) {
            console.warn("⚠️ No companyId found");
            return { roomReport: [], blockBedReports: [] };
        }

        const [roomsSnap, bedsSnap, residentsSnap] = await Promise.all([
            getDocs(query(
                collection(db, DB_NAME.ROOMS),
                where("companyId", "==", resolvedCompanyId),
                where("status", "!=", ROOM_STATUS.DELETE),
                orderBy("status"),
                orderBy("roomNumber")
            )),
            getDocs(query(
                collection(db, DB_NAME.BED),
                where("companyId", "==", resolvedCompanyId)
            )),
            getDocs(query(
                collection(db, DB_NAME.RESIDENT),
                where("companyId", "==", resolvedCompanyId)
                // where("admission.residentStatus", "==", RESIDENT_STATUS.LIVING)
            ))
        ]);

        const rooms = roomsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        const beds = bedsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        const residents = residentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        const [blockBedReports, roomReport] = await Promise.all([
            buildBlockBedReport(resolvedCompanyId, sDate, eDate), // ✅ pass date range
            Promise.resolve(buildRoomReport(rooms, beds, residents, sDate, eDate))
        ]);

        return { roomReport, blockBedReports };

    } catch (error) {
        console.error("❌ Error getting live report:", error);
        return { roomReport: [], blockBedReports: [] };
    }
};