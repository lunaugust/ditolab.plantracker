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
import { useI18n } from "../../i18n";
import { useExerciseGif, useLocalizedExerciseName, useLocalizedExerciseNote } from "../../hooks";
import { formatDate, buildChartData, computeWeightStats } from "../../utils/helpers";
import { SectionLabel, StatCard, BackButton, PageContainer } from "../ui";

/**
 * Full-screen exercise detail view with tabs: Log, Progress
 * Used on mobile for better UX
 *
 * @param {{
 *   exercise: import("../../data/trainingPlan").Exercise,
 *   accentColor: string,
 *   logs: Record<string, import("../../services/types").LogEntry[]>,
 *   addLog: (exId: string, data: { weight: string, reps: string, notes: string }) => void,
 *   deleteLog: (exId: string, idx: number) => void,
 *   onBack: () => void,
 * }} props
 */
export function ExerciseDetailView({ exercise, accentColor, logs, addLog, deleteLog, onBack }) {
  const { t } = useI18n();
  const gifUrl = useExerciseGif(exercise.exerciseId, exercise.name);
  const localizedName = useLocalizedExerciseName(exercise.name);
  const localizedNote = useLocalizedExerciseNote(exercise);
  const [activeTab, setActiveTab] = useState("log");
  const [form, setForm] = useState({ weight: "", reps: "", notes: "" });

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

  const handleSubmit = () => {
    addLog(exercise.id, form);
    setForm((prev) => ({ weight: prev.weight, reps: prev.reps, notes: "" }));
  };

  const adjustWeight = (delta) => {
    const current = Number(form.weight);
    const safeCurrent = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, safeCurrent + delta);
    setForm((prev) => ({ ...prev, weight: String(next) }));
  };

  const adjustReps = (delta) => {
    const current = Number(form.reps);
    const safeCurrent = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, safeCurrent + delta);
    setForm((prev) => ({ ...prev, reps: String(next) }));
  };

  return (
    <PageContainer>
      <BackButton onClick={onBack} />

      {/* Exercise header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: colors.textPrimary }}>
          {localizedName}
        </div>
        <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted }}>
          {exercise.sets} {t("common.series")} · {exercise.reps} {t("common.reps")} · {exercise.rest}
        </div>
        {localizedNote && (
          <div style={{ fontSize: 11, color: colors.warning, marginTop: 6, fontStyle: "italic" }}>
            ⚠ {localizedNote}
          </div>
        )}
      </div>

      {/* Exercise GIF demonstration */}
      {gifUrl && (
        <div style={gifStyles.card}>
          <div style={gifStyles.label}>{t("common.demonstration")}</div>
          <img
            src={gifUrl}
            alt={exercise.name}
            style={gifStyles.img}
          />
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: "log", label: t("nav.log") },
          { key: "progress", label: t("nav.progress") },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              ...styles.tab,
              color: activeTab === key ? accentColor : colors.textMuted,
              borderBottomColor: activeTab === key ? accentColor : "transparent",
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
          />
        )}

        {activeTab === "progress" && (
          <ProgressTab
            entries={entries}
            accentColor={accentColor}
            t={t}
          />
        )}
      </div>
    </PageContainer>
  );
}

/** Log tab content */
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
}) {
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

        <button onClick={handleSubmit} style={{ ...formStyles.submit, background: accentColor }}>
          {t("log.saveRecord")}
        </button>
      </div>

      {/* History */}
      <SectionLabel>{t("log.history")}</SectionLabel>

      {entries.length === 0 ? (
        <div style={historyStyles.emptyState}>{t("log.noRecords")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
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
                  style={historyStyles.deleteBtn}
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

/** Progress tab content */
function ProgressTab({ entries, accentColor, t }) {
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
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: 8,
                  fontFamily: "DM Mono",
                  fontSize: 12,
                }}
                labelStyle={{ color: "#666" }}
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

/* ---- Styles ---- */
const styles = {
  tabs: {
    display: "flex",
    gap: 4,
    borderBottom: `1px solid ${colors.border}`,
  },
  tab: {
    flex: 1,
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    padding: "12px 8px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: fonts.sans,
    transition: "color 0.2s, border-color 0.2s",
    WebkitTapHighlightColor: "transparent",
  },
};

const formStyles = {
  card: {
    background: colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    border: `1px solid ${colors.border}`,
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
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
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
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.textPrimary,
    borderRadius: 10,
    minHeight: 48,
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  textInput: {
    width: "100%",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    padding: "14px 14px",
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  submit: {
    width: "100%",
    padding: 16,
    border: "none",
    borderRadius: 12,
    color: colors.bg,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    minHeight: 50,
    WebkitTapHighlightColor: "transparent",
  },
  chipRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
  },
  chip: {
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.textPrimary,
    borderRadius: 999,
    padding: "8px 12px",
    fontFamily: fonts.mono,
    fontSize: 12,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
};

const historyStyles = {
  emptyState: {
    color: colors.textGhost,
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    padding: "30px 0",
  },
  logEntry: {
    background: colors.surface,
    borderRadius: 10,
    padding: "14px 14px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: `1px solid ${colors.borderLight}`,
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
    background: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    border: `1px solid ${colors.border}`,
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

const progressStyles = {
  noDataCard: {
    background: colors.surface,
    borderRadius: 12,
    padding: 40,
    textAlign: "center",
    border: `1px solid ${colors.border}`,
    marginBottom: 20,
  },
  noDataText: {
    color: colors.textGhost,
    fontSize: 13,
    fontStyle: "italic",
  },
  chartCard: {
    background: colors.surface,
    borderRadius: 12,
    padding: 20,
    border: `1px solid ${colors.border}`,
    marginBottom: 20,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
  },
};
