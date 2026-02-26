import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, "../src/data/exercises.json");

const data = JSON.parse(readFileSync(filePath, "utf8"));

const bodyPartCueEn = {
  back: "Initiate from your shoulder blades, not your lower back.",
  cardio: "Keep a steady pace and controlled breathing.",
  chest: "Keep your shoulders down and chest open through the full range.",
  lowerarms: "Keep wrists neutral and avoid excessive grip tension.",
  "lower arms": "Keep wrists neutral and avoid excessive grip tension.",
  "lower legs": "Use full ankle range and avoid bouncing.",
  neck: "Move slowly and avoid forcing neck range.",
  shoulders: "Keep your core braced and avoid shrugging unless prescribed.",
  "upper arms": "Keep elbows stable and avoid swinging.",
  "upper legs": "Keep knees tracking over toes and control the eccentric phase.",
  waist: "Brace your core and avoid pulling from the neck.",
};

const bodyPartCueEs = {
  back: "Inicia el movimiento desde las escápulas, no desde la zona lumbar.",
  cardio: "Mantén un ritmo estable y una respiración controlada.",
  chest: "Mantén los hombros abajo y el pecho abierto durante todo el recorrido.",
  lowerarms: "Mantén las muñecas neutras y evita tensión excesiva de agarre.",
  "lower arms": "Mantén las muñecas neutras y evita tensión excesiva de agarre.",
  "lower legs": "Usa todo el rango del tobillo y evita rebotes.",
  neck: "Muévete lento y evita forzar el rango cervical.",
  shoulders: "Activa el core y evita encoger los hombros salvo indicación técnica.",
  "upper arms": "Mantén los codos estables y evita balanceos.",
  "upper legs": "Mantén las rodillas alineadas con los pies y controla la fase excéntrica.",
  waist: "Activa el core y evita tirar del cuello.",
};

const equipmentCueEn = {
  barbell: "Keep the bar path controlled and close to your center of mass.",
  dumbbell: "Control both sides evenly and avoid momentum.",
  cable: "Maintain continuous tension and avoid jerking at the end range.",
  band: "Control the return and do not let the band snap back.",
  "body weight": "Maintain posture before increasing speed or reps.",
  kettlebell: "Grip firmly, hinge properly, and avoid spinal rounding.",
  lever: "Adjust the machine setup to match your joint alignment.",
  "smith machine": "Set stance and bar position before each rep for safe tracking.",
};

const equipmentCueEs = {
  barbell: "Controla la trayectoria de la barra y mantenla cerca de tu centro de masa.",
  dumbbell: "Controla ambos lados por igual y evita usar impulso.",
  cable: "Mantén tensión continua y evita tirones al final del recorrido.",
  band: "Controla el retorno y no dejes que la banda te jale de golpe.",
  "body weight": "Prioriza la postura antes de aumentar velocidad o repeticiones.",
  kettlebell: "Agarra firme, bisagra de cadera correcta y evita redondear la espalda.",
  lever: "Ajusta la máquina para respetar la alineación de tus articulaciones.",
  "smith machine": "Define postura y recorrido antes de cada repetición para una trayectoria segura.",
};

function firstFrom(array, fallback = "") {
  if (!Array.isArray(array) || array.length === 0) return fallback;
  return String(array[0] || fallback).trim();
}

function makeNote(entry, lang) {
  const bodyPart = firstFrom(entry.bodyParts, "").toLowerCase();
  const equipment = firstFrom(entry.equipments, "").toLowerCase();
  const target = firstFrom(entry.targetMuscles, "");

  const cueByBody = lang === "en" ? bodyPartCueEn : bodyPartCueEs;
  const cueByEquipment = lang === "en" ? equipmentCueEn : equipmentCueEs;

  const bodyCue = cueByBody[bodyPart]
    || (lang === "en"
      ? "Keep your spine neutral and tempo controlled."
      : "Mantén la columna neutra y el tempo controlado.");

  const equipmentCue = cueByEquipment[equipment]
    || (lang === "en"
      ? "Use a controlled range and stop if technique breaks."
      : "Usa un rango controlado y detente si la técnica se rompe.");

  if (lang === "en") {
    const targetText = target ? `Focus on ${target} activation.` : "Focus on the target muscle activation.";
    return `${bodyCue} ${equipmentCue} ${targetText} Stop immediately if you feel sharp pain.`;
  }

  const targetText = target ? `Enfócate en activar ${target}.` : "Enfócate en activar el músculo objetivo.";
  return `${bodyCue} ${equipmentCue} ${targetText} Detente de inmediato si sientes dolor agudo.`;
}

let updated = 0;
for (const entry of data) {
  const nextEn = makeNote(entry, "en");
  const nextEs = makeNote(entry, "es");

  if (entry.noteEn !== nextEn || entry.noteEs !== nextEs) {
    entry.noteEn = nextEn;
    entry.noteEs = nextEs;
    updated += 1;
  }
}

writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`Generated bilingual coaching notes for ${updated} exercises.`);
