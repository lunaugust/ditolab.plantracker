import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";
import { CHANGELOG, APP_VERSION } from "../../data/changelog";
import {
  performanceGhostButtonStyle,
  performanceHeroStyle,
  performancePanelStyle,
} from "../../theme/editorialPerformance";

/**
 * "What's New" bottom-sheet modal.
 *
 * Shows the features from the latest CHANGELOG entry and the immediately previous one.
 * Dismissing it persists APP_VERSION to localStorage so it won't
 * appear again until the next release.
 *
 * @param {{ onDismiss: () => void }} props
 */
export function WhatsNewModal({ onDismiss }: { onDismiss: () => void }) {
  const { t, language } = useI18n();

  const visibleEntries = CHANGELOG.slice(0, 2);
  if (visibleEntries.length === 0) return null;

  const lang = language === "en" ? "en" : "es";

  return (
    /* Backdrop — click-outside to dismiss */
    <div onClick={onDismiss} style={styles.backdrop}>
      {/* Sheet — stops propagation so clicking inside doesn't dismiss */}
      <div onClick={(e) => e.stopPropagation()} style={styles.sheet}>
        {/* Drag handle */}
        <div style={styles.handle} />

        {/* Title row */}
        <div style={{ ...styles.heroCard, ...performanceHeroStyle(colors.accent.blue) }}>
          <div style={styles.titleRow}>
            <div>
              <div style={styles.title}>{t("whatsNew.title")}</div>
              <div style={styles.versionBadge}>
                {t("whatsNew.version")} {APP_VERSION}
              </div>
            </div>
            <button onClick={onDismiss} style={styles.closeBtn} aria-label={t("common.close")}>
              ✕
            </button>
          </div>
        </div>

        {visibleEntries.map((entry, entryIndex) => (
          <div key={entry.version} style={{ ...styles.entryCard, ...performancePanelStyle(entryIndex === 0 ? colors.accent.blue : undefined) }}>
            <div style={styles.entryHeader}>
              <div style={styles.entryVersion}>
                {t("whatsNew.version")} {entry.version}
              </div>
              <div style={styles.entryDate}>{entry.date}</div>
            </div>
            <ul style={styles.featureList}>
              {entry.features.map((feat, i) => (
                <li key={`${entry.version}-${i}`} style={styles.featureItem}>
                  <span style={styles.featureIcon}>{feat.icon}</span>
                  <span style={styles.featureText}>{feat[lang]}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Dismiss button */}
        <button onClick={onDismiss} style={styles.dismissBtn}>
          {t("whatsNew.dismiss")}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 300,
    background: "rgba(0,0,0,0.58)",
    display: "flex",
    alignItems: "flex-end",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  sheet: {
    width: "100%",
    background: `linear-gradient(180deg, ${colors.textPrimary}0a 0%, ${colors.surface}f2 100%)`,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: "16px 20px max(28px, env(safe-area-inset-bottom))",
    borderTop: `1px solid ${colors.textPrimary}10`,
    boxSizing: "border-box",
    maxHeight: "85dvh",
    overflowY: "auto",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    animation: "quietGlassSheetIn 420ms cubic-bezier(0.22, 1, 0.36, 1) both",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    background: colors.border,
    margin: "0 auto 20px",
  },
  heroCard: {
    marginBottom: 18,
  },
  titleRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: -1.1,
    color: colors.textPrimary,
    lineHeight: 1.05,
  },
  versionBadge: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 8,
    letterSpacing: 1,
  },
  closeBtn: {
    ...performanceGhostButtonStyle(colors.accent.blue),
    background: colors.surfaceElevated,
    color: colors.textSecondary,
    fontSize: 14,
    cursor: "pointer",
    padding: "8px 12px",
    WebkitTapHighlightColor: "transparent",
  },
  entryCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 26,
  },
  entryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  entryVersion: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  entryDate: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
    whiteSpace: "nowrap",
  },
  featureList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  featureIcon: {
    flexShrink: 0,
    fontSize: 16,
    minWidth: 24,
    color: colors.accent.blue,
    fontFamily: fonts.mono,
    paddingTop: 1,
  },
  featureText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 1.55,
    fontFamily: fonts.sans,
  },
  dismissBtn: {
    width: "100%",
    background: colors.accent.blue,
    color: colors.bg,
    border: "none",
    borderRadius: 20,
    padding: "15px 20px",
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.05em",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
};
