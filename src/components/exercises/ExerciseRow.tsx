import { colors, fonts } from "../../theme";
import { performancePanelStyle } from "../../theme/editorialPerformance";
import { padIndex } from "../../utils/helpers";
import { useI18n } from "../../i18n";
import { useLocalizedExerciseName } from "../../hooks";
import type { Exercise, LogEntry } from "../../services/types";

interface ExerciseRowProps {
  exercise: Exercise;
  index: number;
  accentColor: string;
  lastLog?: LogEntry | null;
  onClick?: () => void;
  showChevron?: boolean;
  showDetails?: boolean;
  totalLogs?: number;
  progressDiff?: number | null;
  disabled?: boolean;
}

export function ExerciseRow({
  exercise,
  index,
  accentColor,
  lastLog = null,
  onClick,
  showChevron = false,
  showDetails = true,
  totalLogs = 0,
  progressDiff = null,
  disabled = false,
}: ExerciseRowProps) {
  const { t } = useI18n();
  const localizedName = useLocalizedExerciseName(exercise.name);
  const interactive = !!onClick && !disabled;

  return (
    <div
      onClick={interactive ? onClick : undefined}
      style={{
        ...performancePanelStyle(interactive ? accentColor : undefined, disabled),
        background: disabled ? colors.surfaceAlt : colors.surface,
        borderRadius: 18,
        padding: "16px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: interactive ? "pointer" : "default",
        border: `1px solid ${disabled ? colors.borderDim : interactive ? `${accentColor}33` : colors.borderLight}`,
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.1s, border-color 0.1s, transform 0.1s",
        minHeight: 64,
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseEnter={(e) => {
        if (interactive) {
          e.currentTarget.style.background = colors.surfaceAlt;
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          e.currentTarget.style.background = colors.surface;
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
    >
      {/* Index */}
      <div style={{ fontFamily: fonts.mono, fontSize: 10, color: accentColor, minWidth: 28 }}>
        {padIndex(index)}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: showDetails ? 4 : 0, color: disabled ? colors.textDim : colors.textPrimary }}>
          {localizedName}
        </div>

        {showDetails && (
          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, letterSpacing: 0.4 }}>
            {exercise.sets} {t("common.series")} · {exercise.reps} {t("common.reps")} · {exercise.rest}
          </div>
        )}

        {!showDetails && totalLogs > 0 && (
          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, marginTop: 2 }}>
            {totalLogs} {t("common.sessions")}
          </div>
        )}

        {exercise.note && showDetails && (
          <div style={{ fontSize: 11, color: colors.warning, marginTop: 4, fontStyle: "italic" }}>
            ⚠ {exercise.note}
          </div>
        )}
      </div>

      {/* Right side: last log / progress */}
      {lastLog && progressDiff === null && (
        <div style={{ textAlign: "right", minWidth: 78 }}>
          {lastLog.weight && (
            <div style={{ fontFamily: fonts.mono, fontSize: 14, color: accentColor, fontWeight: 700 }}>
              {lastLog.weight} kg
            </div>
          )}
          {lastLog.reps && (
            <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim }}>
              {lastLog.reps} {t("common.reps")}
            </div>
          )}
          {totalLogs > 0 && (
            <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textGhost }}>
              {totalLogs} {t("common.records")}
            </div>
          )}
        </div>
      )}

      {/* Progress summary (used in progress list) */}
      {progressDiff !== null && lastLog?.weight && (
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 15, color: accentColor, fontWeight: 600 }}>
            {parseFloat(lastLog.weight)} kg
          </div>
          {progressDiff !== 0 && (
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 11,
                color: progressDiff > 0 ? colors.success : colors.warning,
              }}
            >
              {progressDiff > 0 ? "+" : ""}
              {progressDiff.toFixed(1)} kg
            </div>
          )}
        </div>
      )}

      {/* "no data" label for progress disabled rows */}
      {disabled && (
        <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDisabled }}>
          {t("common.noData")}
        </div>
      )}

      {showChevron && <div style={{ color: accentColor, fontSize: 16 }}>›</div>}
    </div>
  );
}
