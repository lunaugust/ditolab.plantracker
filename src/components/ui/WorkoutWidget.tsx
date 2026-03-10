import { useState, useEffect } from "react";
import { useI18n } from "../../i18n";
import { useLocalizedExerciseName } from "../../hooks";
import classes from "./WorkoutWidget.module.css";

interface WorkoutWidgetProps {
  workoutSession: {
    startedAt: number;
    currentExerciseIndex: number;
    totalExercises: number;
    restSecondsLeft: number;
  };
  exercise: {
    id: string;
    name: string;
    sets?: string;
  };
  accentColor: string;
  lastLogEntry?: { weight?: string; reps?: string } | null;
  addLog: (exId: string, data: { weight: string; reps: string; notes: string }) => void;
  onLogSet: (data: { weight: string; reps: string; notes: string }) => void;
  onSkipRest: () => void;
  onEndSession: () => void;
  onNavigateToExercise?: () => void;
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * WorkoutWidget — a single floating panel that unifies session status,
 * rest countdown, and set logging into one always-visible overlay.
 *
 * Inspired by the Expo Widgets pattern: a compact, interactive card that
 * shows the most relevant workout state without requiring navigation.
 */
export function WorkoutWidget({
  workoutSession,
  exercise,
  accentColor,
  lastLogEntry,
  addLog,
  onLogSet,
  onSkipRest,
  onEndSession,
  onNavigateToExercise,
}: WorkoutWidgetProps) {
  const { t } = useI18n();
  const localizedName = useLocalizedExerciseName(exercise.name);

  const [isMinimized, setIsMinimized] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [form, setForm] = useState({ weight: "", reps: "" });

  const isResting = workoutSession.restSecondsLeft > 0;

  // Parse set target from exercise definition (e.g. "3 series" → 3)
  const setTargetMatch = exercise.sets?.match(/(\d+)/);
  const targetSets = setTargetMatch ? Math.max(1, Number(setTargetMatch[1]) || 1) : 1;

  // Initialise form with the last logged entry for this exercise
  useEffect(() => {
    setForm({
      weight: lastLogEntry?.weight ?? "",
      reps: lastLogEntry?.reps ?? "",
    });
  }, [exercise.id, lastLogEntry?.weight, lastLogEntry?.reps]);

  // Elapsed session timer
  useEffect(() => {
    const update = () =>
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - workoutSession.startedAt) / 1000)));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [workoutSession.startedAt]);

  // Auto-expand when rest starts so the countdown is always visible
  useEffect(() => {
    if (isResting) setIsMinimized(false);
  }, [isResting]);

  const handleLogSubmit = () => {
    if (!form.weight.trim() && !form.reps.trim()) return;
    const entry = { weight: form.weight, reps: form.reps, notes: "" };
    addLog(exercise.id, entry);
    onLogSet(entry);
  };

  const adjustWeight = (delta: number) => {
    const current = Number(form.weight);
    const safe = Number.isFinite(current) ? current : 0;
    setForm((prev) => ({ ...prev, weight: String(Math.max(0, safe + delta)) }));
  };

  const adjustReps = (delta: number) => {
    const current = Number(form.reps);
    const safe = Number.isFinite(current) ? current : 0;
    setForm((prev) => ({ ...prev, reps: String(Math.max(0, safe + delta)) }));
  };

  const accentStyle = { "--widget-accent": accentColor } as React.CSSProperties;

  /* ── Collapsed / minimised pill ── */
  if (isMinimized) {
    return (
      <div className={classes.minimized} style={accentStyle}>
        <button
          className={classes.pill}
          onClick={() => setIsMinimized(false)}
          aria-label={t("widget.expand")}
        >
          <span className={classes.pillName}>{localizedName}</span>
          {isResting ? (
            <span className={classes.pillRest}>{formatDuration(workoutSession.restSecondsLeft)}</span>
          ) : (
            <span className={classes.pillReady}>{t("widget.readyToLog")}</span>
          )}
          <span className={classes.pillChevron} aria-hidden>▲</span>
        </button>
      </div>
    );
  }

  /* ── Expanded widget ── */
  return (
    <div className={classes.widget} style={accentStyle} role="region" aria-label={t("widget.ariaLabel")}>

      {/* ── Widget header: name + progress + timer + controls ── */}
      <div className={classes.header}>
        <div className={classes.headerMain}>
          <button
            className={classes.exerciseNameBtn}
            onClick={onNavigateToExercise}
            disabled={!onNavigateToExercise}
            aria-label={t("widget.goToExercise")}
          >
            {localizedName}
          </button>
          <div className={classes.progressRow}>
            <span className={classes.exerciseCount}>
              {t("session.exerciseProgress", {
                current: workoutSession.currentExerciseIndex + 1,
                total: workoutSession.totalExercises,
              })}
            </span>
            <span className={classes.elapsedTime}>{formatDuration(elapsedSeconds)}</span>
          </div>
        </div>
        <div className={classes.headerActions}>
          <button
            onClick={() => setIsMinimized(true)}
            className={classes.minimizeBtn}
            aria-label={t("widget.minimize")}
          >
            ▼
          </button>
          <button
            onClick={onEndSession}
            className={classes.endBtn}
          >
            {t("session.endWorkout")}
          </button>
        </div>
      </div>

      {/* ── Widget body: resting state ── */}
      {isResting ? (
        <div className={classes.restBody} aria-live="polite">
          <div className={classes.restLabel}>{t("session.resting")}</div>
          <div className={classes.restTimer}>{formatDuration(workoutSession.restSecondsLeft)}</div>
          <div className={classes.restHint}>{t("widget.restingHint", { sets: String(targetSets) })}</div>
          <button onClick={onSkipRest} className={classes.skipBtn}>
            {t("session.skipRest")}
          </button>
        </div>
      ) : (
        /* ── Widget body: logging state ── */
        <div className={classes.logBody}>
          <div className={classes.logRow}>
            {/* Weight stepper */}
            <div className={classes.fieldGroup}>
              <div className={classes.fieldLabel}>{t("log.weightLabel")}</div>
              <div className={classes.stepper}>
                <button
                  type="button"
                  onClick={() => adjustWeight(-2.5)}
                  className={classes.stepBtn}
                  aria-label="-2.5 kg"
                >
                  −2.5
                </button>
                <input
                  value={form.weight}
                  onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
                  placeholder="0"
                  type="number"
                  step="0.5"
                  inputMode="decimal"
                  aria-label={t("log.weightLabel")}
                  className={classes.numInput}
                />
                <button
                  type="button"
                  onClick={() => adjustWeight(2.5)}
                  className={classes.stepBtn}
                  aria-label="+2.5 kg"
                >
                  +2.5
                </button>
              </div>
            </div>

            {/* Reps stepper */}
            <div className={classes.fieldGroup}>
              <div className={classes.fieldLabel}>{t("log.repsDoneLabel")}</div>
              <div className={classes.stepper}>
                <button
                  type="button"
                  onClick={() => adjustReps(-1)}
                  className={classes.stepBtn}
                  aria-label="-1 rep"
                >
                  −1
                </button>
                <input
                  value={form.reps}
                  onChange={(e) => setForm((prev) => ({ ...prev, reps: e.target.value }))}
                  placeholder="0"
                  type="number"
                  inputMode="numeric"
                  aria-label={t("log.repsDoneLabel")}
                  className={classes.numInput}
                />
                <button
                  type="button"
                  onClick={() => adjustReps(1)}
                  className={classes.stepBtn}
                  aria-label="+1 rep"
                >
                  +1
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogSubmit}
            className={classes.logBtn}
            disabled={!form.weight.trim() && !form.reps.trim()}
          >
            {t("log.saveRecord")}
          </button>
        </div>
      )}
    </div>
  );
}
