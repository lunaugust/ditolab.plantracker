import { useState, useEffect, useCallback } from "react";
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
      setTimeout(() => setSaveMsg(""), SAVE_MSG_DURATION_MS);
    } catch {
      setSaveMsg(t("log.saveError"));
      setTimeout(() => setSaveMsg(""), SAVE_MSG_DURATION_MS);
    }
  }, [storageScope, t]);

  /* ---- Public mutations ---- */
  const addLog = useCallback(
    (exerciseId, { weight, reps, notes }) => {
      if (!weight && !reps) return;
      const entry = { date: new Date().toISOString(), weight, reps, notes };
      const nextLogs = {
        ...logs,
        [exerciseId]: [...(logs[exerciseId] || []), entry],
      };
      persist(nextLogs);
    },
    [logs, persist],
  );

  const deleteLog = useCallback(
    (exerciseId, index) => {
      const arr = [...(logs[exerciseId] || [])];
      arr.splice(index, 1);
      persist({ ...logs, [exerciseId]: arr });
    },
    [logs, persist],
  );

  return { logs, loading, saveMsg, addLog, deleteLog };
}
