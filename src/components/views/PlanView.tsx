import { useState, useEffect } from "react";
import { getLastLog, makeExerciseId } from "../../utils/helpers";
import { getExerciseNoteById } from "../../data/exerciseCatalog";
import { applyCatalogNoteSelection, applyManualNote } from "../../utils/exerciseNotes";
import { DayTabs, SectionLabel, PageContainer, ExerciseNameInput } from "../ui";
import { ExerciseRow } from "../exercises";
import { useI18n } from "../../i18n";
import type { Exercise, TrainingDay, TrainingPlan, LogsByExercise, WorkoutSession } from "../../services/types";
import classes from "./PlanView.module.css";

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
  designVariant: "session" | "logbook";
  onDesignVariantChange?: (variant: "session" | "logbook") => void;
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
  designVariant,
  onDesignVariantChange,
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
        <div className={`${classes.shell} ${classes.defaultTone}`}>
          <SectionLabel>{t("plan.title")}</SectionLabel>
          <div className={classes.noDaysText}>{t("plan.noDays")}</div>
          <div className={classes.noDaysActions}>
            <button onClick={addDay} className={classes.ghostButton}>{t("plan.addDay")}</button>
            <button onClick={onOpenGenerator} className={classes.accentGhostButton}>✦ {t("generator.title")}</button>
            <button onClick={onOpenImporter} className={classes.accentGhostButton}>{t("importer.openButton")}</button>
            {onOpenSessionHistory && <button onClick={onOpenSessionHistory} className={classes.ghostButton}>{t("history.openButton")}</button>}
          </div>
        </div>
      </PageContainer>
    );
  }

  const currentDay = isEditing && draftDay ? draftDay : day;
  const activeAccent = dayColors[safeActiveDay];
  const focusExercise = workoutSession
    ? trainingPlan[workoutSession.dayKey]?.exercises?.[workoutSession.currentExerciseIndex]
    : currentDay?.exercises[0];
  const lastLog = focusExercise ? getLastLog(logs, focusExercise.id) : null;

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
      <div className={`${classes.shell} ${getToneClass(activeAccent)} ${designVariant === "logbook" ? classes.logbookTone : classes.sessionTone}`}>
        <DayTabs
          days={dayKeys}
          activeDay={safeActiveDay}
          dayColors={dayColors}
          onSelect={setActiveDay}
        />

        {onDesignVariantChange && (
          <div className={classes.designExamples}>
            {[
              {
                key: "session" as const,
                label: "Glass Session",
                detail: "Flow built around the active session card, rest rail, and thumbable start/resume.",
              },
              {
                key: "logbook" as const,
                label: "Logbook Pro",
                detail: "High-contrast sheets, larger number inputs, and a persistent log history focus.",
              },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                className={`${classes.exampleCard}${designVariant === option.key ? ` ${classes.exampleActive}` : ""}`}
                onClick={() => onDesignVariantChange(option.key)}
              >
                <div className={classes.exampleBadge}>Example</div>
                <div className={classes.exampleTitle}>{option.label}</div>
                <div className={classes.exampleDetail}>{option.detail}</div>
                <div className={classes.exampleSwatches}>
                  <span className={classes.swatchPrimary} />
                  <span className={classes.swatchAccent} />
                </div>
                {designVariant === option.key && <div className={classes.exampleCheck}>✓ Active</div>}
              </button>
            ))}
          </div>
        )}

        {currentDay && (
          <div className={`${classes.sessionFocusCard}${workoutSession ? ` ${classes.sessionFocusActive}` : ""}`}>
            <div className={classes.sessionFocusTop}>
              <div className={classes.sessionFocusLabel}>
                {workoutSession ? t("session.activeTitle") : t("session.startWorkout")}
              </div>
              <div className={classes.sessionFocusMeta}>
                {focusExercise
                  ? `${focusExercise.sets || "—"} ${t("common.series")} · ${focusExercise.reps || t("common.reps")} · ${focusExercise.rest || "—"}`
                  : t("plan.addExercise")}
              </div>
            </div>
            <div className={classes.sessionFocusMain}>
              <div className={classes.sessionFocusName}>{workoutSession ? activeSessionExerciseName || t("session.resumeWorkout") : focusExercise?.name || t("session.startWorkout")}</div>
              <div className={classes.sessionFocusDetail}>
                {lastLog
                  ? `${t("log.weightLabel")}: ${lastLog.weight || "—"} · ${t("log.repsDoneLabel")}: ${lastLog.reps || "—"}`
                  : t("log.noRecords")}
              </div>
            </div>
            <div className={classes.sessionFocusActions}>
              {workoutSession ? (
                <>
                  <button onClick={onResumeWorkoutSession} className={classes.primaryCTA}>
                    {t("session.resumeWorkout")}
                  </button>
                  <button onClick={onEndWorkoutSession} className={classes.ghostButton}>
                    {t("session.endWorkout")}
                  </button>
                </>
              ) : (
                <button onClick={() => onStartWorkoutSession?.(safeActiveDay)} className={classes.primaryCTA}>
                  ▶ {t("session.startWorkout")}
                </button>
              )}
            </div>
          </div>
        )}

        <div className={classes.heroCard}>
          <div className={classes.heroTopRow}>
            <div className={classes.heroMain}>
              <SectionLabel color={activeAccent}>{safeActiveDay}</SectionLabel>
              {isEditing ? (
                <input
                  value={currentDay.label}
                  onChange={(e) => setDraftDay((prev) => prev ? { ...prev, label: e.target.value } : prev)}
                  aria-label={t("plan.dayName")}
                  className={classes.heroTitleInput}
                />
              ) : (
                <div className={classes.heroTitle}>{day.label}</div>
              )}
            </div>
            <div className={classes.heroAside}>
              <div className={classes.heroMetric}>{currentDay.exercises.length} ex</div>
              <div className={classes.heroActions}>
                {!isEditing && (
                  <button onClick={startEditing} className={classes.ghostButton}>
                    {t("plan.editPlan")}
                  </button>
                )}
                {isEditing && (
                  <>
                    <button onClick={cancelEditing} className={classes.ghostButton}>
                      {t("common.cancel")}
                    </button>
                    <button onClick={saveEditing} className={classes.accentGhostButton}>
                      {t("common.save")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className={classes.heroSubtitle}>
            {workoutSession
              ? `${activeSessionExerciseName || t("session.resumeWorkout")} · ${t("session.exerciseProgress", { current: workoutSession.currentExerciseIndex + 1, total: workoutSession.totalExercises })}`
              : `${currentDay.exercises.length} ${t("plan.addExercise").replace("+ ", "").toLowerCase()} · ${t("plan.editPlan")}`}
          </div>
        </div>

        <div className={classes.actionRow}>
          <button
            onClick={() => {
              const newDay = addDay();
              if (newDay) setActiveDay(newDay);
            }}
            className={classes.ghostButton}
          >
            {t("plan.addDayShort")}
          </button>
          <button
            onClick={() => removeDay(safeActiveDay)}
            disabled={dayKeys.length <= 1}
            className={`${classes.ghostButton}${dayKeys.length <= 1 ? ` ${classes.disabledButton}` : ""}`}
          >
            {t("plan.removeDayShort")}
          </button>
          <button onClick={onOpenGenerator} className={classes.accentGhostButton}>
            ✦ {t("generator.title")}
          </button>
          <button onClick={onOpenImporter} className={classes.accentGhostButton}>
            {t("importer.openButton")}
          </button>
          {onOpenSessionHistory && (
            <button onClick={onOpenSessionHistory} className={classes.ghostButton}>
              {t("history.openButton")}
            </button>
          )}
        </div>

        {isEditing && (
          <div className={classes.addExerciseWrap}>
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
              className={classes.ghostButton}
            >
              {t("plan.addExercise")}
            </button>
          </div>
        )}

        <div className={classes.exerciseList}>
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
            <div key={ex.id} className={classes.editCard}>
              <div className={classes.editIndex}>{String(i + 1).padStart(2, "0")}</div>
              <div className={classes.editContent}>
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
                  inputClassName={classes.nameInput}
                />

                <div className={classes.metaGrid}>
                  <input value={ex.sets} onChange={(e) => updateExerciseField(ex.id, "sets", e.target.value)} placeholder={t("plan.setsPlaceholder")} className={classes.metaInput} />
                  <input value={ex.reps} onChange={(e) => updateExerciseField(ex.id, "reps", e.target.value)} placeholder={t("plan.repsPlaceholder")} className={classes.metaInput} />
                  <input value={ex.rest} onChange={(e) => updateExerciseField(ex.id, "rest", e.target.value)} placeholder={t("plan.restPlaceholder")} className={classes.metaInput} />
                </div>

                <input
                  value={ex.note || ""}
                  onChange={(e) => {
                    updateExercise(ex.id, (exercise) => applyManualNote(exercise, e.target.value));
                  }}
                  placeholder={t("plan.notePlaceholder")}
                  className={classes.noteInput}
                />

                <div className={classes.editActions}>
                  <button
                    onClick={() => moveExercise(i, -1)}
                    disabled={i === 0}
                    className={`${classes.compactAction}${i === 0 ? ` ${classes.disabledButton}` : ""}`}
                  >
                    {t("plan.moveUp")}
                  </button>
                  <button
                    onClick={() => moveExercise(i, 1)}
                    disabled={i === currentDay.exercises.length - 1}
                    className={`${classes.compactAction}${i === currentDay.exercises.length - 1 ? ` ${classes.disabledButton}` : ""}`}
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
                    className={classes.compactAction}
                  >
                    {t("plan.removeExercise")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

function getToneClass(color?: string) {
  switch ((color || "").toLowerCase()) {
    case "#e8643a":
      return classes.orangeTone;
    case "#3ab8e8":
      return classes.blueTone;
    case "#7de83a":
      return classes.greenTone;
    case "#e8c93a":
      return classes.yellowTone;
    case "#c83ae8":
      return classes.violetTone;
    case "#e83a7d":
      return classes.pinkTone;
    default:
      return classes.defaultTone;
  }
}
