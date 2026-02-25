import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { PageContainer, SectionLabel, DayTabs, StatCard } from "../ui";
import { ExerciseRow } from "../exercises";
import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";
import { computeWeightStats, getLastLog, buildChartData, formatDate } from "../../utils/helpers";

type Props = {
  trainingPlan: Record<string, import("../../data/trainingPlan").TrainingDay>;
  dayKeys: string[];
  dayColors: Record<string, string>;
  logs: Record<string, import("../../services/types").LogEntry[]>;
  onExit?: () => void;
};

const prototypeModes = [
  { key: "drawer", labelKey: "prototype.drawer" },
  { key: "split", labelKey: "prototype.split" },
  { key: "modal", labelKey: "prototype.modal" },
  { key: "sheet", labelKey: "prototype.sheet" },
  { key: "tabs", labelKey: "prototype.tabs" },
  { key: "feed", labelKey: "prototype.feed" },
];

export function SingleViewPrototypes({ trainingPlan, dayKeys, dayColors, logs, onExit }: Props) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"drawer" | "split" | "modal">("drawer");
  const [activeDay, setActiveDay] = useState(dayKeys[0]);
  const [selectedExercise, setSelectedExercise] = useState<import("../../data/trainingPlan").Exercise | null>(null);
  const [panelTab, setPanelTab] = useState<"log" | "progress">("log");
  const [mobileTab, setMobileTab] = useState<"plan" | "insights">("plan");
  const accent = dayColors[activeDay] || colors.accent.blue;
  const day = trainingPlan[activeDay] || { exercises: [] };

  useEffect(() => {
    if (dayKeys.length === 0) return;
    if (!dayKeys.includes(activeDay)) setActiveDay(dayKeys[0]);
  }, [dayKeys, activeDay]);

  useEffect(() => {
    if (mobileTab !== "insights" || selectedExercise) return;
    const first = trainingPlan[activeDay]?.exercises?.[0];
    if (first) setSelectedExercise(first);
  }, [mobileTab, activeDay, trainingPlan, selectedExercise]);

  const lastLog = selectedExercise ? getLastLog(logs, selectedExercise.id) : null;
  const entries = selectedExercise ? logs[selectedExercise.id] || [] : [];
  const stats = useMemo(() => (selectedExercise ? computeWeightStats(entries) : null), [selectedExercise, entries]);
  const chartHasData = useMemo(() => {
    if (!selectedExercise) return false;
    return buildChartData(entries).filter((d) => d.peso > 0).length >= 2;
  }, [selectedExercise, entries]);

  const detailPanel = (
    <div style={{ ...styles.panelCard, borderColor: accent }}>
      {!selectedExercise ? (
        <div style={styles.placeholder}>{t("prototype.pickExercise")}</div>
      ) : (
        <>
          <div style={styles.panelHeader}>
            <div>
              <div style={{ ...styles.exLabel, color: accent }}>{selectedExercise.name}</div>
              <div style={styles.exMeta}>
                {selectedExercise.sets} {t("common.series")} · {selectedExercise.reps} {t("common.reps")} · {selectedExercise.rest}
              </div>
            </div>
            <div style={styles.tabPills}>
              {["log", "progress"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPanelTab(tab as "log" | "progress")}
                  style={{
                    ...styles.pill,
                    background: panelTab === tab ? accent : colors.surface,
                    color: panelTab === tab ? colors.bg : colors.textSecondary,
                    borderColor: panelTab === tab ? accent : colors.border,
                  }}
                >
                  {t(tab === "log" ? "nav.log" : "nav.progress")}
                </button>
              ))}
            </div>
          </div>

          {panelTab === "log" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SectionLabel color={accent}>{t("prototype.lastLog")}</SectionLabel>
              {!lastLog ? (
                <div style={styles.placeholder}>{t("prototype.noLog")}</div>
              ) : (
                <div style={styles.logCard}>
                  <div style={styles.logDate}>{formatDate(lastLog.date)}</div>
                  <div style={styles.logWeight}>{lastLog.weight ? `${lastLog.weight} kg` : "—"}</div>
                  {lastLog.reps && (
                    <div style={styles.logReps}>
                      × {lastLog.reps} {t("common.reps")}
                    </div>
                  )}
                  {lastLog.notes && <div style={styles.logNotes}>{lastLog.notes}</div>}
                </div>
              )}
            </div>
          )}

          {panelTab === "progress" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SectionLabel color={accent}>{t("prototype.stats")}</SectionLabel>
              {!stats ? (
                <div style={styles.placeholder}>{t("common.noData")}</div>
              ) : (
                <div style={styles.statsGrid}>
                  <StatCard label={t("progress.current")} value={`${stats.current} kg`} color={accent} />
                  <StatCard label={t("progress.max")} value={`${stats.max} kg`} color={colors.textPrimary} />
                  <StatCard label={t("progress.min")} value={`${stats.min} kg`} color={colors.textMuted} />
                </div>
              )}
              <div style={styles.helperText}>
                {chartHasData ? t("progress.titleWeight") : t("progress.needTwoLogs")}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const exerciseList = (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <DayTabs days={dayKeys} activeDay={activeDay} dayColors={dayColors} onSelect={(d) => setActiveDay(d)} />
      {day.exercises.map((ex, i) => (
        <ExerciseRow
          key={ex.id}
          exercise={ex}
          index={i}
          accentColor={accent}
          lastLog={getLastLog(logs, ex.id)}
          showChevron
          onClick={() => setSelectedExercise(ex)}
          progressDiff={(() => {
            const exLogs = logs[ex.id] || [];
            const first = parseFloat(exLogs.find((e) => e.weight)?.weight) || 0;
            const lastEntry = [...exLogs].reverse().find((e) => e.weight);
            const last = parseFloat(lastEntry?.weight) || 0;
            return last - first;
          })()}
        />
      ))}
    </div>
  );

  return (
    <PageContainer>
      <div style={styles.headerRow}>
        <SectionLabel color={accent}>{t("prototype.title")}</SectionLabel>
        {onExit && (
          <button onClick={onExit} style={styles.exitBtn}>
            {t("prototype.exit")}
          </button>
        )}
      </div>

      <div style={styles.modeSwitch}>
        {prototypeModes.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setMode(opt.key as typeof mode)}
            style={{
              ...styles.modeBtn,
              borderColor: mode === opt.key ? accent : colors.border,
              color: mode === opt.key ? accent : colors.textSecondary,
              background: mode === opt.key ? colors.surface : colors.bg,
            }}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>

      {mode === "drawer" && (
        <div style={styles.drawerLayout}>
          <div style={{ flex: 1 }}>{exerciseList}</div>
          <div style={styles.drawerPanel}>{detailPanel}</div>
        </div>
      )}

      {mode === "split" && (
        <div style={styles.splitLayout}>
          <div style={{ flex: 0.55 }}>{exerciseList}</div>
          <div style={{ flex: 0.45 }}>{detailPanel}</div>
        </div>
      )}

      {mode === "modal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {exerciseList}
          {selectedExercise && (
            <div style={styles.modalBackdrop} onClick={() => setSelectedExercise(null)}>
              <div style={{ ...styles.modalCard, borderColor: accent }} onClick={(e) => e.stopPropagation()}>
                <button style={styles.closeBtn} onClick={() => setSelectedExercise(null)}>
                  ×
                </button>
                {detailPanel}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "sheet" && (
        <div style={{ position: "relative" }}>
          {exerciseList}
          {selectedExercise && (
            <>
              <div style={styles.sheetScrim} onClick={() => setSelectedExercise(null)} />
              <div style={{ ...styles.sheetCard, borderColor: accent }}>{detailPanel}</div>
            </>
          )}
        </div>
      )}

      {mode === "tabs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={styles.tabSwitcher}>
            {(["plan", "insights"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                style={{
                  ...styles.tabBtn,
                  background: mobileTab === tab ? accent : colors.surface,
                  color: mobileTab === tab ? colors.bg : colors.textSecondary,
                  borderColor: mobileTab === tab ? accent : colors.border,
                }}
              >
                {t(tab === "plan" ? "prototype.tabPlan" : "prototype.tabInsights")}
              </button>
            ))}
          </div>

          {mobileTab === "plan" && exerciseList}

          {mobileTab === "insights" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={styles.chipRow}>
                {day.exercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExercise(ex)}
                    style={{
                      ...styles.chip,
                      borderColor: selectedExercise?.id === ex.id ? accent : colors.border,
                      color: selectedExercise?.id === ex.id ? accent : colors.textSecondary,
                    }}
                  >
                    {ex.name}
                  </button>
                ))}
              </div>
              {detailPanel}
            </div>
          )}
        </div>
      )}

      {mode === "feed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <DayTabs days={dayKeys} activeDay={activeDay} dayColors={dayColors} onSelect={(d) => setActiveDay(d)} />
          <div style={styles.feedColumn}>
            {day.exercises.map((ex, i) => {
              const exLogs = logs[ex.id] || [];
              const last = getLastLog(logs, ex.id);
              const first = parseFloat(exLogs.find((e) => e.weight)?.weight) || 0;
              const lastEntry = [...exLogs].reverse().find((e) => e.weight);
              const diff = (parseFloat(lastEntry?.weight) || 0) - first;
              return (
                <div key={ex.id} style={{ ...styles.feedCard, borderColor: accent }}>
                  <div style={styles.feedHeader}>
                    <div>
                      <div style={styles.feedLabel}>{`#${i + 1} ${ex.name}`}</div>
                      <div style={styles.exMeta}>
                        {ex.sets} {t("common.series")} · {ex.reps} {t("common.reps")} · {ex.rest}
                      </div>
                    </div>
                    <div style={{ ...styles.badge, background: accent }}>{t("prototype.quick")}</div>
                  </div>
                  <div style={styles.feedRow}>
                    <div style={styles.feedStat}>
                      <div style={styles.feedStatLabel}>{t("prototype.lastLog")}</div>
                      <div style={styles.feedStatValue}>{last?.weight ? `${last.weight} kg` : t("common.noData")}</div>
                    </div>
                    <div style={styles.feedStat}>
                      <div style={styles.feedStatLabel}>{t("progress.title")}</div>
                      <div style={styles.feedStatValue}>{diff ? `${diff > 0 ? "+" : ""}${diff} kg` : t("common.noData")}</div>
                    </div>
                    <button style={{ ...styles.feedAction, borderColor: accent, color: accent }} onClick={() => setSelectedExercise(ex)}>
                      {t("prototype.view")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {selectedExercise && (
            <div style={{ ...styles.feedDrawer, borderColor: accent }}>
              <button style={styles.closeBtn} onClick={() => setSelectedExercise(null)}>
                ×
              </button>
              {detailPanel}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

const styles: Record<string, CSSProperties> = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  exitBtn: {
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.textSecondary,
    borderRadius: 10,
    padding: "6px 10px",
    fontFamily: fonts.mono,
    fontSize: 11,
    cursor: "pointer",
  },
  modeSwitch: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
    marginBottom: 12,
  },
  modeBtn: {
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontFamily: fonts.sans,
    fontSize: 13,
    cursor: "pointer",
  },
  drawerLayout: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 12,
    alignItems: "start",
  },
  drawerPanel: {
    position: "sticky",
    top: 12,
  },
  splitLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  panelCard: {
    background: colors.surface,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    padding: 14,
    minHeight: 200,
  },
  placeholder: {
    color: colors.textGhost,
    fontSize: 12,
    textAlign: "center",
    padding: "20px 0",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  exLabel: {
    fontSize: 16,
    fontWeight: 700,
  },
  exMeta: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  tabPills: {
    display: "flex",
    gap: 6,
  },
  pill: {
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
    padding: "6px 12px",
    fontFamily: fonts.mono,
    fontSize: 11,
    cursor: "pointer",
  },
  logCard: {
    border: `1px solid ${colors.borderLight}`,
    borderRadius: 10,
    padding: 12,
    display: "grid",
    gap: 4,
    background: colors.bg,
  },
  logDate: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textDim,
  },
  logWeight: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.textPrimary,
  },
  logReps: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textMuted,
  },
  logNotes: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
  },
  helperText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textMuted,
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 10,
  },
  modalCard: {
    position: "relative",
    background: colors.surface,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    padding: 12,
    width: "min(900px, 100%)",
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    width: 32,
    height: 32,
    cursor: "pointer",
    color: colors.textSecondary,
    fontSize: 16,
  },
  sheetScrim: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    zIndex: 8,
  },
  sheetCard: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    background: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    border: `1px solid ${colors.border}`,
    boxShadow: "0 -8px 24px rgba(0,0,0,0.25)",
    zIndex: 9,
  },
  tabSwitcher: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  tabBtn: {
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    padding: "10px 12px",
    fontFamily: fonts.sans,
    fontSize: 14,
    cursor: "pointer",
  },
  chipRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    borderRadius: 14,
    border: `1px solid ${colors.border}`,
    padding: "6px 10px",
    fontFamily: fonts.mono,
    fontSize: 11,
    background: colors.surface,
    cursor: "pointer",
  },
  feedColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  feedCard: {
    background: colors.surface,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  feedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  feedLabel: {
    fontSize: 15,
    fontWeight: 700,
  },
  badge: {
    padding: "6px 10px",
    borderRadius: 12,
    color: colors.bg,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  feedRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: 8,
    alignItems: "center",
  },
  feedStat: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  feedStatLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
  },
  feedStatValue: {
    fontFamily: fonts.mono,
    fontSize: 16,
    color: colors.textPrimary,
  },
  feedAction: {
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    padding: "10px 12px",
    background: colors.bg,
    fontFamily: fonts.mono,
    fontSize: 12,
    cursor: "pointer",
  },
  feedDrawer: {
    position: "fixed",
    bottom: 20,
    left: 12,
    right: 12,
    background: colors.surface,
    borderRadius: 14,
    border: `1px solid ${colors.border}`,
    boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
    padding: 12,
    zIndex: 7,
  },
};
