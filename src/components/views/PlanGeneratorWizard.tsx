import { useState, useCallback, useRef } from "react";
import { colors, fonts } from "../../theme";
import { SectionLabel, PageContainer, BackButton, ExerciseNameInput } from "../ui";
import { useI18n } from "../../i18n";
import { generateTrainingPlan, isAIAvailable } from "../../services/aiPlanGenerator";
import { makeExerciseId } from "../../utils/helpers";
import {
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  DAYS_PER_WEEK_OPTIONS,
  MINUTES_OPTIONS,
  DEFAULT_GENERATOR_FORM,
} from "../../data/planGeneratorConfig";
import type { TrainingPlan, Exercise } from "../../services/types";
import classes from "./PlanGeneratorWizard.module.css";

interface PlanGeneratorWizardProps {
  onApply: (plan: TrainingPlan) => void;
  onClose: () => void;
}

export function PlanGeneratorWizard({ onApply, onClose }: PlanGeneratorWizardProps) {
  const { t, language } = useI18n();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULT_GENERATOR_FORM);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<TrainingPlan | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editingExId, setEditingExId] = useState<string | null>(null);
  const [editingDayLabel, setEditingDayLabel] = useState<string | null>(null);
  const editSnapshot = useRef<Exercise | null>(null);
  const dragRef = useRef<{ dayKey: string; fromIdx: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ dayKey: string; toIdx: number } | null>(null);

  /* ---- Preview mutation helpers ---- */
  const updatePreviewEx = useCallback((dayKey: string, exId: string, field: keyof Exercise, value: string) => {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          exercises: prev[dayKey].exercises.map((ex) =>
            ex.id === exId ? { ...ex, [field]: value } : ex
          ),
        },
      };
    });
  }, []);

  const removePreviewEx = useCallback((dayKey: string, exId: string) => {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          exercises: prev[dayKey].exercises.filter((ex) => ex.id !== exId),
        },
      };
    });
    setEditingExId(null);
  }, []);

  const addPreviewEx = useCallback((dayKey: string) => {
    const newEx: Exercise = { id: makeExerciseId(), name: "", sets: "3", reps: "10", rest: "60s", note: "" };
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [dayKey]: { ...prev[dayKey], exercises: [...prev[dayKey].exercises, newEx] },
      };
    });
    editSnapshot.current = { ...newEx };
    setEditingExId(`${dayKey}|||${newEx.id}`);
  }, []);

  const openEditEx = useCallback((dayKey: string, ex: Exercise) => {
    editSnapshot.current = { ...ex };
    setEditingExId(`${dayKey}|||${ex.id}`);
  }, []);

  const cancelEditEx = useCallback((dayKey: string, exId: string) => {
    if (editSnapshot.current) {
      const snap = editSnapshot.current;
      setPreview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [dayKey]: {
            ...prev[dayKey],
            exercises: prev[dayKey].exercises.map((ex) =>
              ex.id === exId ? { ...snap } : ex
            ),
          },
        };
      });
      editSnapshot.current = null;
    }
    setEditingExId(null);
  }, []);

  const movePreviewEx = useCallback((dayKey: string, fromIdx: number, dir: number) => {
    setPreview((prev) => {
      if (!prev) return prev;
      const exercises = [...prev[dayKey].exercises];
      const toIdx = fromIdx + dir;
      if (toIdx < 0 || toIdx >= exercises.length) return prev;
      const [moved] = exercises.splice(fromIdx, 1);
      exercises.splice(toIdx, 0, moved);
      return { ...prev, [dayKey]: { ...prev[dayKey], exercises } };
    });
  }, []);

  const moveExToIndex = useCallback((dayKey: string, fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setPreview((prev) => {
      if (!prev) return prev;
      const exercises = [...prev[dayKey].exercises];
      const [moved] = exercises.splice(fromIdx, 1);
      exercises.splice(toIdx, 0, moved);
      return { ...prev, [dayKey]: { ...prev[dayKey], exercises } };
    });
  }, []);

  const updateDayLabelPreview = useCallback((dayKey: string, value: string) => {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [dayKey]: { ...prev[dayKey], label: value },
      };
    });
  }, []);

  const update = useCallback((field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError("");
    try {
      const { plan, source: src } = await generateTrainingPlan(form, language);
      setPreview(plan);
      setSource(src);
      setStep(4); // preview step
    } catch (err) {
      console.error("[PlanGenerator]", err);
      setError(t("generator.error"));
    } finally {
      setGenerating(false);
    }
  }, [form, language, t]);

  const handleApply = useCallback(() => {
    if (!preview) return;
    onApply(preview);
  }, [preview, onApply]);

  const handleRegenerate = useCallback(() => {
    setPreview(null);
    setSource(null);
    setEditingExId(null);
    setEditingDayLabel(null);
    setStep(3); // back to schedule step
  }, []);

  /* ---- Step definitions ---- */
  const steps = [
    /* 0: Experience */
    () => (
      <>
        <SectionLabel>{t("generator.stepExperience")}</SectionLabel>
        <div className={classes.optionsGrid}>
          {EXPERIENCE_OPTIONS.map(({ key, labelKey }) => (
            <OptionButton
              key={key}
              label={t(labelKey)}
              active={form.experience === key}
              onClick={() => { update("experience", key); setStep(1); }}
            />
          ))}
        </div>
      </>
    ),

    /* 1: Goal */
    () => (
      <>
        <SectionLabel>{t("generator.stepGoal")}</SectionLabel>
        <div className={classes.optionsGrid}>
          {GOAL_OPTIONS.map(({ key, labelKey }) => (
            <OptionButton
              key={key}
              label={t(labelKey)}
              active={form.goal === key}
              onClick={() => { update("goal", key); setStep(2); }}
            />
          ))}
        </div>
      </>
    ),

    /* 2: Limitations */
    () => (
      <>
        <SectionLabel>{t("generator.stepLimitations")}</SectionLabel>
        <textarea
          value={form.limitations}
          onChange={(e) => update("limitations", e.target.value)}
          placeholder={t("generator.limitationsPlaceholder")}
          rows={3}
          className={classes.textarea}
        />
        <div className={classes.privacyNotice}>
          🔒 {t("generator.limitationsPrivacyNotice")}
        </div>
        <button
          onClick={() => setStep(3)}
          className={`${classes.primaryButton} ${classes.primaryButtonSpaced}`}
        >
          {form.limitations.trim() ? t("common.save") : t("generator.limitationsNone")}
        </button>
      </>
    ),

    /* 3: Schedule */
    () => (
      <>
        <SectionLabel>{t("generator.stepSchedule")}</SectionLabel>

        <div className={classes.fieldBlock}>
          <div className={classes.fieldLabel}>{t("generator.daysPerWeek")}</div>
          <div className={classes.optionsRow}>
            {DAYS_PER_WEEK_OPTIONS.map((n) => (
              <OptionButton
                key={n}
                label={String(n)}
                active={form.daysPerWeek === n}
                onClick={() => update("daysPerWeek", n)}
                compact
              />
            ))}
          </div>
        </div>

        <div className={classes.fieldBlockWide}>
          <div className={classes.fieldLabel}>{t("generator.minutesPerSession")}</div>
          <div className={classes.optionsRow}>
            {MINUTES_OPTIONS.map((n) => (
              <OptionButton
                key={n}
                label={`${n}'`}
                active={form.minutesPerSession === n}
                onClick={() => update("minutesPerSession", n)}
                compact
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className={`${classes.primaryButton}${generating ? ` ${classes.primaryButtonDisabled}` : ""}`}
        >
          {generating ? t("generator.generating") : t("generator.generate")}
        </button>

        {error && <div className={classes.errorMsg}>{error}</div>}
      </>
    ),

    /* 4: Preview (editable) */
    () => (
      <>
        <div className={classes.previewHeader}>
          <SectionLabel>{t("generator.preview")}</SectionLabel>
          <div className={classes.sourceBadge}>
            {source === "ai" ? t("generator.sourceAI") : t("generator.sourceRules")}
          </div>
        </div>

        <div className={classes.previewList}>
          {preview && Object.entries(preview).map(([dayKey, day]) => (
            <div key={dayKey} className={classes.previewDay}>
              {/* Day header */}
              <div className={classes.dayHeader}>
                <div className={`${classes.dayDot} ${getToneClass(day.color)}`} />
                <div className={classes.dayKey}>{dayKey}</div>
                {editingDayLabel === dayKey ? (
                  <input
                    autoFocus
                    value={day.label}
                    onChange={(e) => updateDayLabelPreview(dayKey, e.target.value)}
                    onBlur={() => setEditingDayLabel(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingDayLabel(null)}
                    aria-label={t("generator.stepSchedule")}
                    className={classes.inlineInput}
                  />
                ) : (
                  <div
                    onClick={() => setEditingDayLabel(dayKey)}
                    className={classes.dayLabelDisplay}
                  >
                    {day.label || "—"}
                  </div>
                )}
              </div>

              {/* Exercise list */}
              <div className={classes.exerciseList}>
                {day.exercises.map((ex, i) => {
                  const compositeId = `${dayKey}|||${ex.id}`;
                  const isEditing = editingExId === compositeId;
                  return (
                    <div key={ex.id} className={classes.previewExercise}>
                      {isEditing ? (
                        /* Expanded edit form */
                        <div className={classes.editForm}>
                          <ExerciseNameInput
                            autoFocus
                            value={ex.name}
                            onChange={(name, catalogId) => {
                              updatePreviewEx(dayKey, ex.id, "name", name);
                              if (catalogId) updatePreviewEx(dayKey, ex.id, "exerciseId", catalogId);
                            }}
                            placeholder={t("plan.exerciseNameTemplate", { n: i + 1 })}
                            inputClassName={classes.editInput}
                          />
                          <div className={classes.editRow}>
                            <input
                              value={ex.sets}
                              onChange={(e) => updatePreviewEx(dayKey, ex.id, "sets", e.target.value)}
                              placeholder={t("plan.setsPlaceholder")}
                              className={`${classes.editInput} ${classes.flexOne}`}
                            />
                            <input
                              value={ex.reps}
                              onChange={(e) => updatePreviewEx(dayKey, ex.id, "reps", e.target.value)}
                              placeholder={t("plan.repsPlaceholder")}
                              className={`${classes.editInput} ${classes.flexTwo}`}
                            />
                            <input
                              value={ex.rest}
                              onChange={(e) => updatePreviewEx(dayKey, ex.id, "rest", e.target.value)}
                              placeholder={t("plan.restPlaceholder")}
                              className={`${classes.editInput} ${classes.flexOne}`}
                            />
                          </div>
                          <input
                            value={ex.note}
                            onChange={(e) => updatePreviewEx(dayKey, ex.id, "note", e.target.value)}
                            placeholder={t("plan.notePlaceholder")}
                            className={classes.editInput}
                          />
                          <div className={classes.editActions}>
                            <button
                              onClick={() => cancelEditEx(dayKey, ex.id)}
                              className={classes.editActionBtn}
                            >
                              {t("common.cancel")}
                            </button>
                            <button
                              onClick={() => { editSnapshot.current = null; setEditingExId(null); }}
                              className={`${classes.editActionBtn} ${classes.editActionAccent}`}
                            >
                              {t("common.save")}
                            </button>
                            <button
                              onClick={() => removePreviewEx(dayKey, ex.id)}
                              disabled={day.exercises.length <= 1}
                              className={`${classes.editActionBtn} ${classes.editActionWarning}`}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Collapsed row */
                        <div
                          data-exidx={i}
                          data-daykey={dayKey}
                          className={`${classes.collapsedRow}${dragOver?.dayKey === dayKey && dragOver?.toIdx === i ? ` ${classes.collapsedRowDrop}` : ""}`}
                        >
                          {/* Drag handle — large touch target, pointer-event based */}
                          <button
                            aria-label={t("generator.dragToReorder")}
                            className={classes.dragHandle}
                            onPointerDown={(e) => {
                              e.currentTarget.setPointerCapture(e.pointerId);
                              dragRef.current = { dayKey, fromIdx: i };
                            }}
                            onPointerMove={(e) => {
                              if (!dragRef.current || dragRef.current.dayKey !== dayKey) return;
                              const el = document.elementFromPoint(e.clientX, e.clientY);
                              const row = el?.closest("[data-exidx]") as HTMLElement | null;
                              if (row && row.dataset.daykey === dayKey) {
                                const toIdx = parseInt(row.dataset.exidx ?? "", 10);
                                if (!isNaN(toIdx)) setDragOver({ dayKey, toIdx });
                              }
                            }}
                            onPointerUp={() => {
                              if (dragRef.current?.dayKey === dayKey && dragOver?.dayKey === dayKey) {
                                moveExToIndex(dayKey, dragRef.current.fromIdx, dragOver.toIdx);
                              }
                              dragRef.current = null;
                              setDragOver(null);
                            }}
                            onPointerCancel={() => { dragRef.current = null; setDragOver(null); }}
                          >
                            ⠿
                          </button>
                          <span className={classes.indexText}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span
                            onClick={() => openEditEx(dayKey, ex)}
                            className={classes.exerciseName}
                          >
                            {ex.name || <span className={classes.exerciseNameEmpty}>—</span>}
                          </span>
                          <span className={classes.exerciseMeta}>
                            {ex.sets}×{ex.reps}
                          </span>
                          <button
                            onClick={() => openEditEx(dayKey, ex)}
                            className={classes.editIconBtn}
                          >
                            ✏
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add exercise */}
              <button
                onClick={() => addPreviewEx(dayKey)}
                className={`${classes.editActionBtn} ${classes.addExerciseBtn}`}
              >
                {t("generator.addExercise")}
              </button>
            </div>
          ))}
        </div>

        <div className={classes.previewActions}>
          <button onClick={handleRegenerate} className={classes.ghostButton}>
            {t("generator.regenerate")}
          </button>
          <button
            onClick={handleApply}
            className={`${classes.primaryButton} ${classes.previewApply}`}
          >
            {t("generator.apply")}
          </button>
        </div>
      </>
    ),
  ];

  const canGoBack = step > 0 && step < 4;
  return (
    <PageContainer>
      <div className={classes.shell}>
      <div className={classes.headerRow}>
        {canGoBack ? (
          <BackButton onClick={() => setStep((s) => s - 1)} />
        ) : step === 4 ? (
          <BackButton onClick={handleRegenerate} />
        ) : (
          <div />
        )}
        <button onClick={onClose} className={`${classes.ghostButton} ${classes.ghostButtonAccent}`}>
          {t("generator.discard")}
        </button>
      </div>

      <div className={classes.heroCard}>
        <div className={classes.heroTopRow}>
          <div>
            <SectionLabel color={colors.accent.orange}>{t("generator.title")}</SectionLabel>
            <div className={classes.heroTitle}>{t("generator.subtitle")}</div>
          </div>
          <div className={classes.heroMetric}>{step === 4 ? t("generator.preview") : `${step + 1}/4`}</div>
        </div>
        {!isAIAvailable() && step < 4 && (
          <div className={classes.heroSource}>
            {t("generator.sourceRules")}
          </div>
        )}
      </div>

      {/* Step progress dots */}
      <div className={classes.progressDots}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={[
              classes.progressDot,
              step >= 4 || step > i ? classes.progressDotDone : "",
              step === i ? classes.progressDotCurrent : "",
              step !== i && step < 4 && step < i ? classes.progressDotPending : "",
            ].filter(Boolean).join(" ")}
          />
        ))}
      </div>

      <div className={classes.stepPanel}>
        {steps[step]()}
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

/* ---- Sub-components ---- */

function OptionButton({ label, active, onClick, compact = false }: { label: string; active: boolean; onClick: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={[
        classes.optionButton,
        compact ? classes.optionButtonCompact : "",
        active ? classes.optionButtonActive : "",
      ].filter(Boolean).join(" ")}
    >
      {label}
    </button>
  );
}
