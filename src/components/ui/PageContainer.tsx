import { layout } from "../../theme";
import styles from "./PageContainer.module.css";
import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return <div className={styles.container}>{children}</div>;
}
