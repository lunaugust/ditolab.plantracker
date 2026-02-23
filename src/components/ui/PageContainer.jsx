import { colors, fonts, layout } from "../../theme";

/**
 * Max-width page wrapper (centres content).
 *
 * @param {{ children: React.ReactNode }} props
 */
export function PageContainer({ children }) {
  return (
    <div
      style={{
        maxWidth: layout.maxContentWidth,
        margin: "0 auto",
        padding: "24px 20px",
      }}
    >
      {children}
    </div>
  );
}
