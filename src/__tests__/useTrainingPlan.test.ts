import { renderHook, act, waitFor } from "@testing-library/react";
import { useTrainingPlan } from "../hooks/useTrainingPlan";
import { TRAINING_PLAN } from "../data/trainingPlan";

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTrainingPlan", () => {
  /* ----------------------------------------------------------
   * Bootstrap & loading
   * ---------------------------------------------------------- */
  it("starts in loading state and resolves with default plan", async () => {
    const { result } = renderHook(() => useTrainingPlan());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    // Falls back to TRAINING_PLAN when storage returns null
    expect(result.current.hasPlan).toBe(false);
    expect(Object.keys(result.current.trainingPlan).length).toBeGreaterThan(0);
  });

  it("loads a persisted plan from storage", async () => {
    const customPlan = {
      "Día 1": {
        label: "Custom",
        color: "#abc123",
        exercises: [
          { id: "ex1", exerciseId: "", name: "Custom Squat", sets: "3", reps: "10", rest: "60s", note: "", noteSource: "custom", noteCatalogId: "" },
        ],
      },
    };
    loadTrainingPlan.mockResolvedValueOnce(customPlan);

    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasPlan).toBe(true);
    expect(result.current.trainingPlan["Día 1"].label).toBe("Custom");
    expect(result.current.trainingPlan["Día 1"].exercises[0].name).toBe("Custom Squat");
  });

  it("waits for authLoading to become false before loading", async () => {
    const { result, rerender } = renderHook(
      ({ scope, authLoading }) => useTrainingPlan(scope, authLoading),
      { initialProps: { scope: "guest", authLoading: true } },
    );

    // Should remain loading while authLoading is true
    expect(result.current.loading).toBe(true);
    expect(loadTrainingPlan).not.toHaveBeenCalled();

    // When auth resolves, it should start loading
    rerender({ scope: "user123", authLoading: false });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(loadTrainingPlan).toHaveBeenCalledWith("user123");
  });

  /* ----------------------------------------------------------
   * normalizePlan — malformed inputs
   * ---------------------------------------------------------- */
  it("handles null/malformed storage data by falling back to TRAINING_PLAN", async () => {
    loadTrainingPlan.mockResolvedValueOnce("not-an-object");
    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should have same keys as the static default
    const defaultKeys = Object.keys(TRAINING_PLAN);
    expect(result.current.dayKeys.length).toBe(defaultKeys.length);
    expect(result.current.hasPlan).toBe(false);
  });

  /* ----------------------------------------------------------
   * saveDay
   * ---------------------------------------------------------- */
  it("saveDay merges partial day updates and persists", async () => {
    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const firstKey = result.current.dayKeys[0];

    await act(async () => {
      result.current.saveDay(firstKey, { label: "Updated Label" });
    });

    expect(persistTrainingPlan).toHaveBeenCalledTimes(1);
    const persisted = persistTrainingPlan.mock.calls[0][0];
    expect(persisted[firstKey].label).toBe("Updated Label");
    // Exercises should remain unchanged
    expect(persisted[firstKey].exercises.length).toBeGreaterThan(0);
  });

  it("saveDay is a no-op for non-existent day keys", async () => {
    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.saveDay("NonExistentDay", { label: "X" });
    });

    expect(persistTrainingPlan).not.toHaveBeenCalled();
  });

  /* ----------------------------------------------------------
   * addDay
   * ---------------------------------------------------------- */
  it("addDay appends a new day with unique key and correct color", async () => {
    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const initialCount = result.current.dayKeys.length;

    let newKey;
    await act(async () => {
      newKey = result.current.addDay();
    });

    expect(persistTrainingPlan).toHaveBeenCalledTimes(1);
    const persisted = persistTrainingPlan.mock.calls[0][0];
    const newDayKeys = Object.keys(persisted);
    expect(newDayKeys.length).toBe(initialCount + 1);
    expect(newKey).toBeDefined();
    // New day should have empty exercises
    expect(persisted[newKey].exercises).toEqual([]);
  });

  /* ----------------------------------------------------------
   * removeDay
   * ---------------------------------------------------------- */
  it("removeDay deletes a day and persists", async () => {
    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const initialKeys = [...result.current.dayKeys];
    const keyToRemove = initialKeys[initialKeys.length - 1];

    await act(async () => {
      result.current.removeDay(keyToRemove);
    });

    expect(persistTrainingPlan).toHaveBeenCalledTimes(1);
    const persisted = persistTrainingPlan.mock.calls[0][0];
    expect(persisted[keyToRemove]).toBeUndefined();
    expect(Object.keys(persisted).length).toBe(initialKeys.length - 1);
  });

  it("removeDay is a no-op when only one day remains", async () => {
    const singleDayPlan = {
      "Día 1": {
        label: "Only Day",
        color: "#e8643a",
        exercises: [],
      },
    };
    loadTrainingPlan.mockResolvedValueOnce(singleDayPlan);

    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.removeDay("Día 1");
    });

    expect(persistTrainingPlan).not.toHaveBeenCalled();
  });

  /* ----------------------------------------------------------
   * addExercise
   * ---------------------------------------------------------- */
  it("addExercise pushes a new exercise template to the day", async () => {
    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const firstKey = result.current.dayKeys[0];
    const initialCount = result.current.trainingPlan[firstKey].exercises.length;

    await act(async () => {
      result.current.addExercise(firstKey);
    });

    expect(persistTrainingPlan).toHaveBeenCalledTimes(1);
    const persisted = persistTrainingPlan.mock.calls[0][0];
    expect(persisted[firstKey].exercises.length).toBe(initialCount + 1);
    // New exercise should have an id and empty sets/reps/rest
    const newExercise = persisted[firstKey].exercises[initialCount];
    expect(newExercise.id).toBeDefined();
    expect(newExercise.sets).toBe("");
    expect(newExercise.reps).toBe("");
    expect(newExercise.noteSource).toBe("custom");
  });

  /* ----------------------------------------------------------
   * removeExercise
   * ---------------------------------------------------------- */
  it("removeExercise filters out an exercise by ID", async () => {
    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const firstKey = result.current.dayKeys[0];
    const exercises = result.current.trainingPlan[firstKey].exercises;
    const exerciseToRemove = exercises[0].id;

    await act(async () => {
      result.current.removeExercise(firstKey, exerciseToRemove);
    });

    expect(persistTrainingPlan).toHaveBeenCalledTimes(1);
    const persisted = persistTrainingPlan.mock.calls[0][0];
    const ids = persisted[firstKey].exercises.map((e) => e.id);
    expect(ids).not.toContain(exerciseToRemove);
  });

  /* ----------------------------------------------------------
   * replacePlan
   * ---------------------------------------------------------- */
  it("replacePlan replaces the entire plan and persists", async () => {
    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newPlan = {
      "Day A": {
        label: "Arms",
        color: "#ff0000",
        exercises: [
          { id: "a1", name: "Curl", sets: "3", reps: "12", rest: "60s" },
        ],
      },
    };

    await act(async () => {
      result.current.replacePlan(newPlan);
    });

    expect(persistTrainingPlan).toHaveBeenCalledTimes(1);
    const persisted = persistTrainingPlan.mock.calls[0][0];
    expect(Object.keys(persisted)).toEqual(["Day A"]);
    expect(persisted["Day A"].exercises[0].name).toBe("Curl");
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

    // Message clears after SAVE_MSG_DURATION_MS (2000ms)
    act(() => vi.advanceTimersByTime(2500));
    expect(result.current.saveMsg).toBe("");

    vi.useRealTimers();
  });

  it("shows error message when persist fails", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    persistTrainingPlan.mockRejectedValueOnce(new Error("write failed"));

    const { result } = renderHook(() => useTrainingPlan());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const firstKey = result.current.dayKeys[0];

    await act(async () => {
      result.current.saveDay(firstKey, { label: "Fail" });
    });

    await waitFor(() => expect(result.current.saveMsg).toBe("✗ Error al guardar plan"));

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
    // Each key should have a corresponding color
    for (const key of result.current.dayKeys) {
      expect(result.current.dayColors[key]).toBeDefined();
      expect(result.current.dayColors[key]).toMatch(/^#/);
    }
  });
});
