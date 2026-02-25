import { describe, it, expect } from "vitest";
import {
  EXERCISE_CATALOG,
  lookupExerciseDbName,
  buildExerciseCatalogPromptSection,
} from "../data/exerciseCatalog";
import { generateRuleBasedPlan } from "../services/ruleBasedPlanGenerator";

/* ================================================================
 * EXERCISE_CATALOG — shape validation
 * ================================================================ */
describe("EXERCISE_CATALOG", () => {
  it("has at least one entry per muscle group", () => {
    const groups = new Set(EXERCISE_CATALOG.map((e) => e.muscleGroup));
    for (const expected of ["quadriceps", "hamstrings", "glutes", "chest", "back", "shoulders", "biceps", "triceps", "calves", "core"]) {
      expect(groups.has(expected)).toBe(true);
    }
  });

  it("every entry has non-empty nameEs, nameEn, exerciseDbName, and muscleGroup", () => {
    for (const entry of EXERCISE_CATALOG) {
      expect(entry.nameEs.length).toBeGreaterThan(0);
      expect(entry.nameEn.length).toBeGreaterThan(0);
      expect(entry.exerciseDbName.length).toBeGreaterThan(0);
      expect(entry.muscleGroup.length).toBeGreaterThan(0);
    }
  });

  it("exerciseDbName values are lowercase", () => {
    for (const entry of EXERCISE_CATALOG) {
      expect(entry.exerciseDbName).toBe(entry.exerciseDbName.toLowerCase());
    }
  });
});

/* ================================================================
 * lookupExerciseDbName
 * ================================================================ */
describe("lookupExerciseDbName", () => {
  it("finds by Spanish name", () => {
    expect(lookupExerciseDbName("Sentadilla Hack")).toBe("hack squat");
  });

  it("finds by English name", () => {
    expect(lookupExerciseDbName("Barbell Bench Press")).toBe("barbell bench press");
  });

  it("is case-insensitive", () => {
    expect(lookupExerciseDbName("HACK SQUAT")).toBe("hack squat");
    expect(lookupExerciseDbName("sentadilla hack")).toBe("hack squat");
  });

  it("finds by exerciseDbName itself", () => {
    expect(lookupExerciseDbName("romanian deadlift")).toBe("romanian deadlift");
  });

  it("returns undefined for unknown exercises", () => {
    expect(lookupExerciseDbName("Unknown exercise XYZ")).toBeUndefined();
  });

  it("trims whitespace before lookup", () => {
    expect(lookupExerciseDbName("  hack squat  ")).toBe("hack squat");
  });
});

/* ================================================================
 * buildExerciseCatalogPromptSection
 * ================================================================ */
describe("buildExerciseCatalogPromptSection", () => {
  it("returns a non-empty string", () => {
    const section = buildExerciseCatalogPromptSection();
    expect(typeof section).toBe("string");
    expect(section.length).toBeGreaterThan(0);
  });

  it("contains the exerciseDbName for each catalog entry", () => {
    const section = buildExerciseCatalogPromptSection();
    for (const entry of EXERCISE_CATALOG) {
      expect(section).toContain(entry.exerciseDbName);
    }
  });

  it("uses the → separator format", () => {
    const section = buildExerciseCatalogPromptSection();
    expect(section).toContain("→");
  });
});

/* ================================================================
 * ruleBasedPlanGenerator — exerciseDbName integration
 * ================================================================ */
describe("generateRuleBasedPlan — exerciseDbName", () => {
  const baseForm = {
    experience: "intermediate",
    goal: "hypertrophy",
    limitations: "",
    daysPerWeek: 3,
    minutesPerSession: 60,
  };

  it("populates exerciseDbName for exercises that exist in the catalog", () => {
    const plan = generateRuleBasedPlan(baseForm, "es");
    const allExercises = Object.values(plan).flatMap((d) => d.exercises);
    const withDbName = allExercises.filter((ex) => ex.exerciseDbName);
    // At least some exercises should have a matching catalog entry
    expect(withDbName.length).toBeGreaterThan(0);
  });

  it("exerciseDbName values are lowercase strings when present", () => {
    const plan = generateRuleBasedPlan(baseForm, "es");
    for (const day of Object.values(plan)) {
      for (const ex of day.exercises) {
        if (ex.exerciseDbName) {
          expect(typeof ex.exerciseDbName).toBe("string");
          expect(ex.exerciseDbName).toBe(ex.exerciseDbName.toLowerCase());
        }
      }
    }
  });

  it("English plan also populates exerciseDbName", () => {
    const plan = generateRuleBasedPlan(baseForm, "en");
    const allExercises = Object.values(plan).flatMap((d) => d.exercises);
    const withDbName = allExercises.filter((ex) => ex.exerciseDbName);
    expect(withDbName.length).toBeGreaterThan(0);
  });
});
