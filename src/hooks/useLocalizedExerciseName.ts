import { useState, useEffect } from "react";
import { useI18n } from "../i18n";
import { loadNameEsMap, getNameEsMapSync } from "../data/exerciseCatalog";

/**
 * Returns the localized display name for an exercise.
 * - EN language: returns the original name as-is
 * - ES language: returns nameEs from the catalog, falling back to the original name
 */
export function useLocalizedExerciseName(name: string): string {
  const { language } = useI18n();
  const [, setLoaded] = useState(false);

  useEffect(() => {
    if (language === "es") {
      loadNameEsMap().then(() => setLoaded(true));
    }
  }, [language]);

  if (language !== "es" || !name) return name;

  const map = getNameEsMapSync();
  return map.get(name.toLowerCase()) || name;
}
