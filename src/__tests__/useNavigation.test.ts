import { renderHook, act } from "@testing-library/react";
import { useNavigation } from "../hooks/useNavigation";
import { DEFAULT_DAY, DAY_KEYS } from "../data/trainingPlan";

describe("useNavigation", () => {
  it("initialises with default values", () => {
    const { result } = renderHook(() => useNavigation());

    expect(result.current.view).toBe("plan");
    expect(result.current.activeDay).toBe(DEFAULT_DAY);
    expect(result.current.selectedExercise).toBeNull();
  });

  it("setView changes the current view", () => {
    const { result } = renderHook(() => useNavigation());

    act(() => result.current.setView("log"));
    expect(result.current.view).toBe("log");

    act(() => result.current.setView("progress"));
    expect(result.current.view).toBe("progress");
  });

  it("setActiveDay changes the active day", () => {
    const { result } = renderHook(() => useNavigation());
    const secondDay = DAY_KEYS[1];

    act(() => result.current.setActiveDay(secondDay));
    expect(result.current.activeDay).toBe(secondDay);
  });

  it("selectExercise / clearExercise toggle selected exercise", () => {
    const { result } = renderHook(() => useNavigation());
    const fakeExercise = { id: "test", name: "Test Exercise" };

    act(() => result.current.selectExercise(fakeExercise));
    expect(result.current.selectedExercise).toEqual(fakeExercise);

    act(() => result.current.clearExercise());
    expect(result.current.selectedExercise).toBeNull();
  });
});
