import { useState, useCallback, useEffect } from "react";
import { DEFAULT_DAY } from "../data/trainingPlan";

/**
 * Centralised navigation state for the app:
 *   - active training day
 *   - selected exercise (for slide-out panel)
 *   - panel open state
 *
 * @returns {{
 *   activeDay: string,
 *   setActiveDay: (d: string) => void,
 *   selectedExercise: import("../data/trainingPlan").Exercise | null,
 *   selectExercise: (ex: import("../data/trainingPlan").Exercise) => void,
 *   clearExercise: () => void,
 *   isPanelOpen: boolean,
 * }}
 */
export function useNavigation(dayKeys = []) {
  const [activeDay, setActiveDay] = useState(dayKeys[0] || DEFAULT_DAY);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    if (dayKeys.length === 0) return;
    if (!dayKeys.includes(activeDay)) {
      setActiveDay(dayKeys[0]);
    }
  }, [dayKeys, activeDay]);

  const selectExercise = useCallback((ex) => setSelectedExercise(ex), []);
  const clearExercise = useCallback(() => setSelectedExercise(null), []);

  return {
    activeDay,
    setActiveDay,
    selectedExercise,
    selectExercise,
    clearExercise,
    isPanelOpen: selectedExercise !== null,
  };
}
