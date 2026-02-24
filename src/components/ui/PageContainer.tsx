import { layout } from "../../theme";

/**
 * Max-width page wrapper (centres content, mobile-friendly padding).
 *
 * @param {{ children: React.ReactNode }} props
 */
export function PageContainer({ children }) {
  return (
    <div
      style={{
        maxWidth: layout.maxContentWidth,
        margin: "0 auto",
        padding: "16px 16px 24px",
      }}
    >
      {children}
    </div>
  );
}
