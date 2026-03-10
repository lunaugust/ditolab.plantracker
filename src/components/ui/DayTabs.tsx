import { colors, fonts } from "../../theme";
import { performancePanelStyle, performancePillStyle } from "../../theme/editorialPerformance";
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
    ...performancePanelStyle(undefined, true),
    display: "flex",
    gap: 8,
    marginBottom: 16,
    padding: 6,
    borderRadius: 24,
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  tab: {
    flex: "1 1 0",
    padding: "12px 14px",
    cursor: "pointer",
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: 0.8,
    transition: "all 0.15s",
    minHeight: 48,
    minWidth: 86,
    WebkitTapHighlightColor: "transparent",
  },
};
