import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { colors, fonts } from "../../theme";
import { performanceGhostButtonStyle, performancePanelStyle, performancePillStyle } from "../../theme/editorialPerformance";
import { useI18n } from "../../i18n";
import { useExerciseGif, useLocalizedExerciseName, useLocalizedExerciseNote } from "../../hooks";
import { formatDate, buildChartData, computeWeightStats } from "../../utils/helpers";
import { SectionLabel, StatCard, BackButton, PageContainer } from "../ui";
import type { Exercise, LogEntry, LogsByExercise } from "../../services/types";
import type { CSSProperties } from "react";

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
  const [form, setForm] = useState({ weight: "", reps: "", notes: "" });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const entries = logs[exercise.id] || [];

  // Initialize form with last log values when exercise changes
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

  return (
    <PageContainer>
      <BackButton onClick={onBack} />

      {workoutSession && (
        <div style={{ ...sessionStyles.card, ...performancePanelStyle(accentColor) }}>
          <div>
            <div style={sessionStyles.label}>{t("session.activeTitle")}</div>
            <div style={{ ...sessionStyles.value, color: accentColor }}>
              {formatDuration(elapsedSeconds)}
            </div>
            <div style={sessionStyles.meta}>
              {t("session.exerciseProgress", {
                current: workoutSession.currentExerciseIndex + 1,
                total: workoutSession.totalExercises,
              })}
            </div>
          </div>
          <button onClick={onEndWorkoutSession} style={{ ...sessionStyles.endButton, ...performanceGhostButtonStyle(colors.textSecondary) }}>
            {t("session.endWorkout")}
          </button>
        </div>
      )}

      {workoutSession && workoutSession.restSecondsLeft > 0 && (
        <div style={{ ...sessionStyles.restCard, ...performancePanelStyle(colors.warning) }}>
          <div style={sessionStyles.restTitle}>{t("session.resting")}</div>
          <div style={sessionStyles.restTime}>{formatDuration(workoutSession.restSecondsLeft)}</div>
          <button onClick={onSkipRest} style={{ ...sessionStyles.skipButton, ...performanceGhostButtonStyle(colors.warning) }}>
            {t("session.skipRest")}
          </button>
        </div>
      )}

      {/* Exercise header */}
      <div style={{ ...headerStyles.card, ...performancePanelStyle(accentColor) }}>
        <div style={headerStyles.title}>
          {localizedName}
        </div>
        <div style={headerStyles.meta}>
          {exercise.sets} {t("common.series")} · {exercise.reps} {t("common.reps")} · {exercise.rest}
        </div>
        {localizedNote && (
          <div style={headerStyles.note}>
            ⚠ {localizedNote}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: "log", label: t("nav.log") },
          { key: "progress", label: t("nav.progress") },
          { key: "gif", label: t("nav.gif") },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              ...styles.tab,
              ...performancePillStyle(activeTab === key, accentColor),
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ marginTop: 20 }}>
        {activeTab === "log" && (
          <LogTab
            exercise={exercise}
            form={form}
            setForm={setForm}
            handleSubmit={handleSubmit}
            adjustWeight={adjustWeight}
            adjustReps={adjustReps}
            entries={entries}
            deleteLog={deleteLog}
            exerciseId={exercise.id}
            accentColor={accentColor}
            t={t}
            inWorkoutSession={!!workoutSession}
            isResting={!!workoutSession && workoutSession.restSecondsLeft > 0}
            restSecondsLeft={workoutSession?.restSecondsLeft || 0}
            onSkipRest={onSkipRest}
          />
        )}

        {activeTab === "progress" && (
          <ProgressTab
            entries={entries}
            accentColor={accentColor}
            t={t}
          />
        )}

        {activeTab === "gif" && (
          <GifTab gifUrl={gifUrl} exerciseName={exercise.name} t={t} />
        )}
      </div>
    </PageContainer>
  );
}

/** Log tab content */
type FormState = { weight: string; reps: string; notes: string };
type TFunction = (key: string, params?: Record<string, string | number>) => string;

interface LogTabProps {
  exercise: Exercise;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  handleSubmit: () => void;
  adjustWeight: (delta: number) => void;
  adjustReps: (delta: number) => void;
  entries: LogEntry[];
  deleteLog: (exId: string, idx: number) => void;
  exerciseId: string;
  accentColor: string;
  t: TFunction;
  inWorkoutSession: boolean;
  isResting: boolean;
  restSecondsLeft: number;
  onSkipRest?: () => void;
}

function LogTab({
  exercise,
  form,
  setForm,
  handleSubmit,
  adjustWeight,
  adjustReps,
  entries,
  deleteLog,
  exerciseId,
  accentColor,
  t,
  inWorkoutSession,
  isResting,
  restSecondsLeft,
  onSkipRest,
}: LogTabProps) {
  const repTargets = [8, 10, 15, 20];

  return (
    <>
      {/* Form */}
      <div style={formStyles.card}>
        {/* Weight row — full width */}
        <div style={{ marginBottom: 14 }}>
          <div style={formStyles.fieldLabel}>{t("log.weightLabel").toUpperCase()}</div>
          <div style={formStyles.weightControls}>
            <button type="button" onClick={() => adjustWeight(-2.5)} style={formStyles.adjustBtn}>
              -2.5
            </button>
            <input
              value={form.weight}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              placeholder="0"
              type="number"
              step="0.5"
              style={formStyles.numberInput}
            />
            <button type="button" onClick={() => adjustWeight(2.5)} style={formStyles.adjustBtn}>
              +2.5
            </button>
          </div>
        </div>

        {/* Reps row */}
        <div style={{ marginBottom: 14 }}>
          <div style={formStyles.fieldLabel}>{t("log.repsDoneLabel").toUpperCase()}</div>
          <div style={formStyles.weightControls}>
            <button type="button" onClick={() => adjustReps(-1)} style={formStyles.adjustBtn}>
              -1
            </button>
            <input
              value={form.reps}
              onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
              placeholder="0"
              type="number"
              style={formStyles.numberInput}
            />
            <button type="button" onClick={() => adjustReps(1)} style={formStyles.adjustBtn}>
              +1
            </button>
          </div>
          {repTargets.length > 0 && (
            <div style={formStyles.chipRow}>
              {repTargets.map((rep) => (
                <button
                  key={rep}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, reps: String(rep) }))}
                  style={formStyles.chip}
                >
                  {rep} {t("common.reps")}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={formStyles.fieldLabel}>{t("log.notesOptional")}</div>
          <input
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder={t("log.notesPlaceholder")}
            style={formStyles.textInput}
          />
        </div>

        <div style={formStyles.submitRow}>
          <button
            onClick={handleSubmit}
            disabled={inWorkoutSession && isResting}
            style={{
              ...formStyles.submit,
              background: inWorkoutSession && isResting ? colors.textDisabled : accentColor,
              width: "100%",
            }}
          >
            {t("log.saveRecord")}
          </button>
        </div>
      </div>

      {/* History */}
      <SectionLabel>{t("log.history")}</SectionLabel>

      {entries.length === 0 ? (
        <div style={historyStyles.emptyState}>{t("log.noRecords")}</div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginTop: 12,
            marginBottom: inWorkoutSession && isResting ? 72 : 0,
          }}
        >
          {[...entries].reverse().map((entry, ri) => {
            const originalIdx = entries.length - 1 - ri;
            return (
              <div key={originalIdx} style={historyStyles.logEntry}>
                <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, minWidth: 40 }}>
                  {formatDate(entry.date)}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: fonts.mono, fontSize: 14, color: accentColor, fontWeight: 600 }}>
                    {entry.weight ? `${entry.weight} kg` : "—"}
                  </span>
                  {entry.reps && (
                    <span style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted, marginLeft: 10 }}>
                      × {entry.reps} {t("common.reps")}
                    </span>
                  )}
                  {entry.notes && (
                    <div style={{ fontSize: 11, color: colors.textDim, marginTop: 3 }}>{entry.notes}</div>
                  )}
                </div>
                <button
                  onClick={() => deleteLog(exerciseId, originalIdx)}
                  aria-label={t("log.deleteRecord")}
                  style={historyStyles.deleteBtn}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {inWorkoutSession && isResting && (
        <div
          aria-label={t("session.quickRestControlsLabel")}
          role="region"
          style={sessionStyles.quickRestBar}
        >
          <div role="status" aria-live="polite" style={sessionStyles.quickRestInfo}>
            <div style={sessionStyles.quickRestLabel}>{t("session.resting")}</div>
            <div style={sessionStyles.quickRestTime}>{formatDuration(restSecondsLeft)}</div>
          </div>
          <button
            onClick={onSkipRest}
            aria-label={t("session.skipRestAriaLabel", { action: t("session.skipRest"), status: t("session.resting") })}
            style={sessionStyles.quickSkipButton}
          >
            {t("session.skipRest")}
          </button>
        </div>
      )}
    </>
  );
}

/** Progress tab content */
function ProgressTab({ entries, accentColor, t }: { entries: LogEntry[]; accentColor: string; t: TFunction }) {
  const chartData = buildChartData(entries).filter((d) => d.peso > 0);
  const stats = computeWeightStats(entries);

  return (
    <>
      {/* Chart */}
      {chartData.length < 2 ? (
        <div style={progressStyles.noDataCard}>
          <div style={progressStyles.noDataText}>
            {t("progress.needTwoLogs")}
          </div>
        </div>
      ) : (
        <div style={progressStyles.chartCard}>
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
              <Tooltip
                contentStyle={{
                  background: colors.tooltipBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  fontFamily: "DM Mono",
                  fontSize: 12,
                }}
                labelStyle={{ color: colors.textSecondary }}
                itemStyle={{ color: accentColor }}
              />
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

      {/* Stats grid */}
      {stats && (
        <div style={progressStyles.statsGrid}>
          <StatCard label={t("progress.current")} value={`${stats.current} kg`} color={accentColor} />
          <StatCard label={t("progress.max")} value={`${stats.max} kg`} color={colors.textPrimary} />
          <StatCard label={t("progress.min")} value={`${stats.min} kg`} color={colors.textMuted} />
        </div>
      )}
    </>
  );
}

function GifTab({ gifUrl, exerciseName, t }: { gifUrl?: string; exerciseName: string; t: TFunction }) {
  if (!gifUrl) {
    return (
      <div style={progressStyles.noDataCard}>
        <div style={progressStyles.noDataText}>{t("common.noData")}</div>
      </div>
    );
  }

  return (
    <div style={gifStyles.card}>
      <div style={gifStyles.label}>{t("common.demonstration")}</div>
      <img
        src={gifUrl}
        alt={exerciseName}
        style={gifStyles.img}
      />
    </div>
  );
}

/* ---- Styles ---- */
const styles: Record<string, CSSProperties> = {
  tabs: {
    ...performancePanelStyle(undefined, true),
    display: "flex",
    gap: 8,
    padding: 6,
    borderRadius: 24,
  },
  tab: {
    flex: 1,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: fonts.sans,
    transition: "all 0.2s",
    WebkitTapHighlightColor: "transparent",
  },
};

const formStyles: Record<string, CSSProperties> = {
  card: {
    ...performancePanelStyle(),
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "3fr 2fr",
    gap: 12,
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 1,
  },
  numberInput: {
    width: "100%",
    background: `linear-gradient(180deg, ${colors.textPrimary}08 0%, ${colors.surfaceAlt}e8 100%)`,
    border: `1px solid ${colors.textPrimary}12`,
    borderRadius: 16,
    padding: "14px 14px",
    color: colors.textPrimary,
    fontFamily: fonts.mono,
    fontSize: 18,
    WebkitAppearance: "none",
  },
  weightControls: {
    display: "grid",
    gridTemplateColumns: "56px 1fr 56px",
    gap: 8,
    alignItems: "center",
  },
  adjustBtn: {
    border: `1px solid ${colors.textPrimary}10`,
    background: `linear-gradient(180deg, ${colors.textPrimary}0a 0%, ${colors.surfaceAlt}dc 100%)`,
    color: colors.textPrimary,
    borderRadius: 16,
    minHeight: 48,
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  textInput: {
    width: "100%",
    background: `linear-gradient(180deg, ${colors.textPrimary}08 0%, ${colors.surfaceAlt}e8 100%)`,
    border: `1px solid ${colors.textPrimary}12`,
    borderRadius: 16,
    padding: "14px 14px",
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  submit: {
    padding: 16,
    border: "none",
    borderRadius: 18,
    color: colors.textOnAccent,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    minHeight: 50,
    WebkitTapHighlightColor: "transparent",
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.24)",
  },
  submitRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8,
  },
  chipRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
  },
  chip: {
    ...performanceGhostButtonStyle(colors.textSecondary),
    borderRadius: 999,
    fontSize: 12,
  },
};

const sessionStyles: Record<string, CSSProperties> = {
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: 18,
    fontWeight: 700,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  endButton: {
    border: `1px solid ${colors.textPrimary}10`,
    background: `linear-gradient(180deg, ${colors.textPrimary}08 0%, ${colors.surfaceAlt}dc 100%)`,
    color: colors.textSecondary,
    borderRadius: 999,
    padding: "8px 10px",
    fontFamily: fonts.mono,
    fontSize: 11,
    cursor: "pointer",
  },
  restCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  restTitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.warning,
    letterSpacing: 1,
    marginBottom: 6,
  },
  restTime: {
    fontFamily: fonts.mono,
    fontSize: 22,
    fontWeight: 700,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  skipButton: {
    border: `1px solid ${colors.textPrimary}10`,
    background: `linear-gradient(180deg, ${colors.textPrimary}08 0%, ${colors.surfaceAlt}dc 100%)`,
    color: colors.textSecondary,
    borderRadius: 999,
    padding: "8px 10px",
    fontFamily: fonts.mono,
    fontSize: 11,
    cursor: "pointer",
  },
  quickRestBar: {
    position: "sticky",
    bottom: 10,
    zIndex: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    background: `linear-gradient(180deg, ${colors.textPrimary}0d 0%, ${colors.surface}ea 100%)`,
    border: `1px solid ${colors.warning}55`,
    borderRadius: 22,
    padding: "10px 12px",
    marginTop: 12,
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.22)",
  },
  quickRestInfo: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
  },
  quickRestLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.warning,
    textTransform: "uppercase",
  },
  quickRestTime: {
    fontFamily: fonts.mono,
    fontSize: 16,
    fontWeight: 700,
    color: colors.textPrimary,
  },
  quickSkipButton: {
    ...performanceGhostButtonStyle(colors.warning),
    whiteSpace: "nowrap",
  },
};

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const historyStyles: Record<string, CSSProperties> = {
  emptyState: {
    color: colors.textGhost,
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    padding: "30px 0",
  },
  logEntry: {
    ...performancePanelStyle(undefined, true),
    borderRadius: 20,
    padding: "14px 14px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: colors.textGhost,
    cursor: "pointer",
    fontSize: 18,
    padding: "8px",
    minWidth: 36,
    minHeight: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    opacity: 0.6,
    transition: "opacity 0.15s",
    WebkitTapHighlightColor: "transparent",
  },
};

const gifStyles = {
  card: {
    ...performancePanelStyle(),
    borderRadius: 24,
    padding: 14,
    marginBottom: 20,
    textAlign: "center" as const,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: "uppercase" as const,
  },
  img: {
    width: "100%",
    maxHeight: 240,
    objectFit: "contain" as const,
    borderRadius: 10,
  },
};

const progressStyles: Record<string, CSSProperties> = {
  noDataCard: {
    ...performancePanelStyle(),
    borderRadius: 24,
    padding: 40,
    textAlign: "center",
    marginBottom: 20,
  },
  noDataText: {
    color: colors.textGhost,
    fontSize: 13,
    fontStyle: "italic",
  },
  chartCard: {
    ...performancePanelStyle(),
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
  },
};

const headerStyles: Record<string, CSSProperties> = {
  card: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 26,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
    color: colors.textPrimary,
    letterSpacing: -1.1,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  note: {
    fontSize: 11,
    color: colors.warning,
    marginTop: 8,
    fontStyle: "italic",
  },
};
