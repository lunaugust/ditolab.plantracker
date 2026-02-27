import { layout } from "../../theme";
import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
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
