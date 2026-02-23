import { colors, fonts } from "../../theme";

/**
 * Full-screen loading spinner.
 */
export function LoadingScreen() {
  return (
    <div
      style={{
        background: colors.bg,
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ color: colors.textPrimary, fontFamily: "monospace", fontSize: 18 }}>
        Cargando...
      </div>
    </div>
  );
}
