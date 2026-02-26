/**
 * Script to generate Spanish translations for exercise names in exercises.json.
 * Run with: node scripts/translateExercises.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, "../src/data/exercises.json");
const data = JSON.parse(readFileSync(filePath, "utf8"));

/* ------------------------------------------------------------ */
/* Translation dictionaries                                    */
/* ------------------------------------------------------------ */

const EQUIPMENT = {
  "barbell": "con barra",
  "dumbbell": "con mancuerna",
  "cable": "en polea",
  "band": "con banda",
  "lever": "en máquina",
  "smith": "en Smith",
  "kettlebell": "con kettlebell",
  "sled": "en prensa",
  "ez barbell": "con barra EZ",
  "ez-barbell": "con barra EZ",
  "ez-bar": "con barra EZ",
  "ez bar": "con barra EZ",
  "medicine ball": "con balón medicinal",
  "stability ball": "en pelota de estabilidad",
  "weighted": "con peso",
  "bodyweight": "con peso corporal",
  "body weight": "con peso corporal",
  "assisted": "asistido",
  "resistance band": "con banda de resistencia",
  "olympic": "olímpico",
  "trap bar": "con barra hexagonal",
  "hammer": "en máquina hammer",
  "roller": "con rodillo",
  "wheel": "con rueda",
  "suspended": "en suspensión",
  "bosu ball": "en bosu",
  "tire": "con neumático",
};

const FULL_EXERCISE = {
  // Core / Abs
  "dead bug": "dead bug",
  "reverse crunch": "crunch inverso",
  "tuck crunch": "crunch recogido",
  "bicycle crunch": "crunch bicicleta",
  "mountain climber": "escalador",
  "sit-up": "abdominal",
  "v-up": "V-up",
  "flutter kick": "patadas de aleteo",
  "scissor kick": "patadas de tijera",
  "windshield wiper": "limpiaparabrisas",
  "russian twist": "giro ruso",
  "pallof press": "press Pallof",
  "wood chop": "leñador",
  "bird dog": "bird dog",
  "superman": "superman",
  "hollow body hold": "hollow body",

  // Compound
  "clean and jerk": "cargada y envión",
  "clean and press": "cargada y press",
  "snatch": "arranque",
  "power clean": "cargada de potencia",
  "hang clean": "cargada colgante",
  "muscle up": "muscle up",
  "burpee": "burpee",
  "jumping jack": "saltos de tijera",
  "box jump": "salto al cajón",
  "sledge hammer": "martillo de trineo",

  // Named exercises
  "turkish get up": "levantamiento turco",
  "farmers walk": "caminata del granjero",
  "around the world": "alrededor del mundo",
  "lying crossover": "cruce acostado",
  "arm scissors": "tijeras de brazos",
  "arm slingers": "lanzamiento de brazos",
  "curtsey squat": "sentadilla de reverencia",
  "potty squat": "sentadilla profunda",
  "pistol squat": "sentadilla pistola",
  "sissy squat": "sentadilla sissy",
  "rocky pull-up pulldown": "dominada Rocky con jalón",
  "inchworm": "gusano",
  "run": "correr",
  "walk": "caminar",
  "sprint": "sprint",
  "jog": "trotar",
  "spell caster": "hechicero",
  "bottoms up": "de abajo arriba",
  "iron cross": "cruz de hierro",
  "frog pump": "bombeo de rana",
};

const MOVEMENTS = [
  // Order matters — longer/more specific first
  ["close-grip bench press", "press de banca agarre cerrado"],
  ["close grip bench press", "press de banca agarre cerrado"],
  ["wide grip bench press", "press de banca agarre ancho"],
  ["wide reverse grip bench press", "press de banca agarre ancho inverso"],
  ["reverse grip bench press", "press de banca agarre inverso"],
  ["reverse grip incline bench press", "press inclinado agarre inverso"],
  ["reverse grip decline bench press", "press declinado agarre inverso"],
  ["incline bench press", "press de banca inclinado"],
  ["decline bench press", "press de banca declinado"],
  ["bench press", "press de banca"],
  ["skull press", "press cráneo"],
  ["shoulder press", "press de hombros"],
  ["chest press", "press de pecho"],
  ["military press", "press militar"],
  ["close grip military press", "press militar agarre cerrado"],
  ["overhead press", "press sobre cabeza"],
  ["floor press", "press en suelo"],
  ["jm bench press", "press JM"],
  ["guillotine bench press", "press guillotina"],
  ["incline press", "press inclinado"],
  ["decline press", "press declinado"],
  ["close-grip press", "press agarre cerrado"],
  ["narrow grip press", "press agarre estrecho"],
  ["press", "press"],

  ["hack squat", "sentadilla hack"],
  ["goblet squat", "sentadilla goblet"],
  ["front squat", "sentadilla frontal"],
  ["overhead squat", "sentadilla sobre cabeza"],
  ["jump squat", "sentadilla con salto"],
  ["speed squat", "sentadilla rápida"],
  ["split squat", "sentadilla búlgara"],
  ["sumo squat", "sentadilla sumo"],
  ["single leg squat", "sentadilla una pierna"],
  ["one leg squat", "sentadilla una pierna"],
  ["bench squat", "sentadilla en banco"],
  ["chair squat", "sentadilla en silla"],
  ["high bar squat", "sentadilla barra alta"],
  ["low bar squat", "sentadilla barra baja"],
  ["front chest squat", "sentadilla frontal"],
  ["squat", "sentadilla"],

  ["romanian deadlift", "peso muerto rumano"],
  ["stiff leg deadlift", "peso muerto pierna rígida"],
  ["straight leg deadlift", "peso muerto pierna recta"],
  ["sumo deadlift", "peso muerto sumo"],
  ["single leg deadlift", "peso muerto una pierna"],
  ["deadlift", "peso muerto"],

  ["biceps curl", "curl de bíceps"],
  ["bicep curl", "curl de bíceps"],
  ["hammer curl", "curl martillo"],
  ["preacher curl", "curl en banco Scott"],
  ["concentration curl", "curl concentrado"],
  ["reverse curl", "curl inverso"],
  ["wrist curl", "curl de muñeca"],
  ["reverse wrist curl", "curl inverso de muñeca"],
  ["spider curl", "curl araña"],
  ["drag curl", "curl arrastre"],
  ["zottman curl", "curl Zottman"],
  ["scott curl", "curl Scott"],
  ["incline curl", "curl inclinado"],
  ["waiter curl", "curl mozo"],
  ["prone curl", "curl boca abajo"],
  ["standing curl", "curl de pie"],
  ["seated curl", "curl sentado"],
  ["lying curl", "curl acostado"],
  ["close grip curl", "curl agarre cerrado"],
  ["wide grip curl", "curl agarre ancho"],
  ["close-grip curl", "curl agarre cerrado"],
  ["inner biceps curl", "curl bíceps interno"],
  ["curl", "curl"],

  ["reverse fly", "apertura inversa"],
  ["reverse flye", "apertura inversa"],
  ["rear fly", "apertura posterior"],
  ["rear delt fly", "apertura deltoides posterior"],
  ["decline fly", "apertura declinada"],
  ["decline twist fly", "apertura declinada con giro"],
  ["incline fly", "apertura inclinada"],
  ["middle fly", "apertura media"],
  ["chest fly", "apertura de pecho"],
  ["around the world fly", "apertura alrededor del mundo"],
  ["fly", "apertura"],
  ["flye", "apertura"],

  ["bent over row", "remo inclinado"],
  ["bent-over row", "remo inclinado"],
  ["one arm row", "remo un brazo"],
  ["one-arm row", "remo un brazo"],
  ["seated row", "remo sentado"],
  ["upright row", "remo vertical"],
  ["pendlay row", "remo Pendlay"],
  ["t-bar row", "remo en T"],
  ["incline row", "remo inclinado"],
  ["narrow row", "remo agarre estrecho"],
  ["wide row", "remo agarre ancho"],
  ["reverse row", "remo inverso"],
  ["inverted row", "remo invertido"],
  ["rear delt row", "remo deltoides posterior"],
  ["face pull row", "remo face pull"],
  ["vertical row", "remo vertical"],
  ["row", "remo"],

  ["lateral raise", "elevación lateral"],
  ["front raise", "elevación frontal"],
  ["rear raise", "elevación posterior"],
  ["rear delt raise", "elevación deltoides posterior"],
  ["calf raise", "elevación de pantorrilla"],
  ["leg raise", "elevación de piernas"],
  ["knee raise", "elevación de rodillas"],
  ["hip raise", "elevación de cadera"],
  ["t-raise", "elevación en T"],
  ["y-raise", "elevación en Y"],
  ["raise", "elevación"],

  ["triceps extension", "extensión de tríceps"],
  ["tricep extension", "extensión de tríceps"],
  ["leg extension", "extensión de piernas"],
  ["back extension", "extensión de espalda"],
  ["hip extension", "extensión de cadera"],
  ["knee extension", "extensión de rodilla"],
  ["wrist extension", "extensión de muñeca"],
  ["extension", "extensión"],

  ["lat pulldown", "jalón al pecho"],
  ["lateral pulldown", "jalón lateral"],
  ["front pulldown", "jalón frontal"],
  ["rear pulldown", "jalón posterior"],
  ["close grip pulldown", "jalón agarre cerrado"],
  ["close-grip pulldown", "jalón agarre cerrado"],
  ["underhand pulldown", "jalón agarre supino"],
  ["reverse grip pulldown", "jalón agarre inverso"],
  ["straight arm pulldown", "jalón brazos rectos"],
  ["pulldown", "jalón"],

  ["tricep pushdown", "empuje de tríceps"],
  ["pushdown", "empuje hacia abajo"],

  ["push-up", "flexión de brazos"],
  ["push up", "flexión de brazos"],
  ["pushup", "flexión de brazos"],
  ["pull-up", "dominada"],
  ["pull up", "dominada"],
  ["pullup", "dominada"],
  ["chin-up", "dominada supina"],
  ["chin up", "dominada supina"],

  ["bench dip", "fondo en banco"],
  ["chest dip", "fondo de pecho"],
  ["ring dip", "fondo en anillas"],
  ["triceps dip", "fondo de tríceps"],
  ["dip", "fondo"],

  ["forward lunge", "zancada frontal"],
  ["reverse lunge", "zancada inversa"],
  ["walking lunge", "zancada caminando"],
  ["side lunge", "zancada lateral"],
  ["curtsy lunge", "zancada de reverencia"],
  ["cross lunge", "zancada cruzada"],
  ["contralateral forward lunge", "zancada frontal contralateral"],
  ["lunge", "zancada"],

  ["kneeling crunch", "crunch de rodillas"],
  ["seated crunch", "crunch sentado"],
  ["standing crunch", "crunch de pie"],
  ["cable crunch", "crunch en polea"],
  ["oblique crunch", "crunch oblicuo"],
  ["cross crunch", "crunch cruzado"],
  ["crunch", "crunch"],

  ["side plank", "plancha lateral"],
  ["front plank", "plancha frontal"],
  ["reverse plank", "plancha inversa"],
  ["plank", "plancha"],

  ["glute bridge", "puente de glúteos"],
  ["hip bridge", "puente de cadera"],
  ["bridge", "puente"],

  ["hip thrust", "empuje de cadera"],
  ["thrust", "empuje"],

  ["kickback", "patada trasera"],
  ["kick back", "patada trasera"],
  ["step-up", "subida al banco"],
  ["step up", "subida al banco"],
  ["pullover", "pullover"],
  ["shrug", "encogimiento de hombros"],
  ["face pull", "face pull"],
  ["calf press", "prensa de pantorrilla"],
  ["leg press", "prensa de piernas"],
  ["leg wide press", "prensa de piernas ancha"],

  ["lying leg curl", "curl femoral acostado"],
  ["seated leg curl", "curl femoral sentado"],
  ["leg curl", "curl femoral"],

  ["side bend", "flexión lateral"],
  ["lateral flexion", "flexión lateral"],
  ["rotation", "rotación"],
  ["twist", "giro"],
  ["circle", "círculo"],
  ["swing", "balanceo"],
  ["snatch", "arranque"],
  ["clean", "cargada"],
  ["jerk", "envión"],
  ["hang", "colgante"],
  ["rack", "en rack"],
  ["floor", "en suelo"],
  ["standing", "de pie"],
  ["seated", "sentado"],
  ["lying", "acostado"],
  ["kneeling", "de rodillas"],
  ["incline", "inclinado"],
  ["decline", "declinado"],
];

const MODIFIERS = {
  "one arm": "un brazo",
  "one-arm": "un brazo",
  "single arm": "un brazo",
  "single-arm": "un brazo",
  "two arm": "dos brazos",
  "one leg": "una pierna",
  "one-leg": "una pierna",
  "single leg": "una pierna",
  "single-leg": "una pierna",
  "two leg": "dos piernas",
  "alternate": "alternado",
  "alternating": "alternado",
  "close grip": "agarre cerrado",
  "close-grip": "agarre cerrado",
  "wide grip": "agarre ancho",
  "reverse grip": "agarre inverso",
  "neutral grip": "agarre neutro",
  "narrow grip": "agarre estrecho",
  "parallel grip": "agarre paralelo",
  "overhand grip": "agarre prono",
  "underhand": "agarre supino",
  "supinated": "supinado",
  "pronated": "pronado",
  "overhead": "sobre cabeza",
  "behind the back": "detrás de espalda",
  "behind back": "detrás de espalda",
  "inner": "interno",
  "outer": "externo",
  "front": "frontal",
  "rear": "posterior",
  "side": "lateral",
  "high pulley": "polea alta",
  "low pulley": "polea baja",
  "rope": "con cuerda",
  "bar": "con barra",
  "handle": "con asa",
  "twin handle": "doble asa",
  "straight bar": "barra recta",
  "v-bar": "barra V",
  "cross-over": "cruce",
  "crossover": "cruce",
  "on stability ball": "en pelota",
  "on flat bench": "en banco plano",
  "on incline bench": "en banco inclinado",
  "on floor": "en suelo",
  "to failure": "al fallo",
  "full range": "rango completo",
  "half": "media",
  "quarter": "cuarto",
  "elevated": "elevado",
  "fixed back": "espalda fija",
  "(male)": "",
  "(female)": "",
  "(back pov)": "(vista posterior)",
  "(side pov)": "(vista lateral)",
  "(forward)": "(hacia adelante)",
  "(back)": "(hacia atrás)",
  "side to side": "lado a lado",
  "in and out": "adentro y afuera",
  "up and down": "arriba y abajo",
  "rocking": "oscilante",
  "double": "doble",
  "triple": "triple",
  "quad": "cuádruple",
  "stability style": "estilo estabilidad",
  "stability": "estabilidad",
  "isometric": "isométrico",
  "dynamic": "dinámico",
  "explosive": "explosivo",
  "slow": "lento",
  "pause": "con pausa",
  "negative": "negativo",
  "eccentric": "excéntrico",
  "concentric": "concéntrico",
  "contralateral": "contralateral",
  "ipsilateral": "ipsilateral",
  "inside leg kick": "con patada interna",
  "touch": "toque",
  "toe touch": "toque de punta",
  "circular toe touch": "toque circular de punta",
  "arms apart": "brazos abiertos",
  "torso rotation": "rotación de torso",
  "elbow to knee": "codo a rodilla",
  "tabletop": "mesa",
  "outside leg kick": "con patada externa",
  "donkey": "burro",
  "renegade": "renegado",
  "bent arm": "brazo flexionado",
  "speed": "velocidad",
  "jumping": "con salto",
  "jump": "salto",
  "plie": "plié",
  "three": "tres",
  "angled": "angular",
  "forward": "hacia adelante",
  "backward": "hacia atrás",
  "squared": "cuadrado",
  // Position/direction modifiers
  "standing": "de pie",
  "seated": "sentado",
  "lying": "acostado",
  "kneeling": "de rodillas",
  "prone": "boca abajo",
  "supine": "boca arriba",
  "bent over": "inclinado",
  "bent-over": "inclinado",
  "incline": "inclinado",
  "decline": "declinado",
  "flat": "plano",
  "reverse": "inverso",
  "horizontal": "horizontal",
  "vertical": "vertical",
  "static": "estático",
  "full": "completo",
  "behind": "detrás",
  "against": "contra",
  "across": "a través",
  "around": "alrededor",
  "wall": "pared",
  "floor": "suelo",
  "chair": "silla",
  "bench": "banco",
  "cable": "polea",
  "weighted": "con peso",
  "on": "en",
  "to": "a",
  "and": "y",
  "with": "con",
  "v. 2": "v.2",
  "v. 3": "v.3",
  "upper": "superior",
  "lower": "inferior",
  "palm up": "palma arriba",
  "palm down": "palma abajo",
  "external": "externo",
  "internal": "interno",
  "rotation": "rotación",
  "hyper": "hiper",
  "close": "cerrado",
  "wide": "ancho",
  "stretch": "estiramiento",
  "hold": "mantenimiento",
  "hang": "colgante",
  "grip": "agarre",
  "toes": "puntas",
  "heels": "talones",
  "fingers": "dedos",
  "palms": "palmas",
  "elbows": "codos",
  "knees": "rodillas",
  "hips": "caderas",
  "back": "espalda",
  "stiff": "rígido",
  "revers": "inverso",
  "over bench": "sobre banco",
  "roll out": "rodamiento",
  "roll": "rodamiento",
  "supported": "con apoyo",
  "narrow": "estrecho",
  "peacher": "Scott",
  "cross body": "cruzado",
  "cross-body": "cruzado",
  "twisting": "con giro",
  "bear": "oso",
  "crawl": "gateo",
  "pump": "bombeo",
  "frog": "rana",
  "scorpion": "escorpión",
  "spiderman": "hombre araña",
  "plyo": "pliométrico",
  "plyometric": "pliométrico",
  "depth": "profundidad",
  "close grip to": "agarre cerrado a",
  "fixed": "fijo",
  "from": "desde",
  "leg": "pierna",
  "arm": "brazo",
  "mixed": "mixto",
  "over": "sobre",
  "partial": "parcial",
};

const BODY_PARTS_TRANS = {
  "chest": "pecho",
  "back": "espalda",
  "shoulder": "hombro",
  "shoulders": "hombros",
  "biceps": "bíceps",
  "bicep": "bíceps",
  "triceps": "tríceps",
  "tricep": "tríceps",
  "forearm": "antebrazo",
  "forearms": "antebrazos",
  "wrist": "muñeca",
  "leg": "pierna",
  "legs": "piernas",
  "quad": "cuádriceps",
  "quadriceps": "cuádriceps",
  "hamstring": "isquiotibial",
  "hamstrings": "isquiotibiales",
  "glute": "glúteo",
  "glutes": "glúteos",
  "calf": "pantorrilla",
  "calves": "pantorrillas",
  "hip": "cadera",
  "hips": "caderas",
  "ab": "abdominal",
  "abs": "abdominales",
  "abdominal": "abdominal",
  "oblique": "oblicuo",
  "obliques": "oblicuos",
  "core": "core",
  "neck": "cuello",
  "lat": "dorsal",
  "lats": "dorsales",
  "trap": "trapecio",
  "traps": "trapecios",
  "delt": "deltoides",
  "deltoid": "deltoides",
  "pec": "pectoral",
  "pectoral": "pectoral",
  "upper body": "tren superior",
  "lower body": "tren inferior",
  "upper arm": "brazo superior",
  "upper arms": "brazos superiores",
  "upper leg": "pierna superior",
  "upper legs": "piernas superiores",
  "lower arm": "antebrazo",
  "lower arms": "antebrazos",
  "lower leg": "pantorrilla",
  "lower legs": "pantorrillas",
  "waist": "cintura",
};

/* ------------------------------------------------------------ */
/* Translation function                                        */
/* ------------------------------------------------------------ */

function translateExercise(name) {
  // Check full exercise name matches first
  const lower = name.toLowerCase().trim();
  if (FULL_EXERCISE[lower]) {
    return FULL_EXERCISE[lower];
  }

  // Try to identify equipment prefix
  let remaining = lower;
  let equipEs = "";
  const equipKeys = Object.keys(EQUIPMENT).sort((a, b) => b.length - a.length);
  for (const eq of equipKeys) {
    if (remaining.startsWith(eq + " ")) {
      equipEs = EQUIPMENT[eq];
      remaining = remaining.slice(eq.length).trim();
      break;
    }
  }

  // Try to match a movement pattern
  let movementEs = "";
  let afterMovement = "";
  for (const [en, es] of MOVEMENTS) {
    const idx = remaining.indexOf(en);
    if (idx !== -1) {
      afterMovement = remaining.slice(0, idx).trim();
      movementEs = es;
      const rest = remaining.slice(idx + en.length).trim();
      if (rest) afterMovement = afterMovement ? `${afterMovement} ${rest}` : rest;
      break;
    }
  }

  if (!movementEs) {
    // Fallback: try to translate word-by-word for modifiers and body parts
    movementEs = remaining;
    afterMovement = "";
  }

  // Translate remaining modifiers
  let modEs = afterMovement;
  if (modEs) {
    const modKeys = Object.keys(MODIFIERS).sort((a, b) => b.length - a.length);
    for (const mod of modKeys) {
      if (modEs.includes(mod)) {
        modEs = modEs.replace(mod, MODIFIERS[mod]).trim();
      }
    }
    // Translate body part words in modifiers
    const bpKeys = Object.keys(BODY_PARTS_TRANS).sort((a, b) => b.length - a.length);
    for (const bp of bpKeys) {
      const re = new RegExp(`\\b${bp}\\b`, "gi");
      modEs = modEs.replace(re, BODY_PARTS_TRANS[bp]);
    }
  }

  // Assemble
  const parts = [];
  if (movementEs) parts.push(movementEs);
  if (modEs && modEs !== movementEs) parts.push(modEs);
  if (equipEs) parts.push(equipEs);

  let result = parts.join(" ").replace(/\s+/g, " ").trim();
  // Capitalize first letter
  result = result.charAt(0).toUpperCase() + result.slice(1);

  return result;
}

/* ------------------------------------------------------------ */
/* Process all exercises                                       */
/* ------------------------------------------------------------ */

let translated = 0;
for (const exercise of data) {
  exercise.nameEs = translateExercise(exercise.name);
  translated++;
}

writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Translated ${translated} exercises. File saved.`);

// Print a few samples for verification
const samples = [0, 1, 2, 50, 100, 200, 500, 1000, 1499].filter(
  (i) => i < data.length
);
console.log("\nSample translations:");
for (const i of samples) {
  console.log(`  "${data[i].name}" → "${data[i].nameEs}"`);
}
