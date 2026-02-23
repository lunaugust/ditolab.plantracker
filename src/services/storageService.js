/**
 * Abstraction over the persistence layer.
 *
 * Backed by `localStorage` — works in any modern browser.
 * Swap the implementation here to migrate to IndexedDB or a
 * remote API — no consumer changes needed.
 */

const STORAGE_KEY = "augusto_logs";

/**
 * Load all exercise logs from storage.
 * @returns {Promise<Record<string, import("./types").LogEntry[]>>}
 */
export async function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("[StorageService] Failed to load logs:", error);
    return {};
  }
}

/**
 * Persist the full logs object.
 * @param {Record<string, import("./types").LogEntry[]>} logs
 * @returns {Promise<void>}
 */
export async function persistLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("[StorageService] Failed to persist logs:", error);
    throw error;
  }
}
