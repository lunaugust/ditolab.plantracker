import { colors, fonts } from "../../theme";

/**
 * "← volver" back button for detail screens.
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
        fontSize: 12,
        marginBottom: 20,
        padding: 0,
      }}
    >
      ← volver
    </button>
  );
}
