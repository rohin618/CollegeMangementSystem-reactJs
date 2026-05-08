import { BED_STATUS, ROOM_STATUS, PRICE_PERIOD_STATUS } from '../../constant'

// const roomData = [
//     {
//         id: "1001",
//         roomNumber: 'R-1001',
//         roomType: "Single",
//         floor: '1',
//         description: 'Single Room',
//         amenities: 'AC, TV, Wifi',  // need check
//         mapCoordinates_x: "",
//         mapCoordinates_y: "",
//         status: 'Available',
//         beds: [
//             {
//                 id: 'b1001', // unique id
//                 bedName: "10A",
//                 roomId: "1001",
//                 bedType: "Single", // need check
//                 bedSize: "10A", // need check
//                 bedStatus: "Available",
//                 pricePeriods: [
//                     {
//                         sDate: "2025-07-20T05:45:00.000Z", //toLocaleString is Adapts for user time zone
//                         eDate: "2026-07-20T05:45:00.000Z", //toLocaleString is Adapts for user time zone
//                         pricePerWeek: 1500,
//                         minPricePerWeek: 1200,
//                         status: "Active"
//                     },

//                 ]
//             },
//         ]
//     },
// ]




// Types from enums
type BedStatus = typeof BED_STATUS[keyof typeof BED_STATUS];
type RoomStatus = typeof ROOM_STATUS[keyof typeof ROOM_STATUS];
type PricePeriodStatus = typeof PRICE_PERIOD_STATUS[keyof typeof PRICE_PERIOD_STATUS];

// Interfaces
interface PricePeriod {
  sDate: string;
  eDate: string;
  pricePerWeek: number;
  minPricePerWeek: number;
  status: PricePeriodStatus;
}

interface Bed {
  id: string;
  bedName: string;
  roomId: string;
  bedType: string;
  bedSize: string;
  bedStatus: BedStatus;
  pricePeriods: PricePeriod[];
}

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: string;
  description: string;
  amenities: string;
  mapCoordinates_x: string;
  mapCoordinates_y: string;
  status: RoomStatus;
  beds: Bed[];
}

// Helper: pick random enum value
function getRandomEnumValue<T extends Record<string, string>>(obj: T): T[keyof T] {
  const values = Object.values(obj) as T[keyof T][];
  const index = Math.floor(Math.random() * values.length);
  return values[index];
}


// Random date logic
function getRandomDateOffset(baseDate: Date, minDays: number, maxDays: number): Date {
  const offset = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  return new Date(baseDate.getTime() + offset * 86400000); // 1 day = 86400000 ms
}

function generatePricePeriods(): PricePeriod[] {
  const periods: PricePeriod[] = [];
  let currentStart = getRandomDateOffset(new Date(), 0, 30);


  const numberOfPeriods = Math.floor(Math.random() * 3) + 1;
  const activeIndex = Math.floor(Math.random() * numberOfPeriods); // ensure one ACTIVE

  for (let i = 0; i < numberOfPeriods; i++) {
    const status = i === activeIndex ? PRICE_PERIOD_STATUS.ACTIVE : getRandomEnumValue(PRICE_PERIOD_STATUS);
    const end = getRandomDateOffset(currentStart, 90, 180);
    periods.push({
      sDate: currentStart.toISOString(),
      eDate: end.toISOString(),
      pricePerWeek: 1500 + i * 100,
      minPricePerWeek: 1200 + i * 100,
      status: status
    });
    currentStart = getRandomDateOffset(end, 5, 20);
  }

  return periods;
}

// Seed data
const roomTypes = ['Single', 'Double', 'Suite'];
const bedTypes = ['Single', 'Double'];
const bedSizes = ['Small', 'Medium', 'Large'];
const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

export const roomData: Room[] = Array.from({ length: 10 }, (_, i) => {
  const roomId = `100${i + 1}`;
  const bedCount = Math.floor(Math.random() * 4) + 1;

  return {
    id: roomId,
    roomNumber: `R-${roomId}`,
    roomType: roomTypes[i % roomTypes.length],
    floor: `${(i % 3) + 1}`,
    description: `${roomTypes[i % roomTypes.length]} Room`,
    amenities: 'AC, TV, Wifi',
    mapCoordinates_x: '',
    mapCoordinates_y: '',
    status: getRandomEnumValue(ROOM_STATUS),
    beds: Array.from({ length: bedCount }, (_, j) => {
      const bedId = `b${roomId}${j + 1}`;
      return {
        id: bedId,
        bedName: `${'10' + i + 1} ${alphabet[j]}`,
        roomId,
        bedType: bedTypes[j % bedTypes.length],
        bedSize: bedSizes[j % bedSizes.length],
        bedStatus: getRandomEnumValue(BED_STATUS),
        pricePeriods: generatePricePeriods()
      };
    })
  };
});