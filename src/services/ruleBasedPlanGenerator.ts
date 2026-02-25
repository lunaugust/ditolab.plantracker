/**
 * Rule-based training plan generator — offline fallback.
 *
 * Assembles a plan from curated exercise templates based on the
 * user's experience, goal, days-per-week, and limitations.
 * Now uses centralized exercise library with ExerciseDB mappings.
 * No network call required.
 */

import { GENERATED_DAY_COLORS } from "../data/planGeneratorConfig";
import { makeExerciseId } from "../utils/helpers";
import {
  getExercisesByCategory,
  getExerciseName,
  type ExerciseLibraryEntry,
  type ExerciseCategory,
} from "../data/exerciseLibrary";

/* ================================================================
 * Day split templates by days-per-week
 * Each entry: { label, groups[] }
 * ================================================================ */
const SPLITS = {
  2: [
    { label: "Tren Superior", groups: ["chest", "back", "shoulders", "biceps", "triceps", "core"] },
    { label: "Tren Inferior", groups: ["quadriceps", "hamstrings", "glutes", "calves", "core"] },
  ],
  3: [
    { label: "Pecho · Hombros · Tríceps", groups: ["chest", "shoulders", "triceps", "core"] },
    { label: "Espalda · Bíceps", groups: ["back", "biceps", "core"] },
    { label: "Piernas · Glúteos", groups: ["quadriceps", "hamstrings", "glutes", "calves", "core"] },
  ],
  4: [
    { label: "Pecho · Tríceps", groups: ["chest", "triceps", "core"] },
    { label: "Espalda · Bíceps", groups: ["back", "biceps", "core"] },
    { label: "Piernas · Glúteos", groups: ["quadriceps", "hamstrings", "glutes", "calves"] },
    { label: "Hombros · Core", groups: ["shoulders", "core"] },
  ],
  5: [
    { label: "Pecho", groups: ["chest", "core"] },
    { label: "Espalda", groups: ["back", "core"] },
    { label: "Piernas · Cuádriceps", groups: ["quadriceps", "glutes", "calves"] },
    { label: "Hombros · Trapecios", groups: ["shoulders", "core"] },
    { label: "Piernas · Femoral · Bíceps · Tríceps", groups: ["hamstrings", "glutes", "biceps", "triceps"] },
  ],
  6: [
    { label: "Pecho · Tríceps", groups: ["chest", "triceps"] },
    { label: "Espalda · Bíceps", groups: ["back", "biceps"] },
    { label: "Piernas · Glúteos", groups: ["quadriceps", "hamstrings", "glutes", "calves"] },
    { label: "Hombros · Core", groups: ["shoulders", "core"] },
    { label: "Pecho · Espalda", groups: ["chest", "back", "core"] },
    { label: "Piernas · Brazos", groups: ["quadriceps", "hamstrings", "biceps", "triceps"] },
  ],
};

/* English labels for day splits */
const SPLITS_EN = {
  2: [
    { label: "Upper Body", groups: ["chest", "back", "shoulders", "biceps", "triceps", "core"] },
    { label: "Lower Body", groups: ["quadriceps", "hamstrings", "glutes", "calves", "core"] },
  ],
  3: [
    { label: "Chest · Shoulders · Triceps", groups: ["chest", "shoulders", "triceps", "core"] },
    { label: "Back · Biceps", groups: ["back", "biceps", "core"] },
    { label: "Legs · Glutes", groups: ["quadriceps", "hamstrings", "glutes", "calves", "core"] },
  ],
  4: [
    { label: "Chest · Triceps", groups: ["chest", "triceps", "core"] },
    { label: "Back · Biceps", groups: ["back", "biceps", "core"] },
    { label: "Legs · Glutes", groups: ["quadriceps", "hamstrings", "glutes", "calves"] },
    { label: "Shoulders · Core", groups: ["shoulders", "core"] },
  ],
  5: [
    { label: "Chest", groups: ["chest", "core"] },
    { label: "Back", groups: ["back", "core"] },
    { label: "Legs · Quads", groups: ["quadriceps", "glutes", "calves"] },
    { label: "Shoulders · Traps", groups: ["shoulders", "core"] },
    { label: "Legs · Hams · Arms", groups: ["hamstrings", "glutes", "biceps", "triceps"] },
  ],
  6: [
    { label: "Chest · Triceps", groups: ["chest", "triceps"] },
    { label: "Back · Biceps", groups: ["back", "biceps"] },
    { label: "Legs · Glutes", groups: ["quadriceps", "hamstrings", "glutes", "calves"] },
    { label: "Shoulders · Core", groups: ["shoulders", "core"] },
    { label: "Chest · Back", groups: ["chest", "back", "core"] },
    { label: "Legs · Arms", groups: ["quadriceps", "hamstrings", "biceps", "triceps"] },
  ],
};

/* ================================================================
 * Volume multipliers per experience × goal
 * ================================================================ */
const VOLUME = {
  beginner: { exercises: 1.0, sets: 0.75 },
  intermediate: { exercises: 1.0, sets: 1.0 },
  advanced: { exercises: 1.2, sets: 1.25 },
};

const EXERCISES_PER_GROUP = {
  adaptation: 1,
  fatBurn: 2,
  resistance: 2,
  strength: 2,
  hypertrophy: 2,
  maintenance: 1,
};

/* ================================================================
 * Helpers
 * ================================================================ */

/** Pick N exercises from a category, cycling if needed */
function pickExercises(
  category: ExerciseCategory,
  count: number
): ExerciseLibraryEntry[] {
  const pool = getExercisesByCategory(category);
  if (pool.length === 0) return [];
  const picked: ExerciseLibraryEntry[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(pool[i % pool.length]);
  }
  return picked;
}

/** Scale sets string by a multiplier (e.g. "4" × 0.75 → "3") */
function scaleSets(setsStr: string, multiplier: number): string {
  const n = parseInt(setsStr, 10);
  if (!Number.isFinite(n)) return setsStr;
  return String(Math.max(1, Math.round(n * multiplier)));
}

/** Add beginner-friendly notes */
function addBeginnerNotes(
  exercise: ExerciseLibraryEntry,
  language: "es" | "en"
): ExerciseLibraryEntry {
  const lightWeightNote = language === "en" ? "Light weight" : "Peso liviano";
  const focusNote =
    language === "en"
      ? "Light weight, focus on technique"
      : "Peso liviano, enfocarse en técnica";

  return {
    ...exercise,
    defaultNote: exercise.defaultNote
      ? `${exercise.defaultNote} · ${lightWeightNote}`
      : focusNote,
  };
}

/** Translate note fragments ES→EN */
function translateNote(note: string | undefined, language: "es" | "en"): string {
  if (!note || language !== "en") return note || "";

  const noteTranslations: Record<string, string> = {
    "Espalda neutra": "Keep back neutral",
    "Clave para postura": "Key for posture",
    "Peso liviano, enfocarse en técnica": "Light weight, focus on technique",
    "Peso liviano": "Light weight",
  };

  let translated = note;
  for (const [es, en] of Object.entries(noteTranslations)) {
    translated = translated.replace(es, en);
  }
  return translated;
}

/* ================================================================
 * Main generator
 * ================================================================ */

/**
 * Generate a training plan using curated rules.
 *
 * @param {{ experience: string, goal: string, limitations: string, daysPerWeek: number, minutesPerSession: number }} form
 * @param {string} language — "es" | "en"
 * @returns {Record<string, import("../data/trainingPlan").TrainingDay>}
 */
export function generateRuleBasedPlan(
  form: {
    experience: string;
    goal: string;
    limitations: string;
    daysPerWeek: number;
    minutesPerSession: number;
  },
  language: string = "es"
): Record<string, any> {
  const days = form.daysPerWeek;
  const splitSource = language === "en" ? SPLITS_EN : SPLITS;
  const split = splitSource[days as keyof typeof splitSource] || splitSource[3];
  const vol = VOLUME[form.experience as keyof typeof VOLUME] || VOLUME.intermediate;
  const exPerGroup =
    EXERCISES_PER_GROUP[form.goal as keyof typeof EXERCISES_PER_GROUP] || 2;

  // Rough estimate: ~5 min per exercise (including rest)
  const maxExercises = Math.floor(form.minutesPerSession / 5);

  const dayPrefix = language === "en" ? "Day" : "Día";
  const plan: Record<string, any> = {};

  split.forEach((dayTemplate, dayIndex) => {
    const dayKey = `${dayPrefix} ${dayIndex + 1}`;
    let rawExercises: ExerciseLibraryEntry[] = [];

    for (const group of dayTemplate.groups) {
      const count = Math.max(1, Math.round(exPerGroup * vol.exercises));
      const picked = pickExercises(group as ExerciseCategory, count);
      rawExercises.push(...picked);
    }

    // Trim to session time limit
    rawExercises = rawExercises.slice(0, maxExercises);

    // Beginner adjustments
    if (form.experience === "beginner") {
      rawExercises = rawExercises.map((ex) =>
        addBeginnerNotes(ex, language as "es" | "en")
      );
    }

    // Convert library entries to plan exercises with scaled sets
    const exercises = rawExercises.map((ex) => ({
      id: makeExerciseId(),
      name: getExerciseName(ex, language as "es" | "en"),
      sets: scaleSets(ex.defaultSets, vol.sets),
      reps: ex.defaultReps,
      rest: ex.defaultRest,
      note: translateNote(ex.defaultNote, language as "es" | "en"),
      exerciseDbId: ex.exerciseDbId, // Add ExerciseDB ID for GIF fetching
    }));

    plan[dayKey] = {
      label: dayTemplate.label,
      color: GENERATED_DAY_COLORS[dayIndex % GENERATED_DAY_COLORS.length],
      exercises,
    };
  });

  return plan;
}
