/**
 * Format an ISO date string to dd/mm for the es-AR locale.
 * @param {string} iso — ISO-8601 date string
 * @returns {string}
 */
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Pad a 1-based index to two digits: 1 → "01", 12 → "12".
 * @param {number} index — 0-based index
 * @returns {string}
 */
export function padIndex(index) {
  return String(index + 1).padStart(2, "0");
}

/**
 * Get the last entry from an exercise's log array (or null).
 * @param {Record<string, import("../services/types").LogEntry[]>} logs
 * @param {string} exerciseId
 * @returns {import("../services/types").LogEntry | null}
 */
export function getLastLog(logs, exerciseId) {
  const entries = logs[exerciseId] || [];
  return entries.length > 0 ? entries[entries.length - 1] : null;
}

/**
 * Compute progression stats for an exercise.
 * @param {import("../services/types").LogEntry[]} entries
 * @returns {{ current: number, max: number, min: number } | null}
 */
export function computeWeightStats(entries) {
  const weights = entries.filter((e) => e.weight).map((e) => parseFloat(e.weight));
  if (weights.length === 0) return null;
  return {
    current: weights[weights.length - 1],
    max: Math.max(...weights),
    min: Math.min(...weights),
  };
}

/**
 * Build chart-ready data from log entries.
 * @param {import("../services/types").LogEntry[]} entries
 * @returns {{ date: string, peso: number }[]}
 */
export function buildChartData(entries) {
  return entries.map((e) => ({
    date: formatDate(e.date),
    peso: parseFloat(e.weight) || 0,
  }));
}
