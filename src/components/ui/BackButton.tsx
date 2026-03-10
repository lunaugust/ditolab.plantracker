import { colors, fonts } from "../../theme";
import styles from "./BackButton.module.css";
import { useI18n } from "../../i18n";

interface BackButtonProps {
  onClick: () => void;
}

export function BackButton({ onClick }: BackButtonProps) {
  const { t } = useI18n();

  return (
    <button onClick={onClick} className={styles.button}>
      {t("common.back")}
    </button>
  );
}
