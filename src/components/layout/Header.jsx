import { colors, fonts, NAV_ITEMS } from "../../theme";

/**
 * Top-level header with branding and navigation tabs.
 *
 * @param {{
 *   view: import("../../services/types").ViewKey,
 *   onViewChange: (v: import("../../services/types").ViewKey) => void,
 *   saveMsg: string,
 * }} props
 */
export function Header({ view, onViewChange, saveMsg }) {
  return (
    <div style={styles.container}>
      {/* Branding */}
      <div>
        <div style={styles.subtitle}>Entrenamiento</div>
        <div style={styles.title}>Augusto</div>
      </div>

      {/* Save feedback */}
      {saveMsg && <div style={styles.saveMsg}>{saveMsg}</div>}

      {/* Nav */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map(({ key, label }) => {
          const isActive = view === key;
          return (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              style={{
                ...styles.navBtn,
                background: isActive ? "#1e1e1e" : "transparent",
                color: isActive ? colors.textPrimary : colors.textMuted,
              }}
            >
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

const styles = {
  container: {
    borderBottom: `1px solid ${colors.border}`,
    padding: "18px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  saveMsg: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.success,
  },
  nav: {
    display: "flex",
    gap: 4,
    background: colors.surface,
    borderRadius: 10,
    padding: 4,
  },
  navBtn: {
    border: "none",
    padding: "8px 16px",
    borderRadius: 7,
    cursor: "pointer",
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.15s",
  },
};
