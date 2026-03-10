import { colors, fonts } from "../../theme";
import { performanceEyebrowStyle } from "../../theme/editorialPerformance";
import type { CSSProperties, ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  color?: string;
}

export function SectionLabel({ children, color = colors.textMuted }: SectionLabelProps) {
  return (
    <div
      style={{
        ...performanceEyebrowStyle(color),
        letterSpacing: 2.6,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}
