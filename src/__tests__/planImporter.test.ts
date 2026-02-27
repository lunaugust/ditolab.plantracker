import { detectMimeType, isImportAvailable, importPlanFromFile } from "../services/planImporter";

/* ================================================================
 * Mock firebase/ai — not available in test environment
 * ================================================================ */
vi.mock("firebase/ai", () => ({
  getGenerativeModel: vi.fn(),
  GoogleAIBackend: vi.fn(),
}));

vi.mock("../services/firebaseClient", () => ({
  ai: null,
  db: null,
  isFirebaseConfigured: false,
}));

describe("planImporter", () => {
  /* ----------------------------------------------------------
   * detectMimeType
   * ---------------------------------------------------------- */
  describe("detectMimeType", () => {
    it("returns application/pdf for PDF files", () => {
      const file = new File([""], "plan.pdf", { type: "application/pdf" });
      expect(detectMimeType(file)).toBe("application/pdf");
    });

    it("returns application/pdf for .pdf extension even without type", () => {
      const file = new File([""], "plan.pdf", { type: "" });
      expect(detectMimeType(file)).toBe("application/pdf");
    });

    it("returns text/plain for CSV files", () => {
      const file = new File(["a,b"], "data.csv", { type: "text/csv" });
      expect(detectMimeType(file)).toBe("text/plain");
    });

    it("returns text/plain for .csv extension even without type", () => {
      const file = new File(["a,b"], "data.csv", { type: "" });
      expect(detectMimeType(file)).toBe("text/plain");
    });

    it("returns text/plain for .txt files", () => {
      const file = new File(["text"], "notes.txt", { type: "text/plain" });
      expect(detectMimeType(file)).toBe("text/plain");
    });

    it("returns null for unsupported file types", () => {
      const file = new File(["data"], "image.png", { type: "image/png" });
      expect(detectMimeType(file)).toBeNull();
    });

    it("returns null for files with no type and unknown extension", () => {
      const file = new File(["data"], "file.xyz", { type: "" });
      expect(detectMimeType(file)).toBeNull();
    });
  });

  /* ----------------------------------------------------------
   * isImportAvailable
   * ---------------------------------------------------------- */
  describe("isImportAvailable", () => {
    it("returns false when ai is null", () => {
      expect(isImportAvailable()).toBe(false);
    });
  });

  /* ----------------------------------------------------------
   * importPlanFromFile — error boundaries
   * ---------------------------------------------------------- */
  describe("importPlanFromFile", () => {
    it("throws when AI is unavailable (ai === null)", async () => {
      const file = new File(["a,b"], "plan.csv", { type: "text/csv" });
      await expect(importPlanFromFile(file, "es")).rejects.toThrow();
    });

    it("throws for unsupported file type (no valid MIME)", async () => {
      const file = new File(["data"], "image.png", { type: "image/png" });
      await expect(importPlanFromFile(file, "es")).rejects.toThrow();
    });
  });
});
