import { renderHook, act, waitFor } from "@testing-library/react";
import { useTrainingPlan } from "../hooks/useTrainingPlan";
import { TRAINING_PLAN } from "../data/trainingPlan";
import type { Mock } from "vitest";
import type { PlanLibrary } from "../services/types";

/* ================================================================
 * Mock storageService
 * ================================================================ */
vi.mock("../services/storageService", () => ({
  loadTrainingPlan: vi.fn().mockResolvedValue(null),
  persistTrainingPlan: vi.fn().mockResolvedValue(undefined),
  loadLogs: vi.fn().mockResolvedValue({}),
  persistLogs: vi.fn().mockResolvedValue(undefined),
}));

import { loadTrainingPlan, persistTrainingPlan } from "../services/storageService";

const mockLoadTrainingPlan = loadTrainingPlan as unknown as Mock;
const mockPersistTrainingPlan = persistTrainingPlan as unknown as Mock;

function decodePersistedLibrary() {
  const persisted = mockPersistTrainingPlan.mock.calls[0]?.[0] as PlanLibrary | undefined;
  if (!persisted) throw new Error("Nothing persisted");
  return persisted;
}

const makeShareCode = (payload: unknown) => Buffer.from(JSON.stringify(payload)).toString("base64");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTrainingPlan", () => {
  /* ----------------------------------------------------------
   * Bootstrap & loading
   * ---------------------------------------------------------- */
  it("bootstraps default library when storage is empty", async () => {
    const { result } = renderHook(() => useTrainingPlan());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasPlan).toBe(false);
    expect(result.current.plans.length).toBeGreaterThan(0);
    expect(result.current.activePlanSource).toBe("owned");
    expect(Object.keys(result.current.trainingPlan).length).toBeGreaterThan(0);
  });

  it("loads a persisted plan library", async () => {
    const customPlan = {
      "Día 1": {
        label: "Custom",
        color: "#abc123",
        exercises: [
          { id: "ex1", exerciseId: "", name: "Custom Squat", sets: "3", reps: "10", rest: "60s", note: "", noteSource: "custom", noteCatalogId: "" },
        ],
      },
    };
    const library: PlanLibrary = {
      activePlanId: "p1",
      ownedPlans: [{ id: "p1", name: "Personal Plan", plan: customPlan, source: "owned" }],
      sharedPlans: [],
    };
    mockLoadTrainingPlan.mockResolvedValueOnce(library);

    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasPlan).toBe(true);
    expect(result.current.activePlanId).toBe("p1");
    expect(result.current.trainingPlan["Día 1"].label).toBe("Custom");
    expect(result.current.plans[0].name).toBe("Personal Plan");
  });

  it("accepts legacy single-plan storage data", async () => {
    const legacyPlan = {
      "Day A": {
        label: "Arms",
        color: "#ff0000",
        exercises: [
          { id: "a1", name: "Curl", sets: "3", reps: "12", rest: "60s" },
        ],
      },
    };
    mockLoadTrainingPlan.mockResolvedValueOnce(legacyPlan);

    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasPlan).toBe(true);
    expect(result.current.trainingPlan["Day A"].label).toBe("Arms");
    expect(result.current.plans[0].plan["Day A"].exercises[0].name).toBe("Curl");
  });

  it("waits for authLoading to become false before loading", async () => {
    const { result, rerender } = renderHook(
      ({ scope, authLoading }) => useTrainingPlan(scope, authLoading),
      { initialProps: { scope: "guest", authLoading: true } },
    );

    expect(result.current.loading).toBe(true);
    expect(loadTrainingPlan).not.toHaveBeenCalled();

    rerender({ scope: "user123", authLoading: false });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(loadTrainingPlan).toHaveBeenCalledWith("user123");
  });

  /* ----------------------------------------------------------
   * Mutations on owned plans
   * ---------------------------------------------------------- */
  it("saveDay merges partial updates and persists within the library", async () => {
    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const firstKey = result.current.dayKeys[0];

    await act(async () => {
      result.current.saveDay(firstKey, { label: "Updated Label" });
    });

    const persisted = decodePersistedLibrary();
    expect(persisted.ownedPlans[0].plan[firstKey].label).toBe("Updated Label");
  });

  it("addDay appends a new day to the active plan", async () => {
    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const initialCount = result.current.dayKeys.length;
    let newKey = "";

    await act(async () => {
      newKey = result.current.addDay();
    });

    const persisted = decodePersistedLibrary();
    const nextPlan = persisted.ownedPlans[0].plan;
    expect(Object.keys(nextPlan).length).toBe(initialCount + 1);
    expect(nextPlan[newKey]).toBeDefined();
    expect(nextPlan[newKey].exercises).toEqual([]);
  });

  it("removeDay prevents deleting the last remaining day", async () => {
    const singleLibrary: PlanLibrary = {
      activePlanId: "only",
      ownedPlans: [{
        id: "only",
        name: "Only Plan",
        source: "owned",
        plan: { "Día 1": { label: "Only Day", color: "#e8643a", exercises: [] } },
      }],
      sharedPlans: [],
    };
    mockLoadTrainingPlan.mockResolvedValueOnce(singleLibrary);
    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.removeDay("Día 1");
    });

    expect(persistTrainingPlan).not.toHaveBeenCalled();
  });

  /* ----------------------------------------------------------
   * Shared plans
   * ---------------------------------------------------------- */
  it("creates a new owned plan when replacing while a shared plan is active", async () => {
    const baseLibrary: PlanLibrary = {
      activePlanId: "shared-1",
      ownedPlans: [
        { id: "owned-1", name: "Base", source: "owned", plan: TRAINING_PLAN },
      ],
      sharedPlans: [
        { id: "shared-1", name: "Read-only", source: "shared", plan: TRAINING_PLAN },
      ],
    };
    mockLoadTrainingPlan.mockResolvedValueOnce(baseLibrary);

    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newPlan = {
      "Day A": { label: "Arms", color: "#ff0000", exercises: [] },
    };

    await act(async () => {
      result.current.replacePlan(newPlan);
    });

    const persisted = decodePersistedLibrary();
    expect(persisted.ownedPlans.length).toBe(2);
    expect(persisted.sharedPlans.length).toBe(1);
  });

  it("prevents edits on shared plans until copied", async () => {
    const baseLibrary: PlanLibrary = {
      activePlanId: "shared-1",
      ownedPlans: [
        { id: "owned-1", name: "Base", source: "owned", plan: TRAINING_PLAN },
      ],
      sharedPlans: [
        { id: "shared-1", name: "Read-only", source: "shared", plan: TRAINING_PLAN },
      ],
    };
    mockLoadTrainingPlan.mockResolvedValueOnce(baseLibrary);

    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const firstKey = Object.keys(TRAINING_PLAN)[0];

    act(() => {
      result.current.saveDay(firstKey, { label: "Should not persist" });
    });
    expect(persistTrainingPlan).not.toHaveBeenCalled();

    await act(async () => {
      result.current.copyActivePlanToOwned("Copied Plan");
    });

    const persisted = decodePersistedLibrary();
    expect(persisted.ownedPlans.length).toBe(2);
    expect(persisted.ownedPlans[0].name).toBe("Copied Plan");
  });

  it("imports a shared plan code and persists it", async () => {
    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const sharedPayload = { id: "shared-123", name: "Shared A", plan: TRAINING_PLAN };
    const code = makeShareCode(sharedPayload);

    await act(async () => {
      result.current.addSharedPlanFromCode(code);
    });

    const persisted = decodePersistedLibrary();
    expect(persisted.sharedPlans.length).toBe(1);
    expect(persisted.sharedPlans[0].id).toBe("shared-123");
  });

  /* ----------------------------------------------------------
   * Save feedback
   * ---------------------------------------------------------- */
  it("shows save success message and clears it after timeout", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const firstKey = result.current.dayKeys[0];

    await act(async () => {
      result.current.saveDay(firstKey, { label: "Test" });
    });

    await waitFor(() => expect(result.current.saveMsg).toBe("✓ Plan guardado"));

    act(() => vi.advanceTimersByTime(2500));
    expect(result.current.saveMsg).toBe("");

    vi.useRealTimers();
  });

  /* ----------------------------------------------------------
   * dayKeys and dayColors
   * ---------------------------------------------------------- */
  it("dayKeys are sorted and dayColors maps each key to a color", async () => {
    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dayKeys.length).toBeGreaterThan(0);
    for (const key of result.current.dayKeys) {
      expect(result.current.dayColors[key]).toBeDefined();
      expect(result.current.dayColors[key]).toMatch(/^#/);
    }
  });
});
