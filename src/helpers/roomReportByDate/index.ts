/* =====================================================
   FINAL ROOM OCCUPANCY MERGE (CLEAN OUTPUT)
   - NO created / updated fields
   - Room + Bed Master
   - Occupancy + Resident
===================================================== */

import { BED_STATUS, ROOM_STATUS } from "../../common/constant";



/* ---------- ROOM MASTER TYPES ---------- */

type BedMaster = {
  id: string;
  bedName: string;
  bedStatus: number;
  pricePeriods?: any[];
};

type RoomMaster = {
  id: string;
  roomNumber: string;
  floor?: string;
  description?: string;
  status: number;
  beds: BedMaster[];
};

/* ---------- OCCUPANCY TYPES ---------- */

type BedSnapshot = {
  bedId: string;
  residentId: string;
  status: number;
};

type RoomDaySnapshot = {
  roomId: string;
  date: string; // YYYY-MM-DD
  beds: BedSnapshot[];
};

/* ---------- RESIDENT TYPE ---------- */

type Resident = {
  id: string;
  code?: string;
  personal?: {
    name?: string;
    gender?: string;
    phone?: string;
    email?: string;
  };
  admission?: any;
  [key: string]: any;
};

/* ---------- OUTPUT TYPES ---------- */

type OccupancyDay = {
  date: string;
  status: number;
};

type OccupancyBlock = {
  residentId: string;
  residentData: Resident | null;
  data: OccupancyDay[];
};

type BedOutput = {
  bedId: string;
  bedName: string;
  bedMasterStatus: number;
  pricePeriods?: any[];
  occupancies: OccupancyBlock[];
};

type RoomOutput = {
  roomId: string;
  roomNumber: string;
  floor?: string;
  description?: string;
  roomMasterStatus: number;
  roomStatus: number;
  beds: BedOutput[];
};

/* ---------- HELPERS ---------- */

function calculateRoomStatus(beds: BedSnapshot[]): number {
  if (beds.some(b => b.status === BED_STATUS.PRIVATE_OCCUPIED)) {
    return ROOM_STATUS.PRIVATE_OCCUPIED;
  }

  if (
    beds.some(
      b =>
        b.status === BED_STATUS.OCCUPIED ||
        b.status === BED_STATUS.BLOCK_BED_OCCUPIED||
        b.status === BED_STATUS.PRIVATE_OCCUPIED
    )
  ) {
    return ROOM_STATUS.ACTIVE;
  }

  return ROOM_STATUS.INACTIVE;
}

function buildResidentMap(residents: Resident[]) {
  const map = new Map<string, Resident>();
  residents.forEach(r => map.set(r.id, r));
  return map;
}

/* ---------- CORE MERGE FUNCTION ---------- */

export function groupByRoomResidentAndBedtoBedOccupancy(
  rooms: RoomMaster[],
  roomDays: RoomDaySnapshot[],
  residents: Resident[]
): RoomOutput[] {
  const residentMap = buildResidentMap(residents);

  // Group snapshots by roomId
  const roomDayMap = new Map<string, RoomDaySnapshot[]>();
  for (const day of roomDays) {
    let bucket = roomDayMap.get(day.roomId);
    if (!bucket) roomDayMap.set(day.roomId, (bucket = []));
    bucket.push(day);
  }

  const result: RoomOutput[] = [];

  for (const room of rooms) {
    const days = roomDayMap.get(room.id);
    if (!days?.length) {
      result.push({
        roomId: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        description: room.description,
        roomMasterStatus: room.status,
        roomStatus: calculateRoomStatus([]),
        beds: [],
      });
      continue;
    }

    // Sort once, ascending
    days.sort((a, b) => a.date.localeCompare(b.date));

    // Pre-build bed master lookup for this room — O(1) access inside loop
    const bedMasterMap = new Map(room.beds.map(b => [b.id, b]));

    const bedMap = new Map<string, BedOutput>();
    let lastDayBeds: BedSnapshot[] = [];

    for (const day of days) {
      lastDayBeds = day.beds;
      for (const bed of day.beds) {
        let bedOut = bedMap.get(bed.bedId);
        if (!bedOut) {
          const master = bedMasterMap.get(bed.bedId);
          bedOut = {
            bedId: bed.bedId,
            bedName: master?.bedName ?? "",
            bedMasterStatus: master?.bedStatus ?? BED_STATUS.AVAILABLE,
            pricePeriods: master?.pricePeriods ?? [],
            occupancies: [],
          };
          bedMap.set(bed.bedId, bedOut);
        }

        const residentId = bed.residentId ?? "";
        const occs = bedOut.occupancies;
        const lastOcc = occs[occs.length - 1];

        if (lastOcc?.residentId === residentId) {
          lastOcc.data.push({ date: day.date, status: bed.status });
        } else {
          occs.push({
            residentId,
            residentData: residentId ? (residentMap.get(residentId) ?? null) : null,
            data: [{ date: day.date, status: bed.status }],
          });
        }
      }
    }

    // Pre-compute hasResident flag so sort comparator doesn't re-scan arrays
    const beds = Array.from(bedMap.values()) as (BedOutput & { _hasResident?: boolean })[];
    for (const bed of beds) {
      bed._hasResident = bed.occupancies.some(o => o.residentId !== "");
    }

    beds.sort((a, b) => {
      if (a._hasResident !== b._hasResident) return a._hasResident ? -1 : 1;
      return a.bedName.localeCompare(b.bedName);
    });

    // Clean up temp flag
    for (const bed of beds) delete bed._hasResident;

    result.push({
      roomId: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      description: room.description,
      roomMasterStatus: room.status,
      roomStatus: calculateRoomStatus(lastDayBeds),
      beds,
    });
  }

  return result;
}

/* ---------- SAMPLE USAGE ---------- */

// const finalData = buildFinalRoomOccupancy(
//   roomMasterData,
//   roomDaySnapshots,
//   residentMasterData
// );

