/**
 * Centralized Exercise Library with ExerciseDB mappings
 *
 * This file contains a curated list of exercises with:
 * - Standardized names in Spanish and English
 * - ExerciseDB API identifiers for fetching GIFs and metadata
 * - Exercise categories and equipment information
 *
 * This enables integration with ExerciseDB while maintaining flexibility
 * for custom exercises (which won't have exerciseDbId).
 */

export type ExerciseCategory =
  | "quadriceps"
  | "hamstrings"
  | "glutes"
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "calves"
  | "core";

export type ExerciseLibraryEntry = {
  /** Unique identifier within our library */
  id: string;
  /** Spanish name */
  nameEs: string;
  /** English name */
  nameEn: string;
  /** ExerciseDB API identifier (for fetching GIFs) */
  exerciseDbId: string;
  /** Primary muscle category */
  category: ExerciseCategory;
  /** Equipment needed */
  equipment?: string;
  /** Default sets */
  defaultSets: string;
  /** Default reps */
  defaultReps: string;
  /** Default rest period */
  defaultRest: string;
  /** Optional note/cue */
  defaultNote?: string;
};

/**
 * Curated exercise library with ExerciseDB mappings.
 * Based on the existing rule-based generator exercises.
 */
export const EXERCISE_LIBRARY: ExerciseLibraryEntry[] = [
  // QUADRICEPS
  {
    id: "hack_squat",
    nameEs: "Sentadilla Hack",
    nameEn: "Hack Squat",
    exerciseDbId: "1420",
    category: "quadriceps",
    equipment: "machine",
    defaultSets: "4",
    defaultReps: "12·10·8·6",
    defaultRest: "90s",
  },
  {
    id: "leg_press_45",
    nameEs: "Prensa 45°",
    nameEn: "45° Leg Press",
    exerciseDbId: "0685",
    category: "quadriceps",
    equipment: "machine",
    defaultSets: "4",
    defaultReps: "12",
    defaultRest: "90s",
  },
  {
    id: "goblet_squat",
    nameEs: "Sentadilla Goblet",
    nameEn: "Goblet Squat",
    exerciseDbId: "1434",
    category: "quadriceps",
    equipment: "dumbbell",
    defaultSets: "3",
    defaultReps: "12",
    defaultRest: "60s",
  },
  {
    id: "leg_extension",
    nameEs: "Extensión de Cuádriceps",
    nameEn: "Leg Extension",
    exerciseDbId: "0589",
    category: "quadriceps",
    equipment: "machine",
    defaultSets: "3",
    defaultReps: "12",
    defaultRest: "60s",
  },
  {
    id: "bulgarian_split_squat",
    nameEs: "Sentadilla Búlgara",
    nameEn: "Bulgarian Split Squat",
    exerciseDbId: "0433",
    category: "quadriceps",
    equipment: "dumbbell",
    defaultSets: "3",
    defaultReps: "10 c/pierna",
    defaultRest: "60s",
  },
  {
    id: "dumbbell_step_up",
    nameEs: "Step-ups con mancuernas",
    nameEn: "Dumbbell Step-ups",
    exerciseDbId: "0360",
    category: "quadriceps",
    equipment: "dumbbell",
    defaultSets: "3",
    defaultReps: "10 c/pierna",
    defaultRest: "60s",
  },

  // HAMSTRINGS
  {
    id: "lying_leg_curl",
    nameEs: "Curl Femoral Acostado",
    nameEn: "Lying Leg Curl",
    exerciseDbId: "0599",
    category: "hamstrings",
    equipment: "machine",
    defaultSets: "4",
    defaultReps: "12",
    defaultRest: "90s",
  },
  {
    id: "romanian_deadlift",
    nameEs: "Peso Muerto Rumano",
    nameEn: "Romanian Deadlift",
    exerciseDbId: "0360",
    category: "hamstrings",
    equipment: "barbell",
    defaultSets: "4",
    defaultReps: "10",
    defaultRest: "90s",
    defaultNote: "Espalda neutra",
  },
  {
    id: "seated_leg_curl",
    nameEs: "Curl Femoral Sentado",
    nameEn: "Seated Leg Curl",
    exerciseDbId: "0599",
    category: "hamstrings",
    equipment: "machine",
    defaultSets: "3",
    defaultReps: "12",
    defaultRest: "60s",
  },

  // GLUTES
  {
    id: "hip_thrust",
    nameEs: "Hip Thrust",
    nameEn: "Hip Thrust",
    exerciseDbId: "3287",
    category: "glutes",
    equipment: "barbell",
    defaultSets: "4",
    defaultReps: "10",
    defaultRest: "90s",
  },
  {
    id: "glute_bridge",
    nameEs: "Elevación de Cadera",
    nameEn: "Glute Bridge",
    exerciseDbId: "3287",
    category: "glutes",
    equipment: "bodyweight",
    defaultSets: "3",
    defaultReps: "12",
    defaultRest: "60s",
  },
  {
    id: "sumo_squat",
    nameEs: "Sentadilla Sumo",
    nameEn: "Sumo Squat",
    exerciseDbId: "1434",
    category: "glutes",
    equipment: "dumbbell",
    defaultSets: "4",
    defaultReps: "10",
    defaultRest: "90s",
  },

  // CHEST
  {
    id: "barbell_bench_press",
    nameEs: "Press Banco Plano con Barra",
    nameEn: "Barbell Bench Press",
    exerciseDbId: "0025",
    category: "chest",
    equipment: "barbell",
    defaultSets: "4",
    defaultReps: "10·8·6·6",
    defaultRest: "120s",
  },
  {
    id: "incline_dumbbell_press",
    nameEs: "Press Inclinado con Mancuernas",
    nameEn: "Incline Dumbbell Press",
    exerciseDbId: "0297",
    category: "chest",
    equipment: "dumbbell",
    defaultSets: "4",
    defaultReps: "10",
    defaultRest: "90s",
  },
  {
    id: "cable_flyes",
    nameEs: "Aperturas en Polea",
    nameEn: "Cable Flyes",
    exerciseDbId: "0115",
    category: "chest",
    equipment: "cable",
    defaultSets: "3",
    defaultReps: "12",
    defaultRest: "60s",
  },
  {
    id: "decline_press",
    nameEs: "Press Declinado",
    nameEn: "Decline Press",
    exerciseDbId: "0226",
    category: "chest",
    equipment: "barbell",
    defaultSets: "3",
    defaultReps: "10",
    defaultRest: "90s",
  },
  {
    id: "chest_dips",
    nameEs: "Fondos en Paralelas (pecho)",
    nameEn: "Chest Dips",
    exerciseDbId: "1430",
    category: "chest",
    equipment: "bodyweight",
    defaultSets: "3",
    defaultReps: "10",
    defaultRest: "90s",
  },

  // BACK
  {
    id: "wide_grip_lat_pulldown",
    nameEs: "Jalón al Pecho (agarre ancho)",
    nameEn: "Wide Grip Lat Pulldown",
    exerciseDbId: "0609",
    category: "back",
    equipment: "cable",
    defaultSets: "4",
    defaultReps: "12·10·8·6",
    defaultRest: "90s",
  },
  {
    id: "seated_cable_row",
    nameEs: "Remo en Polea Sentado",
    nameEn: "Seated Cable Row",
    exerciseDbId: "0179",
    category: "back",
    equipment: "cable",
    defaultSets: "4",
    defaultReps: "10",
    defaultRest: "90s",
  },
  {
    id: "single_arm_dumbbell_row",
    nameEs: "Remo con Mancuerna Unilateral",
    nameEn: "Single-arm Dumbbell Row",
    exerciseDbId: "0329",
    category: "back",
    equipment: "dumbbell",
    defaultSets: "3",
    defaultReps: "10 c/brazo",
    defaultRest: "60s",
  },
  {
    id: "supinated_lat_pulldown",
    nameEs: "Jalón Agarre Supino",
    nameEn: "Supinated Lat Pulldown",
    exerciseDbId: "0609",
    category: "back",
    equipment: "cable",
    defaultSets: "3",
    defaultReps: "10",
    defaultRest: "90s",
  },
  {
    id: "t_bar_row",
    nameEs: "Remo T",
    nameEn: "T-Bar Row",
    exerciseDbId: "0195",
    category: "back",
    equipment: "barbell",
    defaultSets: "3",
    defaultReps: "10",
    defaultRest: "90s",
  },

  // SHOULDERS
  {
    id: "machine_shoulder_press",
    nameEs: "Press Militar en Máquina",
    nameEn: "Machine Shoulder Press",
    exerciseDbId: "0799",
    category: "shoulders",
    equipment: "machine",
    defaultSets: "4",
    defaultReps: "12·10·8·6",
    defaultRest: "90s",
  },
  {
    id: "lateral_raises",
    nameEs: "Vuelos Laterales",
    nameEn: "Lateral Raises",
    exerciseDbId: "0338",
    category: "shoulders",
    equipment: "dumbbell",
    defaultSets: "4",
    defaultReps: "12",
    defaultRest: "60s",
  },
  {
    id: "face_pulls",
    nameEs: "Face Pulls",
    nameEn: "Face Pulls",
    exerciseDbId: "0267",
    category: "shoulders",
    equipment: "cable",
    defaultSets: "4",
    defaultReps: "15",
    defaultRest: "60s",
    defaultNote: "Clave para postura",
  },
  {
    id: "front_raises",
    nameEs: "Elevaciones Frontales",
    nameEn: "Front Raises",
    exerciseDbId: "0334",
    category: "shoulders",
    equipment: "dumbbell",
    defaultSets: "3",
    defaultReps: "12",
    defaultRest: "60s",
  },
  {
    id: "rear_delt_flyes",
    nameEs: "Elevaciones Posteriores",
    nameEn: "Rear Delt Flyes",
    exerciseDbId: "0340",
    category: "shoulders",
    equipment: "dumbbell",
    defaultSets: "3",
    defaultReps: "15",
    defaultRest: "60s",
  },

  // BICEPS
  {
    id: "ez_bar_curl",
    nameEs: "Curl con Barra W",
    nameEn: "EZ-Bar Curl",
    exerciseDbId: "1678",
    category: "biceps",
    equipment: "barbell",
    defaultSets: "4",
    defaultReps: "12·10·8·6",
    defaultRest: "90s",
  },
  {
    id: "hammer_curl",
    nameEs: "Curl Martillo",
    nameEn: "Hammer Curl",
    exerciseDbId: "1656",
    category: "biceps",
    equipment: "dumbbell",
    defaultSets: "3",
    defaultReps: "10",
    defaultRest: "60s",
  },
  {
    id: "preacher_curl",
    nameEs: "Curl en Banco Scott",
    nameEn: "Preacher Curl",
    exerciseDbId: "0180",
    category: "biceps",
    equipment: "barbell",
    defaultSets: "3",
    defaultReps: "10",
    defaultRest: "60s",
  },

  // TRICEPS
  {
    id: "cable_pushdown",
    nameEs: "Pushdown en Polea",
    nameEn: "Cable Pushdown",
    exerciseDbId: "0198",
    category: "triceps",
    equipment: "cable",
    defaultSets: "4",
    defaultReps: "12",
    defaultRest: "60s",
  },
  {
    id: "overhead_triceps_extension",
    nameEs: "Extensión de Tríceps sobre Cabeza",
    nameEn: "Overhead Triceps Extension",
    exerciseDbId: "0382",
    category: "triceps",
    equipment: "dumbbell",
    defaultSets: "3",
    defaultReps: "10",
    defaultRest: "60s",
  },
  {
    id: "bench_dips",
    nameEs: "Fondos en Banco",
    nameEn: "Bench Dips",
    exerciseDbId: "1399",
    category: "triceps",
    equipment: "bodyweight",
    defaultSets: "3",
    defaultReps: "12",
    defaultRest: "60s",
  },

  // CALVES
  {
    id: "standing_calf_raise",
    nameEs: "Pantorrillas de Pie",
    nameEn: "Standing Calf Raise",
    exerciseDbId: "1382",
    category: "calves",
    equipment: "machine",
    defaultSets: "4",
    defaultReps: "15",
    defaultRest: "60s",
  },
  {
    id: "seated_calf_raise",
    nameEs: "Pantorrillas Sentado",
    nameEn: "Seated Calf Raise",
    exerciseDbId: "1382",
    category: "calves",
    equipment: "machine",
    defaultSets: "3",
    defaultReps: "15",
    defaultRest: "60s",
  },

  // CORE
  {
    id: "front_plank",
    nameEs: "Plancha Frontal",
    nameEn: "Front Plank",
    exerciseDbId: "0136",
    category: "core",
    equipment: "bodyweight",
    defaultSets: "3",
    defaultReps: "45-60s",
    defaultRest: "60s",
  },
  {
    id: "dead_bug",
    nameEs: "Dead Bug",
    nameEn: "Dead Bug",
    exerciseDbId: "1479",
    category: "core",
    equipment: "bodyweight",
    defaultSets: "3",
    defaultReps: "10 c/lado",
    defaultRest: "60s",
  },
  {
    id: "bird_dog",
    nameEs: "Bird Dog",
    nameEn: "Bird Dog",
    exerciseDbId: "3299",
    category: "core",
    equipment: "bodyweight",
    defaultSets: "3",
    defaultReps: "10 c/lado",
    defaultRest: "60s",
  },
  {
    id: "cable_crunch",
    nameEs: "Crunch en Polea Alta",
    nameEn: "Cable Crunch",
    exerciseDbId: "0119",
    category: "core",
    equipment: "cable",
    defaultSets: "3",
    defaultReps: "15",
    defaultRest: "60s",
  },
];

/**
 * Get exercises by category
 */
export function getExercisesByCategory(category: ExerciseCategory): ExerciseLibraryEntry[] {
  return EXERCISE_LIBRARY.filter((ex) => ex.category === category);
}

/**
 * Get exercise by library ID
 */
export function getExerciseById(id: string): ExerciseLibraryEntry | undefined {
  return EXERCISE_LIBRARY.find((ex) => ex.id === id);
}

/**
 * Get exercise name in the specified language
 */
export function getExerciseName(entry: ExerciseLibraryEntry, language: "es" | "en"): string {
  return language === "en" ? entry.nameEn : entry.nameEs;
}

/**
 * Find exercise by name (fuzzy match)
 * Returns the best match or undefined if no good match found
 */
export function findExerciseByName(name: string, language: "es" | "en"): ExerciseLibraryEntry | undefined {
  if (!name || !name.trim()) return undefined;

  const searchName = name.toLowerCase().trim();

  // First try exact match
  for (const exercise of EXERCISE_LIBRARY) {
    const exName = (language === "en" ? exercise.nameEn : exercise.nameEs).toLowerCase();
    if (exName === searchName) {
      return exercise;
    }
  }

  // Then try partial match
  for (const exercise of EXERCISE_LIBRARY) {
    const exName = (language === "en" ? exercise.nameEn : exercise.nameEs).toLowerCase();
    if (exName.includes(searchName) || searchName.includes(exName)) {
      return exercise;
    }
  }

  return undefined;
}

/**
 * Get all exercise names for autocomplete (in specified language)
 */
export function getAllExerciseNames(language: "es" | "en"): string[] {
  return EXERCISE_LIBRARY.map((ex) => language === "en" ? ex.nameEn : ex.nameEs);
}
