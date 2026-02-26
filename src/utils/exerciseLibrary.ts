/**
 * Exercise library — lookup helpers for the curated exercises.json catalog.
 *
 * Provides name-based matching (Spanish & English, with alias support) to
 * retrieve exercise metadata such as the animated GIF URL.
 */

import exercisesData from "../data/exercises.json";

export type ExerciseLibraryEntry = {
  id: string;
  /** Primary name in Spanish */
  name: string;
  /** Name in English */
  nameEn: string;
  /** Alternative names / partial exercise names used for fuzzy matching */
  aliases: string[];
  /** Publicly accessible animated GIF URL, or null when unavailable */
  gifUrl: string | null;
  muscleGroup: string;
};

const exercises = exercisesData as ExerciseLibraryEntry[];

/** Normalize a string for comparison: lowercase, strip diacritics & punctuation */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find an exercise library entry by name.
 * Two-pass: exact match first, then substring / partial match.
 *
 * @param name Exercise name in Spanish or English
 */
export function findExerciseByName(name: string): ExerciseLibraryEntry | undefined {
  const key = normalize(name);

  // Pass 1 — exact match on primary name, English name, or any alias
  const exact = exercises.find((ex) => {
    if (normalize(ex.name) === key) return true;
    if (normalize(ex.nameEn) === key) return true;
    return ex.aliases.some((a) => normalize(a) === key);
  });
  if (exact) return exact;

  // Pass 2 — substring match (query contains entry name or vice-versa)
  return exercises.find((ex) => {
    const n = normalize(ex.name);
    const en = normalize(ex.nameEn);
    if (key.includes(n) || n.includes(key)) return true;
    if (key.includes(en) || en.includes(key)) return true;
    return ex.aliases.some((a) => {
      const na = normalize(a);
      return key.includes(na) || na.includes(key);
    });
  });
}

/**
 * Return the GIF URL for an exercise by name, or `undefined` if not found.
 *
 * @param name Exercise name in Spanish or English
 */
export function getGifUrl(name: string): string | undefined {
  const entry = findExerciseByName(name);
  return entry?.gifUrl ?? undefined;
}
