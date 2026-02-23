import { colors, fonts } from "../../theme";

/**
 * Horizontal tab bar for switching between training days.
 *
 * @param {{ days: string[], activeDay: string, dayColors: Record<string,string>, onSelect: (day: string) => void }} props
 */
export function DayTabs({ days, activeDay, dayColors, onSelect }) {
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
              border: isActive
                ? `2px solid ${dayColors[day]}`
                : `2px solid ${colors.border}`,
              background: isActive ? colors.surface : colors.bg,
              color: isActive ? dayColors[day] : colors.textDim,
            }}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    padding: "14px 10px",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: 1,
    transition: "all 0.15s",
    minHeight: 48,
    WebkitTapHighlightColor: "transparent",
  },
};
