/**
 * Configuration for the AI plan generator wizard.
 *
 * Each option set has a key (stored in form state) and i18n label key.
 * The prompt builder and rule-based fallback both consume these keys.
 */

/** Experience levels */
export const EXPERIENCE_OPTIONS = [
  { key: "beginner",     labelKey: "generator.experience.beginner" },
  { key: "intermediate", labelKey: "generator.experience.intermediate" },
  { key: "advanced",     labelKey: "generator.experience.advanced" },
];

/** Training goals */
export const GOAL_OPTIONS = [
  { key: "adaptation",   labelKey: "generator.goal.adaptation" },
  { key: "fatBurn",      labelKey: "generator.goal.fatBurn" },
  { key: "resistance",   labelKey: "generator.goal.resistance" },
  { key: "strength",     labelKey: "generator.goal.strength" },
  { key: "hypertrophy",  labelKey: "generator.goal.hypertrophy" },
  { key: "maintenance",  labelKey: "generator.goal.maintenance" },
];

/** Days-per-week presets */
export const DAYS_PER_WEEK_OPTIONS = [2, 3, 4, 5, 6];

/** Minutes-per-session presets */
export const MINUTES_OPTIONS = [30, 45, 60, 75, 90];

/** Default form values */
export const DEFAULT_GENERATOR_FORM = {
  experience: "intermediate",
  goal: "hypertrophy",
  limitations: "",
  daysPerWeek: 3,
  minutesPerSession: 60,
};

/** Day accent colours cycled for generated plans */
export const GENERATED_DAY_COLORS = [
  "#e8643a",
  "#3ab8e8",
  "#7de83a",
  "#e8c93a",
  "#c83ae8",
  "#e83a7d",
];
