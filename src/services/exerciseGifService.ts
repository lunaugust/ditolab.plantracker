/**
 * Exercise GIF service — fetches exercise animation URLs from the ExerciseDB API.
 *
 * ExerciseDB API reference: https://exercisedb.io
 * Endpoint: GET https://exercisedb.p.rapidapi.com/exercises/name/{name}?limit=1
 *
 * Requires the environment variable VITE_EXERCISEDB_API_KEY (RapidAPI key).
 * When the key is absent the service returns null silently so the UI
 * degrades gracefully without throwing.
 *
 * Usage:
 *   import { fetchExerciseGifUrl, isExerciseGifAvailable } from "./exerciseGifService";
 *
 *   if (isExerciseGifAvailable()) {
 *     const gifUrl = await fetchExerciseGifUrl("barbell bench press");
 *     if (gifUrl) showGif(gifUrl);
 *   }
 */

const API_KEY: string = import.meta.env.VITE_EXERCISEDB_API_KEY ?? "";
const API_HOST = "exercisedb.p.rapidapi.com";
const BASE_URL = `https://${API_HOST}/exercises/name`;

/** Cache to avoid redundant API calls within the same session. */
const gifCache = new Map<string, string | null>();

/**
 * Whether the ExerciseDB API is configured.
 * Returns false when `VITE_EXERCISEDB_API_KEY` is not set.
 */
export function isExerciseGifAvailable(): boolean {
  return Boolean(API_KEY);
}

/**
 * Fetch the GIF URL for an exercise by its ExerciseDB name.
 *
 * @param exerciseDbName  Lowercase name from the exercise catalog (e.g. "barbell bench press").
 * @returns               The GIF URL string, or null on failure / not found.
 */
export async function fetchExerciseGifUrl(
  exerciseDbName: string
): Promise<string | null> {
  if (!isExerciseGifAvailable() || !exerciseDbName) return null;

  const key = exerciseDbName.toLowerCase().trim();

  if (gifCache.has(key)) {
    return gifCache.get(key)!;
  }

  try {
    const url = `${BASE_URL}/${encodeURIComponent(key)}?limit=1&offset=0`;
    const response = await fetch(url, {
      headers: {
        "x-rapidapi-host": API_HOST,
        "x-rapidapi-key": API_KEY,
      },
    });

    if (!response.ok) {
      gifCache.set(key, null);
      return null;
    }

    const data: unknown = await response.json();
    const gifUrl =
      Array.isArray(data) && data.length > 0
        ? (data[0] as Record<string, unknown>).gifUrl as string | undefined
        : undefined;

    const result = gifUrl ?? null;
    gifCache.set(key, result);
    return result;
  } catch {
    gifCache.set(key, null);
    return null;
  }
}
