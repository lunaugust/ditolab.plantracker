import { useState, useCallback, useEffect } from "react";
import { DEFAULT_DAY } from "../data/trainingPlan";

/**
 * Centralised navigation state for the app:
 *   - current view (plan / log / progress)
 *   - active training day
 *   - selected exercise (detail screens)
 *
 * @returns {{
 *   view: import("../services/types").ViewKey,
 *   setView: (v: import("../services/types").ViewKey) => void,
 *   activeDay: string,
 *   setActiveDay: (d: string) => void,
 *   selectedExercise: import("../data/trainingPlan").Exercise | null,
 *   selectExercise: (ex: import("../data/trainingPlan").Exercise) => void,
 *   clearExercise: () => void,
 * }}
 */
export function useNavigation(dayKeys = []) {
  const [view, setView] = useState("plan");
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
    view,
    setView,
    activeDay,
    setActiveDay,
    selectedExercise,
    selectExercise,
    clearExercise,
  };
}
