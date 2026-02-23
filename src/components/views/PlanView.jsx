import { TRAINING_PLAN, DAY_KEYS, DAY_COLORS } from "../../data/trainingPlan";
import { getLastLog } from "../../utils/helpers";
import { DayTabs, SectionLabel, PageContainer } from "../ui";
import { ExerciseRow } from "../exercises";
import { colors, fonts } from "../../theme";

/**
 * "Plan" screen — shows the structured training plan per day.
 *
 * @param {{
 *   activeDay: string,
 *   setActiveDay: (d: string) => void,
 *   logs: Record<string, import("../../services/types").LogEntry[]>,
 * }} props
 */
export function PlanView({ activeDay, setActiveDay, logs }) {
  const day = TRAINING_PLAN[activeDay];

  return (
    <PageContainer>
      <DayTabs
        days={DAY_KEYS}
        activeDay={activeDay}
        dayColors={DAY_COLORS}
        onSelect={setActiveDay}
      />

      {/* Day info header */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel color={DAY_COLORS[activeDay]}>{activeDay}</SectionLabel>
        <div style={{ fontSize: 15, color: colors.textSecondary, fontWeight: 300 }}>
          {day.label}
        </div>
      </div>

      {/* Exercise list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {day.exercises.map((ex, i) => (
          <ExerciseRow
            key={ex.id}
            exercise={ex}
            index={i}
            accentColor={DAY_COLORS[activeDay]}
            lastLog={getLastLog(logs, ex.id)}
          />
        ))}
      </div>
    </PageContainer>
  );
}
