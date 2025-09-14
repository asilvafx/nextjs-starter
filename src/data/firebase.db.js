import {equalTo, get, getDatabase, orderByChild, push, query, ref, remove, update} from "firebase/database";
import {initializeApp} from "firebase/app";
import {getDownloadURL, getStorage, ref as storageRef, uploadBytes} from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

let app;
let db;
let storage;

const firebaseUrl = firebaseConfig.databaseURL;
if(firebaseUrl && firebaseUrl.trim() !== ''){
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    storage = getStorage(app);
}

class FirebaseDBService {

    // Get multiple items by a specific key-value pair
    async getItemsByKeyValue(key, value, table) {
        try {
            const itemsRef = ref(db, `/${table}`);
            const q = query(itemsRef, orderByChild(key), equalTo(value));

            const snapshot = await get(q);
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error in getItemsByKeyValue:', error);
            throw error;
        }
    }

    // Get a single item by a specific key-value pair
    async readBy(key, value, table) {
        try {
            const itemsRef = ref(db, `/${table}`);
            const q = query(itemsRef, orderByChild(key), equalTo(value));

            const snapshot = await get(q);
            if (snapshot.exists()) {
                const snapshotValue = snapshot.val();
                const userObj = Object.keys(snapshotValue);
                const getUserId = userObj[0];

                return snapshotValue[getUserId];
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error in readBy:', error);
            throw error;
        }
    }

    // Get the key of an item by a specific key-value pair
    async getItemKey(key, value, table) {
        try {
            const itemsRef = ref(db, `/${table}`);
            const q = query(itemsRef, orderByChild(key), equalTo(value));

            const snapshot = await get(q);
            if (snapshot.exists()) {
                const snapshotValue = snapshot.val();
                const userObj = Object.keys(snapshotValue);
                const getUserId = userObj[0];

                return getUserId;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error in getItemKey:', error);
            throw error;
        }
    }

    // Get an item by ID
    async read(key, table) {
        try {
            const itemsRef = ref(db, `/${table}/${key}`);
            const q = query(itemsRef);

            const snapshot = await get(q);
            if (snapshot.exists()) {
                const snapshotValue = snapshot.val();
                return snapshotValue;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error in read:', error);
            throw error;
        }
    }

    // Read all items from a table
    async readAll(table) {
        try {
            const requestRef = ref(db, `/${table}`);
            const snapshot = await get(requestRef);

            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                return {};
            }
        } catch (error) {
            console.error('Error in readAll:', error);
            return {};
        }
    }

    // Create a new item
    async create(data, table) {
        try {
            const requestRef = ref(db, `/${table}`);
            const result = await push(requestRef, data);
            return { key: result.key, ref: result };
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    // Update an existing item
    async update(key, value, table) {
        try {
            const requestRef = ref(db, `/${table}/${key}`);
            await update(requestRef, value);
            return value;
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    // Delete an item by key
    async delete(key, table) {
        try {
            const requestRef = ref(db, `/${table}/${key}`);
            await remove(requestRef);
            return true;
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    // Delete all items from a table
    async deleteAll(table) {
        try {
            const requestRef = ref(db, `/${table}`);
            await remove(requestRef);
            return true;
        } catch (error) {
            console.error('Error in deleteAll:', error);
            throw error;
        }
    }

    // Upload a file and return the download URL
    async upload(file, path) {
        try {
            const fileRef = storageRef(storage, path);
            const snapshot = await uploadBytes(fileRef, file);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error('Error in upload:', error);
            throw error;
        }
    }
}

export default new FirebaseDBService();
