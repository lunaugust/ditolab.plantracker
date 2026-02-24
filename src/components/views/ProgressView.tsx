import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getLastLog, buildChartData, computeWeightStats } from "../../utils/helpers";
import { DayTabs, SectionLabel, BackButton, PageContainer, StatCard } from "../ui";
import { ExerciseRow } from "../exercises";
import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";

/**
 * "Progresión" screen — charts + stats for each exercise.
 *
 * @param {{
 *   activeDay: string,
 *   setActiveDay: (d: string) => void,
 *   trainingPlan: Record<string, import("../../data/trainingPlan").TrainingDay>,
 *   dayKeys: string[],
 *   dayColors: Record<string, string>,
 *   selectedExercise: import("../../data/trainingPlan").Exercise | null,
 *   selectExercise: (ex: import("../../data/trainingPlan").Exercise) => void,
 *   clearExercise: () => void,
 *   logs: Record<string, import("../../services/types").LogEntry[]>,
 * }} props
 */
export function ProgressView({
  activeDay,
  setActiveDay,
  trainingPlan,
  dayKeys,
  dayColors,
  selectedExercise,
  selectExercise,
  clearExercise,
  logs,
}) {
  const { t } = useI18n();
  const safeActiveDay = trainingPlan[activeDay] ? activeDay : dayKeys[0];
  const day = safeActiveDay ? trainingPlan[safeActiveDay] : { exercises: [] };
  const accentColor = dayColors[safeActiveDay];

  /* ---- Exercise picker ---- */
  if (!selectedExercise) {
    return (
      <PageContainer>
        <SectionLabel>{t("progress.titleWeight")}</SectionLabel>

        <DayTabs
          days={dayKeys}
          activeDay={safeActiveDay}
          dayColors={dayColors}
          onSelect={setActiveDay}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {day.exercises.map((ex, i) => {
            const exLogs = logs[ex.id] || [];
            const hasWeight = exLogs.some((e) => e.weight);

            if (!hasWeight) {
              return (
                <ExerciseRow
                  key={ex.id}
                  exercise={ex}
                  index={i}
                  accentColor={accentColor}
                  disabled
                />
              );
            }

            const first = parseFloat(exLogs.find((e) => e.weight)?.weight) || 0;
            const lastEntry = [...exLogs].reverse().find((e) => e.weight);
            const last = parseFloat(lastEntry?.weight) || 0;
            const diff = last - first;

            return (
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                index={i}
                accentColor={accentColor}
                lastLog={lastEntry}
                totalLogs={exLogs.length}
                showDetails={false}
                showChevron
                progressDiff={diff}
                onClick={() => selectExercise(ex)}
              />
            );
          })}
        </div>
      </PageContainer>
    );
  }

  /* ---- Detail: chart + stats ---- */
  const entries = logs[selectedExercise.id] || [];
  const chartData = buildChartData(entries).filter((d) => d.peso > 0);
  const stats = computeWeightStats(entries);

  return (
    <PageContainer>
      <BackButton onClick={clearExercise} />

      <div style={{ marginBottom: 24 }}>
        <SectionLabel color={accentColor}>{t("progress.title")}</SectionLabel>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedExercise.name}</div>
      </div>

      {/* Chart */}
      {chartData.length < 2 ? (
        <div style={styles.noDataCard}>
          <div style={styles.noDataText}>
            {t("progress.needTwoLogs")}
          </div>
        </div>
      ) : (
        <div style={styles.chartCard}>
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
        <div style={styles.statsGrid}>
          <StatCard label={t("progress.current")} value={`${stats.current} kg`} color={accentColor} />
          <StatCard label={t("progress.max")} value={`${stats.max} kg`} color={colors.textPrimary} />
          <StatCard label={t("progress.min")} value={`${stats.min} kg`} color={colors.textMuted} />
        </div>
      )}
    </PageContainer>
  );
}

const styles = {
  noDataCard: {
    background: colors.surface,
    borderRadius: 12,
    padding: 40,
    textAlign: "center",
    border: `1px solid ${colors.border}`,
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
