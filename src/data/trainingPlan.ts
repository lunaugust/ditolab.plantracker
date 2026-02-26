/**
 * Training plan configuration.
 * Each day contains a label, theme color, and an array of exercises.
 *
 * To add a new training day, add a new key following the same shape.
 * To add exercises, append to the `exercises` array of the target day.
 *
 * @typedef {Object} Exercise
 * @property {string} id           — Unique identifier (used as storage key)
 * @property {string} exerciseId   — Catalog ID from exercises.json (empty for custom)
 * @property {string} name         — English exercise name (from catalog or custom)
 * @property {string} sets         — Number of sets
 * @property {string} reps         — Rep scheme description
 * @property {string} rest         — Rest period between sets
 * @property {string} [note]       — Optional coaching cue / safety note
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
      { id: "d1_hack_warmup", exerciseId: "Qa55kX1", name: "sled hack squat", sets: "2", reps: "15-20", rest: "60s", note: "Light weight — warm-up" },
      { id: "d1_hack", exerciseId: "Qa55kX1", name: "sled hack squat", sets: "4", reps: "12·10·8·6", rest: "90s", note: "Keep spine neutral" },
      { id: "d1_prensa45", exerciseId: "10Z2DXU", name: "sled 45° leg press", sets: "4", reps: "12", rest: "90s", note: "3-second eccentric" },
      { id: "d1_stepup", exerciseId: "aXtJhlg", name: "dumbbell step-up", sets: "4", reps: "10 /leg", rest: "90s", note: "Replaces lunges — less knee stress" },
      { id: "d1_sillon_cuad", exerciseId: "my33uHU", name: "lever leg extension", sets: "3", reps: "10·10·10 drop set", rest: "90s", note: "30 reps non-stop, reduce weight every 10" },
      { id: "d1_camilla", exerciseId: "17lJ1kr", name: "lever lying leg curl", sets: "4", reps: "12", rest: "90s", note: "3-second eccentric" },
      { id: "d1_sumo", exerciseId: "KgI0tqW", name: "barbell sumo deadlift", sets: "4", reps: "10", rest: "90s", note: "Superset with adductor work" },
      { id: "d1_hip", exerciseId: "OPqShYN", name: "lever hip extension v. 2", sets: "4", reps: "10", rest: "90s", note: "1s hold at top — squeeze glutes" },
      { id: "d1_pant_pie", exerciseId: "ykUOVze", name: "lever standing calf raise", sets: "4", reps: "20", rest: "60s" },
      { id: "d1_pant_sent", exerciseId: "bOOdeyc", name: "lever seated calf raise", sets: "3", reps: "15", rest: "60s" },
      { id: "d1_deadbug", exerciseId: "iny3m5y", name: "dead bug", sets: "3", reps: "10 /side", rest: "60s", note: "Core — bodyweight" },
      { id: "d1_plancha", exerciseId: "VBAWRPG", name: "weighted front plank", sets: "3", reps: "45-60s", rest: "60s", note: "Core — bodyweight" },
      { id: "d1_birddog", exerciseId: "", name: "bird dog", sets: "3", reps: "10 /side", rest: "60s", note: "Core — bodyweight" },
    ],
  },
  "Día 2": {
    label: "Espalda · Hombros Post. · Trapecio · Bíceps · Tríceps",
    color: "#3ab8e8",
    exercises: [
      { id: "d2_facepu", exerciseId: "PQcUlDi", name: "cable supine reverse fly", sets: "4", reps: "15-20", rest: "60s", note: "Always start with this — key for kyphosis" },
      { id: "d2_jalon", exerciseId: "RVwzP10", name: "cable pulldown", sets: "4", reps: "12·10·8·6", rest: "90s" },
      { id: "d2_jalon_sup", exerciseId: "xBYcQHj", name: "cable underhand pulldown", sets: "4", reps: "12·10·8·6", rest: "90s" },
      { id: "d2_remo_polea", exerciseId: "fUBheHs", name: "cable seated row", sets: "4", reps: "12·10·8·6", rest: "90s" },
      { id: "d2_remo_man", exerciseId: "C0MA9bC", name: "dumbbell one arm bent-over row", sets: "4", reps: "10-12 /arm", rest: "60s" },
      { id: "d2_encog", exerciseId: "NJzBsGJ", name: "dumbbell shrug", sets: "3", reps: "10-12", rest: "60s" },
      { id: "d2_elev_post", exerciseId: "8DiFDVA", name: "dumbbell rear fly", sets: "4", reps: "12-15", rest: "60s" },
      { id: "d2_biceps_w", exerciseId: "6TG6x2w", name: "ez barbell curl", sets: "4", reps: "12·10·8·6", rest: "90s" },
      { id: "d2_scott", exerciseId: "qOgPVf6", name: "barbell preacher curl", sets: "3", reps: "10-12", rest: "90s" },
      { id: "d2_triceps", exerciseId: "dU605di", name: "cable pushdown (with rope attachment)", sets: "4", reps: "12-15", rest: "60s", note: "Replaces skull crushers — safer for spine" },
      { id: "d2_plancha_ext", exerciseId: "hCjGsRQ", name: "power point plank", sets: "3", reps: "12 /arm", rest: "60s", note: "Core" },
      { id: "d2_deadbug2", exerciseId: "iny3m5y", name: "dead bug", sets: "3", reps: "10 /side", rest: "60s", note: "Core" },
    ],
  },
  "Día 3": {
    label: "Pecho · Hombros · Femoral · Pantorrillas",
    color: "#7de83a",
    exercises: [
      { id: "d3_fp_activacion", exerciseId: "PQcUlDi", name: "cable supine reverse fly", sets: "2", reps: "20", rest: "—", note: "Before press — activate scapular stabilizers" },
      { id: "d3_press_plano_wu", exerciseId: "EIeI8Vf", name: "barbell bench press", sets: "2", reps: "15-20", rest: "60s", note: "Light weight — warm-up" },
      { id: "d3_press_plano", exerciseId: "EIeI8Vf", name: "barbell bench press", sets: "3", reps: "10·8·6", rest: "120s", note: "Retract scapulae before lowering the bar" },
      { id: "d3_press_inc_man", exerciseId: "ns0SIbU", name: "dumbbell incline bench press", sets: "4", reps: "8-12", rest: "90s" },
      { id: "d3_press_mil", exerciseId: "67n3r98", name: "lever shoulder press", sets: "4", reps: "12·10·8·6", rest: "90s", note: "Back support prevents lumbar compensation" },
      { id: "d3_vuelos", exerciseId: "DsgkuIt", name: "dumbbell lateral raise", sets: "4", reps: "10-12", rest: "60s" },
      { id: "d3_camilla2", exerciseId: "Zg3XY7P", name: "lever seated leg curl", sets: "4", reps: "12", rest: "60s", note: "1s hold at bottom" },
      { id: "d3_prensa_arriba", exerciseId: "10Z2DXU", name: "sled 45° leg press", sets: "4", reps: "10", rest: "90s", note: "3-second eccentric — feet high for hamstrings/glutes" },
      { id: "d3_pant_pie", exerciseId: "ykUOVze", name: "lever standing calf raise", sets: "4", reps: "15", rest: "60s", note: "1s hold at top" },
      { id: "d3_plancha2", exerciseId: "VBAWRPG", name: "weighted front plank", sets: "3", reps: "60s", rest: "60s", note: "Core" },
      { id: "d3_birddog2", exerciseId: "", name: "bird dog", sets: "3", reps: "12 /side", rest: "60s", note: "Core" },
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
