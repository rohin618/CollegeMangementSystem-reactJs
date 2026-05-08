// Example: Using Firestore
import { db, auth } from '../../../firebase';
import {
  collection,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  where,
  getDoc,
} from "firebase/firestore";
import { DB_NAME, NOTIFY_TYPE } from '../../constant';
import { getUserMappedCompanyId, notifyEntity, } from '../../../helpers/helpers'


export const createRoom = async (body: any) => {
  try {
    const currentUser = auth.currentUser;

    // Step 1: Get the last (highest) roomNumber
    const roomsRef = collection(db, DB_NAME.ROOMS);


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
    const docRef = await addDoc(roomsRef, newRoom);
    notifyEntity('Room', NOTIFY_TYPE.CREATE)
    return { id: docRef.id, ...newRoom, beds: [] }


  } catch (error) {
    notifyEntity('Room', NOTIFY_TYPE.ERROR)
    console.error("Failed to create room:", error);
  }
};


export const getAllRooms = async () => {
  try {
    const roomsRef = collection(db, DB_NAME.ROOMS);
    const snapshot = await getDocs(roomsRef);

    const rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return rooms;

  } catch (error) {
    console.error("Error getting rooms:", error);
    return [];
  }
};

export const getAllRoomsWithBeds = async () => {
  try {
    // ✅ Get companyId from localStorage
    const companyId = getUserMappedCompanyId()?.companyId;
    if (!companyId) {
      console.warn("No companyId found in storage");
      return [];
    }

    // ✅ Fetch rooms by company
    const roomsRef = collection(db, DB_NAME.ROOMS);
    const roomsQuery = query(roomsRef, where("companyId", "==", companyId));
    const roomsSnapshot = await getDocs(roomsQuery);

    const rooms = roomsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // ✅ Fetch beds by company
    const bedsRef = collection(db, DB_NAME.BED);
    // const bedsQuery = query(bedsRef, where("companyId", "==", companyId));
    const bedsSnapshot = await getDocs(bedsRef);

    const beds = bedsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // ✅ Attach beds to rooms
    const roomsWithBeds = rooms
      .map(room => ({
        ...room,
        beds: beds.filter((bed: any) => bed.roomId === room.id).sort((a: any, b: any) =>
          a.bedName.localeCompare(b.bedName, undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        ),
      }))
      .sort((a: any, b: any) => a.roomNumber - b.roomNumber);

    return roomsWithBeds;
  } catch (error) {
    console.error("Error getting rooms with beds:", error);
    return [];
  }
};



export const updateRoom = async (id: string, body: any, isDelete?: boolean) => {
  try {
    const currentUser = auth.currentUser;

    const roomDocRef = doc(db, DB_NAME.ROOMS, id);
    delete body?.id;

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
      notifyEntity('Room', NOTIFY_TYPE.DELETE)
    } else {
      notifyEntity('Room', NOTIFY_TYPE.UPDATE)
    }
    return { id, ...bodyObj }
  } catch (error) {
    notifyEntity('Room', NOTIFY_TYPE.ERROR)
    console.error("Failed to update Local Authority:", error);
    throw error;
  }
};

export const getRoomById = async (roomId: string) => {
  try {
    if (!roomId) throw new Error("Room ID is required");

    const roomRef = doc(db, DB_NAME.ROOMS, roomId);
    const snapshot = await getDoc(roomRef);

    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    } else {
      console.warn(`Room with ID "${roomId}" not found`);
      return null;
    }
  } catch (error) {
    console.error("Error getting room by ID:", error);
    return null;
  }
};