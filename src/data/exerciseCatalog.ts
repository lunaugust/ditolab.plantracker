/**
 * Shared exercise catalog — lazy-loads exercises.json once and provides
 * lookup, search, and prompt-formatting utilities.
 */

export type CatalogEntry = {
  exerciseId: string;
  name: string;
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
): Promise<{ name: string; bodyParts: string[] }[]> {
  const entries = await loadExerciseCatalog();
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: { name: string; bodyParts: string[] }[] = [];
  for (const entry of entries) {
    if (entry.name.toLowerCase().includes(q)) {
      results.push({ name: entry.name, bodyParts: entry.bodyParts });
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
