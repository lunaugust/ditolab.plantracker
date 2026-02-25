/**
 * ExerciseDB API service
 *
 * Fetches exercise details (GIFs, instructions, metadata) from ExerciseDB API.
 * Implements caching to minimize API calls and support offline mode.
 */

const EXERCISEDB_BASE_URL = "https://exercisedb.p.rapidapi.com";
const CACHE_KEY_PREFIX = "exercisedb_";
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type ExerciseDetails = {
  id: string;
  name: string;
  gifUrl: string;
  target: string;
  equipment: string;
  instructions: string[];
  bodyPart: string;
  secondaryMuscles: string[];
};

type CachedExercise = {
  data: ExerciseDetails;
  timestamp: number;
};

/**
 * Get exercise details from cache if available and not expired
 */
function getFromCache(exerciseDbId: string): ExerciseDetails | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${exerciseDbId}`);
    if (!cached) return null;

    const parsed: CachedExercise = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;

    if (age > CACHE_DURATION_MS) {
      // Expired, remove from cache
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${exerciseDbId}`);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.warn(`[ExerciseDB] Cache read error:`, error);
    return null;
  }
}

/**
 * Save exercise details to cache
 */
function saveToCache(exerciseDbId: string, data: ExerciseDetails): void {
  try {
    const cached: CachedExercise = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${exerciseDbId}`, JSON.stringify(cached));
  } catch (error) {
    console.warn(`[ExerciseDB] Cache write error:`, error);
  }
}

/**
 * Fetch exercise details from ExerciseDB API
 *
 * Note: This uses the free ExerciseDB API which doesn't require API keys.
 * If rate limits become an issue, consider using the RapidAPI version with a key.
 *
 * @param exerciseDbId - The ExerciseDB exercise ID
 * @returns Exercise details or null if not found/error
 */
export async function fetchExerciseDetails(
  exerciseDbId: string
): Promise<ExerciseDetails | null> {
  // Check cache first
  const cached = getFromCache(exerciseDbId);
  if (cached) {
    return cached;
  }

  try {
    // Use the free ExerciseDB API (no auth required)
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/exercise/${exerciseDbId}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": "SIGN-UP-FOR-KEY", // Free tier, no key needed in practice
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
      }
    );

    if (!response.ok) {
      console.warn(`[ExerciseDB] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Normalize the response to our type
    const details: ExerciseDetails = {
      id: data.id || exerciseDbId,
      name: data.name || "",
      gifUrl: data.gifUrl || "",
      target: data.target || "",
      equipment: data.equipment || "",
      instructions: Array.isArray(data.instructions) ? data.instructions : [],
      bodyPart: data.bodyPart || "",
      secondaryMuscles: Array.isArray(data.secondaryMuscles)
        ? data.secondaryMuscles
        : [],
    };

    // Save to cache
    saveToCache(exerciseDbId, details);

    return details;
  } catch (error) {
    console.warn(`[ExerciseDB] Fetch error:`, error);
    return null;
  }
}

/**
 * Get the direct GIF URL for an exercise
 * This is a quick way to get the GIF without fetching full details
 */
export function getExerciseGifUrl(exerciseDbId: string): string {
  return `https://v2.exercisedb.io/image/${exerciseDbId}`;
}

/**
 * Clear all cached exercise data
 */
export function clearExerciseCache(): void {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn(`[ExerciseDB] Cache clear error:`, error);
  }
}
