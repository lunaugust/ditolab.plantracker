/**
 * Abstraction over the persistence layer.
 *
 * Backed by `localStorage` — works in any modern browser.
 * Swap the implementation here to migrate to IndexedDB or a
 * remote API — no consumer changes needed.
 */

const STORAGE_KEY = "augusto_logs";

function getStorageKey(scope = "guest") {
  return scope === "guest" ? STORAGE_KEY : `${STORAGE_KEY}:${scope}`;
}

/**
 * Load all exercise logs from storage.
 * @param {string} [scope="guest"]
 * @returns {Promise<Record<string, import("./types").LogEntry[]>>}
 */
export async function loadLogs(scope = "guest") {
  try {
    const raw = localStorage.getItem(getStorageKey(scope));
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("[StorageService] Failed to load logs:", error);
    return {};
  }
}

/**
 * Persist the full logs object.
 * @param {Record<string, import("./types").LogEntry[]>} logs
 * @param {string} [scope="guest"]
 * @returns {Promise<void>}
 */
export async function persistLogs(logs, scope = "guest") {
  try {
    localStorage.setItem(getStorageKey(scope), JSON.stringify(logs));
  } catch (error) {
    console.error("[StorageService] Failed to persist logs:", error);
    throw error;
  }
}
