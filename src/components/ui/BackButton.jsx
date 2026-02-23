import { colors, fonts } from "../../theme";

/**
 * "← volver" back button for detail screens.
 * 44px minimum touch target for accessibility.
 *
 * @param {{ onClick: () => void }} props
 */
export function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        color: colors.textMuted,
        cursor: "pointer",
        fontFamily: fonts.mono,
        fontSize: 13,
        marginBottom: 16,
        padding: "10px 12px 10px 0",
        minHeight: 44,
        display: "flex",
        alignItems: "center",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      ← volver
    </button>
  );
}
