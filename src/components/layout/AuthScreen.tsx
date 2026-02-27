import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";

export function AuthScreen({ onSignIn, error }) {
  const { t } = useI18n();

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.title}>{t("app.name")}</div>
        <div style={styles.subtitle}>{t("auth.subtitle")}</div>

        <button onClick={onSignIn} style={styles.googleBtn}>
          {t("auth.signInGoogle")}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100dvh",
    background: colors.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 18,
  },
  googleBtn: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.textPrimary,
    borderRadius: 10,
    minHeight: 46,
    fontSize: 14,
    fontWeight: 700,
    fontFamily: fonts.sans,
    cursor: "pointer",
  },
  error: {
    marginTop: 12,
    color: colors.warning,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
};
