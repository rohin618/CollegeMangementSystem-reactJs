
// Example: Using Firestore
import { db, auth } from '../../../firebase';
import {
  collection,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { DB_NAME, NOTIFY_TYPE } from '../../constant';
import { downloadPdfBlob, getUserMappedCompanyId, notifyEntity, } from '../../../helpers/helpers';
import { uploadFileToStorage } from '../fileUpload';
import { apiCall } from '../axios';
import { residentDocument, residentDocumentMail } from '../axios/api.varible';


export const createResidentDocument = async (body: any, file: File) => {
  try {
    const currentUser = auth.currentUser;

    const fileUrl = await uploadFileToStorage(file, '/resident/documents');

    const residentDocumentRef = collection(db, DB_NAME.RESIDENT_DOCUMENT);
    // Step 2: Define the room model
    const residentDocumentRefBody = {
      ...body,
      ...getUserMappedCompanyId(),
      fileUrl,
      created: {
        date: serverTimestamp(),
        user: currentUser?.uid || "system"
      },
      updated: []
    };

    // Step 3: Add to Firestore
    const docRef = await addDoc(residentDocumentRef, residentDocumentRefBody);
    notifyEntity('Resident Document', NOTIFY_TYPE.CREATE);

    return { id: docRef.id, ...residentDocumentRefBody };

  } catch (error) {
    // notifyServerError(DB_NAME.COMPANY)
    notifyEntity('Resident Document', NOTIFY_TYPE.ERROR);
    console.error("Failed to create room:", error);
  }
};


export const getResidentDocumentByResidentId = async (residentId: any) => {
  try {
    const resolvedCompanyId = getUserMappedCompanyId()?.companyId;
    if (!resolvedCompanyId) {
      console.warn("⚠️ No companyId provided or found in storage");
      return [];
    }

    const residentDocumentRef = collection(db, DB_NAME.RESIDENT_DOCUMENT);
    const q = query(residentDocumentRef, where("companyId", "==", resolvedCompanyId), where("residentId", "==", residentId));
    const snapshot = await getDocs(q);

    const residentDocuments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));



    // Group by `type` and return as array
    const groupedArray = Object.values(
      residentDocuments.reduce((acc: Record<string, any>, doc: any) => {
        const type = doc.type ?? "unknown"; // fallback if type missing
        if (!acc[type]) acc[type] = { type, documents: [] };
        acc[type].documents.push(doc);
        return acc;
      }, {})
    );



    return groupedArray;

  } catch (error) {
    notifyEntity('Resident Document', NOTIFY_TYPE.ERROR);
    console.error("Failed to fetch resident documents:", error);
    return [];
  }
};




export const downloadResidentDocument = async (
  body: HTMLBaseElement,
  fileName = "document.pdf"
): Promise<void> => {
  try {
    const response = await apiCall<any>({
      ...residentDocument.downloadDocument,
      body,
      responseType: "blob", // 🔥 IMPORTANT
    });


    downloadPdfBlob(response, fileName);
    return response;
  } catch (error) {
    notifyEntity(
      "Resident Document Download",
      NOTIFY_TYPE.ERROR,
      "Failed to download the Document. Please try again later."
    );
    console.error(error);
  }
};
export const getResidentDocument = async (
  body: HTMLBaseElement,
): Promise<void> => {
  try {
    const response = await apiCall<any>({
      ...residentDocument.downloadDocument,
      body,
      responseType: "blob", // 🔥 IMPORTANT
    });
    return response;
  } catch (error) {
    notifyEntity(
      "Resident Document Get",
      NOTIFY_TYPE.ERROR,
      "Failed to get the Document. Please try again later."
    );
    console.error(error);
  }
};
export const sendResidentDocumentMail = async (
  formData: FormData,
): Promise<any> => {
  try {
    const response = await apiCall<any>({
      ...residentDocumentMail.documentMail, // should contain method + url
      body: formData,
      // ⚠️ Do NOT manually set Content-Type if using axios
    });

    return response;
  } catch (error: any) {
    console.error(error);
    throw error; // ✅ important
  }
};


export const sendEmailResidentDocument = async (body: any) => {
  try {
    const a = await apiCall({ ...residentDocument.downloadDocument, body })
  } catch (e) {
    notifyEntity("Email", NOTIFY_TYPE.ERROR, 'Something went wrong while sending the Document email. Please try again.');
    console.error(e)
  }

}