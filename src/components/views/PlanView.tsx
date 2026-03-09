import { useState, useEffect } from "react";
import { getLastLog, makeExerciseId } from "../../utils/helpers";
import { getExerciseNoteById } from "../../data/exerciseCatalog";
import { applyCatalogNoteSelection, applyManualNote } from "../../utils/exerciseNotes";
import { DayTabs, SectionLabel, PageContainer, ExerciseNameInput } from "../ui";
import { ExerciseRow } from "../exercises";
import { colors, fonts } from "../../theme";
import { performanceGhostButtonStyle, performanceHeroStyle, performancePanelStyle } from "../../theme/editorialPerformance";
import { useI18n } from "../../i18n";
import type { Exercise, TrainingDay, TrainingPlan, LogsByExercise, WorkoutSession } from "../../services/types";

interface PlanViewProps {
  activeDay: string;
  setActiveDay: (d: string) => void;
  trainingPlan: TrainingPlan;
  dayKeys: string[];
  dayColors: Record<string, string>;
  logs: LogsByExercise;
  saveDay: (dayKey: string, nextDay: Partial<TrainingDay>) => void;
  addDay: () => string;
  removeDay: (dayKey: string) => void;
  onOpenGenerator: () => void;
  onOpenImporter: () => void;
  onOpenSessionHistory?: () => void;
  onExerciseClick?: (exercise: Exercise) => void;
  workoutSession?: WorkoutSession | null;
  activeSessionExerciseName?: string;
  onStartWorkoutSession?: (dayKey: string) => void;
  onResumeWorkoutSession?: () => void;
  onEndWorkoutSession?: () => void;
}

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
  onOpenSessionHistory,
  onExerciseClick,
  workoutSession,
  activeSessionExerciseName,
  onStartWorkoutSession,
  onResumeWorkoutSession,
  onEndWorkoutSession,
}: PlanViewProps) {
  const { t, language } = useI18n();
  const safeActiveDay = trainingPlan[activeDay] ? activeDay : dayKeys[0];
  const day = safeActiveDay ? trainingPlan[safeActiveDay] : null;
  const [isEditing, setIsEditing] = useState(false);
  const [draftDay, setDraftDay] = useState<TrainingDay | null>(null);

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
          {onOpenSessionHistory && <button onClick={onOpenSessionHistory} style={styles.ghostButton}>{t("history.openButton")}</button>}
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
  const activeAccent = dayColors[safeActiveDay];

  const updateExercise = (exerciseId: string, updater: (ex: Exercise) => Exercise) => {
    if (!draftDay) return;
    setDraftDay((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((exercise) => (
          exercise.id === exerciseId ? updater(exercise) : exercise
        )),
      };
    });
  };

  const updateExerciseField = (exerciseId: string, field: keyof Exercise, value: string) => {
    updateExercise(exerciseId, (exercise) => ({
      ...exercise,
      [field]: value,
    }));
  };

  const moveExercise = (fromIndex: number, direction: number) => {
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

      <div style={{ ...styles.heroCard, ...performanceHeroStyle(activeAccent) }}>
        <div style={styles.heroTopRow}>
          <div>
            <SectionLabel color={activeAccent}>{safeActiveDay}</SectionLabel>
            <div style={styles.heroTitle}>{day.label}</div>
          </div>
          <div style={styles.heroMetric}>{currentDay.exercises.length} ex</div>
        </div>
        <div style={styles.heroSubtitle}>
          {workoutSession
            ? `${activeSessionExerciseName || t("session.resumeWorkout")} · ${t("session.exerciseProgress", { current: workoutSession.currentExerciseIndex + 1, total: workoutSession.totalExercises })}`
            : `${currentDay.exercises.length} ${t("plan.addExercise").replace("+ ", "").toLowerCase()} · ${t("plan.editPlan")}`}
        </div>
      </div>

      <div style={styles.actionRow}>
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
          style={{ ...styles.ghostButton, ...performanceGhostButtonStyle(colors.accent.blue) }}
        >
          ✦ {t("generator.title")}
        </button>
        <button
          onClick={onOpenImporter}
          style={{ ...styles.ghostButton, ...performanceGhostButtonStyle(colors.accent.blue) }}
        >
          {t("importer.openButton")}
        </button>
        {onOpenSessionHistory && (
          <button onClick={onOpenSessionHistory} style={styles.ghostButton}>
            {t("history.openButton")}
          </button>
        )}
      </div>

      {/* Day info header */}
      <div style={styles.dayHeaderRow}>
        <div style={{ flex: 1 }}>
          {isEditing ? (
            <input
              value={currentDay.label}
              onChange={(e) => setDraftDay((prev) => prev ? { ...prev, label: e.target.value } : prev)}
              style={styles.dayLabelInput}
            />
          ) : (
            <div style={styles.daySubtitle}>
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
              <button onClick={saveEditing} style={{ ...styles.ghostButton, ...performanceGhostButtonStyle(activeAccent) }}>
                {t("common.save")}
              </button>
            </>
          )}
        </div>
      </div>

      {!isEditing && workoutSession && (
        <div style={{ ...styles.sessionCard, ...performancePanelStyle(activeAccent) }}>
          <div style={{ flex: 1 }}>
            <div style={styles.sessionLabel}>{t("session.activeTitle")}</div>
            <div style={styles.sessionExerciseName}>{activeSessionExerciseName || t("session.resumeWorkout")}</div>
            <div style={styles.sessionMeta}>
              {workoutSession.dayKey} · {t("session.exerciseProgress", {
                current: workoutSession.currentExerciseIndex + 1,
                total: workoutSession.totalExercises,
              })}
            </div>
          </div>
          <div style={styles.sessionActions}>
            <button onClick={onResumeWorkoutSession} style={{ ...styles.ghostButton, ...performanceGhostButtonStyle(activeAccent) }}>
              {t("session.resumeWorkout")}
            </button>
            <button onClick={onEndWorkoutSession} style={styles.ghostButton}>
              {t("session.endWorkout")}
            </button>
          </div>
        </div>
      )}

      {!isEditing && !workoutSession && currentDay.exercises.length > 0 && onStartWorkoutSession && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => onStartWorkoutSession(safeActiveDay)}
            style={{ ...styles.sessionButton, background: `${activeAccent}18`, borderColor: `${activeAccent}66`, color: activeAccent }}
          >
            ▶ {t("session.startWorkout")}
          </button>
        </div>
      )}

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
                      noteSource: "custom",
                      noteCatalogId: "",
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
                onChange={async (name, catalogId) => {
                  updateExerciseField(ex.id, "name", name);
                  if (!catalogId) {
                    updateExercise(ex.id, (exercise) => ({
                      ...exercise,
                      noteSource: "custom",
                    }));
                    return;
                  }

                  const localizedNote = await getExerciseNoteById(catalogId, language);
                  updateExercise(ex.id, (exercise) => applyCatalogNoteSelection(exercise, {
                    name,
                    catalogId,
                    localizedNote,
                  }));
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
                onChange={(e) => {
                  updateExercise(ex.id, (exercise) => applyManualNote(exercise, e.target.value));
                }}
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
    ...performanceGhostButtonStyle(colors.textSecondary),
  },
  heroCard: {
    marginBottom: 16,
  },
  heroTopRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 1.5,
  },
  heroMetric: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.accent.blue,
    padding: "10px 12px",
    borderRadius: 999,
    border: `1px solid ${colors.accent.blue}55`,
    background: `${colors.accent.blue}12`,
  },
  actionRow: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap" as const,
  },
  dayHeaderRow: {
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  daySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: 400,
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
    ...performancePanelStyle(undefined, true),
    borderRadius: 18,
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
  sessionButton: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    borderRadius: 18,
    padding: "15px 12px",
    cursor: "pointer",
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: 600,
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.22)",
  },
  sessionCard: {
    marginBottom: 12,
    borderRadius: 18,
    padding: 16,
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.accent.blue,
    letterSpacing: 2,
    marginBottom: 4,
  },
  sessionExerciseName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: 700,
    marginBottom: 4,
  },
  sessionMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  sessionActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
    justifyContent: "flex-end" as const,
  },
};
