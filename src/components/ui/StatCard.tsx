import { colors, fonts } from "../../theme";
import { performancePanelStyle } from "../../theme/editorialPerformance";
import type { CSSProperties } from "react";

interface StatCardProps {
  label: string;
  value: string;
  color?: string;
}

export function StatCard({ label, value, color = colors.textPrimary }: StatCardProps) {
  return (
    <div style={styles.card}>
      <div style={styles.label}>{label.toUpperCase()}</div>
      <div style={{ ...styles.value, color }}>{value}</div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    ...performancePanelStyle(undefined, true),
    borderRadius: 22,
    padding: "20px 14px",
    textAlign: "center",
    flex: 1,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 8,
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: 19,
    fontWeight: 600,
  },
};
