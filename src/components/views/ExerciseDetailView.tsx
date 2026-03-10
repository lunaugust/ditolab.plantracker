import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { colors } from "../../theme";
import { useI18n } from "../../i18n";
import { useExerciseGif, useLocalizedExerciseName, useLocalizedExerciseNote } from "../../hooks";
import { formatDate, buildChartData, computeWeightStats } from "../../utils/helpers";
import { StatCard, PageContainer } from "../ui";
import type { Exercise, LogEntry, LogsByExercise } from "../../services/types";
import classes from "./ExerciseDetailView.module.css";

interface ExerciseDetailViewProps {
  exercise: Exercise;
  accentColor: string;
  logs: LogsByExercise;
  addLog: (exId: string, data: { weight: string; reps: string; notes: string }) => void;
  deleteLog: (exId: string, idx: number) => void;
  onBack: () => void;
  workoutSession?: {
    startedAt: number;
    currentExerciseIndex: number;
    totalExercises: number;
    restSecondsLeft: number;
  } | null;
  onLogSet?: (data: { weight: string; reps: string; notes: string }) => void;
  onSkipRest?: () => void;
  onEndWorkoutSession?: () => void;
}

type FormState = { weight: string; reps: string; notes: string };
type TFunction = (key: string, params?: Record<string, string | number>) => string;

// Swipe-back detection constants
const SWIPE_THRESHOLD = 80;
const EDGE_ZONE = 44;

export function ExerciseDetailView({
  exercise,
  accentColor,
  logs,
  addLog,
  deleteLog,
  onBack,
  workoutSession = null,
  onLogSet,
  onSkipRest,
  onEndWorkoutSession,
}: ExerciseDetailViewProps) {
  const { t } = useI18n();
  const gifUrl = useExerciseGif(exercise.exerciseId, exercise.name);
  const localizedName = useLocalizedExerciseName(exercise.name);
  const localizedNote = useLocalizedExerciseNote(exercise);
  const [activeTab, setActiveTab] = useState("log");
  const [form, setForm] = useState<FormState>({ weight: "", reps: "", notes: "" });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const entries = logs[exercise.id] || [];
  const isResting = !!workoutSession && workoutSession.restSecondsLeft > 0;

  useEffect(() => {
    const latest = entries[entries.length - 1];
    setForm({
      weight: latest?.weight ?? "",
      reps: latest?.reps ?? "",
      notes: "",
    });
  }, [exercise.id]);

  useEffect(() => {
    if (!workoutSession) {
      setElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - workoutSession.startedAt) / 1000)));
    };

    updateElapsed();
    const timerId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timerId);
  }, [workoutSession?.startedAt]);

  const handleSubmit = () => {
    if (!form.weight.trim() && !form.reps.trim()) return;
    addLog(exercise.id, form);
    onLogSet?.(form);
    setForm((prev) => ({ weight: prev.weight, reps: prev.reps, notes: "" }));
  };

  const adjustWeight = (delta: number) => {
    const current = Number(form.weight);
    const safeCurrent = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, safeCurrent + delta);
    setForm((prev) => ({ ...prev, weight: String(next) }));
  };

  const adjustReps = (delta: number) => {
    const current = Number(form.reps);
    const safeCurrent = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, safeCurrent + delta);
    setForm((prev) => ({ ...prev, reps: String(next) }));
  };

  // Swipe-back gesture: initiated from left edge (≤44px), triggers when distance ≥ 80px
  const handleTouchStart = (e: React.TouchEvent) => {
    const x = e.touches[0].clientX;
    touchStartX.current = x <= EDGE_ZONE ? x : null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    if (e.changedTouches[0].clientX - touchStartX.current >= SWIPE_THRESHOLD) {
      onBack();
    }
    touchStartX.current = null;
  };

  const toneClass = getToneClass(accentColor);

  // Determine current set info from today's logs
  const setTargetMatch = exercise.sets?.match(/(\d+)/);
  const targetSets = setTargetMatch ? Math.max(1, Number(setTargetMatch[1]) || 1) : 1;
  const today = new Date().toDateString();
  const loggedSetsToday = entries.filter((e) => new Date(e.date).toDateString() === today).length;
  const currentSetDisplay = Math.min(loggedSetsToday + 1, targetSets);

  return (
    <PageContainer>
      <div
        className={`${classes.shell} ${toneClass}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Header: back + exercise info ── */}
        <div className={classes.headerRow}>
          <button
            onClick={onBack}
            aria-label={t("common.back")}
            className={classes.backBtn}
          >
            {t("common.back")}
          </button>
          <div className={classes.headerCenter}>
            <div className={classes.exerciseName}>{localizedName}</div>
            <div className={classes.exerciseMeta}>
              {exercise.sets} {t("common.series")} · {exercise.reps} {t("common.reps")} · {exercise.rest}
            </div>
          </div>
        </div>

        {localizedNote && (
          <div className={classes.noteBar}>⚠ {localizedNote}</div>
        )}

        {/* ── Workout session bar ── */}
        {workoutSession && (
          <div className={classes.sessionCard}>
            <div className={classes.sessionMain}>
              <div className={classes.sessionLabel}>{t("session.activeTitle")}</div>
              <div className={classes.sessionSetRow}>
                <span className={classes.sessionSetBadge}>
                  {t("session.setOf", { current: currentSetDisplay, total: targetSets })}
                </span>
                <span className={classes.sessionTimer}>{formatDuration(elapsedSeconds)}</span>
              </div>
              <div className={classes.sessionMeta}>
                {t("session.exerciseProgress", {
                  current: workoutSession.currentExerciseIndex + 1,
                  total: workoutSession.totalExercises,
                })}
              </div>
            </div>
            <button onClick={onEndWorkoutSession} className={classes.endBtn}>
              {t("session.endWorkout")}
            </button>
          </div>
        )}

        {/* ── Rest card (shown when resting) ── */}
        {isResting && (
          <div
            aria-label={t("session.quickRestControlsLabel")}
            role="region"
            className={classes.restCard}
            aria-live="polite"
          >
            <div className={classes.restLabel}>{t("session.resting")}</div>
            <div className={classes.restTime}>{formatDuration(workoutSession!.restSecondsLeft)}</div>
            <div className={classes.restSubLabel}>
              {t("session.nextSet", { set: currentSetDisplay, total: targetSets })}
            </div>
            <button onClick={onSkipRest} className={classes.skipRestBtn}>
              {t("session.skipRest")}
            </button>
          </div>
        )}

        {/* ── Compact tab strip ── */}
        <div className={classes.tabs}>
          {[
            { key: "log", label: t("nav.log") },
            { key: "progress", label: t("nav.progress") },
            { key: "gif", label: t("nav.gif") },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`${classes.tab}${activeTab === key ? ` ${classes.tabActive}` : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className={classes.contentSection}>
          {activeTab === "log" && (
            <LogTab
              form={form}
              setForm={setForm}
              handleSubmit={handleSubmit}
              adjustWeight={adjustWeight}
              adjustReps={adjustReps}
              entries={entries}
              deleteLog={deleteLog}
              exerciseId={exercise.id}
              t={t}
              inWorkoutSession={!!workoutSession}
              isResting={isResting}
            />
          )}

          {activeTab === "progress" && (
            <ProgressTab entries={entries} accentColor={accentColor} t={t} />
          )}

          {activeTab === "gif" && (
            <GifTab gifUrl={gifUrl} exerciseName={exercise.name} t={t} />
          )}
        </div>
      </div>
    </PageContainer>
  );
}

interface LogTabProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  handleSubmit: () => void;
  adjustWeight: (delta: number) => void;
  adjustReps: (delta: number) => void;
  entries: LogEntry[];
  deleteLog: (exId: string, idx: number) => void;
  exerciseId: string;
  t: TFunction;
  inWorkoutSession: boolean;
  isResting: boolean;
}

function LogTab({
  form,
  setForm,
  handleSubmit,
  adjustWeight,
  adjustReps,
  entries,
  deleteLog,
  exerciseId,
  t,
  inWorkoutSession,
  isResting,
}: LogTabProps) {
  const repTargets = [8, 10, 12, 15, 20];

  return (
    <>
      <div className={`${classes.logCard}${isResting ? ` ${classes.logCardResting}` : ""}`}>
        {/* Weight */}
        <div className={classes.inputGroup}>
          <div className={classes.inputLabel}>{t("log.weightLabel")}</div>
          <div className={classes.stepper}>
            <button
              type="button"
              onClick={() => adjustWeight(-2.5)}
              className={classes.stepBtn}
            >
              -2.5
            </button>
            <input
              value={form.weight}
              onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
              placeholder="0"
              aria-label={t("log.weightLabel")}
              type="number"
              step="0.5"
              inputMode="decimal"
              className={classes.bigInput}
            />
            <button
              type="button"
              onClick={() => adjustWeight(2.5)}
              className={classes.stepBtn}
            >
              +2.5
            </button>
          </div>
        </div>

        {/* Reps */}
        <div className={classes.inputGroup}>
          <div className={classes.inputLabel}>{t("log.repsDoneLabel")}</div>
          <div className={classes.stepper}>
            <button
              type="button"
              onClick={() => adjustReps(-1)}
              className={classes.stepBtn}
            >
              -1
            </button>
            <input
              value={form.reps}
              onChange={(e) => setForm((prev) => ({ ...prev, reps: e.target.value }))}
              placeholder="0"
              aria-label={t("log.repsDoneLabel")}
              type="number"
              inputMode="numeric"
              className={classes.bigInput}
            />
            <button
              type="button"
              onClick={() => adjustReps(1)}
              className={classes.stepBtn}
            >
              +1
            </button>
          </div>
          <div className={classes.repChips}>
            {repTargets.map((rep) => (
              <button
                key={rep}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, reps: String(rep) }))}
                className={`${classes.repChip}${form.reps === String(rep) ? ` ${classes.repChipActive}` : ""}`}
              >
                {rep} {t("common.reps")}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className={classes.inputGroup}>
          <div className={classes.inputLabel}>{t("log.notesOptional")}</div>
          <input
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder={t("log.notesPlaceholder")}
            aria-label={t("log.notesOptional")}
            className={classes.notesInput}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={inWorkoutSession && isResting}
          className={`${classes.logBtn}${inWorkoutSession && isResting ? ` ${classes.logBtnDisabled}` : ""}`}
        >
          {t("log.saveRecord")}
        </button>
      </div>

      {/* History */}
      <div className={classes.historyLabel}>{t("log.history")}</div>
      {entries.length === 0 ? (
        <div className={classes.emptyHistory}>{t("log.noRecords")}</div>
      ) : (
        <div className={classes.historySection}>
          {[...entries].reverse().map((entry, reverseIndex) => {
            const originalIndex = entries.length - 1 - reverseIndex;
            return (
              <div key={originalIndex} className={classes.historyRow}>
                <div className={classes.historyDate}>{formatDate(entry.date)}</div>
                <div className={classes.historyMain}>
                  <span className={classes.historyWeight}>
                    {entry.weight ? `${entry.weight} kg` : "—"}
                  </span>
                  {entry.reps && (
                    <span className={classes.historyReps}>
                      × {entry.reps} {t("common.reps")}
                    </span>
                  )}
                  {entry.notes && (
                    <div className={classes.historyNotes}>{entry.notes}</div>
                  )}
                </div>
                <button
                  onClick={() => deleteLog(exerciseId, originalIndex)}
                  aria-label={t("log.deleteRecord")}
                  className={classes.deleteBtn}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function ProgressTab({ entries, accentColor, t }: { entries: LogEntry[]; accentColor: string; t: TFunction }) {
  const chartData = buildChartData(entries).filter((entry) => entry.peso > 0);
  const stats = computeWeightStats(entries);

  return (
    <>
      {chartData.length < 2 ? (
        <div className={classes.noDataCard}>
          <div className={classes.noDataText}>{t("progress.needTwoLogs")}</div>
        </div>
      ) : (
        <div className={classes.chartCard}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fontFamily: "DM Mono", fontSize: 10, fill: colors.textDim }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: "DM Mono", fontSize: 10, fill: colors.textDim }}
                axisLine={false}
                tickLine={false}
                unit=" kg"
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="peso"
                stroke={accentColor}
                strokeWidth={2}
                dot={{ fill: accentColor, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {stats && (
        <div className={classes.statsGrid}>
          <StatCard label={t("progress.current")} value={`${stats.current} kg`} color={accentColor} />
          <StatCard label={t("progress.max")} value={`${stats.max} kg`} color={colors.textPrimary} />
          <StatCard label={t("progress.min")} value={`${stats.min} kg`} color={colors.textMuted} />
        </div>
      )}
    </>
  );
}

function GifTab({ gifUrl, exerciseName, t }: { gifUrl?: string | null; exerciseName: string; t: TFunction }) {
  if (!gifUrl) {
    return (
      <div className={classes.noDataCard}>
        <div className={classes.noDataText}>{t("common.noData")}</div>
      </div>
    );
  }

  return (
    <div className={classes.gifCard}>
      <div className={classes.gifLabel}>{t("common.demonstration")}</div>
      <img src={gifUrl} alt={exerciseName} className={classes.gifImage} />
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className={classes.tooltipCard}>
      <div className={classes.tooltipLabel}>{label}</div>
      <div className={classes.tooltipValue}>{payload[0]?.value} kg</div>
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getToneClass(color?: string) {
  switch ((color || "").toLowerCase()) {
    case "#e8643a":
    case "#ff6b35":
      return classes.orangeTone;
    case "#3ab8e8":
    case "#40c8f4":
      return classes.blueTone;
    case "#7de83a":
      return classes.greenTone;
    case "#e8c93a":
      return classes.yellowTone;
    case "#c83ae8":
      return classes.violetTone;
    case "#e83a7d":
      return classes.pinkTone;
    default:
      return classes.defaultTone;
  }
}
