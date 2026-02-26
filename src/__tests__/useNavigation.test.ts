import { renderHook, act } from "@testing-library/react";
import { useNavigation } from "../hooks/useNavigation";
import { DEFAULT_DAY, DAY_KEYS } from "../data/trainingPlan";

describe("useNavigation", () => {
  it("initialises with default values (no dayKeys)", () => {
    const { result } = renderHook(() => useNavigation());

    expect(result.current.activeDay).toBe(DEFAULT_DAY);
    expect(result.current.selectedExercise).toBeNull();
    expect(result.current.isPanelOpen).toBe(false);
  });

  it("uses first dayKey as initial activeDay when provided", () => {
    const { result } = renderHook(() => useNavigation(DAY_KEYS));
    expect(result.current.activeDay).toBe(DAY_KEYS[0]);
  });

  it("setActiveDay changes the active day", () => {
    const { result } = renderHook(() => useNavigation(DAY_KEYS));
    const secondDay = DAY_KEYS[1];

    act(() => result.current.setActiveDay(secondDay));
    expect(result.current.activeDay).toBe(secondDay);
  });

  it("resets activeDay when dayKeys change and activeDay is invalid", () => {
    const keys1 = ["DayA", "DayB"];
    const keys2 = ["DayC", "DayD"];
    const { result, rerender } = renderHook(
      ({ dayKeys }) => useNavigation(dayKeys),
      { initialProps: { dayKeys: keys1 } },
    );

    act(() => result.current.setActiveDay("DayB"));
    expect(result.current.activeDay).toBe("DayB");

    rerender({ dayKeys: keys2 });
    expect(result.current.activeDay).toBe("DayC");
  });

  it("selectExercise / clearExercise toggle selected exercise and isPanelOpen", () => {
    const { result } = renderHook(() => useNavigation());
    const fakeExercise = { id: "test", name: "Test Exercise" };

    act(() => result.current.selectExercise(fakeExercise));
    expect(result.current.selectedExercise).toEqual(fakeExercise);
    expect(result.current.isPanelOpen).toBe(true);

    act(() => result.current.clearExercise());
    expect(result.current.selectedExercise).toBeNull();
    expect(result.current.isPanelOpen).toBe(false);
  });
});
