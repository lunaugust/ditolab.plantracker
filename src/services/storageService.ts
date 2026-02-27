/**
 * Abstraction over the persistence layer.
 *
 * Backed by Firestore for authenticated users, with localStorage fallback.
 * Guests (scope="guest") continue using localStorage only.
 */

import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebaseClient";
import type { LogsByExercise, TrainingPlan, PlanMetadata, PlanWithMetadata } from "./types";

const STORAGE_KEY = "gymbuddy_logs";
const PLAN_STORAGE_KEY = "gymbuddy_plan";
const ACTIVE_PLAN_KEY = "gymbuddy_active_plan";
const GUEST_PLANS_KEY = "gymbuddy_guest_plans";

function getStorageKey(scope = "guest"): string {
  return scope === "guest" ? STORAGE_KEY : `${STORAGE_KEY}:${scope}`;
}

function isRemoteScope(scope: string): boolean {
  return scope !== "guest" && Boolean(db) && isFirebaseConfigured;
}

function getUserLogsDoc(scope: string) {
  return doc(db!, "users", scope, "appData", "trainingLogs");
}

function getUserPlanDoc(scope: string) {
  return doc(db!, "users", scope, "appData", "trainingPlan");
}

function getPlanStorageKey(scope = "guest"): string {
  return scope === "guest" ? PLAN_STORAGE_KEY : `${PLAN_STORAGE_KEY}:${scope}`;
}

/**
 * Load all exercise logs from storage.
 * @param {string} [scope="guest"]
 * @returns {Promise<Record<string, import("./types").LogEntry[]>>}
 */
export async function loadLogs(scope = "guest"): Promise<LogsByExercise> {
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
export async function persistLogs(logs: LogsByExercise, scope = "guest"): Promise<void> {
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
export async function loadTrainingPlan(scope = "guest"): Promise<TrainingPlan | Record<string, never>> {
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
export async function persistTrainingPlan(plan: TrainingPlan, scope = "guest"): Promise<void> {
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

// ============================================================================
// Multi-Plan Management Functions
// ============================================================================

function generatePlanId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get the active plan ID for a user.
 * @param {string} userId - User ID or "guest"
 * @returns {Promise<string | null>}
 */
export async function getActivePlanId(userId: string): Promise<string | null> {
  if (userId === "guest") {
    try {
      return localStorage.getItem(ACTIVE_PLAN_KEY);
    } catch {
      return null;
    }
  }

  if (!isRemoteScope(userId)) return null;

  try {
    const userDoc = doc(db!, "users", userId);
    const snap = await getDoc(userDoc);
    return snap.exists() ? snap.data()?.activePlanId || null : null;
  } catch (error) {
    console.error("[StorageService] Failed to get active plan ID:", error);
    return null;
  }
}

/**
 * Set the active plan ID for a user.
 * @param {string} userId - User ID or "guest"
 * @param {string} planId - Plan ID to set as active
 * @returns {Promise<void>}
 */
export async function setActivePlanId(userId: string, planId: string): Promise<void> {
  if (userId === "guest") {
    try {
      localStorage.setItem(ACTIVE_PLAN_KEY, planId);
    } catch (error) {
      console.error("[StorageService] Failed to set active plan ID:", error);
    }
    return;
  }

  if (!isRemoteScope(userId)) return;

  try {
    const userDoc = doc(db!, "users", userId);
    await setDoc(userDoc, { activePlanId: planId, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("[StorageService] Failed to set active plan ID:", error);
    throw error;
  }
}

/**
 * List all plans accessible to a user (owned + shared).
 * @param {string} userId - User ID or "guest"
 * @returns {Promise<PlanMetadata[]>}
 */
export async function listPlans(userId: string): Promise<PlanMetadata[]> {
  if (userId === "guest") {
    try {
      const raw = localStorage.getItem(GUEST_PLANS_KEY);
      const plans: PlanWithMetadata[] = raw ? JSON.parse(raw) : [];
      return plans.map((p) => p.metadata);
    } catch {
      return [];
    }
  }

  if (!isRemoteScope(userId)) return [];

  try {
    // Get owned plans
    const ownedQuery = query(collection(db!, "plans"), where("ownerId", "==", userId));
    const ownedSnap = await getDocs(ownedQuery);
    const owned = ownedSnap.docs.map((d) => d.data() as PlanWithMetadata).map((p) => p.metadata);

    // Get shared plans
    const sharedQuery = query(collection(db!, "plans"), where("sharedWith", "array-contains", userId));
    const sharedSnap = await getDocs(sharedQuery);
    const shared = sharedSnap.docs.map((d) => d.data() as PlanWithMetadata).map((p) => p.metadata);

    return [...owned, ...shared];
  } catch (error) {
    console.error("[StorageService] Failed to list plans:", error);
    return [];
  }
}

/**
 * Load a specific plan by ID.
 * @param {string} planId - Plan ID
 * @param {string} userId - User ID or "guest" (for access control)
 * @returns {Promise<PlanWithMetadata | null>}
 */
export async function loadPlanById(planId: string, userId: string): Promise<PlanWithMetadata | null> {
  if (userId === "guest") {
    try {
      const raw = localStorage.getItem(GUEST_PLANS_KEY);
      const plans: PlanWithMetadata[] = raw ? JSON.parse(raw) : [];
      return plans.find((p) => p.metadata.id === planId) || null;
    } catch {
      return null;
    }
  }

  if (!isRemoteScope(userId)) return null;

  try {
    const planDoc = doc(db!, "plans", planId);
    const snap = await getDoc(planDoc);

    if (!snap.exists()) return null;

    const planData = snap.data() as PlanWithMetadata;

    // Check access: must be owner or in sharedWith list
    if (planData.metadata.ownerId !== userId && !planData.metadata.sharedWith.includes(userId)) {
      console.warn("[StorageService] User does not have access to plan:", planId);
      return null;
    }

    return planData;
  } catch (error) {
    console.error("[StorageService] Failed to load plan:", error);
    return null;
  }
}

/**
 * Save a plan (create or update).
 * @param {PlanWithMetadata} planData - Plan with metadata
 * @param {string} userId - User ID or "guest"
 * @returns {Promise<string>} - Plan ID
 */
export async function savePlan(planData: PlanWithMetadata, userId: string): Promise<string> {
  const now = Date.now();
  const planId = planData.metadata.id || generatePlanId();

  const updatedPlan: PlanWithMetadata = {
    ...planData,
    metadata: {
      ...planData.metadata,
      id: planId,
      updatedAt: now,
      createdAt: planData.metadata.createdAt || now,
    },
  };

  if (userId === "guest") {
    try {
      const raw = localStorage.getItem(GUEST_PLANS_KEY);
      const plans: PlanWithMetadata[] = raw ? JSON.parse(raw) : [];
      const index = plans.findIndex((p) => p.metadata.id === planId);

      if (index >= 0) {
        plans[index] = updatedPlan;
      } else {
        plans.push(updatedPlan);
      }

      localStorage.setItem(GUEST_PLANS_KEY, JSON.stringify(plans));
      return planId;
    } catch (error) {
      console.error("[StorageService] Failed to save guest plan:", error);
      throw error;
    }
  }

  if (!isRemoteScope(userId)) {
    throw new Error("Firebase not configured");
  }

  try {
    const planDoc = doc(db!, "plans", planId);
    await setDoc(planDoc, updatedPlan);
    return planId;
  } catch (error) {
    console.error("[StorageService] Failed to save plan:", error);
    throw error;
  }
}

/**
 * Delete a plan (owner only).
 * @param {string} planId - Plan ID
 * @param {string} userId - User ID or "guest"
 * @returns {Promise<void>}
 */
export async function deletePlan(planId: string, userId: string): Promise<void> {
  if (userId === "guest") {
    try {
      const raw = localStorage.getItem(GUEST_PLANS_KEY);
      const plans: PlanWithMetadata[] = raw ? JSON.parse(raw) : [];
      const filtered = plans.filter((p) => p.metadata.id !== planId);
      localStorage.setItem(GUEST_PLANS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("[StorageService] Failed to delete guest plan:", error);
      throw error;
    }
    return;
  }

  if (!isRemoteScope(userId)) return;

  try {
    // Verify ownership before deleting
    const planData = await loadPlanById(planId, userId);
    if (!planData || planData.metadata.ownerId !== userId) {
      throw new Error("Not authorized to delete this plan");
    }

    const planDoc = doc(db!, "plans", planId);
    await deleteDoc(planDoc);
  } catch (error) {
    console.error("[StorageService] Failed to delete plan:", error);
    throw error;
  }
}

/**
 * Share a plan with other users (owner only).
 * @param {string} planId - Plan ID
 * @param {string[]} userIds - User IDs to share with
 * @param {string} ownerId - Owner's user ID
 * @returns {Promise<void>}
 */
export async function sharePlan(planId: string, userIds: string[], ownerId: string): Promise<void> {
  if (ownerId === "guest") {
    console.warn("[StorageService] Cannot share guest plans");
    return;
  }

  if (!isRemoteScope(ownerId)) return;

  try {
    const planData = await loadPlanById(planId, ownerId);
    if (!planData || planData.metadata.ownerId !== ownerId) {
      throw new Error("Not authorized to share this plan");
    }

    const updatedPlan: PlanWithMetadata = {
      ...planData,
      metadata: {
        ...planData.metadata,
        isShared: userIds.length > 0,
        sharedWith: userIds,
        updatedAt: Date.now(),
      },
    };

    await savePlan(updatedPlan, ownerId);
  } catch (error) {
    console.error("[StorageService] Failed to share plan:", error);
    throw error;
  }
}

/**
 * Copy a plan (for duplicating shared plans to owned plans).
 * @param {string} sourcePlanId - Source plan ID
 * @param {string} userId - User ID creating the copy
 * @param {string} newPlanName - Name for the new plan
 * @returns {Promise<string>} - New plan ID
 */
export async function copyPlan(sourcePlanId: string, userId: string, newPlanName: string): Promise<string> {
  const sourcePlan = await loadPlanById(sourcePlanId, userId);

  if (!sourcePlan) {
    throw new Error("Source plan not found or not accessible");
  }

  const now = Date.now();
  const newPlanId = generatePlanId();

  const copiedPlan: PlanWithMetadata = {
    plan: JSON.parse(JSON.stringify(sourcePlan.plan)), // Deep copy
    metadata: {
      id: newPlanId,
      name: newPlanName,
      description: sourcePlan.metadata.description,
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
      isShared: false,
      sharedWith: [],
      source: sourcePlan.metadata.source,
    },
  };

  await savePlan(copiedPlan, userId);
  return newPlanId;
}
