import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { TRAINING_PLAN } from "../data/trainingPlan";
import { loadTrainingPlan, persistTrainingPlan } from "../services/storageService";
import { SAVE_MSG_DURATION_MS } from "../theme";
import { useI18n } from "../i18n";
import { makeExerciseId } from "../utils/helpers";
import type { Exercise, TrainingDay, TrainingPlan } from "../services/types";

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

const DEFAULT_DAY_COLORS = Object.values(TRAINING_PLAN).map((day) => day.color);

function clonePlan(plan: TrainingPlan): TrainingPlan {
  return JSON.parse(JSON.stringify(plan));
}

function getNextDayName(existingKeys: string[], template: string): string {
  let index = existingKeys.length + 1;
  let candidate = template.replace("{n}", String(index));
  while (existingKeys.includes(candidate)) {
    index += 1;
    candidate = template.replace("{n}", String(index));
  }
  return candidate;
}

function normalizeExercise(rawExercise: unknown, index: number): Exercise {
  const exercise = rawExercise && typeof rawExercise === "object" ? rawExercise as Record<string, unknown> : {};
  const normalizedExerciseId = normalizeString(exercise.exerciseId, "");
  const normalizedNote = normalizeString(exercise.note, "");
  const rawNoteSource = normalizeString(exercise.noteSource, "");
  const normalizedNoteSource: "catalog" | "custom" = rawNoteSource === "catalog" ? "catalog" : "custom";
  const normalizedNoteCatalogId = normalizeString(exercise.noteCatalogId, normalizedExerciseId);

  return {
    id: normalizeString(exercise.id, `${makeExerciseId()}_${index}`),
    exerciseId: normalizedExerciseId,
    name: normalizeString(exercise.name, `Ejercicio ${index + 1}`),
    sets: normalizeString(exercise.sets, ""),
    reps: normalizeString(exercise.reps, ""),
    rest: normalizeString(exercise.rest, ""),
    note: normalizedNote,
    noteSource: normalizedNoteSource,
    noteCatalogId: normalizedNoteCatalogId,
  };
}

function compareDayKeys(a: string, b: string): number {
  return a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });
}

function normalizePlan(inputPlan: unknown): TrainingPlan {
  const source = inputPlan && typeof inputPlan === "object" ? inputPlan as Record<string, unknown> : null;
  const sourceKeys = source ? Object.keys(source) : [];
  const basePlan: Record<string, unknown> = sourceKeys.length > 0 ? source! : TRAINING_PLAN;
  const baseKeys = Object.keys(basePlan);

  return Object.fromEntries(
    baseKeys.map((dayKey, index) => {
      const rawDayVal = basePlan[dayKey];
      const rawDay = rawDayVal && typeof rawDayVal === "object" ? rawDayVal as Record<string, unknown> : {} as Record<string, unknown>;
      const rawExercises = Array.isArray(rawDay.exercises) ? rawDay.exercises as unknown[] : [];
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
 *
 * @param {string} storageScope - User uid or "guest".
 * @param {boolean} authLoading - Pass auth.loading so the hook waits for the
 *   final scope before fetching. Prevents a transient "guest" empty-plan from
 *   falsely triggering the first-visit wizard for authenticated users.
 */
export function useTrainingPlan(storageScope = "guest", authLoading = false) {
  const { t } = useI18n();
  const [trainingPlan, setTrainingPlan] = useState(() => normalizePlan(TRAINING_PLAN));
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  /** True when a saved plan was found in storage; false when falling back to static defaults. */
  const [hasPlan, setHasPlan] = useState(false);

  /* ---- Keep a ref in sync so mutations always read the latest plan ---- */
  const trainingPlanRef = useRef(normalizePlan(TRAINING_PLAN));
  useEffect(() => {
    trainingPlanRef.current = trainingPlan;
  }, [trainingPlan]);

  useEffect(() => {
    // Wait until auth has resolved so we always load with the correct scope.
    if (authLoading) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      const data = await loadTrainingPlan(storageScope);
      if (!cancelled) {
        const planFound = data !== null && typeof data === "object" && Object.keys(data).length > 0;
        setHasPlan(planFound);
        setTrainingPlan(normalizePlan(data));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storageScope, authLoading]);

  const saveMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Clean up pending save-message timer on unmount */
  useEffect(() => {
    return () => {
      if (saveMsgTimerRef.current) clearTimeout(saveMsgTimerRef.current);
    };
  }, []);

  const persist = useCallback(async (nextPlan: TrainingPlan) => {
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

  const saveDay = useCallback((dayKey: string, nextDay: Partial<TrainingDay>) => {
    const plan = trainingPlanRef.current;
    if (!plan[dayKey]) return;
    const nextPlan = {
      ...plan,
      [dayKey]: {
        ...plan[dayKey],
        ...nextDay,
      },
    };
    persist(nextPlan);
  }, [persist]);

  const addDay = useCallback(() => {
    const plan = trainingPlanRef.current;
    const existingKeys = Object.keys(plan);
    const newDayKey = getNextDayName(existingKeys, t("plan.dayNameTemplate"));
    const color = DEFAULT_DAY_COLORS[existingKeys.length % DEFAULT_DAY_COLORS.length] || "#e8643a";

    const nextPlan = {
      ...plan,
      [newDayKey]: {
        label: t("plan.dayLabelPlaceholder"),
        color,
        exercises: [],
      },
    };

    persist(nextPlan);
    return newDayKey;
  }, [persist, t]);

  const removeDay = useCallback((dayKey: string) => {
    const plan = trainingPlanRef.current;
    if (!plan[dayKey]) return;
    const keys = Object.keys(plan);
    if (keys.length <= 1) return;

    const nextPlan = clonePlan(plan);
    delete nextPlan[dayKey];
    persist(nextPlan);
  }, [persist]);

  const addExercise = useCallback((dayKey: string) => {
    const plan = trainingPlanRef.current;
    const day = plan[dayKey];
    if (!day) return;

    const nextPlan = clonePlan(plan);
    nextPlan[dayKey].exercises.push({
      id: makeExerciseId(),
      exerciseId: "",
      name: t("plan.exerciseNameTemplate", { n: day.exercises.length + 1 }),
      sets: "",
      reps: "",
      rest: "",
      note: "",
      noteSource: "custom",
      noteCatalogId: "",
    });
    persist(nextPlan);
  }, [persist, t]);

  const removeExercise = useCallback((dayKey: string, exerciseId: string) => {
    const plan = trainingPlanRef.current;
    const day = plan[dayKey];
    if (!day) return;

    const nextPlan = clonePlan(plan);
    nextPlan[dayKey].exercises = day.exercises.filter((exercise) => exercise.id !== exerciseId);
    persist(nextPlan);
  }, [persist]);

  const replacePlan = useCallback((newPlan: TrainingPlan) => {
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
    hasPlan,
    saveDay,
    addDay,
    removeDay,
    addExercise,
    removeExercise,
    replacePlan,
  };
}
