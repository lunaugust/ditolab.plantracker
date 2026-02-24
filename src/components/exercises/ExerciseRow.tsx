import { colors, fonts } from "../../theme";
import { padIndex } from "../../utils/helpers";
import { useI18n } from "../../i18n";

/**
 * A single exercise row used across Plan, Log-picker and Progress screens.
 *
 * @param {{
 *   exercise: import("../../data/trainingPlan").Exercise,
 *   index: number,
 *   accentColor: string,
 *   lastLog?: import("../../services/types").LogEntry | null,
 *   onClick?: () => void,
 *   showChevron?: boolean,
 *   showDetails?: boolean,
 *   totalLogs?: number,
 *   progressDiff?: number | null,
 *   disabled?: boolean,
 * }} props
 */
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
}) {
  const { t } = useI18n();
  const interactive = !!onClick && !disabled;

  return (
    <div
      onClick={interactive ? onClick : undefined}
      style={{
        background: disabled ? colors.surfaceAlt : colors.surface,
        borderRadius: 12,
        padding: "16px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: interactive ? "pointer" : "default",
        border: `1px solid ${disabled ? colors.borderDim : colors.borderLight}`,
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.1s",
        minHeight: 56,
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseEnter={(e) => {
        if (interactive) e.currentTarget.style.background = "#1a1a1a";
      }}
      onMouseLeave={(e) => {
        if (interactive) e.currentTarget.style.background = colors.surface;
      }}
    >
      {/* Index */}
      <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textGhost, minWidth: 22 }}>
        {padIndex(index)}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: showDetails ? 3 : 0, color: disabled ? colors.textDim : colors.textPrimary }}>
          {exercise.name}
        </div>

        {showDetails && (
          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted }}>
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
        <div style={{ textAlign: "right", minWidth: 70 }}>
          {lastLog.weight && (
            <div style={{ fontFamily: fonts.mono, fontSize: 13, color: accentColor, fontWeight: 500 }}>
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

      {showChevron && <div style={{ color: colors.textGhost, fontSize: 16 }}>›</div>}
    </div>
  );
}
