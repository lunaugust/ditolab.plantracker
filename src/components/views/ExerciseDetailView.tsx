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
import { useExerciseGif, useLocalizedExerciseName, useLocalizedExerciseNote, useSwipeBack } from "../../hooks";
import { formatDate, buildChartData, computeWeightStats } from "../../utils/helpers";
import { SectionLabel, StatCard, BackButton, PageContainer } from "../ui";
import type { Exercise, LogEntry, LogsByExercise, WorkoutSession } from "../../services/types";
import classes from "./ExerciseDetailView.module.css";

interface ExerciseDetailViewProps {
  exercise: Exercise;
  accentColor: string;
  logs: LogsByExercise;
  addLog: (exId: string, data: { weight: string; reps: string; notes: string }) => void;
  deleteLog: (exId: string, idx: number) => void;
  onBack: () => void;
  workoutSession?: WorkoutSession | null;
  onLogSet?: (data: { weight: string; reps: string; notes: string }) => void;
  onSkipRest?: () => void;
  onEndWorkoutSession?: () => void;
  designVariant: "session" | "logbook";
}

type FormState = { weight: string; reps: string; notes: string };
type TFunction = (key: string, params?: Record<string, string | number>) => string;

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
  designVariant,
}: ExerciseDetailViewProps) {
  const { t } = useI18n();
  const gifUrl = useExerciseGif(exercise.exerciseId, exercise.name);
  const localizedName = useLocalizedExerciseName(exercise.name);
  const localizedNote = useLocalizedExerciseNote(exercise);
  const [activeTab, setActiveTab] = useState("log");
  const [form, setForm] = useState<FormState>({ weight: "", reps: "", notes: "" });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const entries = logs[exercise.id] || [];
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  useSwipeBack(onBack, { enabled: true });

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

  const latestEntry = entries[entries.length - 1];
  const setTargetMatch = exercise.sets?.match(/(\d+)/);
  const targetSets = setTargetMatch ? Math.max(1, Number(setTargetMatch[1]) || 1) : 1;
  const setsLogged = workoutSession?.loggedSetsByExercise?.[exercise.id] || 0;
  const nextSetNumber = Math.min(targetSets, setsLogged + 1);
  const setProgressPct = Math.min(100, Math.floor((setsLogged / Math.max(1, targetSets)) * 100));

  return (
    <PageContainer>
      <div ref={containerRef} className={`${classes.shell} ${getToneClass(accentColor)} ${designVariant === "logbook" ? classes.logbookTone : classes.sessionTone}`}>
        <BackButton onClick={onBack} />

        {workoutSession && (
          <div className={classes.sessionCard}>
            <div className={classes.sessionMain}>
              <div className={classes.sessionLabel}>{t("session.activeTitle")}</div>
              <div className={classes.sessionValue}>{formatDuration(elapsedSeconds)}</div>
              <div className={classes.sessionMeta}>
                {t("session.exerciseProgress", {
                  current: workoutSession.currentExerciseIndex + 1,
                  total: workoutSession.totalExercises,
                })}
              </div>
            </div>
            <div className={classes.sessionStack}>
              <div className={classes.sessionPill}>
                {t("common.series")}: {nextSetNumber}/{targetSets}
              </div>
              <button onClick={onEndWorkoutSession} className={classes.ghostButton}>
                {t("session.endWorkout")}
              </button>
            </div>
          </div>
        )}

        {workoutSession && workoutSession.restSecondsLeft > 0 && (
          <div className={classes.restCard}>
            <div className={classes.restTitle}>{t("session.resting")}</div>
            <div className={classes.restTime}>{formatDuration(workoutSession.restSecondsLeft)}</div>
            <button onClick={onSkipRest} className={classes.warningButton}>
              {t("session.skipRest")}
            </button>
          </div>
        )}

        <div className={classes.headerCard}>
          <div className={classes.headerRow}>
            <div className={classes.headerTitle}>{localizedName}</div>
            <div className={classes.headerBadge}>{t("common.series")} {exercise.sets || "—"}</div>
          </div>
          <div className={classes.headerMeta}>
            {exercise.sets} {t("common.series")} · {exercise.reps} {t("common.reps")} · {exercise.rest}
          </div>
          <div className={classes.sessionMeter}>
            <div className={classes.sessionMeterTrack}>
              <div className={classes.sessionMeterFill} style={{ width: `${setProgressPct}%` }} />
            </div>
            <div className={classes.sessionMeterLabel}>
              {workoutSession ? `${t("common.series")}: ${setsLogged}/${targetSets}` : t("log.history")}
            </div>
          </div>
          <div className={classes.headerMeta}>
            {localizedNote && <span className={classes.headerNote}>⚠ {localizedNote}</span>}
          </div>
          {latestEntry && (
            <div className={classes.lastEntry}>
              <span className={classes.lastEntryLabel}>{t("log.history")}</span>
              <span className={classes.lastEntryValue}>
                {latestEntry.weight || "—"} kg · {latestEntry.reps || "—"} {t("common.reps")}
              </span>
            </div>
          )}
        </div>

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
              isResting={!!workoutSession && workoutSession.restSecondsLeft > 0}
              restSecondsLeft={workoutSession?.restSecondsLeft || 0}
              onSkipRest={onSkipRest}
              latestEntry={latestEntry}
              onUseLatest={() => {
                if (!latestEntry) return;
                setForm((current) => ({
                  ...current,
                  weight: latestEntry.weight || current.weight,
                  reps: latestEntry.reps || current.reps,
                }));
              }}
            />
          )}

          {activeTab === "progress" && <ProgressTab entries={entries} accentColor={accentColor} t={t} />}

          {activeTab === "gif" && <GifTab gifUrl={gifUrl} exerciseName={exercise.name} t={t} />}
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
  restSecondsLeft: number;
  onSkipRest?: () => void;
  latestEntry?: LogEntry;
  onUseLatest?: () => void;
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
  restSecondsLeft,
  onSkipRest,
  latestEntry,
  onUseLatest,
}: LogTabProps) {
  const repTargets = [8, 10, 15, 20];

  return (
    <>
      {latestEntry && (
        <div className={classes.quickLoad}>
          <div className={classes.quickLoadLabel}>Último set guardado</div>
          <div className={classes.quickLoadValue}>
            {latestEntry.weight || "—"} kg · {latestEntry.reps || "—"} {t("common.reps")}
          </div>
          <button type="button" onClick={onUseLatest} className={classes.quickLoadButton}>
            Rellenar campos
          </button>
        </div>
      )}

      <div className={classes.formCard}>
        <div className={classes.fieldSection}>
          <div className={classes.fieldLabel}>{t("log.weightLabel").toUpperCase()}</div>
          <div className={classes.weightControls}>
            <button type="button" onClick={() => adjustWeight(-2.5)} className={classes.adjustButton}>
              -2.5
            </button>
            <input
              value={form.weight}
              onChange={(e) => setForm((current) => ({ ...current, weight: e.target.value }))}
              placeholder="0"
              aria-label={t("log.weightLabel")}
              type="number"
              step="0.5"
              className={classes.numberInput}
            />
            <button type="button" onClick={() => adjustWeight(2.5)} className={classes.adjustButton}>
              +2.5
            </button>
          </div>
        </div>

        <div className={classes.fieldSection}>
          <div className={classes.fieldLabel}>{t("log.repsDoneLabel").toUpperCase()}</div>
          <div className={classes.weightControls}>
            <button type="button" onClick={() => adjustReps(-1)} className={classes.adjustButton}>
              -1
            </button>
            <input
              value={form.reps}
              onChange={(e) => setForm((current) => ({ ...current, reps: e.target.value }))}
              placeholder="0"
              aria-label={t("log.repsDoneLabel")}
              type="number"
              className={classes.numberInput}
            />
            <button type="button" onClick={() => adjustReps(1)} className={classes.adjustButton}>
              +1
            </button>
          </div>
          <div className={classes.chipRow}>
            {repTargets.map((rep) => (
              <button
                key={rep}
                type="button"
                onClick={() => setForm((current) => ({ ...current, reps: String(rep) }))}
                className={classes.chip}
              >
                {rep} {t("common.reps")}
              </button>
            ))}
          </div>
        </div>

        <div className={classes.fieldSection}>
          <div className={classes.fieldLabel}>{t("log.notesOptional")}</div>
          <input
            value={form.notes}
            onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
            placeholder={t("log.notesPlaceholder")}
            aria-label={t("log.notesOptional")}
            className={classes.textInput}
          />
        </div>

        <div className={classes.submitRow}>
          <button
            onClick={handleSubmit}
            disabled={inWorkoutSession && isResting}
            className={`${classes.submitButton}${inWorkoutSession && isResting ? ` ${classes.submitButtonDisabled}` : ""}`}
          >
            {t("log.saveRecord")}
          </button>
        </div>
      </div>

      <SectionLabel>{t("log.history")}</SectionLabel>

      {entries.length === 0 ? (
        <div className={classes.emptyState}>{t("log.noRecords")}</div>
      ) : (
        <div className={`${classes.historyList}${inWorkoutSession && isResting ? ` ${classes.historyListResting}` : ""}`}>
          {[...entries].reverse().map((entry, reverseIndex) => {
            const originalIndex = entries.length - 1 - reverseIndex;
            return (
              <div key={originalIndex} className={classes.historyEntry}>
                <div className={classes.historyDate}>{formatDate(entry.date)}</div>
                <div className={classes.historyContent}>
                  <span className={classes.historyWeight}>{entry.weight ? `${entry.weight} kg` : "—"}</span>
                  {entry.reps && <span className={classes.historyReps}>× {entry.reps} {t("common.reps")}</span>}
                  {entry.notes && <div className={classes.historyNotes}>{entry.notes}</div>}
                </div>
                <button
                  onClick={() => deleteLog(exerciseId, originalIndex)}
                  aria-label={t("log.deleteRecord")}
                  className={classes.deleteButton}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {inWorkoutSession && isResting && (
        <div aria-label={t("session.quickRestControlsLabel")} role="region" className={classes.quickRestBar}>
          <div role="status" aria-live="polite" className={classes.quickRestInfo}>
            <div className={classes.quickRestLabel}>{t("session.resting")}</div>
            <div className={classes.quickRestTime}>{formatDuration(restSecondsLeft)}</div>
          </div>
          <button
            onClick={onSkipRest}
            aria-label={t("session.skipRestAriaLabel", {
              action: t("session.skipRest"),
              status: t("session.resting"),
            })}
            className={classes.quickSkipButton}
          >
            {t("session.skipRest")}
          </button>
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
          <ResponsiveContainer width="100%" height={220}>
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
      return classes.orangeTone;
    case "#3ab8e8":
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
