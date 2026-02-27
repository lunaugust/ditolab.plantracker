import type { LogEntry, LogsByExercise } from "../services/types";

/** Format an ISO date string to dd/mm for the es-AR locale. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

/** Generate a unique exercise ID. */
export function makeExerciseId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Pad a 0-based index to display as two-digit 1-based: 0 → "01", 11 → "12". */
export function padIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** Get the last entry from an exercise's log array (or null). */
export function getLastLog(logs: LogsByExercise, exerciseId: string): LogEntry | null {
  const entries = logs[exerciseId] || [];
  return entries.length > 0 ? entries[entries.length - 1] : null;
}

/** Compute progression stats for an exercise. */
export function computeWeightStats(entries: LogEntry[]): { current: number; max: number; min: number } | null {
  const weights = entries.filter((e) => e.weight).map((e) => parseFloat(e.weight));
  if (weights.length === 0) return null;
  return {
    current: weights[weights.length - 1],
    max: Math.max(...weights),
    min: Math.min(...weights),
  };
}

/** Build chart-ready data from log entries. */
export function buildChartData(entries: LogEntry[]): { date: string; peso: number }[] {
  return entries.map((e) => ({
    date: formatDate(e.date),
    peso: parseFloat(e.weight) || 0,
  }));
}
