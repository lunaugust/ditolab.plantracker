/**
 * Abstraction over the persistence layer.
 *
 * Backed by Firestore for authenticated users, with localStorage fallback.
 * Guests (scope="guest") continue using localStorage only.
 */

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebaseClient";

const STORAGE_KEY = "augusto_logs";

function getStorageKey(scope = "guest") {
  return scope === "guest" ? STORAGE_KEY : `${STORAGE_KEY}:${scope}`;
}

function isRemoteScope(scope) {
  return scope !== "guest" && Boolean(db) && isFirebaseConfigured;
}

function getUserLogsDoc(scope) {
  return doc(db, "users", scope, "appData", "trainingLogs");
}

/**
 * Load all exercise logs from storage.
 * @param {string} [scope="guest"]
 * @returns {Promise<Record<string, import("./types").LogEntry[]>>}
 */
export async function loadLogs(scope = "guest") {
  if (isRemoteScope(scope)) {
    try {
      const snap = await getDoc(getUserLogsDoc(scope));
      const remoteLogs = snap.exists() ? snap.data()?.logs : null;
      if (remoteLogs && typeof remoteLogs === "object") {
        localStorage.setItem(getStorageKey(scope), JSON.stringify(remoteLogs));
        return remoteLogs;
      }
      return {};
    } catch (error) {
      console.error("[StorageService] Failed to load Firestore logs:", error);
    }
  }

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
  if (isRemoteScope(scope)) {
    try {
      await setDoc(
        getUserLogsDoc(scope),
        { logs, updatedAt: serverTimestamp() },
        { merge: true },
      );
    } catch (error) {
      console.error("[StorageService] Failed to persist Firestore logs:", error);
      throw error;
    }
  }

  try {
    localStorage.setItem(getStorageKey(scope), JSON.stringify(logs));
  } catch (error) {
    console.error("[StorageService] Failed to persist logs:", error);
    throw error;
  }
}
