/**
 * Abstraction over the persistence layer.
 *
 * Backed by Firestore for authenticated users, with localStorage fallback.
 * Guests (scope="guest") continue using localStorage only.
 */

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebaseClient";

const STORAGE_KEY = "augusto_logs";
const PLAN_STORAGE_KEY = "augusto_plan";

function getStorageKey(scope = "guest") {
  return scope === "guest" ? STORAGE_KEY : `${STORAGE_KEY}:${scope}`;
}

function isRemoteScope(scope) {
  return scope !== "guest" && Boolean(db) && isFirebaseConfigured;
}

function getUserLogsDoc(scope) {
  return doc(db, "users", scope, "appData", "trainingLogs");
}

function getUserPlanDoc(scope) {
  return doc(db, "users", scope, "appData", "trainingPlan");
}

function getPlanStorageKey(scope = "guest") {
  return scope === "guest" ? PLAN_STORAGE_KEY : `${PLAN_STORAGE_KEY}:${scope}`;
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
      await setDoc(getUserLogsDoc(scope), { logs, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error("[StorageService] Failed to persist Firestore logs:", error);
      throw error;
    }

    // Best-effort local cache — don't throw if Firestore already succeeded
    try {
      localStorage.setItem(getStorageKey(scope), JSON.stringify(logs));
    } catch (error) {
      console.error("[StorageService] Failed to cache logs locally:", error);
    }
    return;
  }

  try {
    localStorage.setItem(getStorageKey(scope), JSON.stringify(logs));
  } catch (error) {
    console.error("[StorageService] Failed to persist logs:", error);
    throw error;
  }
}

/**
 * Load full training plan object from storage.
 * @param {string} [scope="guest"]
 * @returns {Promise<Record<string, { label: string, color: string, exercises: any[] }>>}
 */
export async function loadTrainingPlan(scope = "guest") {
  if (isRemoteScope(scope)) {
    try {
      const snap = await getDoc(getUserPlanDoc(scope));
      const remotePlan = snap.exists() ? snap.data()?.plan : null;
      if (remotePlan && typeof remotePlan === "object") {
        localStorage.setItem(getPlanStorageKey(scope), JSON.stringify(remotePlan));
        return remotePlan;
      }
      return {};
    } catch (error) {
      console.error("[StorageService] Failed to load Firestore plan:", error);
    }
  }

  try {
    const raw = localStorage.getItem(getPlanStorageKey(scope));
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("[StorageService] Failed to load plan:", error);
    return {};
  }
}

/**
 * Persist full training plan object.
 * @param {Record<string, { label: string, color: string, exercises: any[] }>} plan
 * @param {string} [scope="guest"]
 * @returns {Promise<void>}
 */
export async function persistTrainingPlan(plan, scope = "guest") {
  if (isRemoteScope(scope)) {
    try {
      await setDoc(getUserPlanDoc(scope), { plan, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error("[StorageService] Failed to persist Firestore plan:", error);
      throw error;
    }

    // Best-effort local cache — don't throw if Firestore already succeeded
    try {
      localStorage.setItem(getPlanStorageKey(scope), JSON.stringify(plan));
    } catch (error) {
      console.error("[StorageService] Failed to cache plan locally:", error);
    }
    return;
  }

  try {
    localStorage.setItem(getPlanStorageKey(scope), JSON.stringify(plan));
  } catch (error) {
    console.error("[StorageService] Failed to persist plan:", error);
    throw error;
  }
}
