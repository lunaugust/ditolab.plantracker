import { useCallback, useEffect, useRef, useState } from "react";
import { loadWorkoutSessions, persistWorkoutSessions } from "../services/storageService";
import { SAVE_MSG_DURATION_MS } from "../theme";
import { useI18n } from "../i18n";
import type { WorkoutHistoryEntry } from "../services/types";

export function useWorkoutSessions(storageScope = "guest") {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<WorkoutHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  const sessionsRef = useRef<WorkoutHistoryEntry[]>([]);
  const saveMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    return () => {
      if (saveMsgTimerRef.current) clearTimeout(saveMsgTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const data = await loadWorkoutSessions(storageScope);
      if (!cancelled) {
        setSessions(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storageScope]);

  const persist = useCallback(async (nextSessions: WorkoutHistoryEntry[]) => {
    try {
      await persistWorkoutSessions(nextSessions, storageScope);
      setSaveMsg(t("history.saveSuccess"));
    } catch {
      setSaveMsg(t("history.saveError"));
    }

    if (saveMsgTimerRef.current) clearTimeout(saveMsgTimerRef.current);
    saveMsgTimerRef.current = setTimeout(() => setSaveMsg(""), SAVE_MSG_DURATION_MS);
  }, [storageScope, t]);

  const addSession = useCallback((session: WorkoutHistoryEntry) => {
    const nextSessions = [session, ...sessionsRef.current];
    setSessions(nextSessions);
    persist(nextSessions);
  }, [persist]);

  return { sessions, loading, saveMsg, addSession };
}