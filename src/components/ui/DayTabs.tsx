import { colors, fonts } from "../../theme";
import { performancePillStyle } from "../../theme/editorialPerformance";
import type { CSSProperties } from "react";

interface DayTabsProps {
  days: string[];
  activeDay: string;
  dayColors: Record<string, string>;
  onSelect: (day: string) => void;
}

export function DayTabs({ days, activeDay, dayColors, onSelect }: DayTabsProps) {
  return (
    <div style={styles.container}>
      {days.map((day) => {
        const isActive = activeDay === day;
        return (
          <button
            key={day}
            onClick={() => onSelect(day)}
            style={{
              ...styles.tab,
              ...performancePillStyle(isActive, dayColors[day]),
            }}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    padding: 6,
    background: colors.surfaceAlt,
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
  },
  tab: {
    flex: 1,
    padding: "12px 10px",
    cursor: "pointer",
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: 1,
    transition: "all 0.15s",
    minHeight: 48,
    WebkitTapHighlightColor: "transparent",
  },
};
