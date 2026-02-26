import { loadExerciseCatalog } from "../data/exerciseCatalog";
import {
  applyCatalogNoteSelection,
  applyManualNote,
  ensureExerciseNoteCatalogLoaded,
  resolveExerciseNote,
} from "../utils/exerciseNotes";

describe("exercise coaching notes", () => {
  it("ensures every catalog exercise has bilingual coaching notes", async () => {
    const catalog = await loadExerciseCatalog();

    expect(catalog.length).toBeGreaterThan(0);

    const missing = catalog.filter((entry) => {
      const noteEn = typeof entry.noteEn === "string" ? entry.noteEn.trim() : "";
      const noteEs = typeof entry.noteEs === "string" ? entry.noteEs.trim() : "";
      return !entry.exerciseId || !noteEn || !noteEs;
    });

    expect(missing).toHaveLength(0);
  });

  it("overwrites with catalog note on exercise selection", () => {
    const previous = {
      id: "ex_1",
      name: "custom movement",
      exerciseId: "old-id",
      note: "previous custom note",
      noteSource: "custom" as const,
      noteCatalogId: "old-id",
    };

    const next = applyCatalogNoteSelection(previous, {
      name: "barbell bench press",
      catalogId: "EIeI8Vf",
      localizedNote: "Keep wrists stacked over elbows.",
    });

    expect(next.name).toBe("barbell bench press");
    expect(next.exerciseId).toBe("EIeI8Vf");
    expect(next.noteSource).toBe("catalog");
    expect(next.noteCatalogId).toBe("EIeI8Vf");
    expect(next.note).toBe("Keep wrists stacked over elbows.");
  });

  it("switches localized catalog note by language", async () => {
    await ensureExerciseNoteCatalogLoaded();

    const exercise = {
      exerciseId: "EIeI8Vf",
      noteSource: "catalog" as const,
      noteCatalogId: "EIeI8Vf",
      note: "",
    };

    const noteEs = resolveExerciseNote(exercise, "es");
    const noteEn = resolveExerciseNote(exercise, "en");

    expect(noteEs).toBeTruthy();
    expect(noteEn).toBeTruthy();
    expect(noteEs).not.toBe(noteEn);
  });

  it("keeps custom note fallback for legacy/manual entries", () => {
    const withManual = applyManualNote(
      {
        exerciseId: "",
        noteSource: "catalog" as const,
        noteCatalogId: "",
        note: "old",
      },
      "Mi nota manual",
    );

    expect(withManual.noteSource).toBe("custom");
    expect(resolveExerciseNote(withManual, "es")).toBe("Mi nota manual");
    expect(resolveExerciseNote(withManual, "en")).toBe("Mi nota manual");
  });
});
