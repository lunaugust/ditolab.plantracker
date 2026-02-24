/**
 * Exercise media service — fetches GIF animations and images for exercises.
 *
 * Primary source: wger.de REST API (free, no key required)
 * Fallback: YouTube search URL
 *
 * For the built-in training plan exercises, a curated English keyword map
 * is used to improve search accuracy against the wger database.
 */

/** Maps built-in exercise IDs to English search terms for wger lookups. */
const EXERCISE_KEYWORDS: Record<string, string> = {
  d1_hack_warmup: "hack squat",
  d1_hack: "hack squat",
  d1_prensa45: "leg press 45",
  d1_stepup: "step up dumbbell",
  d1_sillon_cuad: "leg extension",
  d1_camilla: "leg curl",
  d1_sumo: "sumo squat",
  d1_hip: "hip thrust machine",
  d1_pant_pie: "standing calf raise",
  d1_pant_sent: "seated calf raise",
  d1_deadbug: "dead bug",
  d1_plancha: "plank",
  d1_birddog: "bird dog",

  d2_facepu: "face pull",
  d2_jalon: "lat pulldown wide grip",
  d2_jalon_sup: "lat pulldown supine grip",
  d2_remo_polea: "cable row seated",
  d2_remo_man: "dumbbell row",
  d2_encog: "dumbbell shrug",
  d2_elev_post: "dumbbell rear delt fly",
  d2_biceps_w: "barbell curl",
  d2_scott: "preacher curl",
  d2_triceps: "triceps pushdown rope",
  d2_plancha_ext: "plank reach",
  d2_deadbug2: "dead bug",

  d3_press_plan: "barbell bench press",
  d3_press_inc: "incline dumbbell press",
  d3_pec_deck: "pec deck fly",
  d3_cable_cross: "cable crossover",
  d3_press_hom: "shoulder press dumbbell",
  d3_elev_lat: "lateral raise",
  d3_arnold: "arnold press",
  d3_triceps_ext: "skull crusher",

  d4_sentadilla: "squat barbell",
  d4_peso_muerto: "deadlift",
  d4_zancada: "lunge dumbbell",
  d4_abductor: "abductor machine",
  d4_adductor: "adductor machine",
};

export interface ExerciseMedia {
  imageUrl: string | null;
  wgerExerciseId: number | null;
  youtubeUrl: string;
}

/**
 * Searches the public wger.de API for an exercise image.
 * Returns null imageUrl if the request fails or no image is found.
 */
async function fetchWgerMedia(searchTerm: string): Promise<{ imageUrl: string | null; wgerExerciseId: number | null }> {
  try {
    const searchUrl = `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(searchTerm)}&language=english&format=json`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
    if (!searchRes.ok) return { imageUrl: null, wgerExerciseId: null };

    const searchData = await searchRes.json();
    const suggestions: Array<{ data: { id: number; base_id: number } }> = searchData.suggestions ?? [];
    if (suggestions.length === 0) return { imageUrl: null, wgerExerciseId: null };

    const baseId = suggestions[0].data.base_id;

    const imgUrl = `https://wger.de/api/v2/exerciseimage/?exercise_base=${baseId}&format=json`;
    const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(5000) });
    if (!imgRes.ok) return { imageUrl: null, wgerExerciseId: baseId };

    const imgData = await imgRes.json();
    const results: Array<{ image: string; is_main: boolean }> = imgData.results ?? [];
    const main = results.find((r) => r.is_main) ?? results[0];

    return { imageUrl: main?.image ?? null, wgerExerciseId: baseId };
  } catch {
    return { imageUrl: null, wgerExerciseId: null };
  }
}

/**
 * Returns media (image + YouTube link) for the given exercise.
 *
 * @param exerciseName - Display name of the exercise (any language)
 * @param exerciseId   - Internal exercise ID (used to look up English keyword)
 */
export async function getExerciseMedia(
  exerciseName: string,
  exerciseId?: string
): Promise<ExerciseMedia> {
  const searchTerm = (exerciseId && EXERCISE_KEYWORDS[exerciseId]) ?? exerciseName;
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + " ejercicio técnica")}`;

  const { imageUrl, wgerExerciseId } = await fetchWgerMedia(searchTerm);

  return { imageUrl, wgerExerciseId, youtubeUrl };
}
