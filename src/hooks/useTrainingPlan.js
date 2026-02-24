import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { TRAINING_PLAN } from "../data/trainingPlan";
import { loadTrainingPlan, persistTrainingPlan } from "../services/storageService";
import { SAVE_MSG_DURATION_MS } from "../theme";
import { useI18n } from "../i18n";
import { makeExerciseId } from "../utils/helpers";

function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

const DEFAULT_DAY_COLORS = Object.values(TRAINING_PLAN).map((day) => day.color);

function clonePlan(plan) {
  return JSON.parse(JSON.stringify(plan));
}

function getNextDayName(existingKeys, template) {
  let index = existingKeys.length + 1;
  let candidate = template.replace("{n}", String(index));
  while (existingKeys.includes(candidate)) {
    index += 1;
    candidate = template.replace("{n}", String(index));
  }
  return candidate;
}

function normalizeExercise(rawExercise, index) {
  const exercise = rawExercise && typeof rawExercise === "object" ? rawExercise : {};

  return {
    id: normalizeString(exercise.id, `${makeExerciseId()}_${index}`),
    name: normalizeString(exercise.name, `Ejercicio ${index + 1}`),
    sets: normalizeString(exercise.sets, ""),
    reps: normalizeString(exercise.reps, ""),
    rest: normalizeString(exercise.rest, ""),
    note: normalizeString(exercise.note, ""),
  };
}

function compareDayKeys(a, b) {
  return a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });
}

function normalizePlan(inputPlan) {
  const source = inputPlan && typeof inputPlan === "object" ? inputPlan : null;
  const sourceKeys = source ? Object.keys(source) : [];
  const basePlan = sourceKeys.length > 0 ? source : TRAINING_PLAN;
  const baseKeys = Object.keys(basePlan);

  return Object.fromEntries(
    baseKeys.map((dayKey, index) => {
      const rawDay = basePlan[dayKey] && typeof basePlan[dayKey] === "object" ? basePlan[dayKey] : {};
      const rawExercises = Array.isArray(rawDay.exercises) ? rawDay.exercises : [];
      const defaultColor = DEFAULT_DAY_COLORS[index % DEFAULT_DAY_COLORS.length] || "#e8643a";

      return [
        dayKey,
        {
          label: normalizeString(rawDay.label, ""),
          color: normalizeString(rawDay.color, defaultColor),
          exercises: rawExercises.map((exercise, exIndex) => normalizeExercise(exercise, exIndex)),
        },
      ];
    }),
  );
}

/**
 * Encapsulates editable training-plan state and persistence.
 */
export function useTrainingPlan(storageScope = "guest") {
  const { t } = useI18n();
  const [trainingPlan, setTrainingPlan] = useState(() => normalizePlan(TRAINING_PLAN));
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const data = await loadTrainingPlan(storageScope);
      if (!cancelled) {
        setTrainingPlan(normalizePlan(data));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storageScope]);

  const saveMsgTimerRef = useRef(null);

  /* Clean up pending save-message timer on unmount */
  useEffect(() => {
    return () => {
      if (saveMsgTimerRef.current) clearTimeout(saveMsgTimerRef.current);
    };
  }, []);

  const persist = useCallback(async (nextPlan) => {
    const normalized = normalizePlan(nextPlan);
    setTrainingPlan(normalized);

    try {
      await persistTrainingPlan(normalized, storageScope);
      setSaveMsg(t("plan.saveSuccess"));
    } catch {
      setSaveMsg(t("plan.saveError"));
    }
    if (saveMsgTimerRef.current) clearTimeout(saveMsgTimerRef.current);
    saveMsgTimerRef.current = setTimeout(() => setSaveMsg(""), SAVE_MSG_DURATION_MS);
  }, [storageScope, t]);

  const saveDay = useCallback((dayKey, nextDay) => {
    if (!trainingPlan[dayKey]) return;
    const nextPlan = {
      ...trainingPlan,
      [dayKey]: {
        ...trainingPlan[dayKey],
        ...nextDay,
      },
    };
    persist(nextPlan);
  }, [trainingPlan, persist]);

  const addDay = useCallback(() => {
    const existingKeys = Object.keys(trainingPlan);
    const newDayKey = getNextDayName(existingKeys, t("plan.dayNameTemplate"));
    const color = DEFAULT_DAY_COLORS[existingKeys.length % DEFAULT_DAY_COLORS.length] || "#e8643a";

    const nextPlan = {
      ...trainingPlan,
      [newDayKey]: {
        label: t("plan.dayLabelPlaceholder"),
        color,
        exercises: [],
      },
    };

    persist(nextPlan);
    return newDayKey;
  }, [trainingPlan, persist, t]);

  const removeDay = useCallback((dayKey) => {
    if (!trainingPlan[dayKey]) return;
    const keys = Object.keys(trainingPlan);
    if (keys.length <= 1) return;

    const nextPlan = clonePlan(trainingPlan);
    delete nextPlan[dayKey];
    persist(nextPlan);
  }, [trainingPlan, persist]);

  const addExercise = useCallback((dayKey) => {
    const day = trainingPlan[dayKey];
    if (!day) return;

    const nextPlan = clonePlan(trainingPlan);
    nextPlan[dayKey].exercises.push({
      id: makeExerciseId(),
      name: t("plan.exerciseNameTemplate", { n: day.exercises.length + 1 }),
      sets: "",
      reps: "",
      rest: "",
      note: "",
    });
    persist(nextPlan);
  }, [trainingPlan, persist, t]);

  const removeExercise = useCallback((dayKey, exerciseId) => {
    const day = trainingPlan[dayKey];
    if (!day) return;

    const nextPlan = clonePlan(trainingPlan);
    nextPlan[dayKey].exercises = day.exercises.filter((exercise) => exercise.id !== exerciseId);
    persist(nextPlan);
  }, [trainingPlan, persist]);

  const replacePlan = useCallback((newPlan) => {
    persist(newPlan);
  }, [persist]);

  const dayKeys = useMemo(
    () => Object.keys(trainingPlan).sort(compareDayKeys),
    [trainingPlan],
  );

  const dayColors = useMemo(
    () => Object.fromEntries(dayKeys.map((dayKey, index) => [dayKey, trainingPlan[dayKey]?.color || DEFAULT_DAY_COLORS[index % DEFAULT_DAY_COLORS.length] || "#e8643a"])),
    [dayKeys, trainingPlan],
  );

  return {
    trainingPlan,
    dayKeys,
    dayColors,
    loading,
    saveMsg,
    saveDay,
    addDay,
    removeDay,
    addExercise,
    removeExercise,
    replacePlan,
  };
}
