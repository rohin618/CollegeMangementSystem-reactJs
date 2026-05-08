import { addDoc, arrayUnion, collection, doc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { DB_NAME, NOTIFY_TYPE, PRODUCT_STATUS } from "../../constant";
import { productModal } from "../../model/product";
import { getUserMappedCompany, getUserMappedCompanyId, notifyEntity, showAlert } from "../../../helpers/helpers";


const isProductNameOrCodeExist = async (
    productCode?: string,
    excludeId?: string, // important for update
) => {
    if (!productCode) return false;

    const queries = [];

    if (productCode) {
        queries.push(
            query(
                collection(db, DB_NAME.PRODUCT),
                where(
                    'productCodeSlug',
                    '==',
                    productCode.trim().toLowerCase(),
                ),
                limit(1),
            ),
        );
    }

    const snapshots = await Promise.all(queries.map((q) => getDocs(q)));

    return snapshots.some((snapshot) =>
        snapshot.docs.some((doc) => doc.id !== excludeId),
    );
};

export const createProduct = async (body: any) => {
    try {

        const companyId = getUserMappedCompanyId()?.companyId || '';
        if(!companyId)return;

        const currentUser = auth.currentUser;
        const normalizedCode = body?.productCode?.trim();

        const isExists = await isProductNameOrCodeExist(
            normalizedCode,
        );

        if (isExists) {
            showAlert({
                title: 'Product already exists',
                text: 'The Product Code is Already Exist',
            })
            return;
        }

        const productRef = collection(db, DB_NAME.PRODUCT);

        const productBody = {
            ...productModal,
            ...body,
            productCode: normalizedCode,
            productCodeSlug: normalizedCode?.toLowerCase(),
            companyId,

            created: {
                date: serverTimestamp(),
                userId: currentUser?.uid || "system",
            },
        };


        const docRef = await addDoc(productRef, productBody);

        notifyEntity('Product', NOTIFY_TYPE.CREATE);

        return { id: docRef.id, ...productBody };
    } catch (error) {
        notifyEntity('Product', NOTIFY_TYPE.ERROR);
        console.error("Failed to create Product:", error);
        throw error;
    }
};


export const updateProduct = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;
        const productRef = doc(db, DB_NAME.PRODUCT, id);

        delete body.id;

        const updateLog = {
            userId: currentUser?.uid || "system",
            date: new Date(), // Use actual JS Date
        };
        const normalizedCode = body?.productCode?.trim();

        const isExists = await isProductNameOrCodeExist(
            normalizedCode,
            id, 
        );

        if (isExists) {
			showAlert({
				title: 'Product already exists',
				text: 'The Product Code already exists',
			});
			return;
		}

		const bodyObj = {
			...body,
			productCode: normalizedCode,
			productCodeSlug: normalizedCode?.toLowerCase(),

			updated: arrayUnion(updateLog),
		};

        await updateDoc(productRef, bodyObj);

        notifyEntity('Product', NOTIFY_TYPE.UPDATE);

        return { id, ...bodyObj };
    } catch (error) {
        notifyEntity('Product', NOTIFY_TYPE.ERROR);
        console.error("Failed to update Product:", error);
        throw error;
    }
};



export const getAllProduct = async (
    params?: {
        categoryId?: string;
        status?: number | number[]; // single or multiple statuses
        unitOfMeasurementId?: string;
    }
) => {
    try {

        const companyId = getUserMappedCompanyId()?.companyId || '';
        if(!companyId){
            console.warn("No Company Id Fount");
            return [];
        }
        const productRef = collection(db, DB_NAME.PRODUCT);

        const conditions: any[] = [];

        // 🔹 STATUS condition
        if (params?.status) {
            // user explicitly passed status
            if (Array.isArray(params.status)) {
                conditions.push(
                    where("status", "in", params.status)
                );
            } else {
                conditions.push(
                    where("status", "==", params.status)
                );
            }
        } else {
            // 🔹 DEFAULT → ACTIVE + INACTIVE
            conditions.push(
                where("status", "in", [
                    PRODUCT_STATUS.ACTIVE,
                    PRODUCT_STATUS.INACTIVE,
                ])
            );
        }

        // 🔹 CATEGORY condition (optional)
        if (params?.categoryId) {
            conditions.push(
                where("categoryId", "==", params.categoryId)
            );
        }
        // 🔹 unitOfMeasurementId condition (optional)
        if (params?.unitOfMeasurementId) {
            conditions.push(
                where("unitOfMeasurementId", "==", params.unitOfMeasurementId)
            );
        }

        conditions.push(where("companyId", "==", companyId))

        const q = query(productRef, ...conditions);
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Failed to get Products:", error);
        throw error;
    }
};

export const updateProductLastPrice = async (productId: string, unitPrice: number) => {
    const productRef = doc(db, DB_NAME.PRODUCT, productId);
    await updateDoc(productRef, { lastPurchasePrice: unitPrice });
};


