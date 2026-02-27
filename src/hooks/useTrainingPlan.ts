import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { TRAINING_PLAN } from "../data/trainingPlan";
import { loadTrainingPlan, persistTrainingPlan } from "../services/storageService";
import { SAVE_MSG_DURATION_MS } from "../theme";
import { useI18n } from "../i18n";
import { makeExerciseId } from "../utils/helpers";
import type { Exercise, SharedPlan, TrainingDay, TrainingPlan } from "../services/types";

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

const DEFAULT_DAY_COLORS = Object.values(TRAINING_PLAN).map((day) => day.color);

function clonePlan(plan: TrainingPlan): TrainingPlan {
  return JSON.parse(JSON.stringify(plan));
}

function cloneStoredPlanState(state: StoredPlanState): StoredPlanState {
  return JSON.parse(JSON.stringify(state));
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

type PlanScope = "owned" | "shared";

type StoredPlanState = {
  ownedPlans: Record<string, { name: string; plan: TrainingPlan }>;
  sharedPlans: Record<string, { name: string; ownerName: string; plan: TrainingPlan }>;
  activePlanId: string;
  activePlanScope: PlanScope;
};

const DEFAULT_PLAN_ID = "plan_1";

function createDefaultStoredPlanState(defaultName: string): StoredPlanState {
  return {
    ownedPlans: {
      [DEFAULT_PLAN_ID]: { name: defaultName, plan: normalizePlan(TRAINING_PLAN) },
    },
    sharedPlans: {},
    activePlanId: DEFAULT_PLAN_ID,
    activePlanScope: "owned",
  };
}

function isLegacyTrainingPlan(inputPlan: unknown): inputPlan is TrainingPlan {
  if (!inputPlan || typeof inputPlan !== "object" || Array.isArray(inputPlan)) return false;
  const keys = Object.keys(inputPlan as Record<string, unknown>);
  if (keys.length === 0) return false;

  return keys.some((key) => {
    const candidate = (inputPlan as Record<string, unknown>)[key];
    return Boolean(candidate && typeof candidate === "object" && Array.isArray((candidate as TrainingDay).exercises));
  });
}

function normalizeStoredPlanState(inputPlan: unknown, defaultName: string): StoredPlanState {
  if (isLegacyTrainingPlan(inputPlan)) {
    return {
      ownedPlans: {
        [DEFAULT_PLAN_ID]: { name: defaultName, plan: normalizePlan(inputPlan) },
      },
      sharedPlans: {},
      activePlanId: DEFAULT_PLAN_ID,
      activePlanScope: "owned",
    };
  }

  if (!inputPlan || typeof inputPlan !== "object" || Array.isArray(inputPlan)) {
    return createDefaultStoredPlanState(defaultName);
  }

  const source = inputPlan as Record<string, unknown>;
  const ownedSource = source.ownedPlans && typeof source.ownedPlans === "object"
    ? source.ownedPlans as Record<string, unknown>
    : {};
  const sharedSource = source.sharedPlans && typeof source.sharedPlans === "object"
    ? source.sharedPlans as Record<string, unknown>
    : {};

  const ownedPlans = Object.fromEntries(
    Object.entries(ownedSource).map(([id, raw]) => {
      const val = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
      return [id, { name: normalizeString(val.name, defaultName), plan: normalizePlan(val.plan) }];
    }),
  ) as StoredPlanState["ownedPlans"];

  const sharedPlans = Object.fromEntries(
    Object.entries(sharedSource).map(([id, raw]) => {
      const val = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
      return [id, {
        name: normalizeString(val.name, defaultName),
        ownerName: normalizeString(val.ownerName, "Unknown"),
        plan: normalizePlan(val.plan),
      }];
    }),
  ) as StoredPlanState["sharedPlans"];

  if (Object.keys(ownedPlans).length === 0) {
    return createDefaultStoredPlanState(defaultName);
  }

  const activePlanScope = source.activePlanScope === "shared" ? "shared" : "owned";
  const requestedPlanId = normalizeString(source.activePlanId, Object.keys(ownedPlans)[0]);
  const hasRequestedOwned = Boolean(ownedPlans[requestedPlanId]);
  const hasRequestedShared = Boolean(sharedPlans[requestedPlanId]);

  return {
    ownedPlans,
    sharedPlans,
    activePlanId: hasRequestedOwned || hasRequestedShared ? requestedPlanId : Object.keys(ownedPlans)[0],
    activePlanScope: activePlanScope === "shared" && hasRequestedShared ? "shared" : "owned",
  };
}

function serializeStoredPlanState(state: StoredPlanState): StoredPlanState | TrainingPlan {
  const ownedIds = Object.keys(state.ownedPlans);
  if (
    ownedIds.length === 1
    && Object.keys(state.sharedPlans).length === 0
    && state.activePlanScope === "owned"
  ) {
    return state.ownedPlans[ownedIds[0]].plan;
  }
  return state;
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
  const [planState, setPlanState] = useState(() => createDefaultStoredPlanState(t("plan.defaultPlanName")));
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  /** True when a saved plan was found in storage; false when falling back to static defaults. */
  const [hasPlan, setHasPlan] = useState(false);

  /* ---- Keep a ref in sync so mutations always read the latest plan ---- */
  const planStateRef = useRef(planState);
  useEffect(() => {
    planStateRef.current = planState;
  }, [planState]);

  const isSharedPlanActive = planState.activePlanScope === "shared";
  const activeOwnedPlan = planState.ownedPlans[planState.activePlanId];
  const activeSharedPlan = planState.sharedPlans[planState.activePlanId];
  const activePlanRecord = isSharedPlanActive ? activeSharedPlan : activeOwnedPlan;
  const trainingPlan = activePlanRecord?.plan || normalizePlan(TRAINING_PLAN);

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
        setPlanState(normalizeStoredPlanState(data, t("plan.defaultPlanName")));
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

  const persist = useCallback(async (nextState: StoredPlanState) => {
    setPlanState(nextState);

    try {
      await persistTrainingPlan(serializeStoredPlanState(nextState), storageScope);
      setSaveMsg(t("plan.saveSuccess"));
    } catch {
      setSaveMsg(t("plan.saveError"));
    }
    if (saveMsgTimerRef.current) clearTimeout(saveMsgTimerRef.current);
    saveMsgTimerRef.current = setTimeout(() => setSaveMsg(""), SAVE_MSG_DURATION_MS);
  }, [storageScope, t]);

  const getActiveOwnedPlan = useCallback(() => {
    const state = planStateRef.current;
    if (state.activePlanScope !== "owned") return null;
    const owned = state.ownedPlans[state.activePlanId];
    if (!owned) return null;
    return { state, owned };
  }, []);

  const saveDay = useCallback((dayKey: string, nextDay: Partial<TrainingDay>) => {
    const active = getActiveOwnedPlan();
    if (!active || !active.owned.plan[dayKey]) return;
    const nextState = cloneStoredPlanState(active.state);
    nextState.ownedPlans[active.state.activePlanId].plan = {
      ...active.owned.plan,
      [dayKey]: {
        ...active.owned.plan[dayKey],
        ...nextDay,
      },
    };
    persist(nextState);
  }, [getActiveOwnedPlan, persist]);

  const addDay = useCallback(() => {
    const active = getActiveOwnedPlan();
    if (!active) return "";
    const plan = active.owned.plan;
    const existingKeys = Object.keys(plan);
    const newDayKey = getNextDayName(existingKeys, t("plan.dayNameTemplate"));
    const color = DEFAULT_DAY_COLORS[existingKeys.length % DEFAULT_DAY_COLORS.length] || "#e8643a";

    const nextState = cloneStoredPlanState(active.state);
    nextState.ownedPlans[active.state.activePlanId].plan = {
      ...plan,
      [newDayKey]: {
        label: t("plan.dayLabelPlaceholder"),
        color,
        exercises: [],
      },
    };

    persist(nextState);
    return newDayKey;
  }, [getActiveOwnedPlan, persist, t]);

  const removeDay = useCallback((dayKey: string) => {
    const active = getActiveOwnedPlan();
    if (!active) return;
    const plan = active.owned.plan;
    if (!plan[dayKey]) return;
    const keys = Object.keys(plan);
    if (keys.length <= 1) return;

    const nextState = cloneStoredPlanState(active.state);
    const nextPlan = clonePlan(plan);
    delete nextPlan[dayKey];
    nextState.ownedPlans[active.state.activePlanId].plan = nextPlan;
    persist(nextState);
  }, [getActiveOwnedPlan, persist]);

  const addExercise = useCallback((dayKey: string) => {
    const active = getActiveOwnedPlan();
    if (!active) return;
    const plan = active.owned.plan;
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
    const nextState = cloneStoredPlanState(active.state);
    nextState.ownedPlans[active.state.activePlanId].plan = nextPlan;
    persist(nextState);
  }, [getActiveOwnedPlan, persist, t]);

  const removeExercise = useCallback((dayKey: string, exerciseId: string) => {
    const active = getActiveOwnedPlan();
    if (!active) return;
    const plan = active.owned.plan;
    const day = plan[dayKey];
    if (!day) return;

    const nextPlan = clonePlan(plan);
    nextPlan[dayKey].exercises = day.exercises.filter((exercise) => exercise.id !== exerciseId);
    const nextState = cloneStoredPlanState(active.state);
    nextState.ownedPlans[active.state.activePlanId].plan = nextPlan;
    persist(nextState);
  }, [getActiveOwnedPlan, persist]);

  const replacePlan = useCallback((newPlan: TrainingPlan) => {
    const active = getActiveOwnedPlan();
    if (!active) return;
    const nextState = cloneStoredPlanState(active.state);
    nextState.ownedPlans[active.state.activePlanId].plan = normalizePlan(newPlan);
    persist(nextState);
  }, [getActiveOwnedPlan, persist]);

  const createPlan = useCallback((name: string, sourcePlan?: TrainingPlan) => {
    const state = planStateRef.current;
    const planId = makeExerciseId();
    const nextState = cloneStoredPlanState(state);
    nextState.ownedPlans[planId] = {
      name: name.trim() || t("plan.defaultPlanName"),
      plan: normalizePlan(sourcePlan || trainingPlan),
    };
    nextState.activePlanId = planId;
    nextState.activePlanScope = "owned";
    persist(nextState);
    return planId;
  }, [persist, t, trainingPlan]);

  const selectPlan = useCallback((planId: string, scope: PlanScope) => {
    const state = planStateRef.current;
    if (scope === "owned" && !state.ownedPlans[planId]) return;
    if (scope === "shared" && !state.sharedPlans[planId]) return;
    setPlanState({
      ...state,
      activePlanId: planId,
      activePlanScope: scope,
    });
  }, []);

  const addSharedPlan = useCallback((payload: Pick<SharedPlan, "name" | "ownerName" | "plan">) => {
    const state = planStateRef.current;
    const planId = makeExerciseId();
    const nextState = cloneStoredPlanState(state);
    nextState.sharedPlans[planId] = {
      name: payload.name.trim() || t("plan.sharedPlanDefaultName"),
      ownerName: payload.ownerName.trim() || "Unknown",
      plan: normalizePlan(payload.plan),
    };
    nextState.activePlanId = planId;
    nextState.activePlanScope = "shared";
    persist(nextState);
    return planId;
  }, [persist, t]);

  const copySharedPlanToOwned = useCallback((name: string) => {
    const state = planStateRef.current;
    if (state.activePlanScope !== "shared") return "";
    const shared = state.sharedPlans[state.activePlanId];
    if (!shared) return "";
    return createPlan(name, shared.plan);
  }, [createPlan]);

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
    plans: [
      ...Object.entries(planState.ownedPlans).map(([id, value]) => ({
        id,
        name: value.name,
        scope: "owned" as const,
      })),
      ...Object.entries(planState.sharedPlans).map(([id, value]) => ({
        id,
        name: value.name,
        ownerName: value.ownerName,
        scope: "shared" as const,
      })),
    ],
    activePlanId: planState.activePlanId,
    activePlanScope: planState.activePlanScope,
    activePlanName: activePlanRecord?.name || t("plan.defaultPlanName"),
    isSharedPlanActive,
    createPlan,
    selectPlan,
    addSharedPlan,
    copySharedPlanToOwned,
  };
}
