import styles from "./LoadingScreen.module.css";

/**
 * Full-screen loading splash — PWA-friendly.
 */
export function LoadingScreen() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.mark}>
          GB
        </div>
        <div className={styles.label}>
          GymBuddy AI
        </div>
      </div>
    </div>
  );
}
