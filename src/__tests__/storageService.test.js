import { loadLogs, persistLogs } from "../services/storageService";

/* ================================================================
 * Mock localStorage (jsdom provides one, but we want fine control)
 * ================================================================ */
const STORAGE_KEY = "augusto_logs";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

/* ================================================================
 * loadLogs
 * ================================================================ */
describe("loadLogs", () => {
  it("returns empty object when nothing is stored", async () => {
    expect(await loadLogs()).toEqual({});
  });

  it("parses stored JSON correctly", async () => {
    const data = { ex1: [{ date: "d", weight: "50", reps: "10", notes: "" }] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    expect(await loadLogs()).toEqual(data);
  });

  it("returns empty object on corrupted JSON", async () => {
    localStorage.setItem(STORAGE_KEY, "{invalid json");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await loadLogs()).toEqual({});
    expect(consoleSpy).toHaveBeenCalled();
  });
});

/* ================================================================
 * persistLogs
 * ================================================================ */
describe("persistLogs", () => {
  it("writes JSON to localStorage", async () => {
    const data = { ex1: [{ date: "d", weight: "60", reps: "8", notes: "" }] };
    await persistLogs(data);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(data);
  });

  it("throws when localStorage.setItem fails", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(persistLogs({})).rejects.toThrow("QuotaExceeded");
    expect(consoleSpy).toHaveBeenCalled();
  });
});
