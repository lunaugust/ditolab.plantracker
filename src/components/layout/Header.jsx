import { colors, fonts, NAV_ITEMS } from "../../theme";
import { useI18n } from "../../i18n";

/** Simple SVG icons for the bottom nav */
const NAV_ICONS = {
  plan: (color) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  ),
  log: (color) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  progress: (color) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
};

/**
 * Top header with branding + save feedback.
 * Bottom sticky navigation bar (mobile-friendly).
 */
export function Header({ view, onViewChange, saveMsg, authUserName, onSignOut }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <>
      {/* Top bar — branding */}
      <div style={styles.topBar}>
        <div>
          <div style={styles.subtitle}>{t("header.subtitle")}</div>
          <div style={styles.title}>{authUserName?.split(" ")[0] || "GymBuddy"}</div>
        </div>
        <div style={styles.actions}>
          <div style={styles.langSwitch}>
            {[
              ["es", "ES"],
              ["en", "EN"],
            ].map(([code, label]) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                style={{
                  ...styles.langBtn,
                  color: language === code ? colors.textPrimary : colors.textMuted,
                  borderColor: language === code ? colors.accent.orange : colors.border,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {saveMsg && <div style={styles.saveMsg}>{saveMsg}</div>}
          {onSignOut && (
            <button onClick={onSignOut} style={styles.signOutBtn}>
              {t("header.signOut")}
            </button>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <nav style={styles.bottomNav}>
        {NAV_ITEMS.map(({ key, labelKey }) => {
          const isActive = view === key;
          const color = isActive ? colors.accent.orange : colors.textDim;
          return (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              style={{
                ...styles.navBtn,
                color,
              }}
            >
              {NAV_ICONS[key](color)}
              <span style={{
                ...styles.navLabel,
                color,
                fontWeight: isActive ? 600 : 400,
              }}>
                {t(labelKey)}
              </span>
              {isActive && <div style={styles.activeIndicator} />}
            </button>
          );
        })}
      </nav>
    </>
  );
}

const styles = {
  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    borderBottom: `1px solid ${colors.border}`,
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: `${colors.bg}ee`,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  saveMsg: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.success,
    background: `${colors.success}15`,
    padding: "6px 12px",
    borderRadius: 20,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  langSwitch: {
    display: "flex",
    gap: 4,
  },
  langBtn: {
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    borderRadius: 12,
    minWidth: 34,
    minHeight: 24,
    fontSize: 10,
    fontFamily: fonts.mono,
    cursor: "pointer",
    padding: "0 6px",
  },
  signOutBtn: {
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.textSecondary,
    borderRadius: 20,
    padding: "6px 10px",
    fontSize: 11,
    fontFamily: fonts.mono,
    cursor: "pointer",
  },
  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    background: `${colors.bg}f5`,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderTop: `1px solid ${colors.border}`,
    paddingTop: 8,
    paddingBottom: "max(8px, env(safe-area-inset-bottom))",
  },
  navBtn: {
    position: "relative",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    background: "none",
    border: "none",
    padding: "6px 0",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    transition: "color 0.15s",
  },
  navLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    transition: "color 0.15s",
  },
  activeIndicator: {
    position: "absolute",
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    background: colors.accent.orange,
  },
};
