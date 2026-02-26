import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, "../src/data/exercises.json");

const data = JSON.parse(readFileSync(filePath, "utf8"));

const replacements = [
  [/\bcen\b/gi, "con"],
  [/\bcon\s+con\b/gi, "con"],
  [/\bbarrara\b/gi, "barra"],
  [/\bbarrara\s+V\b/gi, "barra V"],
  [/\bbarrabell\b/gi, "barra"],
  [/\bcomplea\b/gi, "completa"],
  [/\bfrental\b/gi, "frontal"],
  [/\bestiramiena\b/gi, "estiramiento"],
  [/\badductien\b/gi, "aducción"],
  [/\babductien\b/gi, "abducción"],
  [/\bcolganteing\b/gi, "colgado"],
  [/\bhorizental\b/gi, "horizontal"],
  [/\brotaciónal\b/gi, "rotacional"],
  [/\bpiernass\b/gi, "piernas"],
  [/\bflexienado\b/gi, "flexionado"],
  [/\bflexienados\b/gi, "flexionados"],
  [/\bflexienada\b/gi, "flexionada"],
  [/\bflexienadas\b/gi, "flexionadas"],
  [/\brodamienaerout\b/gi, "rodillo abdominal"],
  [/\bdelaid\b/gi, "deltoides"],
  [/\bmixa\b/gi, "mixto"],
  [/\bsupport\b/gi, "apoyo"],
  [/\battachment\b/gi, "accesorio"],
  [/\bexercise\s+ball\b/gi, "balón de estabilidad"],
  [/\bstability\s+ball\b/gi, "balón de estabilidad"],
  [/\bbosu\s+ball\b/gi, "bosu"],
  [/\bmedicine\s+ball\b/gi, "balón medicinal"],
  [/\bsark\s+stance\b/gi, "postura de zancada"],
  [/\bawel\b/gi, "toalla"],
  [/\bhys\b/gi, "manos"],
  [/\bth\b/gi, "hacia"],
  [/\bnar\b/gi, "estrecho"],
  [/\bhigh\b/gi, "alto"],
  [/\blow\b/gi, "bajo"],
  [/\bstraight\b/gi, "recto"],
  [/\bpullsobre\b/gi, "pullover"],
  [/\boff\s+ground\b/gi, "elevadas"],
  [/\boutestiramienaed\b/gi, "extendida"],
  [/\bbetween\s+bancoes\b/gi, "entre bancos"],
  [/\bpotty\b/gi, "profunda"],
  [/\bmachine\b/gi, "máquina"],
  [/\bplanche\b/gi, "plancha"],
  [/\bstretch\b/gi, "estiramiento"],
  [/\bmale\b/gi, "hombre"],
  [/\bup\s+straight\b/gi, "upright"],
  [/\bpre?nation\s+on\b/gi, "pronación"],
  [/\bsupinatien\s+on\b/gi, "supinación"],
  [/\bsupinatien\b/gi, "supinación"],
  [/\bpress\s+clean\s+y\b/gi, "cargada y press"],
  [/\s{2,}/g, " "],
  [/\(\s+/g, "("],
  [/\s+\)/g, ")"],
  [/\s+-\s+/g, " - "],
  [/\ben\s+con\s+barra\b/gi, "con barra"],
  [/\ben\s+con\s+barra\s+EZ\b/gi, "con barra EZ"],
  [/\ben\s+con\s+cuerda\b/gi, "con cuerda"],
  [/\(con\s+con\s+/gi, "(con "]
];

const sentenceFixes = new Map([
  ["Press cráneo declinado agarre cerrado a con barra", "Press cráneo declinado de agarre cerrado con barra"],
  ["Flexión de brazos cen patada interna", "Flexión de brazos con patada interna"],
  ["Sentadilla completaa (vista posterior) con barra", "Sentadilla completa (vista posterior) con barra"],
  ["Sentadilla complea (vista posterior) con barra", "Sentadilla completa (vista posterior) con barra"],
  ["Empuje hacia abajo tríceps (con barra V) en polea", "Empuje de tríceps hacia abajo con barra V en polea"],
  ["Sentado cadera abducción en máquina", "Abducción de cadera sentado en máquina"],
  ["Sentado cadera aducción en máquina", "Aducción de cadera sentado en máquina"],
  ["Crunch (hys sobre cabeza)", "Crunch con manos sobre la cabeza"],
  ["Press horizental pallof con banda", "Press Pallof horizontal con banda"],
  ["De pie wheel rodillo abdominal", "Rodillo abdominal de pie"],
  ["De pie abdominal rodillo abdominal con barra", "Rodillo abdominal de pie con barra"],
  ["Sentadilla potty con apoyo", "Sentadilla profunda con apoyo"],
  ["Flexión de brazos complea plancha", "Flexión de brazos tipo plancha"],
  ["Curl martillo con barrabell olímpico", "Curl martillo con barra olímpica"],
  ["Extensión de tríceps con barrabell olímpico", "Extensión de tríceps con barra olímpica"],
  ["Sentadilla a sobre cabeza reach con twist", "Sentadilla con alcance por encima de la cabeza y giro"],
  ["Remo de pie twist (con barra V) en polea", "Remo de pie con giro (barra V) en polea"],
  ["Plancha frontal con twist", "Plancha frontal con giro"],
  ["Zancada con twist", "Zancada con giro"],
  ["Acostado prenation con mancuerna", "Pronación acostado con mancuerna"]
]);

let changed = 0;

for (const exercise of data) {
  if (!exercise?.nameEs || typeof exercise.nameEs !== "string") {
    continue;
  }

  const original = exercise.nameEs;
  let current = original;

  for (const [pattern, replacement] of replacements) {
    current = current.replace(pattern, replacement);
  }

  current = current
    .replace(/\bcon\s+con\b/gi, "con")
    .replace(/\bcompletaa\b/gi, "completa")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (sentenceFixes.has(current)) {
    current = sentenceFixes.get(current);
  }

  if (current !== original) {
    exercise.nameEs = current;
    changed += 1;
  }
}

writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`Polished Spanish names. Updated entries: ${changed}`);
