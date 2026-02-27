import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";
import type { CSSProperties } from "react";

/** Download / install icon */
const InstallIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface HeaderProps {
  saveMsg: string;
  authUserName?: string | null;
  onSignOut: (() => void) | null;
  onOpenFeedback: () => void;
  onOpenPlanManager?: () => void;
  activePlanName?: string;
  canEdit?: boolean;
  canInstall: boolean;
  onInstall: () => void;
}

export function Header({ saveMsg, authUserName, onSignOut, onOpenFeedback, onOpenPlanManager, activePlanName, canEdit, canInstall, onInstall }: HeaderProps) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div style={styles.topBar}>
      <div>
        <div style={styles.subtitle}>{t("header.subtitle")}</div>
        <div style={styles.titleRow}>
          <div style={styles.title}>{authUserName?.split(" ")[0] || "GymBuddy"}</div>
          {onOpenPlanManager && activePlanName && (
            <button onClick={onOpenPlanManager} style={styles.planBtn} title={t("planManager.switchPlan")}>
              {activePlanName} {canEdit === false ? "🔒" : "▾"}
            </button>
          )}
        </div>
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
        {canInstall && (
          <button
            onClick={onInstall}
            title={t("header.install")}
            style={styles.installBtn}
          >
            <InstallIcon />
          </button>
        )}
        <button
          onClick={onOpenFeedback}
          title={t("feedback.title")}
          style={styles.feedbackBtn}
        >
          💬
        </button>
        {onSignOut && (
          <button onClick={onSignOut} style={styles.signOutBtn}>
            {t("header.signOut")}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
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
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  planBtn: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    color: colors.textSecondary,
    borderRadius: 16,
    padding: "4px 10px",
    fontSize: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
    maxWidth: 150,
    overflow: "hidden",
    textOverflow: "ellipsis",
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
  feedbackBtn: {
    background: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 6px",
    lineHeight: 1,
    WebkitTapHighlightColor: "transparent",
    minWidth: 36,
    minHeight: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  installBtn: {
    background: colors.surface,
    border: `1px solid ${colors.accent.orange}`,
    color: colors.accent.orange,
    borderRadius: 20,
    padding: "6px 10px",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    minWidth: 36,
    minHeight: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
};
