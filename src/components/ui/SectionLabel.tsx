import { colors, fonts } from "../../theme";

/**
 * Small section-heading label (mono, uppercase, letter-spaced).
 *
 * @param {{ children: React.ReactNode, color?: string }} props
 */
export function SectionLabel({ children, color = colors.textMuted }) {
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 10,
        color,
        letterSpacing: 3,
        textTransform: "uppercase",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}
