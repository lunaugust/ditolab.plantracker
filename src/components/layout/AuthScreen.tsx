import styles from "./AuthScreen.module.css";
import { useI18n } from "../../i18n";

interface AuthScreenProps {
  onSignIn: () => void;
  error: string;
}

export function AuthScreen({ onSignIn, error }: AuthScreenProps) {
  const { t } = useI18n();

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.title}>{t("app.name")}</div>
        <div className={styles.subtitle}>{t("auth.subtitle")}</div>

        <button onClick={onSignIn} className={styles.googleBtn}>
          {t("auth.signInGoogle")}
        </button>

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
}
