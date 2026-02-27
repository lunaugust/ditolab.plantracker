import { useState, useEffect, useCallback, useRef } from "react";
import { loadLogs, persistLogs } from "../services/storageService";
import { SAVE_MSG_DURATION_MS } from "../theme";
import { useI18n } from "../i18n";
import type { LogEntry } from "../services/types";

export function useTrainingLogs(storageScope = "guest") {
  const { t } = useI18n();
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  const saveMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- Keep a ref in sync so mutations always read the latest state ---- */
  const logsRef = useRef<Record<string, LogEntry[]>>({});
  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

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

  /* ---- Persist helper — does NOT call setLogs (caller already did) ---- */
  const persist = useCallback(async (nextLogs: Record<string, LogEntry[]>) => {
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
    (exerciseId: string, { weight, reps, notes }: { weight: string; reps: string; notes: string }) => {
      if (!weight && !reps) return;
      const entry: LogEntry = { date: new Date().toISOString(), weight, reps, notes };
      const nextLogs = {
        ...logsRef.current,
        [exerciseId]: [...(logsRef.current[exerciseId] || []), entry],
      };
      setLogs(nextLogs);
      persist(nextLogs);
    },
    [persist],
  );

  const deleteLog = useCallback(
    (exerciseId: string, index: number) => {
      const arr = [...(logsRef.current[exerciseId] || [])];
      arr.splice(index, 1);
      const nextLogs = { ...logsRef.current, [exerciseId]: arr };
      setLogs(nextLogs);
      persist(nextLogs);
    },
    [persist],
  );

  return { logs, loading, saveMsg, addLog, deleteLog };
}
