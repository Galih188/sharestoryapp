import CONFIG from "../config";

const { DATABASE_NAME, DATABASE_VERSION, OBJECT_STORE_NAME } = CONFIG;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    dbRequest.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Buat object store jika belum ada
      if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        database.createObjectStore(OBJECT_STORE_NAME, { keyPath: "id" });
        console.log(`Object Store ${OBJECT_STORE_NAME} dibuat`);
      }
    };

    dbRequest.onsuccess = (event) => {
      const database = event.target.result;
      resolve(database);
    };

    dbRequest.onerror = (event) => {
      reject(new Error("IndexedDB error: " + event.target.errorCode));
    };
  });
};

// Simpan stories ke IndexedDB
const saveStories = async (stories) => {
  const db = await openDB();
  const tx = db.transaction(OBJECT_STORE_NAME, "readwrite");
  const store = tx.objectStore(OBJECT_STORE_NAME);

  // Simpan setiap story ke object store
  stories.forEach((story) => {
    store.put(story);
  });

  return tx.complete;
};

// Simpan satu story ke IndexedDB
const saveStory = async (story) => {
  const db = await openDB();
  const tx = db.transaction(OBJECT_STORE_NAME, "readwrite");
  const store = tx.objectStore(OBJECT_STORE_NAME);

  store.put(story);

  return tx.complete;
};

// Ambil semua stories dari IndexedDB
const getAllStories = async () => {
  const db = await openDB();
  const tx = db.transaction(OBJECT_STORE_NAME, "readonly");
  const store = tx.objectStore(OBJECT_STORE_NAME);

  return store.getAll();
};

// Ambil story berdasarkan ID
const getStoryById = async (id) => {
  const db = await openDB();
  const tx = db.transaction(OBJECT_STORE_NAME, "readonly");
  const store = tx.objectStore(OBJECT_STORE_NAME);

  return store.get(id);
};

// Hapus story berdasarkan ID
const deleteStory = async (id) => {
  const db = await openDB();
  const tx = db.transaction(OBJECT_STORE_NAME, "readwrite");
  const store = tx.objectStore(OBJECT_STORE_NAME);

  store.delete(id);

  return tx.complete;
};

// Hapus semua data story
const clearStories = async () => {
  const db = await openDB();
  const tx = db.transaction(OBJECT_STORE_NAME, "readwrite");
  const store = tx.objectStore(OBJECT_STORE_NAME);

  store.clear();

  return tx.complete;
};

export {
  openDB,
  saveStories,
  saveStory,
  getAllStories,
  getStoryById,
  deleteStory,
  clearStories,
};
