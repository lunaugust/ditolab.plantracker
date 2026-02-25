import { useState, useEffect } from "react";
import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";
import { getExerciseMedia } from "../../services/exerciseMediaService";

/**
 * Bottom-sheet modal that surfaces details + an exercise animation/image
 * for a selected exercise. Fetches a reference image from the public
 * wger.de API; falls back gracefully when offline or not found.
 *
 * @param {{
 *   exercise: import("../../data/trainingPlan").Exercise,
 *   accentColor: string,
 *   onClose: () => void,
 * }} props
 */
export function ExerciseDetailModal({ exercise, accentColor, onClose }) {
  const { t } = useI18n();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [wgerExerciseId, setWgerExerciseId] = useState<number | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setImageUrl(null);
    setWgerExerciseId(null);

    getExerciseMedia(exercise.name, exercise.id).then((media) => {
      if (cancelled) return;
      setImageUrl(media.imageUrl);
      setWgerExerciseId(media.wgerExerciseId);
      setYoutubeUrl(media.youtubeUrl);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [exercise.id, exercise.name]);

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={styles.backdrop}
    >
      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={styles.sheet}
      >
        {/* Handle bar */}
        <div style={styles.handle} />

        {/* Header */}
        <div style={styles.header}>
          <div style={{ flex: 1 }}>
            <div style={{ ...styles.exerciseName, color: accentColor }}>
              {exercise.name}
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="close">✕</button>
        </div>

        {/* Meta chips: sets · reps · rest */}
        <div style={styles.metaRow}>
          <Chip label={t("exerciseDetail.sets")} value={exercise.sets} color={accentColor} />
          <Chip label={t("exerciseDetail.reps")} value={exercise.reps} color={accentColor} />
          {exercise.rest && (
            <Chip label={t("exerciseDetail.rest")} value={exercise.rest} color={accentColor} />
          )}
        </div>

        {/* Coaching note */}
        {exercise.note && (
          <div style={styles.note}>
            <span style={{ color: colors.warning }}>⚠ </span>
            {exercise.note}
          </div>
        )}

        {/* Exercise image / GIF area */}
        <div style={styles.imageContainer}>
          {loading && (
            <div style={styles.skeleton}>
              <div style={styles.skeletonInner} />
            </div>
          )}

          {!loading && imageUrl && (
            <img
              src={imageUrl}
              alt={exercise.name}
              style={styles.exerciseImage}
              onError={() => setImageUrl(null)}
            />
          )}

          {!loading && !imageUrl && (
            <div style={styles.noImage}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏋️</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>
                {t("exerciseDetail.noPreview")}
              </div>
            </div>
          )}
        </div>

        {/* Attribution when image shown */}
        {!loading && imageUrl && wgerExerciseId && (
          <div style={styles.attribution}>
            {t("exerciseDetail.imageSource")}{" "}
            <a
              href="https://wger.de"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: colors.textMuted }}
            >
              wger.de
            </a>
          </div>
        )}

        {/* YouTube CTA */}
        {youtubeUrl && (
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...styles.youtubeBtn, borderColor: colors.accent.orange, color: colors.accent.orange }}
          >
            ▶ {t("exerciseDetail.watchYoutube")}
          </a>
        )}
      </div>
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={styles.chip}>
      <span style={{ color: colors.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ color, fontFamily: fonts.mono, fontSize: 13, fontWeight: 500, marginTop: 2 }}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    zIndex: 200,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sheet: {
    background: colors.surface,
    borderRadius: "20px 20px 0 0",
    padding: "8px 20px 36px",
    width: "100%",
    maxWidth: 560,
    boxSizing: "border-box",
    border: `1px solid ${colors.border}`,
    borderBottom: "none",
    maxHeight: "90dvh",
    overflowY: "auto",
  },
  handle: {
    width: 36,
    height: 4,
    background: colors.borderLight,
    borderRadius: 99,
    margin: "8px auto 16px",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.2,
    fontFamily: fonts.sans,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: colors.textSecondary,
    fontSize: 18,
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
    flexShrink: 0,
  },
  metaRow: {
    display: "flex",
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap" as const,
  },
  chip: {
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column" as const,
    minWidth: 64,
    alignItems: "center",
  },
  note: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 16,
    padding: "10px 12px",
    background: colors.bg,
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    lineHeight: 1.5,
  },
  imageContainer: {
    width: "100%",
    minHeight: 200,
    borderRadius: 12,
    overflow: "hidden",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  skeleton: {
    width: "100%",
    minHeight: 200,
    background: colors.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonInner: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: `3px solid ${colors.border}`,
    borderTopColor: colors.textMuted,
    animation: "spin 0.8s linear infinite",
  },
  exerciseImage: {
    width: "100%",
    height: "auto",
    maxHeight: 320,
    objectFit: "contain" as const,
    display: "block",
  },
  noImage: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    minHeight: 160,
  },
  attribution: {
    fontSize: 10,
    color: colors.textGhost,
    textAlign: "center" as const,
    marginBottom: 16,
  },
  youtubeBtn: {
    display: "block",
    width: "100%",
    padding: "13px 0",
    textAlign: "center" as const,
    borderRadius: 12,
    border: `1px solid`,
    background: "transparent",
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "none",
    marginTop: 12,
    boxSizing: "border-box" as const,
  },
};
