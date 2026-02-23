import { renderHook, act, waitFor } from "@testing-library/react";
import { useTrainingLogs } from "../hooks/useTrainingLogs";

/* ================================================================
 * Mock storageService so tests don't touch real localStorage
 * ================================================================ */
vi.mock("../services/storageService", () => ({
  loadLogs: vi.fn().mockResolvedValue({}),
  persistLogs: vi.fn().mockResolvedValue(undefined),
}));

import { loadLogs, persistLogs } from "../services/storageService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTrainingLogs", () => {
  it("starts in loading state and resolves", async () => {
    const { result } = renderHook(() => useTrainingLogs());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.logs).toEqual({});
  });

  it("loads existing logs from storage", async () => {
    const stored = { ex1: [{ date: "d", weight: "50", reps: "10", notes: "" }] };
    loadLogs.mockResolvedValueOnce(stored);

    const { result } = renderHook(() => useTrainingLogs());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.logs).toEqual(stored);
  });

  it("addLog creates a new entry and persists", async () => {
    const { result } = renderHook(() => useTrainingLogs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addLog("ex1", { weight: "60", reps: "8", notes: "test" });
    });

    expect(persistLogs).toHaveBeenCalledTimes(1);
    const persisted = persistLogs.mock.calls[0][0];
    expect(persisted.ex1).toHaveLength(1);
    expect(persisted.ex1[0].weight).toBe("60");
    expect(persisted.ex1[0].reps).toBe("8");
    expect(persisted.ex1[0].notes).toBe("test");
    expect(persisted.ex1[0].date).toBeDefined();
  });

  it("addLog ignores empty weight AND reps", async () => {
    const { result } = renderHook(() => useTrainingLogs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addLog("ex1", { weight: "", reps: "", notes: "skip" });
    });

    expect(persistLogs).not.toHaveBeenCalled();
  });

  it("deleteLog removes entry by index and persists", async () => {
    const entry1 = { date: "d1", weight: "40", reps: "10", notes: "" };
    const entry2 = { date: "d2", weight: "50", reps: "8", notes: "" };
    loadLogs.mockResolvedValueOnce({ ex1: [entry1, entry2] });

    const { result } = renderHook(() => useTrainingLogs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.deleteLog("ex1", 0);
    });

    const persisted = persistLogs.mock.calls[0][0];
    expect(persisted.ex1).toHaveLength(1);
    expect(persisted.ex1[0]).toEqual(entry2);
  });

  it("shows save message after successful persist", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { result } = renderHook(() => useTrainingLogs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addLog("ex1", { weight: "70", reps: "6", notes: "" });
    });

    await waitFor(() => expect(result.current.saveMsg).toBe("✓ Guardado"));

    // Message clears after timeout
    act(() => vi.advanceTimersByTime(2500));
    expect(result.current.saveMsg).toBe("");

    vi.useRealTimers();
  });
});
