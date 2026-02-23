import { useState, useEffect, useCallback } from "react";
import { loadLogs, persistLogs } from "../services/storageService";
import { SAVE_MSG_DURATION_MS } from "../theme";

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
export function useTrainingLogs() {
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");

  /* ---- Bootstrap ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadLogs();
      if (!cancelled) {
        setLogs(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ---- Persist helper ---- */
  const persist = useCallback(async (nextLogs) => {
    setLogs(nextLogs);
    try {
      await persistLogs(nextLogs);
      setSaveMsg("✓ Guardado");
      setTimeout(() => setSaveMsg(""), SAVE_MSG_DURATION_MS);
    } catch {
      setSaveMsg("✗ Error al guardar");
      setTimeout(() => setSaveMsg(""), SAVE_MSG_DURATION_MS);
    }
  }, []);

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
