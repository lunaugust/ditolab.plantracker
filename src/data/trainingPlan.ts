/**
 * Training plan configuration.
 * Each day contains a label, theme color, and an array of exercises.
 *
 * To add a new training day, add a new key following the same shape.
 * To add exercises, append to the `exercises` array of the target day.
 *
 * @typedef {Object} Exercise
 * @property {string} id        — Unique identifier (used as storage key)
 * @property {string} name      — Display name
 * @property {string} sets      — Number of sets
 * @property {string} reps      — Rep scheme description
 * @property {string} rest      — Rest period between sets
 * @property {string} [note]    — Optional coaching cue / safety note
 * @property {string} [exerciseDbId] — Optional ExerciseDB identifier for GIF lookup
 */

/** @typedef {Object} TrainingDay
 *  @property {string}     label     — Muscle groups targeted
 *  @property {string}     color     — Hex colour for UI theming
 *  @property {Exercise[]} exercises — Ordered list of exercises
 */

/** @type {Record<string, TrainingDay>} */
export const TRAINING_PLAN = {
  "Día 1": {
    label: "Cuádriceps · Femoral · Glúteos · Pantorrillas",
    color: "#e8643a",
    exercises: [
      { id: "d1_hack_warmup", name: "Sentadilla Hack (calentamiento)", sets: "2", reps: "15-20", rest: "60s", note: "Peso liviano" },
      { id: "d1_hack", name: "Sentadilla Hack", sets: "4", reps: "12·10·8·6", rest: "90s", note: "Columna neutra, no hundir zona lumbar" },
      { id: "d1_prensa45", name: "Prensa 45°", sets: "4", reps: "12", rest: "90s", note: "Bajar en 3 segundos" },
      { id: "d1_stepup", name: "Step-ups con mancuernas", sets: "4", reps: "10 c/pierna", rest: "90s", note: "Reemplaza estocadas — menos estrés en rodilla" },
      { id: "d1_sillon_cuad", name: "Sillón de Cuádriceps", sets: "3", reps: "10·10·10 descendentes", rest: "90s", note: "30 reps seguidas sin descanso, bajando peso cada 10" },
      { id: "d1_camilla", name: "Camilla Femoral", sets: "4", reps: "12", rest: "90s", note: "Bajar en 3 segundos" },
      { id: "d1_sumo", name: "Sentadilla Sumo + Aductor", sets: "4", reps: "10", rest: "90s", note: "Sin descanso entre ambos ejercicios" },
      { id: "d1_hip", name: "Elevación de Cadera en Máquina", sets: "4", reps: "10", rest: "90s", note: "Retención 1s arriba — apretar glúteo conscientemente" },
      { id: "d1_pant_pie", name: "Pantorrillas de Pie", sets: "4", reps: "20", rest: "60s" },
      { id: "d1_pant_sent", name: "Pantorrillas Sentado", sets: "3", reps: "15", rest: "60s" },
      { id: "d1_deadbug", name: "Dead Bug", sets: "3", reps: "10 c/lado", rest: "60s", note: "Zona media — sin peso" },
      { id: "d1_plancha", name: "Plancha Frontal", sets: "3", reps: "45-60s", rest: "60s", note: "Zona media — sin peso" },
      { id: "d1_birddog", name: "Bird Dog", sets: "3", reps: "10 c/lado", rest: "60s", note: "Zona media — sin peso" },
    ],
  },
  "Día 2": {
    label: "Espalda · Hombros Post. · Trapecio · Bíceps · Tríceps",
    color: "#3ab8e8",
    exercises: [
      { id: "d2_facepu", name: "Face Pulls en Polea Alta", sets: "4", reps: "15-20", rest: "60s", note: "¡Empezar siempre con esto! Clave para cifosis" },
      { id: "d2_jalon", name: "Jalón al Pecho (agarre ancho)", sets: "4", reps: "12·10·8·6", rest: "90s" },
      { id: "d2_jalon_sup", name: "Jalón Agarre Supino", sets: "4", reps: "12·10·8·6", rest: "90s" },
      { id: "d2_remo_polea", name: "Remo en Polea Sentado", sets: "4", reps: "12·10·8·6", rest: "90s" },
      { id: "d2_remo_man", name: "Remo con Mancuerna Unilateral", sets: "4", reps: "10-12 c/brazo", rest: "60s" },
      { id: "d2_encog", name: "Encogimiento con Mancuernas (Trapecio)", sets: "3", reps: "10-12", rest: "60s" },
      { id: "d2_elev_post", name: "Elevaciones Posteriores con Mancuernas", sets: "4", reps: "12-15", rest: "60s" },
      { id: "d2_biceps_w", name: "Bíceps con Barra W", sets: "4", reps: "12·10·8·6", rest: "90s" },
      { id: "d2_scott", name: "Bíceps Banco Scott", sets: "3", reps: "10-12", rest: "90s" },
      { id: "d2_triceps", name: "Tríceps en Polea con Cuerda (Pushdown)", sets: "4", reps: "12-15", rest: "60s", note: "Reemplaza press francés — más seguro para columna" },
      { id: "d2_plancha_ext", name: "Plancha con Extensión de Brazos", sets: "3", reps: "12 c/brazo", rest: "60s", note: "Zona media" },
      { id: "d2_deadbug2", name: "Dead Bug", sets: "3", reps: "10 c/lado", rest: "60s", note: "Zona media" },
    ],
  },
  "Día 3": {
    label: "Pecho · Hombros · Femoral · Pantorrillas",
    color: "#7de83a",
    exercises: [
      { id: "d3_fp_activacion", name: "Face Pulls / Band Pull-Aparts (activación)", sets: "2", reps: "20", rest: "—", note: "ANTES de los press — activa estabilizadores escapulares" },
      { id: "d3_press_plano_wu", name: "Press Banco Plano — Calentamiento", sets: "2", reps: "15-20", rest: "60s", note: "Peso liviano" },
      { id: "d3_press_plano", name: "Press Banco Plano con Barra", sets: "3", reps: "10·8·6", rest: "120s", note: "Retraer escápulas antes de bajar la barra" },
      { id: "d3_press_inc_man", name: "Press Inclinado con Mancuernas", sets: "4", reps: "8-12", rest: "90s" },
      { id: "d3_press_mil", name: "Press Militar en Máquina (con respaldo)", sets: "4", reps: "12·10·8·6", rest: "90s", note: "El respaldo evita extensión lumbar compensatoria" },
      { id: "d3_vuelos", name: "Vuelos Laterales con Mancuernas", sets: "4", reps: "10-12", rest: "60s" },
      { id: "d3_camilla2", name: "Silla Femoral", sets: "4", reps: "12", rest: "60s", note: "Retención 1s en posición baja" },
      { id: "d3_prensa_arriba", name: "Prensa Pies Arriba", sets: "4", reps: "10", rest: "90s", note: "Bajar en 3 segundos — mayor reclutamiento femoral/glúteo" },
      { id: "d3_pant_pie", name: "Pantorrillas de Pie", sets: "4", reps: "15", rest: "60s", note: "Retención 1s arriba" },
      { id: "d3_plancha2", name: "Plancha Frontal", sets: "3", reps: "60s", rest: "60s", note: "Zona media" },
      { id: "d3_birddog2", name: "Bird Dog", sets: "3", reps: "12 c/lado", rest: "60s", note: "Zona media" },
    ],
  },
};

/** All day keys in display order */
export const DAY_KEYS = Object.keys(TRAINING_PLAN);

/** Default active day */
export const DEFAULT_DAY = DAY_KEYS[0];

/** Quick lookup: dayKey → hex color */
export const DAY_COLORS = Object.fromEntries(
  DAY_KEYS.map((key) => [key, TRAINING_PLAN[key].color]),
);

/** Flat list of every exercise across all days */
export const ALL_EXERCISES = Object.values(TRAINING_PLAN).flatMap(
  (day) => day.exercises,
);
