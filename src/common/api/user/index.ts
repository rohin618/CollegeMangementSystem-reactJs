
import { createUserWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword, updatePassword } from "firebase/auth";

// Example: Using Firestore
import { db, auth } from '../../../firebase';
import {
    collection,
    getDocs,
    serverTimestamp,
    doc,
    updateDoc,
    setDoc,
    getDoc,
    where,
    query,
} from "firebase/firestore";
import { DB_NAME, EXIST_SESSION_STORAGE_NAMES, NOTIFY_TYPE, USER_STATUS } from '../../constant';
import { getStorage, notifyEntity, notifyServerError, setStorage } from '../../../helpers/helpers';
import showNotification from '../../../components/extras/showNotification';

const getAuthErrorMessage = (code: string) => {
    switch (code) {
        case "auth/user-not-found":
            return "No account found with this email.";
        case "auth/wrong-password":
            return "Incorrect password. Please try again.";
        case "auth/invalid-email":
            return "Invalid email format.";
        case "auth/user-disabled":
            return "This account has been disabled.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please try again later.";
        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";
        default:
            return "Invalid email or password.";
    }
};


export async function createUser(body: any) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, body?.email, 'test@123');

        const user = userCredential.user;
        // 2. Create user document in Firestore
        const res = await setDoc(doc(db, DB_NAME.USER, user.uid), {
            uid: user.uid,
            ...body,
            createdAt: serverTimestamp(),
        });

        notifyEntity('User', NOTIFY_TYPE.CREATE)
        return { ...body, id: user.uid };
    } catch (error: any) {
        // Handle Firebase auth errors
        let message: any = "Unknown error occurred";

        switch (error.code) {
            case "auth/missing-email":
                message = "Email is required.";
                break;
            case "auth/email-already-in-use":
                message = "This email is already registered.";
                break;
            case "auth/invalid-email":
                message = "Invalid email format.";
                break;
            case "auth/weak-password":
                message = "Password is too weak.";
                break;
            default:
                message = error.message || message;
        }

        notifyServerError(DB_NAME.USER, message);
        console.error("Error creating user:", error);
        // throw error;
    }
}


export const getAllUsers = async () => {
    try {
        const userRef = collection(db, DB_NAME.USER);


        const q = query(
            userRef,
            where("status", "!=", USER_STATUS.DELETE)
        );
        const snapshot = await getDocs(q);

        const rooms = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return rooms;

    } catch (error) {
        console.error("Error getting userRef:", error);
        return [];
    }
};

type NotifyType = "success" | "error";




export const userLogin = async (body: any) => {
    const { email, password } = body;

    try {
        // 🔑 Authenticate user
        const { user } = await signInWithEmailAndPassword(auth, email, password);

        if (!user?.uid) {
            showNotification(
                "Login Failed ❌",
                "Login failed: No user info found",
                "danger"
            );
            console.error("❌ Login failed: No UID found.");
            return null;
        }

        // 🔎 Get Firestore user document by UID
        const docRef = doc(db, DB_NAME.USER, user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            showNotification(
                "Login Failed ❌",
                "No user found. Invalid details.",
                "danger"
            );
            console.warn("⚠️ No user found in Firestore for UID:", user.uid);
            return null;
        }
        
        if (+docSnap.data()?.status === USER_STATUS.ACTIVE) {
            // 🎉 Login successful
            showNotification(
                "Login Successful 🎉",
                `Welcome back, ${docSnap.data()?.name || "User"}!`,
                "success"
            );
        }

        return { id: docSnap.id, ...docSnap.data() };
    } catch (error: any) {
        const errorMessage = getAuthErrorMessage(error.code);

        showNotification(
            "Login Failed ❌",
            errorMessage,
            "danger"
        );

        console.error("🔥 userLogin error:", error.code, error.message);
        return null;
    }

};


export const updateUser = async (id: string, body: any) => {
    try {
        const currentUser = auth.currentUser;
        const curentUser = getStorage(EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO);
        const userDocRef = doc(db, DB_NAME.USER, id);

        // Remove id from the body if present
        delete body?.id;

        // Prepare update metadata
        const updateMeta = {
            user: currentUser?.uid || "system",
            date: new Date(), // actual timestamp
        };

        // Merge new data with updated array
        const bodyObj = {
            ...body,
            updated: [...(body?.updated || []), updateMeta],
        };

        await updateDoc(userDocRef, bodyObj);

        notifyEntity('User', NOTIFY_TYPE.UPDATE)
        if (id === curentUser.id) {
            setStorage(EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO, { ...bodyObj, id })
        }
        return { ...bodyObj, id }
    } catch (error) {
        notifyEntity('User', NOTIFY_TYPE.ERROR)
        console.error("Failed to update user:", error);
        throw error;
    }
};

// Fetch user by ID
export const getUserById = async (id: string) => {
    try {
        const userRef = doc(db, DB_NAME.USER, id);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            notifyEntity("User Not Found", NOTIFY_TYPE.ERROR,
            'User Not Found for the current Id');
            return null;
        }

        // 🧠 Return user object with Firestore doc ID
        return { id: userSnap.id, ...userSnap.data() };
    } catch (error) {
        console.error("Error fetching user:", error);
        notifyEntity("Failed to fetch user details.", NOTIFY_TYPE.ERROR);
        return null;
    }
};

//change password

export const changePassword = async (
    currentPassword: string,
    newPassword: string
) => {
    try {
        const user = auth.currentUser;

        if (!user || !user.email) {
            throw { code: 'auth/no-current-user' };
        }

        // 1️⃣ Re-authenticate user
        const credential = EmailAuthProvider.credential(
            user.email,
            currentPassword
        );

        await reauthenticateWithCredential(user, credential);

        // 2️⃣ Update password
        await updatePassword(user, newPassword);

        // 3️⃣ Success notification
        notifyEntity(
            'Password',
            NOTIFY_TYPE.UPDATE,
            'Your password has been updated successfully.',
        );

        return { success: true };
    } catch (error: any) {
        console.error('Change password error:', {
            code: error?.code,
            message: error?.message,
        });

        let message = 'Unable to update password. Please try again.';

        switch (error?.code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
                message = 'Current password is incorrect.';
                break;

            case 'auth/user-mismatch':
                message = 'Authentication mismatch. Please log in again.';
                break;

            case 'auth/user-not-found':
                message = 'User session expired. Please log in again.';
                break;

            case 'auth/too-many-requests':
                message =
                    'Too many failed attempts. Please wait and try again later.';
                break;
            case 'auth/weak-password':
                message =
                    'New password does not meet security requirements.';
                break;

            case 'auth/requires-recent-login':
                message =
                    'For security reasons, please log in again to change your password.';
                break;
            case 'auth/no-current-user':
                message = 'No logged-in user found. Please log in again.';
                break;

            case 'auth/network-request-failed':
                message =
                    'Network error. Please check your internet connection.';
                break;

            default:
                message =
                    'An unexpected error occurred while updating your password.';
                break;
        }

        notifyEntity('Password', NOTIFY_TYPE.ERROR,message);

        return {
            success: false,
            message,
            code: error?.code,
        };
    }
};
