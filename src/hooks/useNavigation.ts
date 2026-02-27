import { useState, useCallback, useEffect } from "react";
import { DEFAULT_DAY } from "../data/trainingPlan";
import type { Exercise } from "../services/types";

export function useNavigation(dayKeys: string[] = []) {
  const [activeDay, setActiveDay] = useState(dayKeys[0] || DEFAULT_DAY);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (dayKeys.length === 0) return;
    if (!dayKeys.includes(activeDay)) {
      setActiveDay(dayKeys[0]);
    }
  }, [dayKeys, activeDay]);

  const selectExercise = useCallback((ex: Exercise) => setSelectedExercise(ex), []);
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
