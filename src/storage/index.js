import { STORAGE_KEYS } from "../constants/defaults.js";

const fallbackStorage = {
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

export const storage = window.storage ?? fallbackStorage;

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
