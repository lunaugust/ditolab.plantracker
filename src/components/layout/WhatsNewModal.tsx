import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";
import { CHANGELOG, APP_VERSION } from "../../data/changelog";

/**
 * "What's New" bottom-sheet modal.
 *
 * Shows the features from the latest CHANGELOG entry.
 * Dismissing it persists APP_VERSION to localStorage so it won't
 * appear again until the next release.
 *
 * @param {{ onDismiss: () => void }} props
 */
export function WhatsNewModal({ onDismiss }: { onDismiss: () => void }) {
  const { t, language } = useI18n();

  const latest = CHANGELOG[0];
  if (!latest) return null;

  const lang = language === "en" ? "en" : "es";

  return (
    /* Backdrop — click-outside to dismiss */
    <div onClick={onDismiss} style={styles.backdrop}>
      {/* Sheet — stops propagation so clicking inside doesn't dismiss */}
      <div onClick={(e) => e.stopPropagation()} style={styles.sheet}>
        {/* Drag handle */}
        <div style={styles.handle} />

        {/* Title row */}
        <div style={styles.titleRow}>
          <div>
            <div style={styles.title}>{t("whatsNew.title")}</div>
            <div style={styles.versionBadge}>
              {t("whatsNew.version")} {APP_VERSION} · {latest.date}
            </div>
          </div>
          <button onClick={onDismiss} style={styles.closeBtn} aria-label={t("common.close")}>
            ✕
          </button>
        </div>

        {/* Feature list */}
        <ul style={styles.featureList}>
          {latest.features.map((feat, i) => (
            <li key={i} style={styles.featureItem}>
              <span style={styles.featureIcon}>{feat.icon}</span>
              <span style={styles.featureText}>{feat[lang]}</span>
            </li>
          ))}
        </ul>

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
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "flex-end",
  },
  sheet: {
    width: "100%",
    background: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: "16px 20px max(28px, env(safe-area-inset-bottom))",
    borderTop: `1px solid ${colors.border}`,
    boxSizing: "border-box",
    maxHeight: "85dvh",
    overflowY: "auto",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    background: colors.border,
    margin: "0 auto 20px",
  },
  titleRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: colors.accent.blue,
  },
  versionBadge: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: colors.textDim,
    fontSize: 16,
    cursor: "pointer",
    padding: "4px 8px",
    WebkitTapHighlightColor: "transparent",
  },
  featureList: {
    listStyle: "none",
    margin: "0 0 24px",
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
    borderRadius: 14,
    padding: "15px 20px",
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.05em",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
};
