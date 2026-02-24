import { useState, useEffect, useCallback, useRef } from "react";
import { loadLogs, persistLogs } from "../services/storageService";
import { SAVE_MSG_DURATION_MS } from "../theme";
import { useI18n } from "../i18n";

/**
 * Encapsulates all training-log state, persistence, and mutations.
 *
 * @returns {{
 *   logs: Record<string, import("../services/types").LogEntry[]>,
 *   loading: boolean,
 *   saveMsg: string,
 *   addLog: (exerciseId: string, entry: Omit<import("../services/types").LogEntry, "date">) => void,
 *   deleteLog: (exerciseId: string, index: number) => void,
 * }}
 */
export function useTrainingLogs(storageScope = "guest") {
  const { t } = useI18n();
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  const saveMsgTimerRef = useRef(null);

  /* ---- Clean up pending save-message timer on unmount ---- */
  useEffect(() => {
    return () => {
      if (saveMsgTimerRef.current) clearTimeout(saveMsgTimerRef.current);
    };
  }, []);

  /* ---- Bootstrap ---- */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const data = await loadLogs(storageScope);
      if (!cancelled) {
        setLogs(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [storageScope]);

  /* ---- Persist helper ---- */
  const persist = useCallback(async (nextLogs) => {
    setLogs(nextLogs);
    try {
      await persistLogs(nextLogs, storageScope);
      setSaveMsg(t("log.saveSuccess"));
    } catch {
      setSaveMsg(t("log.saveError"));
    }
    if (saveMsgTimerRef.current) clearTimeout(saveMsgTimerRef.current);
    saveMsgTimerRef.current = setTimeout(() => setSaveMsg(""), SAVE_MSG_DURATION_MS);
  }, [storageScope, t]);

  /* ---- Public mutations ---- */
  const addLog = useCallback(
    (exerciseId, { weight, reps, notes }) => {
      if (!weight && !reps) return;
      const entry = { date: new Date().toISOString(), weight, reps, notes };
      setLogs((prev) => {
        const nextLogs = {
          ...prev,
          [exerciseId]: [...(prev[exerciseId] || []), entry],
        };
        persist(nextLogs);
        return nextLogs;
      });
    },
    [persist],
  );

  const deleteLog = useCallback(
    (exerciseId, index) => {
      setLogs((prev) => {
        const arr = [...(prev[exerciseId] || [])];
        arr.splice(index, 1);
        const nextLogs = { ...prev, [exerciseId]: arr };
        persist(nextLogs);
        return nextLogs;
      });
    },
    [persist],
  );

  return { logs, loading, saveMsg, addLog, deleteLog };
}
