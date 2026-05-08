
import { serverTimestamp } from "firebase/firestore";
import {ROOM_STATUS} from '../constant'

export const roomModel = {
 roomNumber: "",
  floor: '',
  description: "",
  mapCoordinates: { x: '', y: '' },
  status: ROOM_STATUS?.ACTIVE,
  created: {
    date: serverTimestamp(),
    user: ""
  },
  updated: []
};