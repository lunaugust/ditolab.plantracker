/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import {
  EXERCISE_LIBRARY,
  getExercisesByCategory,
  getExerciseById,
  getExerciseName,
  findExerciseByName,
  getAllExerciseNames,
} from "../data/exerciseLibrary";
import {
  enrichExerciseWithDbId,
  enrichPlanWithDbIds,
  getPlanMatchingStats,
  getExerciseDbIdsFromPlan,
} from "../utils/exerciseMatching";

describe("Exercise Library", () => {
  it("should have exercises with all required fields", () => {
    for (const exercise of EXERCISE_LIBRARY) {
      expect(exercise.id).toBeDefined();
      expect(exercise.nameEs).toBeDefined();
      expect(exercise.nameEn).toBeDefined();
      expect(exercise.exerciseDbId).toBeDefined();
      expect(exercise.category).toBeDefined();
      expect(exercise.defaultSets).toBeDefined();
      expect(exercise.defaultReps).toBeDefined();
      expect(exercise.defaultRest).toBeDefined();
    }
  });

  it("should have exercises for all categories", () => {
    const categories = [
      "quadriceps",
      "hamstrings",
      "glutes",
      "chest",
      "back",
      "shoulders",
      "biceps",
      "triceps",
      "calves",
      "core",
    ];

    for (const category of categories) {
      const exercises = getExercisesByCategory(category as any);
      expect(exercises.length).toBeGreaterThan(0);
    }
  });

  it("should get exercise by ID", () => {
    const exercise = getExerciseById("hack_squat");
    expect(exercise).toBeDefined();
    expect(exercise?.nameEs).toBe("Sentadilla Hack");
    expect(exercise?.nameEn).toBe("Hack Squat");
  });

  it("should return undefined for non-existent ID", () => {
    const exercise = getExerciseById("non_existent_exercise");
    expect(exercise).toBeUndefined();
  });

  it("should get exercise name in Spanish", () => {
    const exercise = getExerciseById("hack_squat");
    expect(exercise).toBeDefined();
    const name = getExerciseName(exercise!, "es");
    expect(name).toBe("Sentadilla Hack");
  });

  it("should get exercise name in English", () => {
    const exercise = getExerciseById("hack_squat");
    expect(exercise).toBeDefined();
    const name = getExerciseName(exercise!, "en");
    expect(name).toBe("Hack Squat");
  });

  it("should find exercise by exact name match (Spanish)", () => {
    const exercise = findExerciseByName("Sentadilla Hack", "es");
    expect(exercise).toBeDefined();
    expect(exercise?.id).toBe("hack_squat");
  });

  it("should find exercise by exact name match (English)", () => {
    const exercise = findExerciseByName("Hack Squat", "en");
    expect(exercise).toBeDefined();
    expect(exercise?.id).toBe("hack_squat");
  });

  it("should find exercise by partial name match", () => {
    const exercise = findExerciseByName("Hack", "en");
    expect(exercise).toBeDefined();
    expect(exercise?.nameEn).toContain("Hack");
  });

  it("should return undefined for non-matching name", () => {
    const exercise = findExerciseByName("Completely Non Existent Exercise", "en");
    expect(exercise).toBeUndefined();
  });

  it("should get all exercise names in Spanish", () => {
    const names = getAllExerciseNames("es");
    expect(names.length).toBeGreaterThan(0);
    expect(names).toContain("Sentadilla Hack");
  });

  it("should get all exercise names in English", () => {
    const names = getAllExerciseNames("en");
    expect(names.length).toBeGreaterThan(0);
    expect(names).toContain("Hack Squat");
  });
});

describe("Exercise Matching", () => {
  it("should enrich exercise with DB ID when name matches", () => {
    const exercise = {
      id: "ex_123",
      name: "Sentadilla Hack",
      sets: "4",
      reps: "12",
    };

    const enriched = enrichExerciseWithDbId(exercise, "es");
    expect(enriched.exerciseDbId).toBeDefined();
    expect(enriched.exerciseDbId).toBe("1420");
  });

  it("should not override existing exerciseDbId", () => {
    const exercise = {
      id: "ex_123",
      name: "Sentadilla Hack",
      sets: "4",
      reps: "12",
      exerciseDbId: "existing_id",
    };

    const enriched = enrichExerciseWithDbId(exercise, "es");
    expect(enriched.exerciseDbId).toBe("existing_id");
  });

  it("should return exercise unchanged when no match found", () => {
    const exercise = {
      id: "ex_123",
      name: "Custom Exercise Name",
      sets: "4",
      reps: "12",
    };

    const enriched = enrichExerciseWithDbId(exercise, "es");
    expect(enriched.exerciseDbId).toBeUndefined();
    expect(enriched).toEqual(exercise);
  });

  it("should enrich all exercises in a plan", () => {
    const plan = {
      "Día 1": {
        label: "Pecho",
        color: "#ff6b6b",
        exercises: [
          { id: "ex_1", name: "Press Banco Plano con Barra", sets: "4", reps: "10" },
          { id: "ex_2", name: "Custom Exercise", sets: "3", reps: "12" },
        ],
      },
    };

    const enriched = enrichPlanWithDbIds(plan, "es");
    expect(enriched["Día 1"].exercises[0].exerciseDbId).toBe("0025");
    expect(enriched["Día 1"].exercises[1].exerciseDbId).toBeUndefined();
  });

  it("should get matching statistics", () => {
    const plan = {
      "Día 1": {
        label: "Pecho",
        color: "#ff6b6b",
        exercises: [
          { id: "ex_1", name: "Test", sets: "4", reps: "10", exerciseDbId: "0025" },
          { id: "ex_2", name: "Custom", sets: "3", reps: "12" },
          { id: "ex_3", name: "Another", sets: "3", reps: "12", exerciseDbId: "1234" },
        ],
      },
    };

    const stats = getPlanMatchingStats(plan);
    expect(stats.total).toBe(3);
    expect(stats.matched).toBe(2);
    expect(stats.unmatched).toBe(1);
    expect(stats.matchRate).toBeCloseTo(0.666, 2);
  });

  it("should get unique ExerciseDB IDs from plan", () => {
    const plan = {
      "Día 1": {
        label: "Pecho",
        color: "#ff6b6b",
        exercises: [
          { id: "ex_1", name: "Test", sets: "4", reps: "10", exerciseDbId: "0025" },
          { id: "ex_2", name: "Test2", sets: "4", reps: "10", exerciseDbId: "0025" },
          { id: "ex_3", name: "Custom", sets: "3", reps: "12" },
        ],
      },
      "Día 2": {
        label: "Espalda",
        color: "#4ecdc4",
        exercises: [
          { id: "ex_4", name: "Test", sets: "4", reps: "10", exerciseDbId: "0609" },
        ],
      },
    };

    const ids = getExerciseDbIdsFromPlan(plan);
    expect(ids).toHaveLength(2);
    expect(ids).toContain("0025");
    expect(ids).toContain("0609");
  });

  it("should handle empty plan gracefully", () => {
    const plan = {};
    const stats = getPlanMatchingStats(plan);
    expect(stats.total).toBe(0);
    expect(stats.matched).toBe(0);
    expect(stats.matchRate).toBe(0);
  });
});
