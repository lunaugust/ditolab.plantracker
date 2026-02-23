import { useState, useCallback } from "react";
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
export function useNavigation() {
  const [view, setView] = useState("plan");
  const [activeDay, setActiveDay] = useState(DEFAULT_DAY);
  const [selectedExercise, setSelectedExercise] = useState(null);

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
