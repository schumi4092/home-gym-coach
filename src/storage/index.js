import { STORAGE_KEYS } from "../constants/defaults.js";

// ── IndexedDB storage ───────────────────────────────────────────────────────
const DB_NAME = "home-gym";
const DB_VERSION = 1;
const STORE_NAME = "kv";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const idbStorage = {
  async get(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result === undefined ? null : { value: req.result });
      req.onerror = () => reject(req.error);
    });
  },
  async set(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async delete(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

// ── Fallback to localStorage if IndexedDB is not available ──────────────────
const localStorageFallback = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value === null ? null : { value };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
  async delete(key) {
    localStorage.removeItem(key);
  },
};

function hasIndexedDB() {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

// ── Migrate existing localStorage data to IndexedDB (one-time) ──────────────
async function migrateFromLocalStorage(target) {
  const migrationKey = "wk-idb-migrated";
  if (localStorage.getItem(migrationKey)) return;

  for (const key of Object.values(STORAGE_KEYS)) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      await target.set(key, value);
    }
  }

  localStorage.setItem(migrationKey, "1");
}

// ── Exported storage instance ───────────────────────────────────────────────
const useIDB = hasIndexedDB() && !window.storage;
export const storage = window.storage ?? (useIDB ? idbStorage : localStorageFallback);

if (useIDB) {
  migrateFromLocalStorage(idbStorage).catch((err) =>
    console.warn("localStorage → IndexedDB migration failed:", err),
  );
}

export async function persistLiveWorkout(session) {
  try {
    await storage.set(STORAGE_KEYS.live, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to save live workout", error);
  }
}

export async function clearLiveWorkout() {
  try {
    await storage.delete(STORAGE_KEYS.live);
  } catch (error) {
    console.error("Failed to clear live workout", error);
  }
}
