import { getExerciseNoteByIdSync, loadNotesByExerciseIdMap } from "../data/exerciseCatalog";

export type ExerciseWithNoteMeta = {
  id?: string;
  exerciseId?: string;
  name?: string;
  note?: string;
  noteSource?: "catalog" | "custom";
  noteCatalogId?: string;
};

export function applyCatalogNoteSelection<T extends ExerciseWithNoteMeta>(
  exercise: T,
  params: { name: string; catalogId: string; localizedNote?: string },
): T {
  return {
    ...exercise,
    name: params.name,
    exerciseId: params.catalogId,
    noteSource: "catalog",
    noteCatalogId: params.catalogId,
    note: (params.localizedNote || "").trim(),
  };
}

export function applyManualNote<T extends ExerciseWithNoteMeta>(exercise: T, note: string): T {
  return {
    ...exercise,
    note,
    noteSource: "custom",
  };
}

export function getExerciseCatalogNoteId(exercise: ExerciseWithNoteMeta): string {
  if (!exercise) return "";
  return (exercise.noteCatalogId || exercise.exerciseId || "").trim();
}

export function resolveExerciseNote(
  exercise: ExerciseWithNoteMeta,
  language: "es" | "en" = "es",
): string {
  if (!exercise) return "";

  const source = exercise.noteSource || "custom";
  if (source === "catalog") {
    const catalogId = getExerciseCatalogNoteId(exercise);
    const catalogNote = getExerciseNoteByIdSync(catalogId, language);
    if (catalogNote) return catalogNote;
  }

  return (exercise.note || "").trim();
}

export async function ensureExerciseNoteCatalogLoaded(): Promise<void> {
  await loadNotesByExerciseIdMap();
}
