/**
 * Standardized exercise catalog.
 *
 * Each entry maps a canonical Spanish display name and English display name
 * to the lowercase `exerciseDbName` used for ExerciseDB API lookups
 * (https://exercisedb.io).
 *
 * Used by:
 *  - ruleBasedPlanGenerator  — auto-attaches `exerciseDbName` to every exercise
 *  - aiPlanGenerator         — injected into the system prompt so Gemini picks
 *                              canonical names and emits `exerciseDbName`
 *  - planImporter            — injected into the import prompt so Gemini
 *                              normalizes arbitrary exercise names from user files
 *  - ExerciseRow UI          — triggers GIF lookup when `exerciseDbName` is set
 */

export interface ExerciseCatalogEntry {
  /** Spanish display name (used as primary key for rule-based generator) */
  nameEs: string;
  /** English display name */
  nameEn: string;
  /**
   * Lowercase name matching ExerciseDB API search.
   * Used to query: GET /exercises/name/{exerciseDbName}
   */
  exerciseDbName: string;
  /** Primary muscle group key (matches keys in ruleBasedPlanGenerator) */
  muscleGroup: string;
}

export const EXERCISE_CATALOG: ExerciseCatalogEntry[] = [
  // ── Quadriceps ─────────────────────────────────────────────────────────────
  { nameEs: "Sentadilla Hack",          nameEn: "Hack Squat",               exerciseDbName: "hack squat",               muscleGroup: "quadriceps" },
  { nameEs: "Prensa 45°",               nameEn: "Leg Press",                exerciseDbName: "leg press",                muscleGroup: "quadriceps" },
  { nameEs: "Sentadilla Goblet",        nameEn: "Goblet Squat",             exerciseDbName: "goblet squat",             muscleGroup: "quadriceps" },
  { nameEs: "Extensión de Cuádriceps", nameEn: "Leg Extension",            exerciseDbName: "leg extension",            muscleGroup: "quadriceps" },
  { nameEs: "Sentadilla Búlgara",       nameEn: "Bulgarian Split Squat",    exerciseDbName: "bulgarian split squat",    muscleGroup: "quadriceps" },
  { nameEs: "Step-ups con mancuernas",  nameEn: "Dumbbell Step-up",         exerciseDbName: "dumbbell step-up",         muscleGroup: "quadriceps" },

  // ── Hamstrings ──────────────────────────────────────────────────────────────
  { nameEs: "Curl Femoral Acostado",    nameEn: "Lying Leg Curl",           exerciseDbName: "lying leg curl",           muscleGroup: "hamstrings" },
  { nameEs: "Peso Muerto Rumano",       nameEn: "Romanian Deadlift",        exerciseDbName: "romanian deadlift",        muscleGroup: "hamstrings" },
  { nameEs: "Curl Femoral Sentado",     nameEn: "Seated Leg Curl",          exerciseDbName: "seated leg curl",          muscleGroup: "hamstrings" },

  // ── Glutes ──────────────────────────────────────────────────────────────────
  { nameEs: "Hip Thrust",               nameEn: "Hip Thrust",               exerciseDbName: "barbell hip thrust",       muscleGroup: "glutes" },
  { nameEs: "Elevación de Cadera",      nameEn: "Glute Bridge",             exerciseDbName: "glute bridge",             muscleGroup: "glutes" },
  { nameEs: "Sentadilla Sumo",          nameEn: "Sumo Squat",               exerciseDbName: "sumo squat",               muscleGroup: "glutes" },

  // ── Chest ───────────────────────────────────────────────────────────────────
  { nameEs: "Press Banco Plano con Barra",    nameEn: "Barbell Bench Press",      exerciseDbName: "barbell bench press",      muscleGroup: "chest" },
  { nameEs: "Press Inclinado con Mancuernas", nameEn: "Incline Dumbbell Press",   exerciseDbName: "incline dumbbell press",   muscleGroup: "chest" },
  { nameEs: "Aperturas en Polea",             nameEn: "Cable Fly",                exerciseDbName: "cable fly",                muscleGroup: "chest" },
  { nameEs: "Press Declinado",                nameEn: "Decline Bench Press",      exerciseDbName: "decline bench press",      muscleGroup: "chest" },
  { nameEs: "Fondos en Paralelas (pecho)",    nameEn: "Chest Dip",                exerciseDbName: "chest dip",                muscleGroup: "chest" },

  // ── Back ────────────────────────────────────────────────────────────────────
  { nameEs: "Jalón al Pecho (agarre ancho)", nameEn: "Wide-Grip Lat Pulldown",   exerciseDbName: "wide-grip lat pulldown",   muscleGroup: "back" },
  { nameEs: "Remo en Polea Sentado",          nameEn: "Seated Cable Row",         exerciseDbName: "seated cable row",         muscleGroup: "back" },
  { nameEs: "Remo con Mancuerna Unilateral",  nameEn: "One-Arm Dumbbell Row",     exerciseDbName: "one arm dumbbell row",     muscleGroup: "back" },
  { nameEs: "Jalón Agarre Supino",            nameEn: "Reverse-Grip Lat Pulldown",exerciseDbName: "reverse grip lat pulldown",muscleGroup: "back" },
  { nameEs: "Remo T",                         nameEn: "T-Bar Row",                exerciseDbName: "t bar row",                muscleGroup: "back" },
  { nameEs: "Face Pulls en Polea Alta",       nameEn: "Face Pull",                exerciseDbName: "face pull",                muscleGroup: "back" },

  // ── Shoulders ───────────────────────────────────────────────────────────────
  { nameEs: "Press Militar en Máquina",       nameEn: "Machine Shoulder Press",   exerciseDbName: "smith machine overhead press", muscleGroup: "shoulders" },
  { nameEs: "Vuelos Laterales",               nameEn: "Lateral Raise",            exerciseDbName: "lateral raise",            muscleGroup: "shoulders" },
  { nameEs: "Face Pulls",                     nameEn: "Face Pull",                exerciseDbName: "face pull",                muscleGroup: "shoulders" },
  { nameEs: "Elevaciones Frontales",          nameEn: "Front Raise",              exerciseDbName: "front raise",              muscleGroup: "shoulders" },
  { nameEs: "Elevaciones Posteriores",        nameEn: "Rear Delt Fly",            exerciseDbName: "rear delt fly",            muscleGroup: "shoulders" },

  // ── Biceps ──────────────────────────────────────────────────────────────────
  { nameEs: "Curl con Barra W",           nameEn: "EZ-Bar Curl",              exerciseDbName: "ez bar curl",              muscleGroup: "biceps" },
  { nameEs: "Curl Martillo",              nameEn: "Hammer Curl",              exerciseDbName: "hammer curl",              muscleGroup: "biceps" },
  { nameEs: "Curl en Banco Scott",        nameEn: "Preacher Curl",            exerciseDbName: "preacher curl",            muscleGroup: "biceps" },

  // ── Triceps ──────────────────────────────────────────────────────────────────
  { nameEs: "Pushdown en Polea",                 nameEn: "Cable Pushdown",            exerciseDbName: "cable pushdown",            muscleGroup: "triceps" },
  { nameEs: "Extensión de Tríceps sobre Cabeza", nameEn: "Overhead Tricep Extension", exerciseDbName: "overhead tricep extension", muscleGroup: "triceps" },
  { nameEs: "Fondos en Banco",                   nameEn: "Bench Dip",                 exerciseDbName: "bench dip",                 muscleGroup: "triceps" },

  // ── Calves ──────────────────────────────────────────────────────────────────
  { nameEs: "Pantorrillas de Pie",    nameEn: "Standing Calf Raise",  exerciseDbName: "standing calf raise",  muscleGroup: "calves" },
  { nameEs: "Pantorrillas Sentado",   nameEn: "Seated Calf Raise",    exerciseDbName: "seated calf raise",    muscleGroup: "calves" },

  // ── Core ────────────────────────────────────────────────────────────────────
  { nameEs: "Plancha Frontal",      nameEn: "Plank",          exerciseDbName: "plank",          muscleGroup: "core" },
  { nameEs: "Dead Bug",             nameEn: "Dead Bug",       exerciseDbName: "dead bug",       muscleGroup: "core" },
  { nameEs: "Bird Dog",             nameEn: "Bird Dog",       exerciseDbName: "bird dog",       muscleGroup: "core" },
  { nameEs: "Crunch en Polea Alta", nameEn: "Cable Crunch",   exerciseDbName: "cable crunch",   muscleGroup: "core" },
];

/**
 * Lookup the ExerciseDB name for a given display name (Spanish or English).
 * Case-insensitive. Returns `undefined` when not found.
 */
export function lookupExerciseDbName(displayName: string): string | undefined {
  const lower = displayName.toLowerCase().trim();
  const entry = EXERCISE_CATALOG.find(
    (e) =>
      e.nameEs.toLowerCase() === lower ||
      e.nameEn.toLowerCase() === lower ||
      e.exerciseDbName === lower
  );
  return entry?.exerciseDbName;
}

/**
 * Build a compact reference list (English name → exerciseDbName) suitable
 * for injecting into AI / importer system prompts.
 *
 * Format: "  - Barbell Bench Press → barbell bench press"
 */
export function buildExerciseCatalogPromptSection(): string {
  const lines = EXERCISE_CATALOG.map(
    (e) => `  - ${e.nameEn} → ${e.exerciseDbName}`
  );
  return lines.join("\n");
}
