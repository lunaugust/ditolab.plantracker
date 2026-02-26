import { useState, useEffect } from "react";
import { getGifUrlByName } from "../data/exerciseCatalog";

export function useExerciseGif(exerciseName: string) {
  const [gifUrl, setGifUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGifUrlByName(exerciseName).then((url) => {
      if (!cancelled) setGifUrl(url);
    });
    return () => { cancelled = true; };
  }, [exerciseName]);

  return gifUrl;
}
