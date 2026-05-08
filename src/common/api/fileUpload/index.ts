// firebaseUpload.ts
import { ref, uploadBytes, getDownloadURL, UploadResult } from "firebase/storage";

import { storage } from '../../../firebase';

/**
 * Upload a file to Firebase Storage with a dynamic path.
 * @param file - The file to upload
 * @param path - Dynamic path in storage, e.g. 'users/{userId}/folder'
 * @returns Promise<string> - Resolves with the download URL
 */
export async function uploadFileToStorage(file: File, path: string): Promise<string> {
  if (!file) throw new Error("No file provided");

  const storageRef = ref(storage, `${path}/${file.name}`);

  try {
    const snapshot: UploadResult = await uploadBytes(storageRef, file);
    const url: string = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}
