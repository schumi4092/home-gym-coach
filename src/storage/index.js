import { STORAGE_KEYS } from "../constants/defaults.js";

// ── HTTP API storage (preferred when running under server.js) ───────────────
const apiStorage = {
  async get(key) {
    const r = await fetch(`/api/kv/${encodeURIComponent(key)}`);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`storage get failed: ${r.status}`);
    const value = await r.text();
    return { value };
  },
  async set(key, value) {
    const r = await fetch(`/api/kv/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "content-type": "text/plain; charset=utf-8" },
      body: value,
    });
    if (!r.ok) throw new Error(`storage set failed: ${r.status}`);
  },
  async delete(key) {
    const r = await fetch(`/api/kv/${encodeURIComponent(key)}`, { method: "DELETE" });
    if (!r.ok && r.status !== 404) throw new Error(`storage delete failed: ${r.status}`);
  },
};

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

// ── Backend selection ────────────────────────────────────────────────────────
async function detectApi() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);
    const r = await fetch("/api/health", { signal: ctrl.signal });
    clearTimeout(timer);
    return r.ok;
  } catch {
    return false;
  }
}

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

async function migrateFromIndexedDBToApi(target) {
  const migrationKey = "wk-api-migrated";
  if (localStorage.getItem(migrationKey)) return;

  if (!hasIndexedDB()) {
    localStorage.setItem(migrationKey, "1");
    return;
  }

  for (const key of Object.values(STORAGE_KEYS)) {
    try {
      const existing = await target.get(key);
      if (existing !== null) continue;
      const fromIdb = await idbStorage.get(key);
      if (fromIdb !== null) {
        await target.set(key, fromIdb.value);
      }
    } catch (err) {
      console.warn("IDB → API migration failed for", key, err);
    }
  }

  localStorage.setItem(migrationKey, "1");
}

async function pickBackend() {
  if (await detectApi()) {
    void migrateFromIndexedDBToApi(apiStorage).catch((err) =>
      console.warn("IndexedDB → API migration failed:", err),
    );
    return apiStorage;
  }
  if (hasIndexedDB()) {
    void migrateFromLocalStorage(idbStorage).catch((err) =>
      console.warn("localStorage → IndexedDB migration failed:", err),
    );
    return idbStorage;
  }
  return localStorageFallback;
}

let resolvedBackend = null;
let backendPromise = null;
function getBackend() {
  if (resolvedBackend) return resolvedBackend;
  if (!backendPromise) backendPromise = pickBackend().then((b) => (resolvedBackend = b));
  return backendPromise;
}

// ── Exported storage instance ───────────────────────────────────────────────
export const storage = window.storage ?? {
  async get(key) { return (await getBackend()).get(key); },
  async set(key, value) { return (await getBackend()).set(key, value); },
  async delete(key) { return (await getBackend()).delete(key); },
};

let liveSaveTimer = null;
let pendingLiveSession = null;

function cancelPendingLiveSave() {
  if (liveSaveTimer) {
    clearTimeout(liveSaveTimer);
    liveSaveTimer = null;
  }
  pendingLiveSession = null;
}

export async function persistLiveWorkout(session) {
  cancelPendingLiveSave();
  try {
    await storage.set(STORAGE_KEYS.live, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to save live workout", error);
  }
}

export function persistLiveWorkoutDebounced(session, ms = 400) {
  pendingLiveSession = session;
  if (liveSaveTimer) clearTimeout(liveSaveTimer);
  liveSaveTimer = setTimeout(() => {
    const snapshot = pendingLiveSession;
    liveSaveTimer = null;
    pendingLiveSession = null;
    if (snapshot) void storage.set(STORAGE_KEYS.live, JSON.stringify(snapshot)).catch((e) => console.error("Failed to save live workout", e));
  }, ms);
}

export async function flushLiveWorkout() {
  if (liveSaveTimer && pendingLiveSession) {
    const snapshot = pendingLiveSession;
    cancelPendingLiveSave();
    await persistLiveWorkout(snapshot);
  }
}

export async function clearLiveWorkout() {
  cancelPendingLiveSave();
  try {
    await storage.delete(STORAGE_KEYS.live);
  } catch (error) {
    console.error("Failed to clear live workout", error);
  }
}
