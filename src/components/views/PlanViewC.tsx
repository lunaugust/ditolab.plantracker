import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { getLastLog, formatDate, buildChartData, computeWeightStats, makeExerciseId } from "../../utils/helpers";
import { DayTabs, SectionLabel, BackButton, PageContainer, StatCard } from "../ui";
import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";
import { PrototypeSwitcher, ProtoKey } from "./PrototypeSwitcher";

type Exercise = { id: string; name: string; sets: string; reps: string; rest: string; note?: string };
type TabKey = "log" | "progress";

/**
 * Prototype C — Full-Screen Push
 *
 * The plan list is the main screen. Tapping an exercise "pushes" a full-screen
 * exercise detail view (replacing the list). The detail view has two tabs:
 * Log (form + history) and Progress (chart + stats). A back button returns to
 * the plan list.
 */
export function PlanViewC({
  activeDay,
  setActiveDay,
  trainingPlan,
  dayKeys,
  dayColors,
  logs,
  saveDay,
  addDay,
  removeDay,
  onOpenGenerator,
  onOpenImporter,
  addLog,
  deleteLog,
  prototype,
  onPrototypeChange,
}: {
  activeDay: string;
  setActiveDay: (d: string) => void;
  trainingPlan: Record<string, any>;
  dayKeys: string[];
  dayColors: Record<string, string>;
  logs: Record<string, any[]>;
  saveDay: (key: string, day: any) => void;
  addDay: () => string;
  removeDay: (key: string) => void;
  onOpenGenerator: () => void;
  onOpenImporter: () => void;
  addLog: (id: string, data: { weight: string; reps: string; notes: string }) => void;
  deleteLog: (id: string, idx: number) => void;
  prototype: ProtoKey;
  onPrototypeChange: (p: ProtoKey) => void;
}) {
  const { t } = useI18n();
  const safeActiveDay = trainingPlan[activeDay] ? activeDay : dayKeys[0];
  const day = safeActiveDay ? trainingPlan[safeActiveDay] : null;
  const accentColor = dayColors[safeActiveDay] || colors.accent.orange;

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("log");
  const [form, setForm] = useState({ weight: "", reps: "", notes: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [draftDay, setDraftDay] = useState<any>(null);

  const openDetail = (ex: Exercise) => {
    const entries = logs[ex.id] || [];
    const latest = entries[entries.length - 1];
    setForm({ weight: latest?.weight ?? "", reps: latest?.reps ?? "", notes: "" });
    setActiveTab("log");
    setSelectedExercise(ex);
  };

  const closeDetail = () => setSelectedExercise(null);

  const handleSave = () => {
    if (!selectedExercise) return;
    addLog(selectedExercise.id, form);
    setForm((prev) => ({ weight: prev.weight, reps: prev.reps, notes: "" }));
  };

  const adjustWeight = (delta: number) => {
    setForm((f) => ({ ...f, weight: String(Math.max(0, (Number(f.weight) || 0) + delta)) }));
  };

  const startEditing = () => { setDraftDay(JSON.parse(JSON.stringify(day))); setIsEditing(true); };
  const cancelEditing = () => { setDraftDay(null); setIsEditing(false); };
  const saveEditing = () => { if (!draftDay) return; saveDay(safeActiveDay, draftDay); setIsEditing(false); };
  const updateField = (id: string, field: string, value: string) => {
    if (!draftDay) return;
    setDraftDay((p: any) => ({ ...p, exercises: p.exercises.map((e: any) => e.id === id ? { ...e, [field]: value } : e) }));
  };

  const currentDay = isEditing && draftDay ? draftDay : day;

  /* ---- Exercise Detail Screen ---- */
  if (selectedExercise) {
    const entries = logs[selectedExercise.id] || [];
    const chartData = buildChartData(entries).filter((d) => d.peso > 0);
    const stats = computeWeightStats(entries);

    return (
      <PageContainer>
        <PrototypeSwitcher active={prototype} onChange={onPrototypeChange} />

        <BackButton onClick={closeDetail} />

        {/* Exercise header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 10, color: accentColor, letterSpacing: 2, marginBottom: 4 }}>
            {safeActiveDay}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
            {selectedExercise.name}
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted }}>
            {selectedExercise.sets} {t("common.series")} · {selectedExercise.reps} {t("common.reps")} · {selectedExercise.rest}
          </div>
          {selectedExercise.note && (
            <div style={{ fontSize: 11, color: colors.warning, marginTop: 6, fontStyle: "italic" }}>
              ⚠ {selectedExercise.note}
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div style={styles.tabBar}>
          {(["log", "progress"] as TabKey[]).map((tab) => {
            const label = tab === "log" ? t("log.register") : t("progress.title");
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  ...styles.tabBtn,
                  color: isActive ? accentColor : colors.textMuted,
                  borderBottom: `2px solid ${isActive ? accentColor : "transparent"}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Log tab */}
        {activeTab === "log" && (
          <div>
            {/* Form */}
            <div style={styles.formCard}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={styles.fieldLabel}>{t("log.weightLabel").toUpperCase()}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 48px", gap: 8, alignItems: "center" }}>
                    <button onClick={() => adjustWeight(-5)} style={styles.adjBtn}>-5</button>
                    <input value={form.weight} onChange={(e) => setForm(f => ({ ...f, weight: e.target.value }))} type="number" placeholder="0" style={styles.numInput} />
                    <button onClick={() => adjustWeight(5)} style={styles.adjBtn}>+5</button>
                  </div>
                </div>
                <div>
                  <div style={styles.fieldLabel}>{t("log.repsDoneLabel").toUpperCase()}</div>
                  <input value={form.reps} onChange={(e) => setForm(f => ({ ...f, reps: e.target.value }))} type="number" placeholder="0" style={styles.numInput} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={styles.fieldLabel}>{t("log.notesOptional")}</div>
                <input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t("log.notesPlaceholder")} style={styles.textInput} />
              </div>
              <button onClick={handleSave} style={{ ...styles.submitBtn, background: accentColor }}>{t("log.saveRecord")}</button>
            </div>

            {/* History */}
            <SectionLabel>{t("log.history")}</SectionLabel>
            {entries.length === 0 ? (
              <div style={styles.emptyState}>{t("log.noRecords")}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[...entries].reverse().map((entry: any, ri: number) => {
                  const origIdx = entries.length - 1 - ri;
                  return (
                    <div key={ri} style={styles.histRow}>
                      <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, minWidth: 40 }}>{formatDate(entry.date)}</span>
                      <div style={{ flex: 1, marginLeft: 8 }}>
                        <span style={{ fontFamily: fonts.mono, fontSize: 14, color: accentColor, fontWeight: 600 }}>
                          {entry.weight ? `${entry.weight} kg` : "—"}
                        </span>
                        {entry.reps && <span style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted, marginLeft: 10 }}>× {entry.reps} {t("common.reps")}</span>}
                        {entry.notes && <div style={{ fontSize: 11, color: colors.textDim, marginTop: 3 }}>{entry.notes}</div>}
                      </div>
                      <button onClick={() => deleteLog(selectedExercise.id, origIdx)} style={styles.delBtn}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Progress tab */}
        {activeTab === "progress" && (
          <div>
            {chartData.length < 2 ? (
              <div style={styles.noDataCard}>
                <div style={styles.noDataText}>{t("progress.needTwoLogs")}</div>
              </div>
            ) : (
              <div style={styles.chartCard}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontFamily: "DM Mono", fontSize: 10, fill: colors.textDim }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontFamily: "DM Mono", fontSize: 10, fill: colors.textDim }} axisLine={false} tickLine={false} unit=" kg" />
                    <Tooltip
                      contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, fontFamily: "DM Mono", fontSize: 12 }}
                      labelStyle={{ color: colors.textDim }}
                      itemStyle={{ color: accentColor }}
                    />
                    <Line type="monotone" dataKey="peso" stroke={accentColor} strokeWidth={2} dot={{ fill: accentColor, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {stats && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <StatCard label={t("progress.current")} value={`${stats.current} kg`} color={accentColor} />
                <StatCard label={t("progress.max")} value={`${stats.max} kg`} color={colors.textPrimary} />
                <StatCard label={t("progress.min")} value={`${stats.min} kg`} color={colors.textMuted} />
              </div>
            )}
          </div>
        )}
      </PageContainer>
    );
  }

  /* ---- Plan List Screen ---- */
  if (!day) {
    return (
      <PageContainer>
        <PrototypeSwitcher active={prototype} onChange={onPrototypeChange} />
        <SectionLabel>{t("plan.title")}</SectionLabel>
        <div style={{ color: colors.textMuted, marginBottom: 12 }}>{t("plan.noDays")}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={addDay} style={styles.ghostBtn}>{t("plan.addDay")}</button>
          <button onClick={onOpenGenerator} style={{ ...styles.ghostBtn, color: colors.accent.blue, borderColor: colors.accent.blue }}>✦ {t("generator.title")}</button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PrototypeSwitcher active={prototype} onChange={onPrototypeChange} />

      <DayTabs days={dayKeys} activeDay={safeActiveDay} dayColors={dayColors} onSelect={setActiveDay} />

      {/* Day header */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <SectionLabel color={accentColor}>{safeActiveDay}</SectionLabel>
          {isEditing ? (
            <input value={draftDay?.label ?? ""} onChange={(e) => setDraftDay((p: any) => ({ ...p, label: e.target.value }))} style={styles.labelInput} />
          ) : (
            <div style={{ fontSize: 14, color: colors.textSecondary, fontWeight: 300 }}>{day.label}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => { const k = addDay(); if (k) setActiveDay(k); }} style={styles.ghostBtn}>{t("plan.addDayShort")}</button>
          <button onClick={() => removeDay(safeActiveDay)} disabled={dayKeys.length <= 1} style={{ ...styles.ghostBtn, opacity: dayKeys.length <= 1 ? 0.4 : 1 }}>{t("plan.removeDayShort")}</button>
          {!isEditing ? (
            <button onClick={startEditing} style={styles.ghostBtn}>{t("plan.editPlan")}</button>
          ) : (
            <>
              <button onClick={cancelEditing} style={styles.ghostBtn}>{t("common.cancel")}</button>
              <button onClick={saveEditing} style={{ ...styles.ghostBtn, color: accentColor, borderColor: accentColor }}>{t("common.save")}</button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div style={{ marginBottom: 10 }}>
          <button
            onClick={() => {
              setDraftDay((prev: any) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  exercises: [{ id: makeExerciseId(), name: t("plan.exerciseNameTemplate", { n: prev.exercises.length + 1 }), sets: "", reps: "", rest: "", note: "" }, ...prev.exercises],
                };
              });
            }}
            style={styles.ghostBtn}
          >{t("plan.addExercise")}</button>
        </div>
      )}

      {/* Exercise list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {currentDay.exercises.map((ex: any, i: number) => {
          const lastLog = getLastLog(logs, ex.id);
          const exLogs = logs[ex.id] || [];

          return isEditing ? (
            <div key={ex.id} style={styles.editCard}>
              <div style={styles.editIndex}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={ex.name} onChange={(e) => updateField(ex.id, "name", e.target.value)} style={styles.nameInput} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  <input value={ex.sets} onChange={(e) => updateField(ex.id, "sets", e.target.value)} placeholder={t("plan.setsPlaceholder")} style={styles.metaInput} />
                  <input value={ex.reps} onChange={(e) => updateField(ex.id, "reps", e.target.value)} placeholder={t("plan.repsPlaceholder")} style={styles.metaInput} />
                  <input value={ex.rest} onChange={(e) => updateField(ex.id, "rest", e.target.value)} placeholder={t("plan.restPlaceholder")} style={styles.metaInput} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { /* move up handled via draftDay */ }} style={{ ...styles.ghostBtn, fontSize: 10, padding: "5px 8px" }}>{t("plan.moveUp")}</button>
                  <button onClick={() => { /* move down */ }} style={{ ...styles.ghostBtn, fontSize: 10, padding: "5px 8px" }}>{t("plan.moveDown")}</button>
                  <button
                    onClick={() => setDraftDay((p: any) => p ? { ...p, exercises: p.exercises.filter((e: any) => e.id !== ex.id) } : p)}
                    style={{ ...styles.ghostBtn, fontSize: 10, padding: "5px 8px" }}
                  >{t("plan.removeExercise")}</button>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={ex.id}
              onClick={() => openDetail(ex)}
              style={styles.exerciseRow}
            >
              <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textGhost, minWidth: 22 }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: colors.textPrimary, marginBottom: 2 }}>{ex.name}</div>
                <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted }}>
                  {ex.sets} {t("common.series")} · {ex.reps} {t("common.reps")} · {ex.rest}
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 60 }}>
                {lastLog?.weight && (
                  <div style={{ fontFamily: fonts.mono, fontSize: 12, color: accentColor, fontWeight: 600 }}>{lastLog.weight} kg</div>
                )}
                {exLogs.length > 0 && (
                  <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textGhost }}>{exLogs.length} {t("common.records")}</div>
                )}
              </div>
              <div style={{ color: colors.textGhost, fontSize: 18, marginLeft: 6 }}>›</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
        <button onClick={onOpenGenerator} style={{ ...styles.ghostBtn, color: colors.accent.blue, borderColor: colors.accent.blue }}>✦ {t("generator.title")}</button>
        <button onClick={onOpenImporter} style={{ ...styles.ghostBtn, color: colors.accent.blue, borderColor: colors.accent.blue }}>{t("importer.openButton")}</button>
      </div>
    </PageContainer>
  );
}

const styles = {
  ghostBtn: {
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.textSecondary,
    borderRadius: 10,
    padding: "7px 10px",
    cursor: "pointer",
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  exerciseRow: {
    background: colors.surface,
    borderRadius: 12,
    border: `1px solid ${colors.borderLight}`,
    padding: "14px 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    minHeight: 54,
    WebkitTapHighlightColor: "transparent",
  },
  editCard: { background: colors.surface, borderRadius: 12, border: `1px solid ${colors.borderLight}`, padding: 12, display: "flex", gap: 10, alignItems: "flex-start" },
  editIndex: { fontFamily: fonts.mono, fontSize: 10, color: colors.textGhost, minWidth: 22, paddingTop: 10 },
  nameInput: { width: "100%", border: `1px solid ${colors.border}`, background: colors.bg, color: colors.textPrimary, borderRadius: 10, padding: "10px 12px", fontFamily: fonts.sans, fontSize: 14 },
  metaInput: { width: "100%", border: `1px solid ${colors.border}`, background: colors.bg, color: colors.textPrimary, borderRadius: 10, padding: "8px 10px", fontFamily: fonts.mono, fontSize: 12 },
  labelInput: { width: "100%", border: `1px solid ${colors.border}`, background: colors.surface, color: colors.textPrimary, borderRadius: 10, padding: "8px 12px", fontFamily: fonts.sans, fontSize: 14, marginTop: 4 },
  tabBar: { display: "flex", borderBottom: `1px solid ${colors.border}`, marginBottom: 20 },
  tabBtn: { flex: 1, background: "none", border: "none", borderBottom: "2px solid transparent", padding: "10px 0", fontFamily: fonts.sans, fontSize: 13, fontWeight: 600, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  formCard: { background: colors.surface, borderRadius: 14, padding: 18, marginBottom: 24, border: `1px solid ${colors.border}` },
  fieldLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, marginBottom: 6, letterSpacing: 1 },
  numInput: { width: "100%", background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "14px 14px", color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 18, WebkitAppearance: "none" as const },
  adjBtn: { border: `1px solid ${colors.border}`, background: colors.bg, color: colors.textPrimary, borderRadius: 10, minHeight: 48, fontFamily: fonts.mono, fontSize: 14, fontWeight: 700, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  textInput: { width: "100%", background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "14px 14px", color: colors.textPrimary, fontFamily: fonts.sans, fontSize: 15 },
  submitBtn: { width: "100%", padding: 16, border: "none", borderRadius: 12, color: colors.bg, fontFamily: fonts.sans, fontSize: 15, fontWeight: 700, cursor: "pointer", minHeight: 50, WebkitTapHighlightColor: "transparent" },
  histRow: { background: colors.surface, borderRadius: 10, padding: "14px 14px", display: "flex", alignItems: "center", border: `1px solid ${colors.borderLight}` },
  delBtn: { background: "none", border: "none", color: colors.textGhost, cursor: "pointer", fontSize: 18, padding: "8px", minWidth: 36, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, opacity: 0.6, WebkitTapHighlightColor: "transparent" },
  emptyState: { color: colors.textGhost, fontSize: 13, fontStyle: "italic", textAlign: "center" as const, padding: "30px 0" },
  noDataCard: { background: colors.surface, borderRadius: 12, padding: 40, textAlign: "center" as const, border: `1px solid ${colors.border}` },
  noDataText: { color: colors.textGhost, fontSize: 13, fontStyle: "italic" },
  chartCard: { background: colors.surface, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}`, marginBottom: 20 },
};
