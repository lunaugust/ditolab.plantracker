import { renderHook, act, waitFor } from "@testing-library/react";
import { useWorkoutSessions } from "../hooks/useWorkoutSessions";
import type { Mock } from "vitest";

vi.mock("../services/storageService", () => ({
  loadWorkoutSessions: vi.fn().mockResolvedValue([]),
  persistWorkoutSessions: vi.fn().mockResolvedValue(undefined),
}));

import { loadWorkoutSessions, persistWorkoutSessions } from "../services/storageService";

const mockLoadWorkoutSessions = loadWorkoutSessions as unknown as Mock;
const mockPersistWorkoutSessions = persistWorkoutSessions as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useWorkoutSessions", () => {
  it("loads stored workout sessions", async () => {
    const stored = [{ id: "s1", dayKey: "Día 1", dayLabel: "Push", startedAt: "2026-03-09T18:00:00.000Z", endedAt: "2026-03-09T18:30:00.000Z", durationSeconds: 1800, totalExercises: 3, completedExercises: 3, totalLoggedSets: 9, completed: true, exercises: [] }];
    mockLoadWorkoutSessions.mockResolvedValueOnce(stored);

    const { result } = renderHook(() => useWorkoutSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sessions).toEqual(stored);
  });

  it("prepends and persists a new session", async () => {
    const { result } = renderHook(() => useWorkoutSessions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const session = { id: "s1", dayKey: "Día 1", dayLabel: "Push", startedAt: "2026-03-09T18:00:00.000Z", endedAt: "2026-03-09T18:30:00.000Z", durationSeconds: 1800, totalExercises: 3, completedExercises: 2, totalLoggedSets: 7, completed: false, exercises: [] };

    await act(async () => {
      result.current.addSession(session);
    });

    expect(mockPersistWorkoutSessions).toHaveBeenCalledTimes(1);
    expect(mockPersistWorkoutSessions.mock.calls[0][0][0]).toEqual(session);
  });
});