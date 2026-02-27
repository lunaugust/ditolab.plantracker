import { useState, useEffect, useCallback, useRef } from "react";
import { normalizePlan } from "../utils/planNormalization";
import {
  getActivePlanId,
  setActivePlanId,
  listPlans,
  loadPlanById,
  savePlan,
  deletePlan,
  sharePlan,
  copyPlan,
  loadTrainingPlan,
} from "../services/storageService";
import type { PlanMetadata, PlanWithMetadata, TrainingPlan } from "../services/types";

/**
 * Hook for managing multiple plans with sharing support.
 *
 * @param userId - User ID or "guest"
 * @param authLoading - Whether auth is still loading
 * @returns Multi-plan management functions and state
 */
export function useMultiPlan(userId = "guest", authLoading = false) {
  const [plans, setPlans] = useState<PlanMetadata[]>([]);
  const [activePlanId, setActivePlanIdState] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<PlanWithMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activePlanRef = useRef(activePlan);
  useEffect(() => {
    activePlanRef.current = activePlan;
  }, [activePlan]);

  // Load plans and active plan on mount or when userId changes
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Check if user has migrated to multi-plan
        const activeId = await getActivePlanId(userId);

        if (activeId) {
          // Multi-plan mode: load all plans and active plan
          const allPlans = await listPlans(userId);
          const active = await loadPlanById(activeId, userId);

          if (!cancelled) {
            setPlans(allPlans);
            setActivePlanIdState(activeId);
            setActivePlan(active);
            setLoading(false);
          }
        } else {
          // Legacy mode: try to migrate single plan to multi-plan
          const legacyPlan = await loadTrainingPlan(userId);
          const hasPlan = legacyPlan && typeof legacyPlan === "object" && Object.keys(legacyPlan).length > 0;

          if (hasPlan) {
            // Migrate legacy plan to multi-plan
            const now = Date.now();
            const planId = `plan_${now}_migrated`;

            const newPlan: PlanWithMetadata = {
              metadata: {
                id: planId,
                name: "Mi Plan",
                ownerId: userId,
                createdAt: now,
                updatedAt: now,
                isShared: false,
                sharedWith: [],
                source: "manual",
              },
              plan: legacyPlan,
            };

            await savePlan(newPlan, userId);
            await setActivePlanId(userId, planId);

            if (!cancelled) {
              setPlans([newPlan.metadata]);
              setActivePlanIdState(planId);
              setActivePlan(newPlan);
              setLoading(false);
            }
          } else {
            // No plan exists yet
            if (!cancelled) {
              setPlans([]);
              setActivePlanIdState(null);
              setActivePlan(null);
              setLoading(false);
            }
          }
        }
      } catch (err) {
        console.error("[useMultiPlan] Failed to load plans:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load plans");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, authLoading]);

  const refreshPlans = useCallback(async () => {
    try {
      const allPlans = await listPlans(userId);
      setPlans(allPlans);
    } catch (err) {
      console.error("[useMultiPlan] Failed to refresh plans:", err);
    }
  }, [userId]);

  const switchActivePlan = useCallback(
    async (planId: string) => {
      try {
        const plan = await loadPlanById(planId, userId);
        if (plan) {
          await setActivePlanId(userId, planId);
          setActivePlanIdState(planId);
          setActivePlan(plan);
        }
      } catch (err) {
        console.error("[useMultiPlan] Failed to switch plan:", err);
        setError(err instanceof Error ? err.message : "Failed to switch plan");
      }
    },
    [userId],
  );

  const createPlan = useCallback(
    async (name: string, plan: TrainingPlan, source?: "generated" | "imported" | "manual") => {
      const now = Date.now();
      const planId = `plan_${now}_${Math.random().toString(36).substring(2, 11)}`;

      const newPlan: PlanWithMetadata = {
        metadata: {
          id: planId,
          name,
          ownerId: userId,
          createdAt: now,
          updatedAt: now,
          isShared: false,
          sharedWith: [],
          source: source || "manual",
        },
        plan,
      };

      try {
        await savePlan(newPlan, userId);
        await refreshPlans();
        await switchActivePlan(planId);
        return planId;
      } catch (err) {
        console.error("[useMultiPlan] Failed to create plan:", err);
        setError(err instanceof Error ? err.message : "Failed to create plan");
        throw err;
      }
    },
    [userId, refreshPlans, switchActivePlan],
  );

  const updateActivePlan = useCallback(
    async (updatedPlan: TrainingPlan) => {
      const current = activePlanRef.current;
      if (!current || !activePlanId) return;

      const updated: PlanWithMetadata = {
        ...current,
        plan: updatedPlan,
        metadata: {
          ...current.metadata,
          updatedAt: Date.now(),
        },
      };

      try {
        await savePlan(updated, userId);
        setActivePlan(updated);
        await refreshPlans();
      } catch (err) {
        console.error("[useMultiPlan] Failed to update plan:", err);
        setError(err instanceof Error ? err.message : "Failed to update plan");
        throw err;
      }
    },
    [userId, activePlanId, refreshPlans],
  );

  const renamePlan = useCallback(
    async (planId: string, newName: string) => {
      const plan = await loadPlanById(planId, userId);
      if (!plan) return;

      const updated: PlanWithMetadata = {
        ...plan,
        metadata: {
          ...plan.metadata,
          name: newName,
          updatedAt: Date.now(),
        },
      };

      try {
        await savePlan(updated, userId);
        if (planId === activePlanId) {
          setActivePlan(updated);
        }
        await refreshPlans();
      } catch (err) {
        console.error("[useMultiPlan] Failed to rename plan:", err);
        setError(err instanceof Error ? err.message : "Failed to rename plan");
        throw err;
      }
    },
    [userId, activePlanId, refreshPlans],
  );

  const removePlan = useCallback(
    async (planId: string) => {
      try {
        await deletePlan(planId, userId);

        // If deleting active plan, switch to another plan
        if (planId === activePlanId) {
          const remaining = plans.filter((p) => p.id !== planId);
          if (remaining.length > 0) {
            await switchActivePlan(remaining[0].id);
          } else {
            setActivePlanIdState(null);
            setActivePlan(null);
          }
        }

        await refreshPlans();
      } catch (err) {
        console.error("[useMultiPlan] Failed to delete plan:", err);
        setError(err instanceof Error ? err.message : "Failed to delete plan");
        throw err;
      }
    },
    [userId, activePlanId, plans, refreshPlans, switchActivePlan],
  );

  const shareActivePlan = useCallback(
    async (userIds: string[]) => {
      if (!activePlanId) return;

      try {
        await sharePlan(activePlanId, userIds, userId);
        const updated = await loadPlanById(activePlanId, userId);
        if (updated) {
          setActivePlan(updated);
        }
        await refreshPlans();
      } catch (err) {
        console.error("[useMultiPlan] Failed to share plan:", err);
        setError(err instanceof Error ? err.message : "Failed to share plan");
        throw err;
      }
    },
    [userId, activePlanId, refreshPlans],
  );

  const copySharedPlan = useCallback(
    async (planId: string, newName: string) => {
      try {
        const newPlanId = await copyPlan(planId, userId, newName);
        await refreshPlans();
        await switchActivePlan(newPlanId);
        return newPlanId;
      } catch (err) {
        console.error("[useMultiPlan] Failed to copy plan:", err);
        setError(err instanceof Error ? err.message : "Failed to copy plan");
        throw err;
      }
    },
    [userId, refreshPlans, switchActivePlan],
  );

  // Derive metadata about active plan
  const isOwned = activePlan?.metadata.ownerId === userId;
  const isShared = activePlan?.metadata.sharedWith.includes(userId) || false;
  const canEdit = isOwned; // Only owners can edit

  return {
    // State
    plans,
    activePlanId,
    activePlan: activePlan?.plan || null,
    activePlanMetadata: activePlan?.metadata || null,
    loading,
    error,
    hasPlan: activePlan !== null,

    // Derived flags
    isOwned,
    isShared,
    canEdit,

    // Actions
    switchActivePlan,
    createPlan,
    updateActivePlan,
    renamePlan,
    removePlan,
    shareActivePlan,
    copySharedPlan,
    refreshPlans,
  };
}
