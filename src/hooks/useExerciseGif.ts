import { useState, useEffect } from "react";
import { getGifUrlById, getGifUrlByName } from "../data/exerciseCatalog";

export function useExerciseGif(exerciseId?: string, exerciseName?: string) {
  const [gifUrl, setGifUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const lookup = exerciseId
      ? getGifUrlById(exerciseId)
      : exerciseName
        ? getGifUrlByName(exerciseName)
        : Promise.resolve(null);

    lookup.then((url) => {
      if (!cancelled) setGifUrl(url);
    });

    return () => { cancelled = true; };
  }, [exerciseId, exerciseName]);

  return gifUrl;
}
