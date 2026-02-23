/**
 * Shared type definitions (JSDoc).
 *
 * These exist purely for editor intellisense & documentation —
 * no runtime cost.  Migrate to .ts when ready.
 */

/**
 * @typedef {Object} LogEntry
 * @property {string} date    — ISO-8601 timestamp
 * @property {string} weight  — Weight used (kg)
 * @property {string} reps    — Reps completed
 * @property {string} notes   — Free-form notes
 */

/**
 * @typedef {"plan" | "log" | "progress"} ViewKey
 */

export {};
