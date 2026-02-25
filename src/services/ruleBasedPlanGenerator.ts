/**
 * Rule-based training plan generator — offline fallback.
 *
 * Assembles a plan from curated exercise templates based on the
 * user's experience, goal, days-per-week, and limitations.
 * No network call required.
 */

import { GENERATED_DAY_COLORS } from "../data/planGeneratorConfig";
import { lookupExerciseDbName } from "../data/exerciseCatalog";
import { makeExerciseId } from "../utils/helpers";

/* ================================================================
 * Exercise library — grouped by muscle region
 * Each exercise: { name, sets, reps, rest, note? }
 * Values are in Spanish; translated at the end if language==="en".
 * ================================================================ */
const EXERCISES = {
  quadriceps: [
    { name: "Sentadilla Hack", sets: "4", reps: "12·10·8·6", rest: "90s" },
    { name: "Prensa 45°", sets: "4", reps: "12", rest: "90s" },
    { name: "Sentadilla Goblet", sets: "3", reps: "12", rest: "60s" },
    { name: "Extensión de Cuádriceps", sets: "3", reps: "12", rest: "60s" },
    { name: "Sentadilla Búlgara", sets: "3", reps: "10 c/pierna", rest: "60s" },
    { name: "Step-ups con mancuernas", sets: "3", reps: "10 c/pierna", rest: "60s" },
  ],
  hamstrings: [
    { name: "Curl Femoral Acostado", sets: "4", reps: "12", rest: "90s" },
    { name: "Peso Muerto Rumano", sets: "4", reps: "10", rest: "90s", note: "Espalda neutra" },
    { name: "Curl Femoral Sentado", sets: "3", reps: "12", rest: "60s" },
  ],
  glutes: [
    { name: "Hip Thrust", sets: "4", reps: "10", rest: "90s" },
    { name: "Elevación de Cadera", sets: "3", reps: "12", rest: "60s" },
    { name: "Sentadilla Sumo", sets: "4", reps: "10", rest: "90s" },
  ],
  chest: [
    { name: "Press Banco Plano con Barra", sets: "4", reps: "10·8·6·6", rest: "120s" },
    { name: "Press Inclinado con Mancuernas", sets: "4", reps: "10", rest: "90s" },
    { name: "Aperturas en Polea", sets: "3", reps: "12", rest: "60s" },
    { name: "Press Declinado", sets: "3", reps: "10", rest: "90s" },
    { name: "Fondos en Paralelas (pecho)", sets: "3", reps: "10", rest: "90s" },
  ],
  back: [
    { name: "Jalón al Pecho (agarre ancho)", sets: "4", reps: "12·10·8·6", rest: "90s" },
    { name: "Remo en Polea Sentado", sets: "4", reps: "10", rest: "90s" },
    { name: "Remo con Mancuerna Unilateral", sets: "3", reps: "10 c/brazo", rest: "60s" },
    { name: "Jalón Agarre Supino", sets: "3", reps: "10", rest: "90s" },
    { name: "Remo T", sets: "3", reps: "10", rest: "90s" },
  ],
  shoulders: [
    { name: "Press Militar en Máquina", sets: "4", reps: "12·10·8·6", rest: "90s" },
    { name: "Vuelos Laterales", sets: "4", reps: "12", rest: "60s" },
    { name: "Face Pulls", sets: "4", reps: "15", rest: "60s", note: "Clave para postura" },
    { name: "Elevaciones Frontales", sets: "3", reps: "12", rest: "60s" },
    { name: "Elevaciones Posteriores", sets: "3", reps: "15", rest: "60s" },
  ],
  biceps: [
    { name: "Curl con Barra W", sets: "4", reps: "12·10·8·6", rest: "90s" },
    { name: "Curl Martillo", sets: "3", reps: "10", rest: "60s" },
    { name: "Curl en Banco Scott", sets: "3", reps: "10", rest: "60s" },
  ],
  triceps: [
    { name: "Pushdown en Polea", sets: "4", reps: "12", rest: "60s" },
    { name: "Extensión de Tríceps sobre Cabeza", sets: "3", reps: "10", rest: "60s" },
    { name: "Fondos en Banco", sets: "3", reps: "12", rest: "60s" },
  ],
  calves: [
    { name: "Pantorrillas de Pie", sets: "4", reps: "15", rest: "60s" },
    { name: "Pantorrillas Sentado", sets: "3", reps: "15", rest: "60s" },
  ],
  core: [
    { name: "Plancha Frontal", sets: "3", reps: "45-60s", rest: "60s" },
    { name: "Dead Bug", sets: "3", reps: "10 c/lado", rest: "60s" },
    { name: "Bird Dog", sets: "3", reps: "10 c/lado", rest: "60s" },
    { name: "Crunch en Polea Alta", sets: "3", reps: "15", rest: "60s" },
  ],
};

/* ================================================================
 * Day split templates by days-per-week
 * Each entry: { labelKey, groups[] }
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

/** Add beginner-friendly notes */
function addBeginnerNotes(exercise) {
  return {
    ...exercise,
    note: exercise.note ? `${exercise.note} · Peso liviano` : "Peso liviano, enfocarse en técnica",
  };
}

/* Simple ES→EN exercise name map for rule-based (best effort) */
const NAME_TRANSLATIONS = {
  "Sentadilla Hack": "Hack Squat",
  "Prensa 45°": "45° Leg Press",
  "Sentadilla Goblet": "Goblet Squat",
  "Extensión de Cuádriceps": "Leg Extension",
  "Sentadilla Búlgara": "Bulgarian Split Squat",
  "Step-ups con mancuernas": "Dumbbell Step-ups",
  "Curl Femoral Acostado": "Lying Leg Curl",
  "Peso Muerto Rumano": "Romanian Deadlift",
  "Curl Femoral Sentado": "Seated Leg Curl",
  "Hip Thrust": "Hip Thrust",
  "Elevación de Cadera": "Glute Bridge",
  "Sentadilla Sumo": "Sumo Squat",
  "Press Banco Plano con Barra": "Barbell Bench Press",
  "Press Inclinado con Mancuernas": "Incline Dumbbell Press",
  "Aperturas en Polea": "Cable Flyes",
  "Press Declinado": "Decline Press",
  "Fondos en Paralelas (pecho)": "Chest Dips",
  "Jalón al Pecho (agarre ancho)": "Wide Grip Lat Pulldown",
  "Remo en Polea Sentado": "Seated Cable Row",
  "Remo con Mancuerna Unilateral": "Single-arm Dumbbell Row",
  "Jalón Agarre Supino": "Supinated Lat Pulldown",
  "Remo T": "T-Bar Row",
  "Press Militar en Máquina": "Machine Shoulder Press",
  "Vuelos Laterales": "Lateral Raises",
  "Face Pulls": "Face Pulls",
  "Elevaciones Frontales": "Front Raises",
  "Elevaciones Posteriores": "Rear Delt Flyes",
  "Curl con Barra W": "EZ-Bar Curl",
  "Curl Martillo": "Hammer Curl",
  "Curl en Banco Scott": "Preacher Curl",
  "Pushdown en Polea": "Cable Pushdown",
  "Extensión de Tríceps sobre Cabeza": "Overhead Triceps Extension",
  "Fondos en Banco": "Bench Dips",
  "Pantorrillas de Pie": "Standing Calf Raise",
  "Pantorrillas Sentado": "Seated Calf Raise",
  "Plancha Frontal": "Front Plank",
  "Dead Bug": "Dead Bug",
  "Bird Dog": "Bird Dog",
  "Crunch en Polea Alta": "Cable Crunch",
};

const NOTE_TRANSLATIONS = {
  "Espalda neutra": "Keep back neutral",
  "Clave para postura": "Key for posture",
  "Peso liviano, enfocarse en técnica": "Light weight, focus on technique",
  "Peso liviano": "Light weight",
};

function translateExercise(ex, language) {
  if (language !== "en") return ex;
  let note = ex.note || "";
  // Translate known note fragments
  for (const [es, en] of Object.entries(NOTE_TRANSLATIONS)) {
    note = note.replace(es, en);
  }
  return {
    ...ex,
    name: NAME_TRANSLATIONS[ex.name] || ex.name,
    note,
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
      exercises = exercises.map(addBeginnerNotes);
    }

    // Translate if needed
    exercises = exercises.map((ex) => translateExercise(ex, language));

    // Add unique IDs and ExerciseDB name
    exercises = exercises.map((ex) => ({
      id: makeExerciseId(),
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rest: ex.rest,
      note: ex.note || "",
      exerciseDbName: lookupExerciseDbName(ex.name),
    }));

    plan[dayKey] = {
      label: dayTemplate.label,
      color: GENERATED_DAY_COLORS[dayIndex % GENERATED_DAY_COLORS.length],
      exercises,
    };
  });

  return plan;
}
