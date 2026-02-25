/**
 * Plan Importer — extracts a structured TrainingPlan from a user-supplied file
 * (PDF or CSV/plain-text) using Gemini via Firebase AI Logic.
 *
 * Mirrors the aiPlanGenerator.ts architecture:
 *  - buildImportSystemPrompt  → tells Gemini what schema to produce
 *  - parseImportResponse      → same normalisation path as the generator
 *  - importPlanFromFile       → the public entry point
 */

import { getGenerativeModel } from "firebase/ai";
import { ai } from "./firebaseClient";
import { GENERATED_DAY_COLORS } from "../data/planGeneratorConfig";
import { makeExerciseId } from "../utils/helpers";
import type { TrainingPlan } from "./types";
import { findExerciseCatalogEntry, getExerciseNameOptions } from "../data/exerciseCatalog";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ImportSource = "ai";

export type ImportResult = {
  plan: TrainingPlan;
  source: ImportSource;
};

/** MIME types that Gemini's document/text understanding supports. */
export type SupportedMimeType = "application/pdf" | "text/plain";

// ---------------------------------------------------------------------------
// File detection
// ---------------------------------------------------------------------------

/**
 * Infer the Gemini MIME type from the browser File object.
 * Returns null when the file type is not supported.
 */
export function detectMimeType(file: File): SupportedMimeType | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (
    file.type === "text/plain" ||
    file.type === "text/csv" ||
    name.endsWith(".csv") ||
    name.endsWith(".txt")
  ) {
    return "text/plain";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Availability check (mirrors isAIAvailable in aiPlanGenerator.ts)
// ---------------------------------------------------------------------------

/** Whether the Firebase AI backend is available for file import. */
export function isImportAvailable(): boolean {
  return Boolean(ai);
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildImportSystemPrompt(language: string): string {
  const lang = language === "en" ? "English" : "Spanish";
  const dayWord = language === "en" ? "Day" : "Día";
  const allowed = getExerciseNameOptions(language).join(", ");
  return [
    `You are an expert fitness data extractor.`,
    `The user will provide a document (PDF or plain-text / CSV) containing a training plan.`,
    `Extract the plan and return ONLY valid JSON in ${lang} matching this exact schema (no markdown, no explanation):`,
    `{`,
    `  "<Day Name>": {`,
    `    "label": "<muscle groups targeted, e.g. Chest & Triceps>",`,
    `    "exercises": [`,
    `      {`,
    `        "name": "<exercise name>",`,
    `        "sets": "<number of sets as a string>",`,
    `        "reps": "<rep scheme, e.g. 12·10·8·6 or 15>",`,
    `        "rest": "<rest period, e.g. 90s>",`,
    `        "note": "<optional coaching cue, empty string if none>"`,
    `      }`,
    `    ]`,
    `  }`,
    `}`,
    ``,
    `Rules:`,
    `- Each top-level key must follow the pattern "${dayWord} N" (e.g. "${dayWord} 1", "${dayWord} 2").`,
    `- If the document already uses its own day names, map them to "${dayWord} N" but keep the original name as part of the label.`,
    `- All field values must be strings — never raw numbers.`,
    `- If a field is missing in the source, use an empty string "".`,
    `- Do NOT invent exercises that are not present in the document.`,
    `- Prefer exercise names from this allowed list: ${allowed}.`,
    `- If the document is not a training plan, or is unreadable, return an empty JSON object: {}`,
  ].join("\n");
}

function buildImportUserPrompt(language: string): string {
  return language === "en"
    ? "Extract the complete training plan from this document."
    : "Extraé el plan de entrenamiento completo de este documento.";
}

// ---------------------------------------------------------------------------
// Response parsing (same normalisation as aiPlanGenerator.ts)
// ---------------------------------------------------------------------------

function parseImportResponse(rawText: string, language: string): TrainingPlan {
  let cleaned = rawText.trim();
  // Strip markdown code fences if Gemini wraps the response
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  const parsed: Record<string, unknown> = JSON.parse(cleaned);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI response is not a valid object");
  }

  const dayKeys = Object.keys(parsed);
  if (dayKeys.length === 0) {
    throw new Error("NO_PLAN_FOUND");
  }

  const plan: TrainingPlan = {};
  dayKeys.forEach((dayKey, dayIndex) => {
    const rawDay = parsed[dayKey] as Record<string, unknown>;
    const exercises = Array.isArray(rawDay?.exercises) ? rawDay.exercises : [];

    plan[dayKey] = {
      label: String(rawDay?.label ?? ""),
      color: GENERATED_DAY_COLORS[dayIndex % GENERATED_DAY_COLORS.length],
      exercises: (exercises as Record<string, unknown>[]).map((ex) => {
        const match = findExerciseCatalogEntry((ex as any)?.name || (ex as any)?.exerciseDbId);
        const displayName = match
          ? (language === "en" ? match.name.en : match.name.es)
          : String((ex as any)?.name ?? "");

        return {
          id: makeExerciseId(),
          name: displayName,
          sets: String((ex as any)?.sets ?? ""),
          reps: String((ex as any)?.reps ?? ""),
          rest: String((ex as any)?.rest ?? ""),
          note: String((ex as any)?.note ?? ""),
          exerciseDbId: String((ex as any)?.exerciseDbId ?? match?.exerciseDbId ?? ""),
          catalogSlug: match?.slug ?? "",
        };
      }),
    };
  });

  return plan;
}

// ---------------------------------------------------------------------------
// Base64 helpers — chunked to avoid call-stack overflow on large files
// ---------------------------------------------------------------------------

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function textToBase64(text: string): string {
  // encodeURIComponent + unescape handles multi-byte UTF-8 characters
  return btoa(unescape(encodeURIComponent(text)));
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Import a training plan from a user-supplied File object.
 *
 * Supported formats: PDF, CSV, plain text (.txt).
 * Requires Firebase AI (authenticated users). Throws for guests.
 *
 * @param file     A browser File object selected by the user.
 * @param language "es" | "en" — controls the language of the extracted plan.
 */
export async function importPlanFromFile(
  file: File,
  language = "es"
): Promise<ImportResult> {
  if (!ai) {
    throw new Error("AI_UNAVAILABLE");
  }

  const mimeType = detectMimeType(file);
  if (!mimeType) {
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }

  // Build the inline data part for Gemini
  let data: string;
  if (mimeType === "application/pdf") {
    const buffer = await file.arrayBuffer();
    data = arrayBufferToBase64(buffer);
  } else {
    const text = await file.text();
    data = textToBase64(text);
  }

  const filePart = { inlineData: { mimeType, data } };
  const textPart = { text: buildImportUserPrompt(language) };

  const model = getGenerativeModel(ai, { model: "gemini-2.5-flash-lite" });

  const result = await model.generateContent({
    systemInstruction: { parts: [{ text: buildImportSystemPrompt(language) }] },
    contents: [{ role: "user", parts: [filePart, textPart] }],
    generationConfig: {
      temperature: 0.2, // low temperature → faithful extraction, minimal hallucination
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  const plan = parseImportResponse(text, language);
  return { plan, source: "ai" };
}
