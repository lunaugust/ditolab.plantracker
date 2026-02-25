export type ExerciseCatalogEntry = {
  slug: string;
  exerciseDbId: string;
  name: { es: string; en: string };
  synonyms?: string[];
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const EXERCISE_CATALOG: ExerciseCatalogEntry[] = [
  { slug: "hack-squat", exerciseDbId: "hack-squat", name: { es: "Sentadilla Hack", en: "Hack Squat" }, synonyms: ["sentadilla hack calentamiento", "sentadilla hack (calentamiento)"] },
  { slug: "leg-press-45", exerciseDbId: "leg-press-45", name: { es: "Prensa 45°", en: "45° Leg Press" }, synonyms: ["prensa pies arriba", "prensa 45"] },
  { slug: "dumbbell-step-up", exerciseDbId: "dumbbell-step-up", name: { es: "Step-ups con mancuernas", en: "Dumbbell Step-up" }, synonyms: ["step ups"] },
  { slug: "leg-extension", exerciseDbId: "leg-extension", name: { es: "Extensión de Cuádriceps", en: "Leg Extension" }, synonyms: ["sillon de cuadriceps", "sillon de cuadriceps", "silla de cuadriceps"] },
  { slug: "lying-leg-curl", exerciseDbId: "lying-leg-curl", name: { es: "Curl Femoral Acostado", en: "Lying Leg Curl" }, synonyms: ["camilla femoral", "curl femoral", "silla femoral"] },
  { slug: "seated-leg-curl", exerciseDbId: "seated-leg-curl", name: { es: "Curl Femoral Sentado", en: "Seated Leg Curl" }, synonyms: ["silla femoral sentado"] },
  { slug: "sumo-squat", exerciseDbId: "sumo-squat", name: { es: "Sentadilla Sumo", en: "Sumo Squat" }, synonyms: ["sentadilla sumo aductor", "sentadilla sumo + aductor"] },
  { slug: "hip-thrust", exerciseDbId: "hip-thrust", name: { es: "Hip Thrust", en: "Hip Thrust" }, synonyms: ["elevacion de cadera", "elevación de cadera", "elevacion de cadera en maquina", "elevación de cadera en máquina"] },
  { slug: "standing-calf-raise", exerciseDbId: "standing-calf-raise", name: { es: "Pantorrillas de Pie", en: "Standing Calf Raise" } },
  { slug: "seated-calf-raise", exerciseDbId: "seated-calf-raise", name: { es: "Pantorrillas Sentado", en: "Seated Calf Raise" } },
  { slug: "dead-bug", exerciseDbId: "dead-bug", name: { es: "Dead Bug", en: "Dead Bug" } },
  { slug: "front-plank", exerciseDbId: "front-plank", name: { es: "Plancha Frontal", en: "Front Plank" } },
  { slug: "bird-dog", exerciseDbId: "bird-dog", name: { es: "Bird Dog", en: "Bird Dog" } },
  { slug: "face-pull", exerciseDbId: "face-pull", name: { es: "Face Pulls", en: "Face Pull" }, synonyms: ["face pulls en polea alta", "face pulls / band pull-aparts"] },
  { slug: "band-pull-apart", exerciseDbId: "band-pull-apart", name: { es: "Band Pull-Aparts", en: "Band Pull-Apart" }, synonyms: ["activacion face pulls", "face pulls / band pull-aparts"] },
  { slug: "lat-pulldown-wide", exerciseDbId: "lat-pulldown-wide", name: { es: "Jalón al Pecho (agarre ancho)", en: "Wide-grip Lat Pulldown" }, synonyms: ["jalon al pecho", "jalon agarre ancho"] },
  { slug: "lat-pulldown-supinated", exerciseDbId: "lat-pulldown-supinated", name: { es: "Jalón Agarre Supino", en: "Supinated Lat Pulldown" } },
  { slug: "seated-cable-row", exerciseDbId: "seated-cable-row", name: { es: "Remo en Polea Sentado", en: "Seated Cable Row" } },
  { slug: "single-arm-dumbbell-row", exerciseDbId: "single-arm-dumbbell-row", name: { es: "Remo con Mancuerna Unilateral", en: "Single-arm Dumbbell Row" } },
  { slug: "dumbbell-shrug", exerciseDbId: "dumbbell-shrug", name: { es: "Encogimiento con Mancuernas", en: "Dumbbell Shrug" } },
  { slug: "rear-delt-raise", exerciseDbId: "rear-delt-raise", name: { es: "Elevaciones Posteriores", en: "Rear Delt Raise" }, synonyms: ["elevaciones posteriores con mancuernas"] },
  { slug: "lateral-raise", exerciseDbId: "lateral-raise", name: { es: "Vuelos Laterales", en: "Lateral Raise" }, synonyms: ["vuelos laterales con mancuernas"] },
  { slug: "front-raise", exerciseDbId: "front-raise", name: { es: "Elevaciones Frontales", en: "Front Raise" } },
  { slug: "ez-bar-curl", exerciseDbId: "ez-bar-curl", name: { es: "Bíceps con Barra W", en: "EZ-Bar Curl" }, synonyms: ["curl con barra w", "biceps con barra w"] },
  { slug: "preacher-curl", exerciseDbId: "preacher-curl", name: { es: "Bíceps Banco Scott", en: "Preacher Curl" }, synonyms: ["curl en banco scott"] },
  { slug: "hammer-curl", exerciseDbId: "hammer-curl", name: { es: "Curl Martillo", en: "Hammer Curl" } },
  { slug: "rope-pushdown", exerciseDbId: "rope-pushdown", name: { es: "Pushdown en Polea", en: "Cable Rope Pushdown" }, synonyms: ["triceps en polea con cuerda", "tríceps en polea con cuerda"] },
  { slug: "overhead-triceps-extension", exerciseDbId: "overhead-triceps-extension", name: { es: "Extensión de Tríceps sobre Cabeza", en: "Overhead Triceps Extension" } },
  { slug: "bench-dip", exerciseDbId: "bench-dip", name: { es: "Fondos en Banco", en: "Bench Dips" } },
  { slug: "chest-dip", exerciseDbId: "chest-dip", name: { es: "Fondos en Paralelas (pecho)", en: "Chest Dips" } },
  { slug: "barbell-bench-press", exerciseDbId: "barbell-bench-press", name: { es: "Press Banco Plano con Barra", en: "Barbell Bench Press" }, synonyms: ["press banco plano — calentamiento", "press banco plano", "press banco plano calentamiento"] },
  { slug: "incline-dumbbell-press", exerciseDbId: "incline-dumbbell-press", name: { es: "Press Inclinado con Mancuernas", en: "Incline Dumbbell Press" } },
  { slug: "decline-bench-press", exerciseDbId: "decline-bench-press", name: { es: "Press Declinado", en: "Decline Bench Press" } },
  { slug: "machine-shoulder-press", exerciseDbId: "machine-shoulder-press", name: { es: "Press Militar en Máquina", en: "Machine Shoulder Press" }, synonyms: ["press militar en maquina (con respaldo)", "press militar en maquina con respaldo"] },
  { slug: "cable-fly", exerciseDbId: "cable-fly", name: { es: "Aperturas en Polea", en: "Cable Fly" } },
  { slug: "t-bar-row", exerciseDbId: "t-bar-row", name: { es: "Remo T", en: "T-Bar Row" } },
  { slug: "romanian-deadlift", exerciseDbId: "romanian-deadlift", name: { es: "Peso Muerto Rumano", en: "Romanian Deadlift" } },
  { slug: "bulgarian-split-squat", exerciseDbId: "bulgarian-split-squat", name: { es: "Sentadilla Búlgara", en: "Bulgarian Split Squat" } },
  { slug: "goblet-squat", exerciseDbId: "goblet-squat", name: { es: "Sentadilla Goblet", en: "Goblet Squat" } },
  { slug: "glute-bridge", exerciseDbId: "glute-bridge", name: { es: "Elevación de Cadera", en: "Glute Bridge" } },
  { slug: "plank-with-arm-raise", exerciseDbId: "plank-with-arm-raise", name: { es: "Plancha con Extensión de Brazos", en: "Plank with Arm Raise" } },
  { slug: "cable-crunch", exerciseDbId: "cable-crunch", name: { es: "Crunch en Polea Alta", en: "Cable Crunch" } },
];

const LOOKUP = new Map<string, ExerciseCatalogEntry>();
EXERCISE_CATALOG.forEach((entry) => {
  LOOKUP.set(normalize(entry.name.es), entry);
  LOOKUP.set(normalize(entry.name.en), entry);
  (entry.synonyms || []).forEach((syn) => LOOKUP.set(normalize(syn), entry));
});

export function findExerciseCatalogEntry(name: string | undefined | null) {
  const key = normalize(name || "");
  if (!key) return null;
  return LOOKUP.get(key) || null;
}

export function getExerciseNameOptions(language: "es" | "en" = "es") {
  return EXERCISE_CATALOG.map((entry) => entry.name[language] || entry.name.es);
}

export const DEFAULT_EXERCISE_ENTRY = EXERCISE_CATALOG[0];
