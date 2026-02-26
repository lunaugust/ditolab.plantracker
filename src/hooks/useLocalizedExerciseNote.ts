import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { ensureExerciseNoteCatalogLoaded, resolveExerciseNote, type ExerciseWithNoteMeta } from "../utils/exerciseNotes";

export function useLocalizedExerciseNote(exercise: ExerciseWithNoteMeta): string {
  const { language } = useI18n();
  const [, setLoaded] = useState(false);

  useEffect(() => {
    if (exercise?.noteSource === "catalog") {
      ensureExerciseNoteCatalogLoaded().then(() => setLoaded(true));
    }
  }, [exercise?.noteSource, exercise?.noteCatalogId]);

  return resolveExerciseNote(exercise, language);
}
