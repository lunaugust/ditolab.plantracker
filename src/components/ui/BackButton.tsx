import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";

/**
 * "← volver" back button for detail screens.
 * 44px minimum touch target for accessibility.
 *
 * @param {{ onClick: () => void }} props
 */
export function BackButton({ onClick }) {
  const { t } = useI18n();

  return (
    <button
      onClick={onClick}
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        color: colors.textSecondary,
        cursor: "pointer",
        fontFamily: fonts.mono,
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 16,
        padding: "10px 16px",
        minHeight: 44,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 10,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {t("common.back")}
    </button>
  );
}
