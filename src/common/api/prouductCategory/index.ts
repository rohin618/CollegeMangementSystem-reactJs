import { addDoc, arrayUnion, collection, deleteDoc, doc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { DB_NAME, NOTIFY_TYPE } from "../../constant";
import { getUserMappedCompanyId, notifyEntity } from "../../../helpers/helpers";
import { productCategoryModal } from "../../model/productCategory/productCategory";


const getNextProductCategoryCode = async (): Promise<number> => {
    const productCategoryRef = collection(db, DB_NAME.PRODUCT_CATEGORY);

    const q = query(
        productCategoryRef,
        orderBy('code', 'desc'),
        limit(1)
    );

    const snapshot = await getDocs(q);

    let nextCode = 1001; // default start

    if (!snapshot.empty) {
        const lastCategoryCode = snapshot.docs[0].data();
        const lastCode = Number(lastCategoryCode.code);

        if (!isNaN(lastCode)) {
            nextCode = lastCode + 1;
        }
    }

    return nextCode; 
};

const isProductCategoryNameExists = async (
    categoryName: string,
) => {
    if (!categoryName) return false;

    const q = query(
        collection(db, DB_NAME.PRODUCT_CATEGORY),
        where("name", "==", categoryName.trim()),
        limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
};



export const createProductCategory = async (body: any) => {
    try {
        const currentUser = auth.currentUser;

        const companyId = getUserMappedCompanyId()?.companyId || '';
        if(!companyId)return;

        
        const isExists = await isProductCategoryNameExists(body?.name);

        if (isExists) {
            notifyEntity(
                "Product Category already exists",
                NOTIFY_TYPE.WARNING
            );
            return;
        }

        const productCategoryRef = collection(db, DB_NAME.PRODUCT_CATEGORY);
        const code = await getNextProductCategoryCode();

        const productCategoryBody = {
            ...productCategoryModal,
            ...body,
            companyId,
            created: {
                date: serverTimestamp(),
                userId: currentUser?.uid || "system",
            },
            code,
        };

        const docRef = await addDoc(productCategoryRef, productCategoryBody);

        notifyEntity('Product Category', NOTIFY_TYPE.CREATE);

        return { id: docRef.id, ...productCategoryBody };
    } catch (error) {
        notifyEntity('Product Category', NOTIFY_TYPE.ERROR);
        console.error("Failed to create Product Category:", error);
        throw error;
    }
};


export const updateProductCategory = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;
        const productCategoryRef = doc(db, DB_NAME.PRODUCT_CATEGORY, id);

        delete body.id;

        const updateLog = {
            userId: currentUser?.uid || "system",
            date: new Date(), // Use actual JS Date
        };

        const bodyObj = {
            ...body,
            updated: arrayUnion(updateLog),
        };

        await updateDoc(productCategoryRef, bodyObj);

        notifyEntity('Product Category', NOTIFY_TYPE.UPDATE);

        return { id, ...bodyObj };
    } catch (error) {
        notifyEntity('Product Category', NOTIFY_TYPE.ERROR);
        console.error("Failed to update Product Category:", error);
        throw error;
    }
};


export const getAllProductCategory = async () => {
    try {
        const companyId = getUserMappedCompanyId()?.companyId || '';
        if(!companyId){
            console.warn("No Company Id Fount");
            return [];
        }
        const productCategoryRef = collection(db, DB_NAME.PRODUCT_CATEGORY);
        

        const q = query(productCategoryRef,where("companyId", "==", companyId));
        const snapshot = await getDocs(q);
        const productCategory = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return productCategory || [];
    } catch (error) {
        console.error("Failed to get Product Categories:", error);
        throw error;
    }
}


export const deleteProductCategoryById = async (id: string) => {
    try {
        if (!id) {
            throw new Error("Product Category ID is required");
        }

        const productCategoryRef = doc(db, DB_NAME.PRODUCT_CATEGORY, id);

        await deleteDoc(productCategoryRef);

        notifyEntity("Product Category", NOTIFY_TYPE.DELETE);
        return true;
    } catch (error) {
        notifyEntity("Product Category", NOTIFY_TYPE.ERROR);
        console.error("Failed to delete Product Category:", error);
        throw error;
    }
};
