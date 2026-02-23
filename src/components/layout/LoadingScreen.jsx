import { colors, fonts } from "../../theme";

/**
 * Full-screen loading splash — PWA-friendly.
 */
export function LoadingScreen() {
  return (
    <div
      style={{
        background: colors.bg,
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 700, color: colors.accent.orange, letterSpacing: -1 }}>
        GB
      </div>
      <div style={{ color: colors.textMuted, fontFamily: fonts.mono, fontSize: 13 }}>
        GymBuddy AI
      </div>
    </div>
  );
}
