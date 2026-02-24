import {
  formatDate,
  padIndex,
  getLastLog,
  computeWeightStats,
  buildChartData,
} from "../utils/helpers";

/* ================================================================
 * formatDate
 * ================================================================ */
describe("formatDate", () => {
  it("formats an ISO string to dd/mm", () => {
    // 15 March 2026
    const result = formatDate("2026-03-15T10:00:00.000Z");
    expect(result).toMatch(/15\/0?3/); // "15/03" or "15/3"
  });

  it("handles single digit day/month correctly", () => {
    const result = formatDate("2026-01-05T12:00:00.000Z");
    expect(result).toMatch(/0?5\/0?1/);
  });
});

/* ================================================================
 * padIndex
 * ================================================================ */
describe("padIndex", () => {
  it("pads single digit to two chars", () => {
    expect(padIndex(0)).toBe("01");
    expect(padIndex(8)).toBe("09");
  });

  it("does not pad double digit", () => {
    expect(padIndex(11)).toBe("12");
    expect(padIndex(99)).toBe("100"); // no truncation
  });
});

/* ================================================================
 * getLastLog
 * ================================================================ */
describe("getLastLog", () => {
  const entry1 = { date: "2026-01-01", weight: "50", reps: "10", notes: "" };
  const entry2 = { date: "2026-02-01", weight: "55", reps: "8", notes: "good" };

  it("returns the last entry for an existing exercise", () => {
    const logs = { ex1: [entry1, entry2] };
    expect(getLastLog(logs, "ex1")).toEqual(entry2);
  });

  it("returns null for an unknown exercise id", () => {
    expect(getLastLog({}, "unknown")).toBeNull();
  });

  it("returns null for an empty array", () => {
    expect(getLastLog({ ex1: [] }, "ex1")).toBeNull();
  });
});

/* ================================================================
 * computeWeightStats
 * ================================================================ */
describe("computeWeightStats", () => {
  it("computes current, max, and min correctly", () => {
    const entries = [
      { date: "d1", weight: "40", reps: "10", notes: "" },
      { date: "d2", weight: "60", reps: "8", notes: "" },
      { date: "d3", weight: "50", reps: "12", notes: "" },
    ];
    expect(computeWeightStats(entries)).toEqual({
      current: 50,
      max: 60,
      min: 40,
    });
  });

  it("skips entries without weight", () => {
    const entries = [
      { date: "d1", weight: "", reps: "10", notes: "" },
      { date: "d2", weight: "70", reps: "8", notes: "" },
    ];
    const stats = computeWeightStats(entries);
    expect(stats).toEqual({ current: 70, max: 70, min: 70 });
  });

  it("returns null when no entries have weight", () => {
    expect(computeWeightStats([])).toBeNull();
    expect(
      computeWeightStats([{ date: "d1", weight: "", reps: "10", notes: "" }]),
    ).toBeNull();
  });
});

/* ================================================================
 * buildChartData
 * ================================================================ */
describe("buildChartData", () => {
  it("maps entries to { date, peso } objects", () => {
    const entries = [
      { date: "2026-03-15T10:00:00.000Z", weight: "80", reps: "6", notes: "" },
      { date: "2026-03-20T10:00:00.000Z", weight: "85", reps: "5", notes: "" },
    ];
    const data = buildChartData(entries);
    expect(data).toHaveLength(2);
    expect(data[0].peso).toBe(80);
    expect(data[1].peso).toBe(85);
    expect(data[0].date).toBeDefined();
  });

  it("defaults peso to 0 when weight is empty", () => {
    const entries = [{ date: "2026-01-01T00:00:00Z", weight: "", reps: "10", notes: "" }];
    expect(buildChartData(entries)[0].peso).toBe(0);
  });
});
