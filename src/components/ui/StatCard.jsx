import { colors, fonts } from "../../theme";

/**
 * Stat card shown in the progress detail (Actual / Máximo / Mínimo).
 *
 * @param {{ label: string, value: string, color?: string }} props
 */
export function StatCard({ label, value, color = colors.textPrimary }) {
  return (
    <div style={styles.card}>
      <div style={styles.label}>{label.toUpperCase()}</div>
      <div style={{ ...styles.value, color }}>{value}</div>
    </div>
  );
}

const styles = {
  card: {
    background: colors.surface,
    borderRadius: 10,
    padding: 16,
    border: `1px solid ${colors.borderLight}`,
    textAlign: "center",
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textDim,
    letterSpacing: 2,
    marginBottom: 8,
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: 18,
    fontWeight: 600,
  },
};
