import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { makeExerciseId, formatDate, getLastLog, buildChartData, computeWeightStats } from "../../utils/helpers";
import { DayTabs, SectionLabel, PageContainer, StatCard } from "../ui";
import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";
import { PrototypeSwitcher, ProtoKey } from "./PrototypeSwitcher";

type Exercise = { id: string; name: string; sets: string; reps: string; rest: string; note?: string };
type TabKey = "log" | "progress";

/**
 * Prototype B — Bottom Sheet
 *
 * The plan list fills the screen. Tapping an exercise slides up a bottom sheet
 * (≈65 % height) with two tabs: Log (form + history) and Progress (chart + stats).
 * A semi-transparent backdrop dismisses the sheet.
 */
export function PlanViewB({
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

  const openSheet = (ex: Exercise) => {
    const entries = logs[ex.id] || [];
    const latest = entries[entries.length - 1];
    setForm({ weight: latest?.weight ?? "", reps: latest?.reps ?? "", notes: "" });
    setActiveTab("log");
    setSelectedExercise(ex);
  };

  const closeSheet = () => setSelectedExercise(null);

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

  /* ---- Detail content for the sheet ---- */
  const SheetContent = () => {
    if (!selectedExercise) return null;
    const entries = logs[selectedExercise.id] || [];
    const chartData = buildChartData(entries).filter((d) => d.peso > 0);
    const stats = computeWeightStats(entries);

    return (
      <>
        {/* Log tab */}
        {activeTab === "log" && (
          <div>
            {/* Form */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={styles.fieldLabel}>{t("log.weightLabel").toUpperCase()}</div>
                <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 40px", gap: 6, alignItems: "center" }}>
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
            <button onClick={handleSave} style={{ ...styles.submitBtn, background: accentColor }}>{t("log.saveRecord")}</button>

            {/* History */}
            {entries.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={styles.histLabel}>{t("log.history").toUpperCase()}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[...entries].reverse().map((entry: any, ri: number) => {
                    const origIdx = entries.length - 1 - ri;
                    return (
                      <div key={ri} style={styles.histRow}>
                        <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, minWidth: 36 }}>{formatDate(entry.date)}</span>
                        <span style={{ fontFamily: fonts.mono, fontSize: 13, color: accentColor, fontWeight: 600, marginLeft: 8 }}>
                          {entry.weight ? `${entry.weight} kg` : "—"}
                        </span>
                        {entry.reps && <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginLeft: 6 }}>× {entry.reps}</span>}
                        <button onClick={() => deleteLog(selectedExercise.id, origIdx)} style={styles.delBtn}>×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress tab */}
        {activeTab === "progress" && (
          <div>
            {chartData.length < 2 ? (
              <div style={styles.noData}>{t("progress.needTwoLogs")}</div>
            ) : (
              <>
                <div style={{ background: colors.bg, borderRadius: 10, padding: 12, marginBottom: 14 }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" tick={{ fontFamily: "DM Mono", fontSize: 9, fill: colors.textDim }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontFamily: "DM Mono", fontSize: 9, fill: colors.textDim }} axisLine={false} tickLine={false} unit=" kg" />
                      <Tooltip
                        contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, fontFamily: "DM Mono", fontSize: 11 }}
                        labelStyle={{ color: colors.textDim }}
                        itemStyle={{ color: accentColor }}
                      />
                      <Line type="monotone" dataKey="peso" stroke={accentColor} strokeWidth={2} dot={{ fill: accentColor, r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {stats && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <StatCard label={t("progress.current")} value={`${stats.current} kg`} color={accentColor} />
                    <StatCard label={t("progress.max")} value={`${stats.max} kg`} color={colors.textPrimary} />
                    <StatCard label={t("progress.min")} value={`${stats.min} kg`} color={colors.textMuted} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <>
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
                </div>
              </div>
            ) : (
              <div
                key={ex.id}
                onClick={() => openSheet(ex)}
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

      {/* ---- Bottom Sheet Overlay ---- */}
      {selectedExercise && (
        <div style={styles.overlay}>
          {/* Backdrop */}
          <div onClick={closeSheet} style={styles.backdrop} />

          {/* Sheet */}
          <div style={styles.sheet}>
            {/* Handle */}
            <div style={styles.handle} />

            {/* Exercise header */}
            <div style={{ marginBottom: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: fonts.mono, fontSize: 10, color: accentColor, letterSpacing: 2, marginBottom: 4 }}>
                  {safeActiveDay}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.2 }}>
                  {selectedExercise.name}
                </div>
                <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                  {selectedExercise.sets} {t("common.series")} · {selectedExercise.reps} {t("common.reps")} · {selectedExercise.rest}
                </div>
              </div>
              <button onClick={closeSheet} style={styles.closeBtn}>✕</button>
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

            {/* Tab content */}
            <div style={{ overflowY: "auto", flex: 1, paddingBottom: 20 }}>
              <SheetContent />
            </div>
          </div>
        </div>
      )}
    </>
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
  editCard: {
    background: colors.surface,
    borderRadius: 12,
    border: `1px solid ${colors.borderLight}`,
    padding: 12,
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  editIndex: { fontFamily: fonts.mono, fontSize: 10, color: colors.textGhost, minWidth: 22, paddingTop: 10 },
  nameInput: { width: "100%", border: `1px solid ${colors.border}`, background: colors.bg, color: colors.textPrimary, borderRadius: 10, padding: "10px 12px", fontFamily: fonts.sans, fontSize: 14 },
  metaInput: { width: "100%", border: `1px solid ${colors.border}`, background: colors.bg, color: colors.textPrimary, borderRadius: 10, padding: "8px 10px", fontFamily: fonts.mono, fontSize: 12 },
  labelInput: { width: "100%", border: `1px solid ${colors.border}`, background: colors.surface, color: colors.textPrimary, borderRadius: 10, padding: "8px 12px", fontFamily: fonts.sans, fontSize: 14, marginTop: 4 },
  overlay: { position: "fixed" as const, inset: 0, zIndex: 300, display: "flex", flexDirection: "column" as const, justifyContent: "flex-end" },
  backdrop: { position: "absolute" as const, inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" },
  sheet: {
    position: "relative" as const,
    background: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "68vh",
    padding: "12px 20px 0",
    display: "flex",
    flexDirection: "column" as const,
    borderTop: `1px solid ${colors.border}`,
  },
  handle: { width: 36, height: 4, background: colors.border, borderRadius: 2, margin: "0 auto 16px" },
  closeBtn: {
    background: "none",
    border: "none",
    color: colors.textMuted,
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 8px",
    lineHeight: 1,
    WebkitTapHighlightColor: "transparent",
  },
  tabBar: { display: "flex", borderBottom: `1px solid ${colors.border}`, marginBottom: 16 },
  tabBtn: {
    flex: 1,
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    padding: "10px 0",
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  fieldLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, marginBottom: 6, letterSpacing: 1 },
  numInput: { width: "100%", background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "12px 10px", color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 16, WebkitAppearance: "none" as const },
  adjBtn: { border: `1px solid ${colors.border}`, background: colors.bg, color: colors.textPrimary, borderRadius: 8, minHeight: 40, fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  submitBtn: { width: "100%", padding: "13px", border: "none", borderRadius: 10, color: colors.bg, fontFamily: fonts.sans, fontSize: 14, fontWeight: 700, cursor: "pointer", WebkitTapHighlightColor: "transparent" },
  histLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.textGhost, letterSpacing: 2, marginBottom: 6 },
  histRow: { display: "flex", alignItems: "center", padding: "8px 10px", background: colors.bg, borderRadius: 8, border: `1px solid ${colors.borderDim}` },
  delBtn: { background: "none", border: "none", color: colors.textGhost, cursor: "pointer", fontSize: 16, padding: "4px 8px", marginLeft: "auto", WebkitTapHighlightColor: "transparent" },
  noData: { color: colors.textGhost, fontSize: 13, fontStyle: "italic", textAlign: "center" as const, padding: "30px 0" },
};
