import { useState, useEffect } from "react";
import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";
import { fetchExerciseDetails, type ExerciseDetails } from "../../services/exerciseDbService";
import type { Exercise } from "../../services/types";

/**
 * Modal showing exercise details from ExerciseDB
 *
 * Displays GIF, instructions, target muscles, and equipment
 * Only shown for exercises that have an exerciseDbId
 */
export function ExerciseDetailsModal({
  exercise,
  onClose,
}: {
  exercise: Exercise;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [details, setDetails] = useState<ExerciseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!exercise.exerciseDbId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadDetails() {
      try {
        const data = await fetchExerciseDetails(exercise.exerciseDbId!);
        if (mounted) {
          setDetails(data);
          setError(!data);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      mounted = false;
    };
  }, [exercise.exerciseDbId]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.title}>{t("exercise.details")}</div>
            <div style={styles.exerciseName}>{exercise.name}</div>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            ×
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {loading && (
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <div style={styles.loadingText}>{t("exercise.loadingDetails")}</div>
            </div>
          )}

          {error && !loading && (
            <div style={styles.errorState}>
              <div style={styles.errorText}>{t("exercise.errorLoading")}</div>
            </div>
          )}

          {!loading && !error && !exercise.exerciseDbId && (
            <div style={styles.noDataState}>
              <div style={styles.noDataText}>{t("plan.customExercise")}</div>
              <div style={styles.noDataSubtext}>
                {t("exercise.noInstructions")}
              </div>
            </div>
          )}

          {!loading && !error && details && (
            <>
              {/* GIF */}
              {details.gifUrl && (
                <div style={styles.gifContainer}>
                  <img
                    src={details.gifUrl}
                    alt={details.name}
                    style={styles.gif}
                    loading="lazy"
                  />
                </div>
              )}

              {/* Metadata */}
              <div style={styles.metaGrid}>
                <div style={styles.metaItem}>
                  <div style={styles.metaLabel}>{t("exercise.targetMuscle")}</div>
                  <div style={styles.metaValue}>{details.target || "—"}</div>
                </div>
                <div style={styles.metaItem}>
                  <div style={styles.metaLabel}>{t("exercise.equipment")}</div>
                  <div style={styles.metaValue}>{details.equipment || "—"}</div>
                </div>
              </div>

              {/* Instructions */}
              {details.instructions && details.instructions.length > 0 && (
                <div style={styles.instructionsSection}>
                  <div style={styles.instructionsTitle}>
                    {t("exercise.instructions")}
                  </div>
                  <ol style={styles.instructionsList}>
                    {details.instructions.map((instruction, i) => (
                      <li key={i} style={styles.instructionItem}>
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Exercise plan details */}
              <div style={styles.planDetails}>
                <div style={styles.planDetailItem}>
                  <span style={styles.planDetailLabel}>{t("common.series")}:</span>{" "}
                  {exercise.sets}
                </div>
                <div style={styles.planDetailItem}>
                  <span style={styles.planDetailLabel}>{t("common.reps")}:</span>{" "}
                  {exercise.reps}
                </div>
                {exercise.rest && (
                  <div style={styles.planDetailItem}>
                    <span style={styles.planDetailLabel}>Rest:</span> {exercise.rest}
                  </div>
                )}
              </div>

              {exercise.note && (
                <div style={styles.note}>
                  <span style={styles.noteIcon}>⚠</span> {exercise.note}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.closeButtonBottom}>
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    backgroundColor: colors.bg,
    borderRadius: 16,
    maxWidth: 600,
    width: "100%",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: `1px solid ${colors.border}`,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px",
    borderBottom: `1px solid ${colors.border}`,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 600,
    color: colors.textPrimary,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: 32,
    color: colors.textMuted,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
    marginTop: -4,
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
  },
  spinner: {
    width: 40,
    height: 40,
    border: `4px solid ${colors.border}`,
    borderTop: `4px solid ${colors.accent.blue}`,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: 16,
    color: colors.textMuted,
    fontSize: 14,
  },
  errorState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "60px 20px",
  },
  errorText: {
    color: colors.warning,
    fontSize: 14,
  },
  noDataState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "60px 20px",
  },
  noDataText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 500,
    marginBottom: 8,
  },
  noDataSubtext: {
    color: colors.textMuted,
    fontSize: 14,
  },
  gifContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  gif: {
    width: "100%",
    maxWidth: 400,
    height: "auto",
    display: "block",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 24,
  },
  metaItem: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  metaLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 500,
    textTransform: "capitalize",
  },
  instructionsSection: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  instructionsList: {
    margin: 0,
    paddingLeft: 20,
  },
  instructionItem: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  planDetails: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },
  planDetailItem: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  planDetailLabel: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textMuted,
  },
  note: {
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
    color: colors.warning,
    fontStyle: "italic",
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
  },
  noteIcon: {
    fontSize: 16,
  },
  footer: {
    padding: "16px 24px",
    borderTop: `1px solid ${colors.border}`,
    display: "flex",
    justifyContent: "flex-end",
  },
  closeButtonBottom: {
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    color: colors.textPrimary,
    padding: "10px 24px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: fonts.sans,
  },
};
