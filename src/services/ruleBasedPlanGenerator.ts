/**
 * Rule-based training plan generator — offline fallback.
 *
 * Assembles a plan from curated exercise templates based on the
 * user's experience, goal, days-per-week, and limitations.
 * No network call required.
 *
 * Exercise names are taken directly from exercises.json so GIFs
 * always match (names are English regardless of language).
 */

import { GENERATED_DAY_COLORS } from "../data/planGeneratorConfig";
import { makeExerciseId } from "../utils/helpers";

/* ================================================================
 * Exercise library — grouped by muscle region.
 * Names match exercises.json entries exactly (English, lowercase).
 * ================================================================ */
const EXERCISES = {
  quadriceps: [
    { name: "sled hack squat", sets: "4", reps: "12·10·8·6", rest: "90s" },
    { name: "smith leg press", sets: "4", reps: "12", rest: "90s" },
    { name: "dumbbell goblet squat", sets: "3", reps: "12", rest: "60s" },
    { name: "lever leg extension", sets: "3", reps: "12", rest: "60s" },
    { name: "dumbbell single leg split squat", sets: "3", reps: "10 /leg", rest: "60s" },
    { name: "dumbbell step-up", sets: "3", reps: "10 /leg", rest: "60s" },
  ],
  hamstrings: [
    { name: "lever lying leg curl", sets: "4", reps: "12", rest: "90s" },
    { name: "barbell romanian deadlift", sets: "4", reps: "10", rest: "90s", note: "Keep back neutral" },
    { name: "lever seated leg curl", sets: "3", reps: "12", rest: "60s" },
  ],
  glutes: [
    { name: "barbell glute bridge", sets: "4", reps: "10", rest: "90s" },
    { name: "cable kickback", sets: "3", reps: "12 /leg", rest: "60s" },
    { name: "barbell sumo deadlift", sets: "4", reps: "10", rest: "90s" },
  ],
  chest: [
    { name: "barbell bench press", sets: "4", reps: "10·8·6·6", rest: "120s" },
    { name: "dumbbell incline bench press", sets: "4", reps: "10", rest: "90s" },
    { name: "cable middle fly", sets: "3", reps: "12", rest: "60s" },
    { name: "barbell decline bench press", sets: "3", reps: "10", rest: "90s" },
    { name: "chest dip", sets: "3", reps: "10", rest: "90s" },
  ],
  back: [
    { name: "cable pulldown", sets: "4", reps: "12·10·8·6", rest: "90s" },
    { name: "cable seated row", sets: "4", reps: "10", rest: "90s" },
    { name: "dumbbell bent over row", sets: "3", reps: "10 /arm", rest: "60s" },
    { name: "cable underhand pulldown", sets: "3", reps: "10", rest: "90s" },
    { name: "lever reverse t-bar row", sets: "3", reps: "10", rest: "90s" },
  ],
  shoulders: [
    { name: "lever shoulder press", sets: "4", reps: "12·10·8·6", rest: "90s" },
    { name: "dumbbell lateral raise", sets: "4", reps: "12", rest: "60s" },
    { name: "cable supine reverse fly", sets: "4", reps: "15", rest: "60s", note: "Key for posture" },
    { name: "dumbbell front raise", sets: "3", reps: "12", rest: "60s" },
    { name: "dumbbell rear fly", sets: "3", reps: "15", rest: "60s" },
  ],
  biceps: [
    { name: "ez barbell curl", sets: "4", reps: "12·10·8·6", rest: "90s" },
    { name: "dumbbell hammer curl", sets: "3", reps: "10", rest: "60s" },
    { name: "barbell preacher curl", sets: "3", reps: "10", rest: "60s" },
  ],
  triceps: [
    { name: "cable pushdown", sets: "4", reps: "12", rest: "60s" },
    { name: "cable rope high pulley overhead tricep extension", sets: "3", reps: "10", rest: "60s" },
    { name: "weighted bench dip", sets: "3", reps: "12", rest: "60s" },
  ],
  calves: [
    { name: "barbell standing calf raise", sets: "4", reps: "15", rest: "60s" },
    { name: "dumbbell seated calf raise", sets: "3", reps: "15", rest: "60s" },
  ],
  core: [
    { name: "weighted front plank", sets: "3", reps: "45-60s", rest: "60s" },
    { name: "dead bug", sets: "3", reps: "10 /side", rest: "60s" },
    { name: "cable kneeling crunch", sets: "3", reps: "15", rest: "60s" },
    { name: "reverse crunch", sets: "3", reps: "15", rest: "60s" },
  ],
};

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
  beginner:     { exercises: 1.0, sets: 0.75 },
  intermediate: { exercises: 1.0, sets: 1.0 },
  advanced:     { exercises: 1.2, sets: 1.25 },
};

const EXERCISES_PER_GROUP = {
  adaptation:  1,
  fatBurn:     2,
  resistance:  2,
  strength:    2,
  hypertrophy: 2,
  maintenance: 1,
};

/* ================================================================
 * Helpers
 * ================================================================ */

/** Pick N exercises from a group, cycling if needed */
function pickExercises(groupKey, count) {
  const pool = EXERCISES[groupKey] || [];
  if (pool.length === 0) return [];
  const picked = [];
  for (let i = 0; i < count; i++) {
    picked.push({ ...pool[i % pool.length] });
  }
  return picked;
}

/** Scale sets string by a multiplier (e.g. "4" × 0.75 → "3") */
function scaleSets(setsStr, multiplier) {
  const n = parseInt(setsStr, 10);
  if (!Number.isFinite(n)) return setsStr;
  return String(Math.max(1, Math.round(n * multiplier)));
}

/** Beginner note translations */
const BEGINNER_NOTES = {
  es: { suffix: "Peso liviano", full: "Peso liviano, enfocarse en técnica" },
  en: { suffix: "Light weight", full: "Light weight, focus on technique" },
};

/** Add beginner-friendly notes */
function addBeginnerNotes(exercise, language) {
  const notes = BEGINNER_NOTES[language] || BEGINNER_NOTES.en;
  return {
    ...exercise,
    note: exercise.note ? `${exercise.note} · ${notes.suffix}` : notes.full,
  };
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
export function generateRuleBasedPlan(form, language = "es") {
  const days = form.daysPerWeek;
  const splitSource = language === "en" ? SPLITS_EN : SPLITS;
  const split = splitSource[days] || splitSource[3];
  const vol = VOLUME[form.experience] || VOLUME.intermediate;
  const exPerGroup = EXERCISES_PER_GROUP[form.goal] || 2;

  // Rough estimate: ~5 min per exercise (including rest)
  const maxExercises = Math.floor(form.minutesPerSession / 5);

  const dayPrefix = language === "en" ? "Day" : "Día";
  const plan = {};

  split.forEach((dayTemplate, dayIndex) => {
    const dayKey = `${dayPrefix} ${dayIndex + 1}`;
    const rawExercises = [];

    for (const group of dayTemplate.groups) {
      const count = Math.max(1, Math.round(exPerGroup * vol.exercises));
      const picked = pickExercises(group, count);
      rawExercises.push(...picked);
    }

    // Trim to session time limit
    let exercises = rawExercises.slice(0, maxExercises);

    // Scale sets
    exercises = exercises.map((ex) => ({
      ...ex,
      sets: scaleSets(ex.sets, vol.sets),
    }));

    // Beginner adjustments
    if (form.experience === "beginner") {
      exercises = exercises.map((ex) => addBeginnerNotes(ex, language));
    }

    // Add unique IDs
    exercises = exercises.map((ex) => ({
      id: makeExerciseId(),
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rest: ex.rest,
      note: ex.note || "",
    }));

    plan[dayKey] = {
      label: dayTemplate.label,
      color: GENERATED_DAY_COLORS[dayIndex % GENERATED_DAY_COLORS.length],
      exercises,
    };
  });

  return plan;
}
