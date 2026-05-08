import { FieldValue } from "firebase/firestore";

export interface IRoomModel {
  roomNumber: string;
  floor: string;
  description: string;

  mapCoordinates: {
    x: string;
    y: string;
  };

  status: string | number; // or ROOM_STATUS enum if you have it

  created: {
    date: FieldValue; // serverTimestamp()
    user: string;
  };

  updated: Array<{
    date?: FieldValue | string;
    user?: string;
  }>;
}
