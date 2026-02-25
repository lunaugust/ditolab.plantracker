import { useState } from "react";
import { makeExerciseId, formatDate, getLastLog } from "../../utils/helpers";
import { DayTabs, SectionLabel, PageContainer } from "../ui";
import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";
import { PrototypeSwitcher, ProtoKey } from "./PrototypeSwitcher";

/**
 * Prototype A — Inline Accordion
 *
 * The plan list is the only screen. Tapping an exercise expands it in-place,
 * revealing a compact log form (weight/reps + save) plus the last 3 history
 * entries. No navigation, no overlays — everything on one scrollable page.
 */
export function PlanViewA({
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
  prototype: ProtoKey;
  onPrototypeChange: (p: ProtoKey) => void;
}) {
  const { t } = useI18n();
  const safeActiveDay = trainingPlan[activeDay] ? activeDay : dayKeys[0];
  const day = safeActiveDay ? trainingPlan[safeActiveDay] : null;
  const accentColor = dayColors[safeActiveDay] || colors.accent.orange;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ weight: "", reps: "", notes: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [draftDay, setDraftDay] = useState<any>(null);

  const toggleExpand = (ex: any) => {
    if (expandedId === ex.id) {
      setExpandedId(null);
      return;
    }
    const entries = logs[ex.id] || [];
    const latest = entries[entries.length - 1];
    setForm({ weight: latest?.weight ?? "", reps: latest?.reps ?? "", notes: "" });
    setExpandedId(ex.id);
  };

  const handleSave = (exId: string) => {
    addLog(exId, form);
    setForm((prev) => ({ weight: prev.weight, reps: prev.reps, notes: "" }));
  };

  const startEditing = () => {
    setDraftDay(JSON.parse(JSON.stringify(day)));
    setIsEditing(true);
  };
  const cancelEditing = () => { setDraftDay(null); setIsEditing(false); };
  const saveEditing = () => {
    if (!draftDay) return;
    saveDay(safeActiveDay, draftDay);
    setIsEditing(false);
  };
  const updateField = (id: string, field: string, value: string) => {
    if (!draftDay) return;
    setDraftDay((prev: any) => ({
      ...prev,
      exercises: prev.exercises.map((ex: any) => ex.id === id ? { ...ex, [field]: value } : ex),
    }));
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
          <button onClick={onOpenGenerator} style={{ ...styles.ghostBtn, color: colors.accent.blue, borderColor: colors.accent.blue }}>
            ✦ {t("generator.title")}
          </button>
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
            <input
              value={draftDay?.label ?? ""}
              onChange={(e) => setDraftDay((p: any) => ({ ...p, label: e.target.value }))}
              style={styles.labelInput}
            />
          ) : (
            <div style={{ fontSize: 14, color: colors.textSecondary, fontWeight: 300 }}>{day.label}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => { const k = addDay(); if (k) setActiveDay(k); }}
            style={styles.ghostBtn}
          >{t("plan.addDayShort")}</button>
          <button
            onClick={() => removeDay(safeActiveDay)}
            disabled={dayKeys.length <= 1}
            style={{ ...styles.ghostBtn, opacity: dayKeys.length <= 1 ? 0.4 : 1 }}
          >{t("plan.removeDayShort")}</button>
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
          const isExpanded = expandedId === ex.id;
          const entries = logs[ex.id] || [];
          const lastLog = getLastLog(logs, ex.id);

          return (
            <div key={ex.id}>
              {/* ---- Edit mode row ---- */}
              {isEditing ? (
                <div style={styles.editCard}>
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
                /* ---- Normal / expanded row ---- */
                <>
                  <div
                    onClick={() => toggleExpand(ex)}
                    style={{
                      ...styles.exerciseRow,
                      borderLeft: `3px solid ${isExpanded ? accentColor : "transparent"}`,
                      borderBottomLeftRadius: isExpanded ? 0 : 12,
                      borderBottomRightRadius: isExpanded ? 0 : 12,
                    }}
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
                    {lastLog && !isExpanded && (
                      <div style={{ textAlign: "right", minWidth: 52 }}>
                        {lastLog.weight && (
                          <div style={{ fontFamily: fonts.mono, fontSize: 12, color: accentColor, fontWeight: 600 }}>{lastLog.weight} kg</div>
                        )}
                        {lastLog.reps && (
                          <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim }}>× {lastLog.reps}</div>
                        )}
                      </div>
                    )}
                    <div style={{
                      color: isExpanded ? accentColor : colors.textGhost,
                      fontSize: 18,
                      marginLeft: 6,
                      transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(90deg)" : "none",
                      lineHeight: 1,
                    }}>›</div>
                  </div>

                  {/* ---- Inline expanded panel ---- */}
                  {isExpanded && (
                    <div style={styles.expandedPanel}>
                      {/* Quick log form */}
                      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px 1fr", gap: 6, marginBottom: 8, alignItems: "center" }}>
                        <button onClick={() => setForm(f => ({ ...f, weight: String(Math.max(0, (Number(f.weight) || 0) - 5)) }))} style={styles.adjBtn}>-5</button>
                        <input
                          value={form.weight}
                          onChange={(e) => setForm(f => ({ ...f, weight: e.target.value }))}
                          placeholder="kg"
                          type="number"
                          style={styles.logInput}
                        />
                        <button onClick={() => setForm(f => ({ ...f, weight: String((Number(f.weight) || 0) + 5) }))} style={styles.adjBtn}>+5</button>
                        <input
                          value={form.reps}
                          onChange={(e) => setForm(f => ({ ...f, reps: e.target.value }))}
                          placeholder={t("log.repsDoneLabel")}
                          type="number"
                          style={styles.logInput}
                        />
                      </div>
                      <button
                        onClick={() => handleSave(ex.id)}
                        style={{ ...styles.saveBtn, background: accentColor }}
                      >
                        {t("log.saveRecord")}
                      </button>

                      {/* Recent history (last 3 entries) */}
                      {entries.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <div style={styles.histLabel}>{t("log.history").toUpperCase()}</div>
                          {[...entries].slice(-3).reverse().map((entry: any, ri: number) => (
                            <div key={ri} style={styles.miniEntry}>
                              <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim }}>{formatDate(entry.date)}</span>
                              <span style={{ fontFamily: fonts.mono, fontSize: 12, color: accentColor, fontWeight: 600, marginLeft: 8 }}>
                                {entry.weight ? `${entry.weight} kg` : "—"}
                              </span>
                              {entry.reps && (
                                <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, marginLeft: 6 }}>
                                  × {entry.reps}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Generator / importer links */}
      <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
        <button onClick={onOpenGenerator} style={{ ...styles.ghostBtn, color: colors.accent.blue, borderColor: colors.accent.blue }}>
          ✦ {t("generator.title")}
        </button>
        <button onClick={onOpenImporter} style={{ ...styles.ghostBtn, color: colors.accent.blue, borderColor: colors.accent.blue }}>
          {t("importer.openButton")}
        </button>
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
  expandedPanel: {
    background: colors.surfaceAlt,
    border: `1px solid ${colors.borderLight}`,
    borderTop: "none",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: "12px 14px 14px",
  },
  adjBtn: {
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.textPrimary,
    borderRadius: 8,
    minHeight: 40,
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  logInput: {
    width: "100%",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: "10px 10px",
    color: colors.textPrimary,
    fontFamily: fonts.mono,
    fontSize: 15,
    WebkitAppearance: "none" as const,
  },
  saveBtn: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: 10,
    color: colors.bg,
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  histLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textGhost,
    letterSpacing: 2,
    marginBottom: 6,
  },
  miniEntry: {
    padding: "5px 0",
    borderBottom: `1px solid ${colors.borderDim}`,
    display: "flex",
    alignItems: "center",
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
  editIndex: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textGhost,
    minWidth: 22,
    paddingTop: 10,
  },
  nameInput: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: "10px 12px",
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  metaInput: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: "8px 10px",
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  labelInput: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: "8px 12px",
    fontFamily: fonts.sans,
    fontSize: 14,
    marginTop: 4,
  },
  sans: fonts.sans,
};
