import { colors, fonts } from "../../theme";
import type { CSSProperties, ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  color?: string;
}

export function SectionLabel({ children, color = colors.textMuted }: SectionLabelProps) {
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 10,
        color,
        letterSpacing: 3,
        textTransform: "uppercase" as CSSProperties["textTransform"],
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}
