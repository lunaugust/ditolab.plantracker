/**
 * Shared exercise catalog — lazy-loads exercises.json once and provides
 * lookup, search, and prompt-formatting utilities.
 */

export type CatalogEntry = {
  exerciseId: string;
  name: string;
  nameEs?: string;
  noteEn?: string;
  noteEs?: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
};

let catalog: CatalogEntry[] | null = null;

/** Lazy-load exercises.json (cached after first call). */
export async function loadExerciseCatalog(): Promise<CatalogEntry[]> {
  if (catalog) return catalog;
  const data = (await import("./exercises.json")).default as CatalogEntry[];
  catalog = data;
  return catalog;
}

/**
 * Build a formatted string of exercise names grouped by body part,
 * suitable for inclusion in an AI system prompt.
 */
export async function getExerciseNamesForPrompt(): Promise<string> {
  const entries = await loadExerciseCatalog();
  const grouped: Record<string, Set<string>> = {};

  for (const entry of entries) {
    for (const part of entry.bodyParts) {
      if (!grouped[part]) grouped[part] = new Set();
      grouped[part].add(entry.name);
    }
  }

  const lines: string[] = [];
  for (const [bodyPart, names] of Object.entries(grouped)) {
    lines.push(`[${bodyPart}]`);
    for (const name of names) {
      lines.push(`- ${name}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/** Search exercises by substring match (case-insensitive). Returns up to `limit` results. */
export async function searchExercises(
  query: string,
  limit = 15
): Promise<{ exerciseId: string; name: string; nameEs?: string; noteEn?: string; noteEs?: string; bodyParts: string[] }[]> {
  const entries = await loadExerciseCatalog();
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: { exerciseId: string; name: string; nameEs?: string; noteEn?: string; noteEs?: string; bodyParts: string[] }[] = [];
  for (const entry of entries) {
    if (
      entry.name.toLowerCase().includes(q) ||
      (entry.nameEs && entry.nameEs.toLowerCase().includes(q))
    ) {
      results.push({
        exerciseId: entry.exerciseId,
        name: entry.name,
        nameEs: entry.nameEs,
        noteEn: entry.noteEn,
        noteEs: entry.noteEs,
        bodyParts: entry.bodyParts,
      });
      if (results.length >= limit) break;
    }
  }
  return results;
}

/** Get gif URL by exact name match (case-insensitive). */
export async function getGifUrlByName(name: string): Promise<string | null> {
  const entries = await loadExerciseCatalog();
  const normalized = name.toLowerCase().trim();
  const entry = entries.find((e) => e.name.toLowerCase() === normalized);
  return entry?.gifUrl ?? null;
}

/** Get gif URL by exerciseId. */
export async function getGifUrlById(exerciseId: string): Promise<string | null> {
  if (!exerciseId) return null;
  const entries = await loadExerciseCatalog();
  const entry = entries.find((e) => e.exerciseId === exerciseId);
  return entry?.gifUrl ?? null;
}

/** Look up exerciseId by exact name match (case-insensitive). */
export async function getExerciseIdByName(name: string): Promise<string | null> {
  const entries = await loadExerciseCatalog();
  const normalized = name.toLowerCase().trim();
  const entry = entries.find((e) => e.name.toLowerCase() === normalized);
  return entry?.exerciseId ?? null;
}

/**
 * Build a synchronous name→nameEs map from the loaded catalog.
 * Returns null if the catalog hasn't been loaded yet.
 */
let nameEsMap: Map<string, string> | null = null;
let notesByIdMap: Map<string, { en: string; es: string }> | null = null;

export async function loadNameEsMap(): Promise<Map<string, string>> {
  if (nameEsMap) return nameEsMap;
  const entries = await loadExerciseCatalog();
  nameEsMap = new Map();
  for (const entry of entries) {
    if (entry.nameEs) {
      nameEsMap.set(entry.name.toLowerCase(), entry.nameEs);
    }
  }
  return nameEsMap;
}

/** Get the nameEs map synchronously (returns empty map if not yet loaded). */
export function getNameEsMapSync(): Map<string, string> {
  return nameEsMap ?? new Map();
}

export async function loadNotesByExerciseIdMap(): Promise<Map<string, { en: string; es: string }>> {
  if (notesByIdMap) return notesByIdMap;

  const entries = await loadExerciseCatalog();
  notesByIdMap = new Map();
  for (const entry of entries) {
    const noteEn = (entry.noteEn || "").trim();
    const noteEs = (entry.noteEs || "").trim();
    if (!entry.exerciseId || !noteEn || !noteEs) continue;
    notesByIdMap.set(entry.exerciseId, { en: noteEn, es: noteEs });
  }

  return notesByIdMap;
}

export function getNotesByExerciseIdMapSync(): Map<string, { en: string; es: string }> {
  return notesByIdMap ?? new Map();
}

export async function getExerciseNoteById(
  exerciseId: string,
  language: "es" | "en" = "es",
): Promise<string> {
  if (!exerciseId) return "";
  const map = await loadNotesByExerciseIdMap();
  const entry = map.get(exerciseId);
  if (!entry) return "";
  return language === "en" ? entry.en : entry.es;
}

export function getExerciseNoteByIdSync(
  exerciseId: string,
  language: "es" | "en" = "es",
): string {
  if (!exerciseId) return "";
  const entry = getNotesByExerciseIdMapSync().get(exerciseId);
  if (!entry) return "";
  return language === "en" ? entry.en : entry.es;
}

/**
 * Post-process a training plan to attach exerciseId from the catalog.
 * Looks up each exercise by name (case-insensitive) and sets exerciseId.
 */
export async function attachExerciseIds<T extends Record<string, { exercises: { name: string; exerciseId?: string }[] }>>(plan: T): Promise<T> {
  const entries = await loadExerciseCatalog();
  const nameToId = new Map<string, string>();
  for (const entry of entries) {
    nameToId.set(entry.name.toLowerCase(), entry.exerciseId);
  }

  for (const dayKey of Object.keys(plan)) {
    for (const ex of plan[dayKey].exercises) {
      const catalogId = nameToId.get(ex.name.toLowerCase());
      if (catalogId) {
        ex.exerciseId = catalogId;
      }
    }
  }

  return plan;
}
