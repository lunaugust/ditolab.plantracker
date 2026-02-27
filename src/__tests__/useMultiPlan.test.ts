import { renderHook, act, waitFor } from "@testing-library/react";
import { useMultiPlan } from "../hooks/useMultiPlan";
import { TRAINING_PLAN } from "../data/trainingPlan";
import type { Mock } from "vitest";
import type { PlanWithMetadata } from "../services/types";

/* ================================================================
 * Mock storageService
 * ================================================================ */
vi.mock("../services/storageService", () => ({
  getActivePlanId: vi.fn().mockResolvedValue(null),
  setActivePlanId: vi.fn().mockResolvedValue(undefined),
  listPlans: vi.fn().mockResolvedValue([]),
  loadPlanById: vi.fn().mockResolvedValue(null),
  savePlan: vi.fn().mockResolvedValue(undefined),
  deletePlan: vi.fn().mockResolvedValue(undefined),
  sharePlan: vi.fn().mockResolvedValue(undefined),
  copyPlan: vi.fn().mockResolvedValue("plan_copied_123"),
  loadTrainingPlan: vi.fn().mockResolvedValue(null),
}));

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

const mockGetActivePlanId = getActivePlanId as unknown as Mock;
const mockSetActivePlanId = setActivePlanId as unknown as Mock;
const mockListPlans = listPlans as unknown as Mock;
const mockLoadPlanById = loadPlanById as unknown as Mock;
const mockSavePlan = savePlan as unknown as Mock;
const mockDeletePlan = deletePlan as unknown as Mock;
const mockSharePlan = sharePlan as unknown as Mock;
const mockCopyPlan = copyPlan as unknown as Mock;
const mockLoadTrainingPlan = loadTrainingPlan as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useMultiPlan", () => {
  /* ----------------------------------------------------------
   * Bootstrap & loading
   * ---------------------------------------------------------- */
  it("starts in loading state and resolves with no plans", async () => {
    const { result } = renderHook(() => useMultiPlan("guest", false));
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasPlan).toBe(false);
    expect(result.current.plans).toEqual([]);
    expect(result.current.activePlanId).toBeNull();
    expect(result.current.activePlan).toBeNull();
  });

  it("waits for authLoading to become false before loading", async () => {
    const { result, rerender } = renderHook(
      ({ userId, authLoading }) => useMultiPlan(userId, authLoading),
      { initialProps: { userId: "guest", authLoading: true } },
    );

    // Should remain loading while authLoading is true
    expect(result.current.loading).toBe(true);
    expect(getActivePlanId).not.toHaveBeenCalled();

    // When auth resolves, it should start loading
    rerender({ userId: "user123", authLoading: false });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getActivePlanId).toHaveBeenCalledWith("user123");
  });

  /* ----------------------------------------------------------
   * Multi-plan mode: load existing plans
   * ---------------------------------------------------------- */
  it("loads existing multi-plan setup", async () => {
    const plan1: PlanWithMetadata = {
      metadata: {
        id: "plan_1",
        name: "My Plan",
        ownerId: "user123",
        createdAt: 1000,
        updatedAt: 1000,
        isShared: false,
        sharedWith: [],
        source: "manual",
      },
      plan: TRAINING_PLAN,
    };

    const plan2: PlanWithMetadata = {
      metadata: {
        id: "plan_2",
        name: "Other Plan",
        ownerId: "user123",
        createdAt: 2000,
        updatedAt: 2000,
        isShared: false,
        sharedWith: [],
        source: "generated",
      },
      plan: {},
    };

    mockGetActivePlanId.mockResolvedValueOnce("plan_1");
    mockListPlans.mockResolvedValueOnce([plan1.metadata, plan2.metadata]);
    mockLoadPlanById.mockResolvedValueOnce(plan1);

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasPlan).toBe(true);
    expect(result.current.plans.length).toBe(2);
    expect(result.current.activePlanId).toBe("plan_1");
    expect(result.current.activePlanMetadata?.name).toBe("My Plan");
    expect(result.current.isOwned).toBe(true);
    expect(result.current.canEdit).toBe(true);
  });

  /* ----------------------------------------------------------
   * Legacy migration: single plan to multi-plan
   * ---------------------------------------------------------- */
  it("migrates legacy single plan to multi-plan on first load", async () => {
    const legacyPlan = {
      "Día 1": {
        label: "Legacy Day",
        color: "#e8643a",
        exercises: [
          {
            id: "ex1",
            exerciseId: "",
            name: "Legacy Exercise",
            sets: "3",
            reps: "10",
            rest: "60s",
            note: "",
            noteSource: "custom" as const,
            noteCatalogId: "",
          },
        ],
      },
    };

    mockGetActivePlanId.mockResolvedValueOnce(null); // No active plan ID
    mockLoadTrainingPlan.mockResolvedValueOnce(legacyPlan); // Has legacy plan

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should have migrated the legacy plan
    expect(savePlan).toHaveBeenCalledTimes(1);
    expect(setActivePlanId).toHaveBeenCalledTimes(1);

    const savedPlan = mockSavePlan.mock.calls[0][0] as PlanWithMetadata;
    expect(savedPlan.metadata.name).toBe("Mi Plan");
    expect(savedPlan.metadata.ownerId).toBe("user123");
    expect(savedPlan.metadata.source).toBe("manual");
    expect(savedPlan.plan).toEqual(legacyPlan);

    // Active plan should be set
    const activePlanId = mockSetActivePlanId.mock.calls[0][1] as string;
    expect(activePlanId).toMatch(/^plan_\d+_migrated$/);
  });

  /* ----------------------------------------------------------
   * CHECKLIST ITEM 1: Create a new plan
   * ---------------------------------------------------------- */
  it("creates a new plan with metadata and switches to it", async () => {
    mockGetActivePlanId.mockResolvedValueOnce(null);
    mockListPlans.mockResolvedValue([]);

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newPlan = {
      "Día 1": {
        label: "New Day",
        color: "#e8643a",
        exercises: [],
      },
    };

    let createdPlanId: string | undefined;

    // Mock loadPlanById to return the plan that was just saved
    mockLoadPlanById.mockImplementation((planId: string) => {
      const savedPlan = mockSavePlan.mock.calls[0]?.[0] as PlanWithMetadata | undefined;
      if (savedPlan && planId === savedPlan.metadata.id) {
        return Promise.resolve(savedPlan);
      }
      return Promise.resolve(null);
    });

    await act(async () => {
      createdPlanId = await result.current.createPlan("Test Plan", newPlan, "manual");
    });

    // Should have saved the plan
    expect(savePlan).toHaveBeenCalledTimes(1);
    const savedPlan = mockSavePlan.mock.calls[0][0] as PlanWithMetadata;
    expect(savedPlan.metadata.name).toBe("Test Plan");
    expect(savedPlan.metadata.ownerId).toBe("user123");
    expect(savedPlan.metadata.source).toBe("manual");
    expect(savedPlan.metadata.isShared).toBe(false);
    expect(savedPlan.metadata.sharedWith).toEqual([]);
    expect(savedPlan.plan).toEqual(newPlan);
    expect(createdPlanId).toBeDefined();
    expect(createdPlanId).toMatch(/^plan_\d+_[a-z0-9]+$/);

    // Should have refreshed plans list
    expect(listPlans).toHaveBeenCalled();

    // Should have switched to the new plan (calls loadPlanById and setActivePlanId)
    expect(loadPlanById).toHaveBeenCalledWith(createdPlanId, "user123");
    expect(setActivePlanId).toHaveBeenCalledWith("user123", createdPlanId);
  });

  it("creates a plan with default source when not specified", async () => {
    mockGetActivePlanId.mockResolvedValueOnce(null);
    mockListPlans.mockResolvedValue([]);

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createPlan("Generated Plan", {});
    });

    const savedPlan = mockSavePlan.mock.calls[0][0] as PlanWithMetadata;
    expect(savedPlan.metadata.source).toBe("manual");
  });

  it("handles errors when creating a plan", async () => {
    mockGetActivePlanId.mockResolvedValueOnce(null);
    mockListPlans.mockResolvedValue([]);
    mockSavePlan.mockRejectedValueOnce(new Error("Save failed"));

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let error: unknown;
    await act(async () => {
      try {
        await result.current.createPlan("Fail Plan", {}, "generated");
      } catch (err) {
        error = err;
      }
    });

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Save failed");
    expect(result.current.error).toBe("Save failed");
  });

  /* ----------------------------------------------------------
   * CHECKLIST ITEM 2: Switch between plans
   * ---------------------------------------------------------- */
  it("switches active plan to a different plan", async () => {
    const plan1: PlanWithMetadata = {
      metadata: {
        id: "plan_1",
        name: "Plan 1",
        ownerId: "user123",
        createdAt: 1000,
        updatedAt: 1000,
        isShared: false,
        sharedWith: [],
        source: "manual",
      },
      plan: { "Día 1": { label: "Day 1", color: "#e8643a", exercises: [] } },
    };

    const plan2: PlanWithMetadata = {
      metadata: {
        id: "plan_2",
        name: "Plan 2",
        ownerId: "user123",
        createdAt: 2000,
        updatedAt: 2000,
        isShared: false,
        sharedWith: [],
        source: "generated",
      },
      plan: { "Día 2": { label: "Day 2", color: "#3ab8e8", exercises: [] } },
    };

    mockGetActivePlanId.mockResolvedValueOnce("plan_1");
    mockListPlans.mockResolvedValueOnce([plan1.metadata, plan2.metadata]);
    mockLoadPlanById.mockResolvedValueOnce(plan1);

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Initially on plan_1
    expect(result.current.activePlanId).toBe("plan_1");
    expect(result.current.activePlanMetadata?.name).toBe("Plan 1");

    // Mock loading plan_2
    mockLoadPlanById.mockResolvedValueOnce(plan2);

    // Switch to plan_2
    await act(async () => {
      await result.current.switchActivePlan("plan_2");
    });

    // Should have loaded plan_2
    expect(loadPlanById).toHaveBeenCalledWith("plan_2", "user123");
    expect(setActivePlanId).toHaveBeenCalledWith("user123", "plan_2");

    // State should be updated
    await waitFor(() => expect(result.current.activePlanId).toBe("plan_2"));
    expect(result.current.activePlanMetadata?.name).toBe("Plan 2");
    expect(result.current.activePlan).toEqual(plan2.plan);
  });

  it("handles errors when switching plans", async () => {
    const plan1: PlanWithMetadata = {
      metadata: {
        id: "plan_1",
        name: "Plan 1",
        ownerId: "user123",
        createdAt: 1000,
        updatedAt: 1000,
        isShared: false,
        sharedWith: [],
        source: "manual",
      },
      plan: {},
    };

    mockGetActivePlanId.mockResolvedValueOnce("plan_1");
    mockListPlans.mockResolvedValueOnce([plan1.metadata]);
    mockLoadPlanById.mockResolvedValueOnce(plan1);

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockLoadPlanById.mockRejectedValueOnce(new Error("Load failed"));

    await act(async () => {
      await result.current.switchActivePlan("plan_2");
    });

    expect(result.current.error).toBe("Load failed");
  });

  /* ----------------------------------------------------------
   * Update active plan
   * ---------------------------------------------------------- */
  it("updates the active plan and persists changes", async () => {
    const originalPlan: PlanWithMetadata = {
      metadata: {
        id: "plan_1",
        name: "Plan 1",
        ownerId: "user123",
        createdAt: 1000,
        updatedAt: 1000,
        isShared: false,
        sharedWith: [],
        source: "manual",
      },
      plan: { "Día 1": { label: "Original", color: "#e8643a", exercises: [] } },
    };

    mockGetActivePlanId.mockResolvedValueOnce("plan_1");
    mockListPlans.mockResolvedValue([originalPlan.metadata]);
    mockLoadPlanById.mockResolvedValueOnce(originalPlan);

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updatedPlanData = {
      "Día 1": { label: "Updated", color: "#e8643a", exercises: [] },
    };

    await act(async () => {
      await result.current.updateActivePlan(updatedPlanData);
    });

    // Should have saved the updated plan
    expect(savePlan).toHaveBeenCalledTimes(1);
    const savedPlan = mockSavePlan.mock.calls[0][0] as PlanWithMetadata;
    expect(savedPlan.metadata.id).toBe("plan_1");
    expect(savedPlan.metadata.updatedAt).toBeGreaterThan(1000);
    expect(savedPlan.plan).toEqual(updatedPlanData);

    // Should have refreshed plans list
    expect(listPlans).toHaveBeenCalled();
  });

  /* ----------------------------------------------------------
   * Rename plan
   * ---------------------------------------------------------- */
  it("renames a plan and persists", async () => {
    const plan1: PlanWithMetadata = {
      metadata: {
        id: "plan_1",
        name: "Old Name",
        ownerId: "user123",
        createdAt: 1000,
        updatedAt: 1000,
        isShared: false,
        sharedWith: [],
        source: "manual",
      },
      plan: {},
    };

    mockGetActivePlanId.mockResolvedValueOnce("plan_1");
    mockListPlans.mockResolvedValue([plan1.metadata]);
    mockLoadPlanById.mockResolvedValue(plan1);

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.renamePlan("plan_1", "New Name");
    });

    // Should have saved with new name
    expect(savePlan).toHaveBeenCalledTimes(1);
    const savedPlan = mockSavePlan.mock.calls[0][0] as PlanWithMetadata;
    expect(savedPlan.metadata.name).toBe("New Name");
    expect(savedPlan.metadata.updatedAt).toBeGreaterThan(1000);
  });

  /* ----------------------------------------------------------
   * Delete plan
   * ---------------------------------------------------------- */
  it("deletes a plan and switches to another if it was active", async () => {
    const plan1: PlanWithMetadata = {
      metadata: {
        id: "plan_1",
        name: "Plan 1",
        ownerId: "user123",
        createdAt: 1000,
        updatedAt: 1000,
        isShared: false,
        sharedWith: [],
        source: "manual",
      },
      plan: {},
    };

    const plan2: PlanWithMetadata = {
      metadata: {
        id: "plan_2",
        name: "Plan 2",
        ownerId: "user123",
        createdAt: 2000,
        updatedAt: 2000,
        isShared: false,
        sharedWith: [],
        source: "manual",
      },
      plan: {},
    };

    mockGetActivePlanId.mockResolvedValueOnce("plan_1");
    mockListPlans.mockResolvedValue([plan1.metadata, plan2.metadata]);
    mockLoadPlanById.mockResolvedValueOnce(plan1);

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mock loading plan_2 after deletion
    mockLoadPlanById.mockResolvedValueOnce(plan2);

    await act(async () => {
      await result.current.removePlan("plan_1");
    });

    // Should have deleted the plan
    expect(deletePlan).toHaveBeenCalledWith("plan_1", "user123");

    // Should have switched to plan_2
    expect(loadPlanById).toHaveBeenCalledWith("plan_2", "user123");
  });

  /* ----------------------------------------------------------
   * Sharing
   * ---------------------------------------------------------- */
  it("shares the active plan with other users", async () => {
    const plan1: PlanWithMetadata = {
      metadata: {
        id: "plan_1",
        name: "Shared Plan",
        ownerId: "user123",
        createdAt: 1000,
        updatedAt: 1000,
        isShared: false,
        sharedWith: [],
        source: "manual",
      },
      plan: {},
    };

    mockGetActivePlanId.mockResolvedValueOnce("plan_1");
    mockListPlans.mockResolvedValue([plan1.metadata]);
    mockLoadPlanById.mockResolvedValue(plan1);

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const sharedPlan: PlanWithMetadata = {
      ...plan1,
      metadata: {
        ...plan1.metadata,
        isShared: true,
        sharedWith: ["user456"],
      },
    };
    mockLoadPlanById.mockResolvedValueOnce(sharedPlan);

    await act(async () => {
      await result.current.shareActivePlan(["user456"]);
    });

    // Should have called sharePlan
    expect(sharePlan).toHaveBeenCalledWith("plan_1", ["user456"], "user123");

    // Should have reloaded the plan
    expect(loadPlanById).toHaveBeenCalledWith("plan_1", "user123");
  });

  it("copies a shared plan to owned plans", async () => {
    const sharedPlan: PlanWithMetadata = {
      metadata: {
        id: "plan_shared",
        name: "Shared Plan",
        ownerId: "otherUser",
        createdAt: 1000,
        updatedAt: 1000,
        isShared: true,
        sharedWith: ["user123"],
        source: "manual",
      },
      plan: {},
    };

    mockGetActivePlanId.mockResolvedValueOnce("plan_shared");
    mockListPlans.mockResolvedValue([sharedPlan.metadata]);
    mockLoadPlanById.mockResolvedValue(sharedPlan);

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mock the new copied plan
    const copiedPlan: PlanWithMetadata = {
      metadata: {
        id: "plan_copied_123",
        name: "My Copy",
        ownerId: "user123",
        createdAt: 3000,
        updatedAt: 3000,
        isShared: false,
        sharedWith: [],
        source: "manual",
      },
      plan: {},
    };
    mockCopyPlan.mockResolvedValueOnce("plan_copied_123");
    mockLoadPlanById.mockResolvedValueOnce(copiedPlan);

    await act(async () => {
      const newId = await result.current.copySharedPlan("plan_shared", "My Copy");
      expect(newId).toBe("plan_copied_123");
    });

    // Should have called copyPlan
    expect(copyPlan).toHaveBeenCalledWith("plan_shared", "user123", "My Copy");

    // Should have switched to the new plan
    expect(loadPlanById).toHaveBeenCalledWith("plan_copied_123", "user123");
  });

  /* ----------------------------------------------------------
   * Ownership flags
   * ---------------------------------------------------------- */
  it("correctly identifies owned plans", async () => {
    const ownedPlan: PlanWithMetadata = {
      metadata: {
        id: "plan_1",
        name: "My Plan",
        ownerId: "user123",
        createdAt: 1000,
        updatedAt: 1000,
        isShared: false,
        sharedWith: [],
        source: "manual",
      },
      plan: {},
    };

    mockGetActivePlanId.mockResolvedValueOnce("plan_1");
    mockListPlans.mockResolvedValueOnce([ownedPlan.metadata]);
    mockLoadPlanById.mockResolvedValueOnce(ownedPlan);

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isOwned).toBe(true);
    expect(result.current.isShared).toBe(false);
    expect(result.current.canEdit).toBe(true);
  });

  it("correctly identifies shared plans (read-only)", async () => {
    const sharedPlan: PlanWithMetadata = {
      metadata: {
        id: "plan_shared",
        name: "Shared Plan",
        ownerId: "otherUser",
        createdAt: 1000,
        updatedAt: 1000,
        isShared: true,
        sharedWith: ["user123"],
        source: "manual",
      },
      plan: {},
    };

    mockGetActivePlanId.mockResolvedValueOnce("plan_shared");
    mockListPlans.mockResolvedValueOnce([sharedPlan.metadata]);
    mockLoadPlanById.mockResolvedValueOnce(sharedPlan);

    const { result } = renderHook(() => useMultiPlan("user123", false));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isOwned).toBe(false);
    expect(result.current.isShared).toBe(true);
    expect(result.current.canEdit).toBe(false);
  });
});
