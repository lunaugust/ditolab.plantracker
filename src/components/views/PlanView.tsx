import { useState, useEffect } from "react";
import { getLastLog, makeExerciseId } from "../../utils/helpers";
import { DayTabs, SectionLabel, PageContainer, ExerciseNameInput } from "../ui";
import { ExerciseRow } from "../exercises";
import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";

/**
 * "Plan" screen — shows the structured training plan per day.
 *
 * @param {{
 *   activeDay: string,
 *   setActiveDay: (d: string) => void,
 *   trainingPlan: Record<string, import("../../data/trainingPlan").TrainingDay>,
 *   dayKeys: string[],
 *   dayColors: Record<string, string>,
 *   logs: Record<string, import("../../services/types").LogEntry[]>,
 *   saveDay: (dayKey: string, nextDay: import("../../data/trainingPlan").TrainingDay) => void,
 *   addDay: () => string,
 *   removeDay: (dayKey: string) => void,
 *   onOpenGenerator: () => void,
 *   onOpenImporter: () => void,
 *   onExerciseClick?: (exercise: import("../../data/trainingPlan").Exercise) => void,
 * }} props
 */
export function PlanView({
  activeDay,
  setActiveDay,
  trainingPlan,
  dayKeys,
  dayColors,
  logs,
  saveDay,
  addDay,
  removeDay,
  onOpenGenerator,
  onOpenImporter,
  onExerciseClick,
}) {
  const { t } = useI18n();
  const safeActiveDay = trainingPlan[activeDay] ? activeDay : dayKeys[0];
  const day = safeActiveDay ? trainingPlan[safeActiveDay] : null;
  const [isEditing, setIsEditing] = useState(false);
  const [draftDay, setDraftDay] = useState(null);

  useEffect(() => {
    if (!isEditing || !day) return;
    setDraftDay(JSON.parse(JSON.stringify(day)));
  }, [isEditing, day, safeActiveDay]);

  if (!day) {
    return (
      <PageContainer>
        <SectionLabel>{t("plan.title")}</SectionLabel>
        <div style={{ color: colors.textMuted, marginBottom: 12 }}>{t("plan.noDays")}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={addDay} style={styles.ghostButton}>{t("plan.addDay")}</button>
          <button onClick={onOpenGenerator} style={{ ...styles.ghostButton, color: colors.accent.blue, borderColor: colors.accent.blue }}>✦ {t("generator.title")}</button>
          <button onClick={onOpenImporter} style={{ ...styles.ghostButton, color: colors.accent.blue, borderColor: colors.accent.blue }}>{t("importer.openButton")}</button>
        </div>
      </PageContainer>
    );
  }

  const startEditing = () => {
    setDraftDay(JSON.parse(JSON.stringify(day)));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftDay(null);
    setIsEditing(false);
  };

  const saveEditing = () => {
    if (!draftDay) return;
    saveDay(safeActiveDay, draftDay);
    setIsEditing(false);
  };

  const currentDay = isEditing && draftDay ? draftDay : day;

  const updateExerciseField = (exerciseId, field, value) => {
    if (!draftDay) return;
    setDraftDay((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) => (
        exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise
      )),
    }));
  };

  const moveExercise = (fromIndex, direction) => {
    setDraftDay((prev) => {
      if (!prev) return prev;
      const toIndex = fromIndex + direction;
      if (toIndex < 0 || toIndex >= prev.exercises.length) return prev;

      const nextExercises = [...prev.exercises];
      const [moved] = nextExercises.splice(fromIndex, 1);
      nextExercises.splice(toIndex, 0, moved);

      return {
        ...prev,
        exercises: nextExercises,
      };
    });
  };

  return (
    <PageContainer>
      <DayTabs
        days={dayKeys}
        activeDay={safeActiveDay}
        dayColors={dayColors}
        onSelect={setActiveDay}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => {
            const newDay = addDay();
            if (newDay) setActiveDay(newDay);
          }}
          style={styles.ghostButton}
        >
          {t("plan.addDayShort")}
        </button>
        <button
          onClick={() => removeDay(safeActiveDay)}
          disabled={dayKeys.length <= 1}
          style={{ ...styles.ghostButton, opacity: dayKeys.length <= 1 ? 0.4 : 1 }}
        >
          {t("plan.removeDayShort")}
        </button>
        <button
          onClick={onOpenGenerator}
          style={{ ...styles.ghostButton, color: colors.accent.blue, borderColor: colors.accent.blue }}
        >
          ✦ {t("generator.title")}
        </button>
        <button
          onClick={onOpenImporter}
          style={{ ...styles.ghostButton, color: colors.accent.blue, borderColor: colors.accent.blue, marginLeft: "auto" }}
        >
          {t("importer.openButton")}
        </button>
      </div>

      {/* Day info header */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <SectionLabel color={dayColors[safeActiveDay]}>{safeActiveDay}</SectionLabel>
          {isEditing ? (
            <input
              value={currentDay.label}
              onChange={(e) => setDraftDay((prev) => ({ ...prev, label: e.target.value }))}
              style={styles.dayLabelInput}
            />
          ) : (
            <div style={{ fontSize: 15, color: colors.textSecondary, fontWeight: 300 }}>
              {day.label}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {!isEditing && (
            <button onClick={startEditing} style={styles.ghostButton}>
              {t("plan.editPlan")}
            </button>
          )}
          {isEditing && (
            <>
              <button onClick={cancelEditing} style={styles.ghostButton}>
                {t("common.cancel")}
              </button>
              <button onClick={saveEditing} style={{ ...styles.ghostButton, color: dayColors[safeActiveDay], borderColor: dayColors[safeActiveDay] }}>
                {t("common.save")}
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div style={{ marginBottom: 10 }}>
          <button
            onClick={() => {
              setDraftDay((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  exercises: [
                    {
                      id: makeExerciseId(),
                      name: t("plan.exerciseNameTemplate", { n: prev.exercises.length + 1 }),
                      sets: "",
                      reps: "",
                      rest: "",
                      note: "",
                    },
                    ...prev.exercises,
                  ],
                };
              });
            }}
            style={styles.ghostButton}
          >
            {t("plan.addExercise")}
          </button>
        </div>
      )}

      {/* Exercise list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {!isEditing && currentDay.exercises.map((ex, i) => (
          <ExerciseRow
            key={ex.id}
            exercise={ex}
            index={i}
            accentColor={dayColors[safeActiveDay]}
            lastLog={getLastLog(logs, ex.id)}
            showChevron={!!onExerciseClick}
            onClick={onExerciseClick ? () => onExerciseClick(ex) : undefined}
          />
        ))}

        {isEditing && currentDay.exercises.map((ex, i) => (
          <div key={ex.id} style={styles.editCard}>
            <div style={styles.editIndex}>{String(i + 1).padStart(2, "0")}</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <ExerciseNameInput
                value={ex.name}
                onChange={(name, catalogId) => {
                  updateExerciseField(ex.id, "name", name);
                  if (catalogId) updateExerciseField(ex.id, "exerciseId", catalogId);
                }}
                style={styles.nameInput}
              />

              <div style={styles.metaGrid}>
                <input value={ex.sets} onChange={(e) => updateExerciseField(ex.id, "sets", e.target.value)} placeholder={t("plan.setsPlaceholder")} style={styles.metaInput} />
                <input value={ex.reps} onChange={(e) => updateExerciseField(ex.id, "reps", e.target.value)} placeholder={t("plan.repsPlaceholder")} style={styles.metaInput} />
                <input value={ex.rest} onChange={(e) => updateExerciseField(ex.id, "rest", e.target.value)} placeholder={t("plan.restPlaceholder")} style={styles.metaInput} />
              </div>

              <input
                value={ex.note || ""}
                onChange={(e) => updateExerciseField(ex.id, "note", e.target.value)}
                placeholder={t("plan.notePlaceholder")}
                style={styles.noteInput}
              />

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                  onClick={() => moveExercise(i, -1)}
                  disabled={i === 0}
                  style={{ ...styles.ghostButton, fontSize: 10, padding: "6px 8px", opacity: i === 0 ? 0.4 : 1 }}
                >
                  {t("plan.moveUp")}
                </button>
                <button
                  onClick={() => moveExercise(i, 1)}
                  disabled={i === currentDay.exercises.length - 1}
                  style={{ ...styles.ghostButton, fontSize: 10, padding: "6px 8px", opacity: i === currentDay.exercises.length - 1 ? 0.4 : 1 }}
                >
                  {t("plan.moveDown")}
                </button>
                <button
                  onClick={() => {
                    setDraftDay((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        exercises: prev.exercises.filter((exercise) => exercise.id !== ex.id),
                      };
                    });
                  }}
                  style={{ ...styles.ghostButton, fontSize: 10, padding: "6px 8px" }}
                >
                  {t("plan.removeExercise")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

const styles = {
  ghostButton: {
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.textSecondary,
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  dayLabelInput: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: "10px 12px",
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  editCard: {
    background: colors.surface,
    borderRadius: 12,
    border: `1px solid ${colors.borderLight}`,
    padding: 12,
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  editIndex: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textGhost,
    minWidth: 22,
    paddingTop: 10,
  },
  nameInput: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: "10px 12px",
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
  },
  metaInput: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: "8px 10px",
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  noteInput: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: "8px 10px",
    fontFamily: fonts.sans,
    fontSize: 12,
  },
};
