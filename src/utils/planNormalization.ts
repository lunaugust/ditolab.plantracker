import { TRAINING_PLAN } from "../data/trainingPlan";
import { makeExerciseId } from "./helpers";
import type { Exercise, TrainingDay, TrainingPlan } from "../services/types";

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

const DEFAULT_DAY_COLORS = Object.values(TRAINING_PLAN).map((day) => day.color);

export function normalizeExercise(rawExercise: unknown, index: number): Exercise {
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

export function normalizePlan(inputPlan: unknown): TrainingPlan {
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

export function clonePlan(plan: TrainingPlan): TrainingPlan {
  return JSON.parse(JSON.stringify(plan));
}

export function compareDayKeys(a: string, b: string): number {
  return a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });
}

export function getNextDayName(existingKeys: string[], template: string): string {
  let index = existingKeys.length + 1;
  let candidate = template.replace("{n}", String(index));
  while (existingKeys.includes(candidate)) {
    index += 1;
    candidate = template.replace("{n}", String(index));
  }
  return candidate;
}

export { DEFAULT_DAY_COLORS };
