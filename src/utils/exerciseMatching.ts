/**
 * Exercise matching utilities
 *
 * Helps match AI-generated or imported exercise names to the
 * centralized exercise library with ExerciseDB mappings.
 */

import { findExerciseByName, EXERCISE_LIBRARY } from "../data/exerciseLibrary";
import type { Exercise } from "./types";

/**
 * Attempt to enrich an exercise with ExerciseDB ID by matching its name
 * to the exercise library.
 *
 * This is a best-effort operation:
 * - If a match is found, adds the exerciseDbId field
 * - If no match, returns the exercise unchanged (custom exercise)
 *
 * @param exercise - The exercise to enrich
 * @param language - The language of the exercise name
 * @returns The exercise with exerciseDbId if matched, unchanged otherwise
 */
export function enrichExerciseWithDbId(
  exercise: Exercise,
  language: "es" | "en"
): Exercise {
  // If already has an exerciseDbId, don't override
  if (exercise.exerciseDbId) {
    return exercise;
  }

  // Try to find a match in the library
  const match = findExerciseByName(exercise.name, language);

  if (match) {
    return {
      ...exercise,
      exerciseDbId: match.exerciseDbId,
    };
  }

  // No match found - return as custom exercise
  return exercise;
}

/**
 * Enrich all exercises in a training plan with ExerciseDB IDs where possible
 *
 * @param plan - The training plan to enrich
 * @param language - The language of exercise names
 * @returns The enriched plan
 */
export function enrichPlanWithDbIds(
  plan: Record<string, any>,
  language: "es" | "en"
): Record<string, any> {
  const enrichedPlan: Record<string, any> = {};

  for (const [dayKey, day] of Object.entries(plan)) {
    enrichedPlan[dayKey] = {
      ...day,
      exercises: (day.exercises || []).map((ex: Exercise) =>
        enrichExerciseWithDbId(ex, language)
      ),
    };
  }

  return enrichedPlan;
}

/**
 * Get statistics about exercise matching in a plan
 *
 * @param plan - The training plan to analyze
 * @returns Statistics about matched vs unmatched exercises
 */
export function getPlanMatchingStats(plan: Record<string, any>): {
  total: number;
  matched: number;
  unmatched: number;
  matchRate: number;
} {
  let total = 0;
  let matched = 0;

  for (const day of Object.values(plan)) {
    for (const exercise of day.exercises || []) {
      total++;
      if (exercise.exerciseDbId) {
        matched++;
      }
    }
  }

  return {
    total,
    matched,
    unmatched: total - matched,
    matchRate: total > 0 ? matched / total : 0,
  };
}

/**
 * Get all unique ExerciseDB IDs from a plan
 *
 * @param plan - The training plan
 * @returns Array of unique ExerciseDB IDs
 */
export function getExerciseDbIdsFromPlan(plan: Record<string, any>): string[] {
  const ids = new Set<string>();

  for (const day of Object.values(plan)) {
    for (const exercise of day.exercises || []) {
      if (exercise.exerciseDbId) {
        ids.add(exercise.exerciseDbId);
      }
    }
  }

  return Array.from(ids);
}
