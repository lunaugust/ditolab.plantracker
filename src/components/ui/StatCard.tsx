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
    borderRadius: 18,
    padding: "18px 14px",
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
    fontSize: 17,
    fontWeight: 600,
  },
};
