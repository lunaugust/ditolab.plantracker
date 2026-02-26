import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, "../src/data/exercises.json");

const data = JSON.parse(readFileSync(filePath, "utf8"));

const missing = data.filter((entry) => {
  const noteEn = typeof entry.noteEn === "string" ? entry.noteEn.trim() : "";
  const noteEs = typeof entry.noteEs === "string" ? entry.noteEs.trim() : "";
  return !entry.exerciseId || !noteEn || !noteEs;
});

if (missing.length > 0) {
  console.error(`Missing bilingual notes in ${missing.length} exercises.`);
  console.error(missing.slice(0, 10).map((e) => e.exerciseId || "(no-id)").join(", "));
  process.exit(1);
}

console.log(`All ${data.length} exercises have noteEn and noteEs.`);
