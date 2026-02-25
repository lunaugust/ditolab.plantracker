/**
 * AI Plan Generator — calls Gemini via Firebase AI Logic.
 *
 * Falls back to rule-based generation when Firebase AI is unavailable
 * (guest mode, missing config, or API failure).
 */

import { getGenerativeModel } from "firebase/ai";
import { ai } from "./firebaseClient";
import { GENERATED_DAY_COLORS } from "../data/planGeneratorConfig";
import { makeExerciseId } from "../utils/helpers";
import { generateRuleBasedPlan } from "./ruleBasedPlanGenerator";
import { findExerciseCatalogEntry, getExerciseNameOptions } from "../data/exerciseCatalog";

/**
 * Whether the Firebase AI backend is available.
 * @returns {boolean}
 */
export function isAIAvailable() {
  return Boolean(ai);
}

/**
 * Build the system prompt for Gemini.
 * @param {string} language — "es" | "en"
 * @returns {string}
 */
function buildSystemPrompt(language) {
  const lang = language === "en" ? "English" : "Spanish";
  const allowed = getExerciseNameOptions(language).join(", ");
  return [
    `You are an expert certified personal trainer and exercise physiologist.`,
    `Generate a training plan in ${lang}.`,
    `Return ONLY valid JSON matching this exact schema (no markdown, no explanation):`,
    `{`,
    `  "<Day Name>": {`,
    `    "label": "<muscle groups targeted>",`,
    `    "exercises": [`,
    `      {`,
    `        "name": "<exercise name>",`,
    `        "sets": "<number>",`,
    `        "reps": "<rep scheme, e.g. 12·10·8·6 or 15>",`,
    `        "rest": "<rest period, e.g. 90s>",`,
    `        "note": "<optional coaching cue or safety note, empty string if none>",`,
    `        "exerciseDbId": "<ExerciseDB id matching the name>"`,
    `      }`,
    `    ]`,
    `  }`,
    `}`,
    ``,
    `Rules:`,
    `- Each day key must be "${language === "en" ? "Day" : "Día"} N" (e.g. "${language === "en" ? "Day" : "Día"} 1").`,
    `- Include appropriate warm-up sets where relevant.`,
    `- Include 2-3 core/abs exercises at the end of each day.`,
    `- All string values, no numbers.`,
    `- Only use exercise names from this allowed list: ${allowed}.`,
    `- The "exerciseDbId" must match the chosen exercise name.`,
    `- Respect injury/limitation constraints strictly — substitute exercises that avoid the affected area.`,
    `- Adjust volume and intensity to the experience level.`,
    `- Match the number of training days requested.`,
    `- Keep each session within the requested time (adjust exercise count accordingly).`,
  ].join("\n");
}

/**
 * Build the user message from wizard form data.
 * @param {import("../data/planGeneratorConfig").GeneratorForm} form
 * @param {string} language
 * @returns {string}
 */
function buildUserPrompt(form, language) {
  const isEn = language === "en";
  const lines = [
    isEn ? `Experience level: ${form.experience}` : `Nivel de experiencia: ${form.experience}`,
    isEn ? `Goal: ${form.goal}` : `Objetivo: ${form.goal}`,
    isEn ? `Training days per week: ${form.daysPerWeek}` : `Días de entrenamiento por semana: ${form.daysPerWeek}`,
    isEn ? `Session duration: ${form.minutesPerSession} minutes` : `Duración por sesión: ${form.minutesPerSession} minutos`,
  ];

  if (form.limitations && form.limitations.trim()) {
    lines.push(
      isEn
        ? `Physical limitations / injuries: ${form.limitations.trim()}`
        : `Limitaciones físicas / lesiones: ${form.limitations.trim()}`
    );
  } else {
    lines.push(isEn ? `No physical limitations.` : `Sin limitaciones físicas.`);
  }

  return lines.join("\n");
}

/**
 * Post-process AI response text → training plan object.
 * Strips markdown fences, parses JSON, normalizes IDs & colors.
 *
 * @param {string} rawText
 * @param {string} language
 * @returns {Record<string, import("../data/trainingPlan").TrainingDay>}
 */
function parseAIResponse(rawText, language) {
  // Strip markdown code fences if Gemini wraps the response
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(cleaned);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI response is not a valid object");
  }

  const dayKeys = Object.keys(parsed);
  if (dayKeys.length === 0) {
    throw new Error("AI response contains no training days");
  }

  // Normalize: add IDs, colors, ensure all fields are strings
  const plan = {};
  dayKeys.forEach((dayKey, dayIndex) => {
    const rawDay = parsed[dayKey];
    const exercises = Array.isArray(rawDay?.exercises) ? rawDay.exercises : [];

    plan[dayKey] = {
      label: String(rawDay?.label || ""),
      color: GENERATED_DAY_COLORS[dayIndex % GENERATED_DAY_COLORS.length],
      exercises: exercises.map((ex) => {
        const match = findExerciseCatalogEntry((ex as any)?.name || (ex as any)?.exerciseDbId);
        const displayName = match
          ? (language === "en" ? match.name.en : match.name.es)
          : String((ex as any)?.name || "");

        return {
          id: makeExerciseId(),
          name: displayName,
          sets: String((ex as any)?.sets || ""),
          reps: String((ex as any)?.reps || ""),
          rest: String((ex as any)?.rest || ""),
          note: String((ex as any)?.note || ""),
          exerciseDbId: String((ex as any)?.exerciseDbId || match?.exerciseDbId || ""),
          catalogSlug: match?.slug || "",
        };
      }),
    };
  });

  return plan;
}

/**
 * Generate a training plan using Firebase AI (Gemini).
 * Falls back to rule-based generation on failure.
 *
 * @param {import("../data/planGeneratorConfig").GeneratorForm} form
 * @param {string} language — "es" | "en"
 * @returns {Promise<{ plan: Record<string, any>, source: "ai" | "rules" }>}
 */
export async function generateTrainingPlan(form, language = "es") {
  if (!isAIAvailable()) {
    return { plan: generateRuleBasedPlan(form, language), source: "rules" };
  }

  try {
    const model = getGenerativeModel(ai, { model: "gemini-3-flash-preview" });

    const result = await model.generateContent({
      systemInstruction: { parts: [{ text: buildSystemPrompt(language) }] },
      contents: [{ role: "user", parts: [{ text: buildUserPrompt(form, language) }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();
    const plan = parseAIResponse(text, language);
    return { plan, source: "ai" };
  } catch (error) {
    console.warn("[AIGenerator] Gemini unavailable, using rule-based fallback.", error.message || error);
    return { plan: generateRuleBasedPlan(form, language), source: "rules" };
  }
}
