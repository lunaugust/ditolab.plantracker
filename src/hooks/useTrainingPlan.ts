import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { TRAINING_PLAN } from "../data/trainingPlan";
import { loadTrainingPlan, persistTrainingPlan } from "../services/storageService";
import { SAVE_MSG_DURATION_MS } from "../theme";
import { useI18n } from "../i18n";
import { makeExerciseId } from "../utils/helpers";
import type { Exercise, PlanLibrary, PlanMetadata, PlanSource, TrainingDay, TrainingPlan } from "../services/types";

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

function makePlanId(prefix = "plan"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function encodeBase64(value: string): string {
  if (typeof btoa === "function") return btoa(value);
  return Buffer.from(value, "utf-8").toString("base64");
}

function decodeBase64(value: string): string {
  if (typeof atob === "function") return atob(value);
  return Buffer.from(value, "base64").toString("utf-8");
}

function ensureUniquePlanName(baseName: string, takenNames: string[]): string {
  let candidate = baseName;
  let suffix = 2;
  while (takenNames.includes(candidate)) {
    candidate = `${baseName} (${suffix})`;
    suffix += 1;
  }
  return candidate;
}

function buildEmptyPlan(dayTemplate: string, dayLabel: string): TrainingPlan {
  const key = dayTemplate.replace("{n}", "1");
  return {
    [key]: {
      label: dayLabel,
      color: DEFAULT_DAY_COLORS[0] || "#e8643a",
      exercises: [],
    },
  };
}

function createDefaultLibrary(t: ReturnType<typeof useI18n>["t"]): PlanLibrary {
  const planName = t("plan.defaultPlanName");
  const plan: PlanMetadata = {
    id: makePlanId("plan"),
    name: planName,
    plan: normalizePlan(TRAINING_PLAN),
    source: "owned",
  };

  return {
    activePlanId: plan.id,
    ownedPlans: [plan],
    sharedPlans: [],
  };
}

function normalizePlanEntry(raw: unknown, fallbackName: string, source: PlanSource, takenNames: string[], t: ReturnType<typeof useI18n>["t"]): PlanMetadata {
  const obj = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const rawName = normalizeString(obj.name, fallbackName);
  const name = ensureUniquePlanName(rawName, takenNames);
  const id = normalizeString(obj.id, makePlanId(source === "shared" ? "shared" : "plan"));
  const plan = normalizePlan(obj.plan);
  const ownerName = normalizeString(obj.ownerName, "");
  const shareCode = normalizeString(obj.shareCode, "");

  takenNames.push(name);

  return {
    id,
    name,
    plan,
    source,
    ownerName: ownerName || undefined,
    shareCode: shareCode || undefined,
  };
}

function normalizePlanLibrary(inputPlan: unknown, t: ReturnType<typeof useI18n>["t"], fallback: PlanLibrary): PlanLibrary {
  if (inputPlan && typeof inputPlan === "object" && ("ownedPlans" in (inputPlan as Record<string, unknown>) || "sharedPlans" in (inputPlan as Record<string, unknown>))) {
    const raw = inputPlan as Record<string, unknown>;
    const takenNames: string[] = [];
    const ownedRaw = Array.isArray(raw.ownedPlans) ? raw.ownedPlans : [];
    const sharedRaw = Array.isArray(raw.sharedPlans) ? raw.sharedPlans : [];

    const owned = ownedRaw.map((entry, index) => normalizePlanEntry(entry, t("plan.planNameTemplate", { n: index + 1 }), "owned", takenNames, t));
    const shared = sharedRaw.map((entry, index) => normalizePlanEntry(entry, t("plan.sharedPlanName", { n: index + 1 }), "shared", takenNames, t));
    const ownedPlans = owned.length > 0 ? owned : [];
    const sharedPlans = shared;
    const allPlans = [...ownedPlans, ...sharedPlans];
    const activeId = typeof raw.activePlanId === "string" && allPlans.some((plan) => plan.id === raw.activePlanId)
      ? raw.activePlanId
      : allPlans[0]?.id ?? fallback.activePlanId;

    return {
      activePlanId: activeId,
      ownedPlans: ownedPlans.length > 0 ? ownedPlans : (sharedPlans.length === 0 ? fallback.ownedPlans : []),
      sharedPlans,
    };
  }

  if (inputPlan && typeof inputPlan === "object" && Object.keys(inputPlan).length > 0) {
    const planName = t("plan.defaultPlanName");
    const plan: PlanMetadata = {
      id: makePlanId("plan"),
      name: planName,
      plan: normalizePlan(inputPlan),
      source: "owned",
    };
    return { activePlanId: plan.id, ownedPlans: [plan], sharedPlans: [] };
  }

  return fallback;
}

export function useTrainingPlan(storageScope = "guest", authLoading = false) {
  const { t } = useI18n();
  const defaultLibrary = useMemo(() => createDefaultLibrary(t), [t]);
  const [planLibrary, setPlanLibrary] = useState<PlanLibrary>(defaultLibrary);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  /** True when a saved plan was found in storage; false when falling back to static defaults. */
  const [hasPlan, setHasPlan] = useState(false);

  const planLibraryRef = useRef(planLibrary);
  useEffect(() => {
    planLibraryRef.current = planLibrary;
  }, [planLibrary]);

  const saveMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Clean up pending save-message timer on unmount */
  useEffect(() => {
    return () => {
      if (saveMsgTimerRef.current) clearTimeout(saveMsgTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      const data = await loadTrainingPlan(storageScope);
      if (!cancelled) {
        const planFound = data !== null && typeof data === "object" && Object.keys(data).length > 0;
        const normalized = normalizePlanLibrary(data, t, defaultLibrary);
        setHasPlan(planFound && (normalized.ownedPlans.length > 0 || normalized.sharedPlans.length > 0));
        setPlanLibrary(normalized);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storageScope, authLoading, t, defaultLibrary]);

  const persist = useCallback(async (nextLibrary: PlanLibrary, options: { silent?: boolean; message?: string } = {}) => {
    const normalized = normalizePlanLibrary(nextLibrary, t, defaultLibrary);
    setPlanLibrary(normalized);
    setHasPlan(normalized.ownedPlans.length > 0 || normalized.sharedPlans.length > 0);

    const shouldShowMessage = options.silent !== true;
    if (shouldShowMessage && saveMsgTimerRef.current) {
      clearTimeout(saveMsgTimerRef.current);
      saveMsgTimerRef.current = null;
    }

    try {
      await persistTrainingPlan(normalized, storageScope);
      if (shouldShowMessage) setSaveMsg(options.message ?? t("plan.saveSuccess"));
    } catch {
      if (shouldShowMessage) setSaveMsg(t("plan.saveError"));
    }

    if (shouldShowMessage) {
      saveMsgTimerRef.current = setTimeout(() => setSaveMsg(""), SAVE_MSG_DURATION_MS);
    }
  }, [storageScope, t, defaultLibrary]);

  const activePlan = useMemo(() => {
    const all = [...planLibrary.ownedPlans, ...planLibrary.sharedPlans];
    return all.find((plan) => plan.id === planLibrary.activePlanId) || all[0] || defaultLibrary.ownedPlans[0];
  }, [planLibrary, defaultLibrary]);

  const trainingPlan = activePlan?.plan ?? defaultLibrary.ownedPlans[0].plan;
  const activePlanName = activePlan?.name ?? defaultLibrary.ownedPlans[0].name;
  const activePlanSource: PlanSource = activePlan?.source ?? "owned";
  const activePlanId = activePlan?.id ?? defaultLibrary.activePlanId;
  const readOnly = activePlanSource === "shared";

  const dayKeys = useMemo(
    () => Object.keys(trainingPlan).sort(compareDayKeys),
    [trainingPlan],
  );

  const dayColors = useMemo(
    () => Object.fromEntries(dayKeys.map((dayKey, index) => [dayKey, trainingPlan[dayKey]?.color || DEFAULT_DAY_COLORS[index % DEFAULT_DAY_COLORS.length] || "#e8643a"])),
    [dayKeys, trainingPlan],
  );

  const plans = useMemo(() => [...planLibrary.ownedPlans, ...planLibrary.sharedPlans], [planLibrary]);

  const updateActiveOwnedPlan = useCallback((updater: (plan: TrainingPlan) => TrainingPlan | null | undefined) => {
    const library = planLibraryRef.current;
    const targetIndex = library.ownedPlans.findIndex((plan) => plan.id === library.activePlanId);
    if (targetIndex === -1) return;

    const currentPlan = library.ownedPlans[targetIndex].plan;
    const nextPlan = updater(currentPlan);
    if (!nextPlan || nextPlan === currentPlan) return;

    const nextOwned = [...library.ownedPlans];
    nextOwned[targetIndex] = { ...nextOwned[targetIndex], plan: normalizePlan(nextPlan) };
    persist({ ...library, ownedPlans: nextOwned });
  }, [persist]);

  const setActivePlan = useCallback((planId: string) => {
    const library = planLibraryRef.current;
    const exists = [...library.ownedPlans, ...library.sharedPlans].some((plan) => plan.id === planId);
    if (!exists) return;
    persist({ ...library, activePlanId: planId }, { silent: true });
  }, [persist]);

  const createPlan = useCallback((plan?: TrainingPlan, name?: string) => {
    const library = planLibraryRef.current;
    const takenNames = [...library.ownedPlans, ...library.sharedPlans].map((entry) => entry.name);
    const baseName = name || t("plan.planNameTemplate", { n: library.ownedPlans.length + 1 });
    const planName = ensureUniquePlanName(baseName, takenNames);
    const newPlan: PlanMetadata = {
      id: makePlanId("plan"),
      name: planName,
      plan: normalizePlan(plan ?? buildEmptyPlan(t("plan.dayNameTemplate"), t("plan.dayLabelPlaceholder"))),
      source: "owned",
    };
    const nextLibrary: PlanLibrary = {
      ...library,
      activePlanId: newPlan.id,
      ownedPlans: [newPlan, ...library.ownedPlans],
    };
    persist(nextLibrary, { message: t("plan.saveSuccess") });
    return newPlan.id;
  }, [persist, t]);

  const copyActivePlanToOwned = useCallback((name?: string) => {
    const library = planLibraryRef.current;
    const sourcePlan = [...library.ownedPlans, ...library.sharedPlans].find((plan) => plan.id === library.activePlanId);
    if (!sourcePlan) return null;

    const takenNames = [...library.ownedPlans, ...library.sharedPlans].map((entry) => entry.name);
    const baseName = name || t("plan.copyNameTemplate", { name: sourcePlan.name });
    const planName = ensureUniquePlanName(baseName, takenNames);
    const newPlan: PlanMetadata = {
      id: makePlanId("plan"),
      name: planName,
      plan: clonePlan(sourcePlan.plan),
      source: "owned",
    };

    const nextLibrary: PlanLibrary = {
      ...library,
      activePlanId: newPlan.id,
      ownedPlans: [newPlan, ...library.ownedPlans],
    };
    persist(nextLibrary, { message: t("plan.saveSuccess") });
    return newPlan.id;
  }, [persist, t]);

  const shareActivePlan = useCallback(() => {
    const library = planLibraryRef.current;
    const activeOwnedPlan = library.ownedPlans.find((plan) => plan.id === library.activePlanId);
    if (!activeOwnedPlan) return null;

    const payload = {
      id: activeOwnedPlan.id,
      name: activeOwnedPlan.name,
      plan: activeOwnedPlan.plan,
    };

    return encodeBase64(JSON.stringify(payload));
  }, []);

  const addSharedPlanFromCode = useCallback((code: string) => {
    if (!code) return { status: "invalid" as const };
    let payload: unknown;
    try {
      payload = JSON.parse(decodeBase64(code.trim()));
    } catch {
      return { status: "invalid" as const };
    }

    const data = payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
    if (!data || typeof data.plan !== "object") {
      return { status: "invalid" as const };
    }

    const library = planLibraryRef.current;
    const existing = library.sharedPlans.find((plan) => plan.shareCode === code.trim());
    if (existing) {
      persist({ ...library, activePlanId: existing.id }, { silent: true });
      return { status: "duplicate" as const, planId: existing.id };
    }

    const takenNames = [...library.ownedPlans, ...library.sharedPlans].map((entry) => entry.name);
    const baseName = normalizeString(data.name, t("plan.sharedPlanName", { n: library.sharedPlans.length + 1 }));
    const planName = ensureUniquePlanName(baseName, takenNames);

    const newShared: PlanMetadata = {
      id: normalizeString(data.id, makePlanId("shared")),
      name: planName,
      plan: normalizePlan(data.plan),
      source: "shared",
      ownerName: normalizeString(data.ownerName, "") || undefined,
      shareCode: code.trim(),
    };

    const nextLibrary: PlanLibrary = {
      ...library,
      activePlanId: newShared.id,
      sharedPlans: [newShared, ...library.sharedPlans],
    };
    persist(nextLibrary, { message: t("plan.sharedAdded") });
    return { status: "added" as const, planId: newShared.id };
  }, [persist, t]);

  const saveDay = useCallback((dayKey: string, nextDay: Partial<TrainingDay>) => {
    if (readOnly) return;
    updateActiveOwnedPlan((plan) => {
      if (!plan[dayKey]) return plan;
      return {
        ...plan,
        [dayKey]: {
          ...plan[dayKey],
          ...nextDay,
        },
      };
    });
  }, [readOnly, updateActiveOwnedPlan]);

  const addDay = useCallback(() => {
    if (readOnly) return "";
    let newDayKey = "";
    updateActiveOwnedPlan((plan) => {
      const existingKeys = Object.keys(plan);
      newDayKey = getNextDayName(existingKeys, t("plan.dayNameTemplate"));
      const color = DEFAULT_DAY_COLORS[existingKeys.length % DEFAULT_DAY_COLORS.length] || "#e8643a";

      return {
        ...plan,
        [newDayKey]: {
          label: t("plan.dayLabelPlaceholder"),
          color,
          exercises: [],
        },
      };
    });
    return newDayKey;
  }, [readOnly, t, updateActiveOwnedPlan]);

  const removeDay = useCallback((dayKey: string) => {
    if (readOnly) return;
    updateActiveOwnedPlan((plan) => {
      const keys = Object.keys(plan);
      if (!plan[dayKey] || keys.length <= 1) return plan;

      const nextPlan = clonePlan(plan);
      delete nextPlan[dayKey];
      return nextPlan;
    });
  }, [readOnly, updateActiveOwnedPlan]);

  const addExercise = useCallback((dayKey: string) => {
    if (readOnly) return;
    updateActiveOwnedPlan((plan) => {
      const day = plan[dayKey];
      if (!day) return plan;

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
      return nextPlan;
    });
  }, [readOnly, t, updateActiveOwnedPlan]);

  const removeExercise = useCallback((dayKey: string, exerciseId: string) => {
    if (readOnly) return;
    updateActiveOwnedPlan((plan) => {
      const day = plan[dayKey];
      if (!day) return plan;

      const nextPlan = clonePlan(plan);
      nextPlan[dayKey].exercises = day.exercises.filter((exercise) => exercise.id !== exerciseId);
      return nextPlan;
    });
  }, [readOnly, updateActiveOwnedPlan]);

  const replacePlan = useCallback((newPlan: TrainingPlan, options?: { name?: string; asNew?: boolean }) => {
    const library = planLibraryRef.current;
    const normalizedPlan = normalizePlan(newPlan);
    const ownedIndex = library.ownedPlans.findIndex((plan) => plan.id === library.activePlanId);

    if (options?.asNew || ownedIndex === -1 || readOnly) {
      const takenNames = [...library.ownedPlans, ...library.sharedPlans].map((entry) => entry.name);
      const baseName = options?.name || t("plan.planNameTemplate", { n: library.ownedPlans.length + 1 });
      const planName = ensureUniquePlanName(baseName, takenNames);

      const nextPlan: PlanMetadata = {
        id: makePlanId("plan"),
        name: planName,
        plan: normalizedPlan,
        source: "owned",
      };

      const nextLibrary: PlanLibrary = {
        ...library,
        activePlanId: nextPlan.id,
        ownedPlans: [nextPlan, ...library.ownedPlans],
      };
      persist(nextLibrary);
      return nextPlan.id;
    }

    const nextOwned = [...library.ownedPlans];
    nextOwned[ownedIndex] = { ...nextOwned[ownedIndex], plan: normalizedPlan, name: options?.name || nextOwned[ownedIndex].name };
    persist({ ...library, ownedPlans: nextOwned });
    return nextOwned[ownedIndex].id;
  }, [persist, readOnly, t]);

  return {
    trainingPlan,
    dayKeys,
    dayColors,
    loading,
    saveMsg,
    hasPlan,
    plans,
    activePlanId,
    activePlanName,
    activePlanSource,
    activePlanOwnerName: activePlan?.ownerName,
    readOnly,
    setActivePlan,
    createPlan,
    copyActivePlanToOwned,
    shareActivePlan,
    addSharedPlanFromCode,
    saveDay,
    addDay,
    removeDay,
    addExercise,
    removeExercise,
    replacePlan,
  };
}
