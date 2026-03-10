import { colors, fonts } from "../../theme";
import headerStyles from "./Header.module.css";
import { useI18n } from "../../i18n";

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
  canInstall: boolean;
  onInstall: () => void;
}

export function Header({ saveMsg, authUserName, onSignOut, onOpenFeedback, canInstall, onInstall }: HeaderProps) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className={headerStyles.topBar}>
      <div className={headerStyles.titleBlock}>
        <div className={headerStyles.subtitle}>{t("header.subtitle")}</div>
        <div className={headerStyles.title}>{authUserName?.split(" ")[0] || "GymBuddy"}</div>
      </div>
      <div className={headerStyles.actions}>
        <div className={headerStyles.langSwitch}>
          {[
            ["es", "ES"],
            ["en", "EN"],
          ].map(([code, label]) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`${headerStyles.langBtn} ${language === code ? headerStyles.langBtnActive : ""}`.trim()}
            >
              {label}
            </button>
          ))}
        </div>
        {saveMsg && <div className={headerStyles.saveMsg}>{saveMsg}</div>}
        {canInstall && (
          <button
            onClick={onInstall}
            title={t("header.install")}
            className={`${headerStyles.ghostBase} ${headerStyles.ghostOrange} ${headerStyles.installBtn}`}
          >
            <InstallIcon />
          </button>
        )}
        <button
          onClick={onOpenFeedback}
          title={t("feedback.title")}
          className={`${headerStyles.ghostBase} ${headerStyles.ghostNeutral} ${headerStyles.feedbackBtn}`}
        >
          💬
        </button>
        {onSignOut && (
          <button onClick={onSignOut} className={`${headerStyles.ghostBase} ${headerStyles.ghostNeutral}`}>
            {t("header.signOut")}
          </button>
        )}
      </div>
    </div>
  );
}
