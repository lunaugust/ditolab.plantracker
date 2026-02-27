import { getGenerativeModel } from "firebase/ai";
import { ai } from "./firebaseClient";
import { GENERATED_DAY_COLORS, type GeneratorForm } from "../data/planGeneratorConfig";
import { makeExerciseId } from "../utils/helpers";
import { generateRuleBasedPlan } from "./ruleBasedPlanGenerator";
import { getExerciseNamesForPrompt, attachExerciseIds } from "../data/exerciseCatalog";
import type { TrainingPlan } from "./types";

export function isAIAvailable(): boolean {
  return Boolean(ai);
}

function buildSystemPrompt(language: string, exerciseCatalog: string): string {
  const lang = language === "en" ? "English" : "Spanish";
  return [
    `You are an expert certified personal trainer and exercise physiologist.`,
    `Generate a training plan. Day names, labels, notes, and coaching cues must be in ${lang}.`,
    `Exercise names MUST be in English, chosen from the provided catalog below.`,
    `Return ONLY valid JSON matching this exact schema (no markdown, no explanation):`,
    `{`,
    `  "<Day Name>": {`,
    `    "label": "<muscle groups targeted>",`,
    `    "exercises": [`,
    `      {`,
    `        "name": "<exercise name from catalog>",`,
    `        "sets": "<number>",`,
    `        "reps": "<rep scheme, e.g. 12·10·8·6 or 15>",`,
    `        "rest": "<rest period, e.g. 90s>",`,
    `        "note": "<optional coaching cue or safety note, empty string if none>"`,
    `      }`,
    `    ]`,
    `  }`,
    `}`,
    ``,
    `Rules:`,
    `- Each day key must be "${language === "en" ? "Day" : "Día"} N" (e.g. "${language === "en" ? "Day" : "Día"} 1").`,
    `- Exercise names MUST come from the exercise catalog below. Use the exact name as listed.`,
    `- Include appropriate warm-up sets where relevant.`,
    `- Include 2-3 core/abs exercises at the end of each day.`,
    `- All string values, no numbers.`,
    `- Respect injury/limitation constraints strictly — substitute exercises that avoid the affected area.`,
    `- Adjust volume and intensity to the experience level.`,
    `- Match the number of training days requested.`,
    `- Keep each session within the requested time (adjust exercise count accordingly).`,
    ``,
    `EXERCISE CATALOG (pick ONLY from these):`,
    exerciseCatalog,
  ].join("\n");
}

function buildUserPrompt(form: GeneratorForm, language: string): string {
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

function parseAIResponse(rawText: string): TrainingPlan {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  const parsed: unknown = JSON.parse(cleaned);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI response is not a valid object");
  }

  const dayKeys = Object.keys(parsed as object);
  if (dayKeys.length === 0) {
    throw new Error("AI response contains no training days");
  }

  const plan: TrainingPlan = {};
  dayKeys.forEach((dayKey, dayIndex) => {
    const rawDay = (parsed as Record<string, unknown>)[dayKey] as Record<string, unknown> | undefined;
    const exercises = Array.isArray(rawDay?.exercises) ? rawDay.exercises as Record<string, unknown>[] : [];

    plan[dayKey] = {
      label: String(rawDay?.label || ""),
      color: GENERATED_DAY_COLORS[dayIndex % GENERATED_DAY_COLORS.length],
      exercises: exercises.map((ex) => ({
        id: makeExerciseId(),
        name: String(ex?.name || ""),
        sets: String(ex?.sets || ""),
        reps: String(ex?.reps || ""),
        rest: String(ex?.rest || ""),
        note: String(ex?.note || ""),
      })),
    };
  });

  return plan;
}

export async function generateTrainingPlan(form: GeneratorForm, language = "es"): Promise<{ plan: TrainingPlan; source: "ai" | "rules" }> {
  if (!isAIAvailable()) {
    return { plan: await generateRuleBasedPlan(form, language), source: "rules" };
  }

  try {
    const exerciseCatalog = await getExerciseNamesForPrompt();
    const model = getGenerativeModel(ai!, { model: "gemini-3-flash-preview" });

    const result = await model.generateContent({
      systemInstruction: buildSystemPrompt(language, exerciseCatalog),
      contents: [{ role: "user", parts: [{ text: buildUserPrompt(form, language) }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();
    const plan = parseAIResponse(text);
    const planWithIds = await attachExerciseIds(plan);
    return { plan: planWithIds, source: "ai" };
  } catch (error) {
    console.warn("[AIGenerator] Gemini unavailable, using rule-based fallback.", error instanceof Error ? error.message : error);
    return { plan: await generateRuleBasedPlan(form, language), source: "rules" };
  }
}
