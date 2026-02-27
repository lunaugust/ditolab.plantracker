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
        <div style={styles.optionsGrid}>
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
        <div style={styles.optionsGrid}>
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
          style={styles.textarea}
        />
        <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, marginTop: 8, lineHeight: 1.4 }}>
          🔒 {t("generator.limitationsPrivacyNotice")}
        </div>
        <button
          onClick={() => setStep(3)}
          style={{ ...styles.primaryBtn, marginTop: 12 }}
        >
          {form.limitations.trim() ? t("common.save") : t("generator.limitationsNone")}
        </button>
      </>
    ),

    /* 3: Schedule */
    () => (
      <>
        <SectionLabel>{t("generator.stepSchedule")}</SectionLabel>

        <div style={{ marginBottom: 16 }}>
          <div style={styles.fieldLabel}>{t("generator.daysPerWeek")}</div>
          <div style={styles.optionsRow}>
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

        <div style={{ marginBottom: 20 }}>
          <div style={styles.fieldLabel}>{t("generator.minutesPerSession")}</div>
          <div style={styles.optionsRow}>
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
          style={{
            ...styles.primaryBtn,
            background: colors.accent.orange,
            color: colors.bg,
            opacity: generating ? 0.6 : 1,
          }}
        >
          {generating ? t("generator.generating") : t("generator.generate")}
        </button>

        {error && <div style={styles.errorMsg}>{error}</div>}
      </>
    ),

    /* 4: Preview (editable) */
    () => (
      <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <SectionLabel>{t("generator.preview")}</SectionLabel>
          <div style={styles.sourceBadge}>
            {source === "ai" ? t("generator.sourceAI") : t("generator.sourceRules")}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {preview && Object.entries(preview).map(([dayKey, day]) => (
            <div key={dayKey} style={styles.previewDay}>
              {/* Day header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: day.color, flexShrink: 0 }} />
                <div style={{ fontWeight: 600, fontSize: 14 }}>{dayKey}</div>
                {editingDayLabel === dayKey ? (
                  <input
                    autoFocus
                    value={day.label}
                    onChange={(e) => updateDayLabelPreview(dayKey, e.target.value)}
                    onBlur={() => setEditingDayLabel(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingDayLabel(null)}
                    style={styles.inlineInput}
                  />
                ) : (
                  <div
                    onClick={() => setEditingDayLabel(dayKey)}
                    style={{ fontSize: 11, color: colors.textMuted, flex: 1, cursor: "text", padding: "2px 4px", borderRadius: 4, border: `1px dashed ${colors.borderDim}` }}
                  >
                    {day.label || "—"}
                  </div>
                )}
              </div>

              {/* Exercise list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {day.exercises.map((ex, i) => {
                  const compositeId = `${dayKey}|||${ex.id}`;
                  const isEditing = editingExId === compositeId;
                  return (
                    <div key={ex.id} style={{ ...styles.previewExercise, flexDirection: "column", alignItems: "stretch", padding: "8px 0", gap: 0 }}>
                      {isEditing ? (
                        /* Expanded edit form */
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <ExerciseNameInput
                            autoFocus
                            value={ex.name}
                            onChange={(name, catalogId) => {
                              updatePreviewEx(dayKey, ex.id, "name", name);
                              if (catalogId) updatePreviewEx(dayKey, ex.id, "exerciseId", catalogId);
                            }}
                            placeholder={t("plan.exerciseNameTemplate", { n: i + 1 })}
                            style={styles.editInput}
                          />
                          <div style={{ display: "flex", gap: 6 }}>
                            <input
                              value={ex.sets}
                              onChange={(e) => updatePreviewEx(dayKey, ex.id, "sets", e.target.value)}
                              placeholder={t("plan.setsPlaceholder")}
                              style={{ ...styles.editInput, flex: 1 }}
                            />
                            <input
                              value={ex.reps}
                              onChange={(e) => updatePreviewEx(dayKey, ex.id, "reps", e.target.value)}
                              placeholder={t("plan.repsPlaceholder")}
                              style={{ ...styles.editInput, flex: 2 }}
                            />
                            <input
                              value={ex.rest}
                              onChange={(e) => updatePreviewEx(dayKey, ex.id, "rest", e.target.value)}
                              placeholder={t("plan.restPlaceholder")}
                              style={{ ...styles.editInput, flex: 1 }}
                            />
                          </div>
                          <input
                            value={ex.note}
                            onChange={(e) => updatePreviewEx(dayKey, ex.id, "note", e.target.value)}
                            placeholder={t("plan.notePlaceholder")}
                            style={styles.editInput}
                          />
                          <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                            <button
                              onClick={() => cancelEditEx(dayKey, ex.id)}
                              style={styles.editActionBtn}
                            >
                              {t("common.cancel")}
                            </button>
                            <button
                              onClick={() => { editSnapshot.current = null; setEditingExId(null); }}
                              style={{ ...styles.editActionBtn, color: colors.accent.orange, borderColor: colors.accent.orange }}
                            >
                              {t("common.save")}
                            </button>
                            <button
                              onClick={() => removePreviewEx(dayKey, ex.id)}
                              disabled={day.exercises.length <= 1}
                              style={{ ...styles.editActionBtn, marginLeft: "auto", color: colors.warning, borderColor: colors.warning, opacity: day.exercises.length <= 1 ? 0.35 : 1 }}
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
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            borderRadius: 8,
                            background: dragOver?.dayKey === dayKey && dragOver?.toIdx === i
                              ? `${colors.accent.orange}20`
                              : "transparent",
                            transition: "background 0.12s",
                          }}
                        >
                          {/* Drag handle — large touch target, pointer-event based */}
                          <button
                            aria-label={t("generator.dragToReorder")}
                            style={styles.dragHandle}
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
                          <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textGhost, minWidth: 20 }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span
                            onClick={() => openEditEx(dayKey, ex)}
                            style={{ flex: 1, fontSize: 13, cursor: "pointer" }}
                          >
                            {ex.name || <span style={{ color: colors.textMuted, fontStyle: "italic" }}>—</span>}
                          </span>
                          <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim }}>
                            {ex.sets}×{ex.reps}
                          </span>
                          <button
                            onClick={() => openEditEx(dayKey, ex)}
                            style={styles.editIconBtn}
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
                style={{ ...styles.editActionBtn, marginTop: 8, width: "100%", justifyContent: "center" }}
              >
                {t("generator.addExercise")}
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleRegenerate} style={styles.ghostBtn}>
            {t("generator.regenerate")}
          </button>
          <button
            onClick={handleApply}
            style={{ ...styles.primaryBtn, flex: 1, background: colors.accent.orange, color: colors.bg }}
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        {canGoBack ? (
          <BackButton onClick={() => setStep((s) => s - 1)} />
        ) : step === 4 ? (
          <BackButton onClick={handleRegenerate} />
        ) : (
          <div />
        )}
        <button onClick={onClose} style={styles.ghostBtn}>
          {t("generator.discard")}
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionLabel color={colors.accent.orange}>{t("generator.title")}</SectionLabel>
        {!isAIAvailable() && step < 4 && (
          <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, marginBottom: 8 }}>
            {t("generator.sourceRules")}
          </div>
        )}
      </div>

      {/* Step progress dots */}
      <div style={styles.progressDots}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: step >= 4 ? 20 : step === i ? 20 : 8,
              height: 4,
              borderRadius: 2,
              background: (step >= 4 || step >= i) ? colors.accent.orange : colors.border,
              transition: "all 0.2s",
            }}
          />
        ))}
      </div>

      {steps[step]()}
    </PageContainer>
  );
}

/* ---- Sub-components ---- */

function OptionButton({ label, active, onClick, compact = false }: { label: string; active: boolean; onClick: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `2px solid ${active ? colors.accent.orange : colors.border}`,
        background: active ? `${colors.accent.orange}15` : colors.surface,
        color: active ? colors.accent.orange : colors.textSecondary,
        borderRadius: 12,
        padding: compact ? "12px 16px" : "16px 18px",
        cursor: "pointer",
        fontFamily: fonts.sans,
        fontSize: compact ? 14 : 15,
        fontWeight: active ? 600 : 400,
        transition: "all 0.15s",
        minHeight: 48,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {label}
    </button>
  );
}

/* ---- Styles ---- */

const styles: Record<string, import("react").CSSProperties> = {
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  optionsRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  fieldLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  textarea: {
    width: "100%",
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: "14px 14px",
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 14,
    resize: "vertical",
    minHeight: 80,
  },
  primaryBtn: {
    width: "100%",
    padding: 16,
    border: "none",
    borderRadius: 12,
    background: colors.surface,
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    minHeight: 50,
    WebkitTapHighlightColor: "transparent",
  },
  ghostBtn: {
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.textSecondary,
    borderRadius: 10,
    padding: "8px 10px",
    cursor: "pointer",
    fontFamily: fonts.mono,
    fontSize: 11,
    WebkitTapHighlightColor: "transparent",
  },
  errorMsg: {
    marginTop: 12,
    color: colors.warning,
    fontFamily: fonts.mono,
    fontSize: 11,
    textAlign: "center",
  },
  sourceBadge: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textDim,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: "4px 8px",
  },
  progressDots: {
    display: "flex",
    gap: 6,
    marginBottom: 20,
    alignItems: "center",
  },
  previewDay: {
    background: colors.surface,
    borderRadius: 12,
    padding: 14,
    border: `1px solid ${colors.borderLight}`,
  },
  previewExercise: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 0",
    borderBottom: `1px solid ${colors.borderDim}`,
  },
  editInput: {
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: "8px 10px",
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
  },
  inlineInput: {
    background: "transparent",
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    padding: "2px 6px",
    color: colors.textSecondary,
    fontFamily: fonts.sans,
    fontSize: 11,
    flex: 1,
    minWidth: 0,
  },
  editActionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "transparent",
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: "6px 12px",
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 11,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  editIconBtn: {
    background: "transparent",
    border: "none",
    color: colors.textDim,
    fontSize: 12,
    cursor: "pointer",
    padding: "4px 6px",
    WebkitTapHighlightColor: "transparent",
  },
  dragHandle: {
    background: "transparent",
    border: "none",
    color: colors.textDim,
    fontSize: 20,
    lineHeight: 1,
    cursor: "grab",
    padding: "4px 4px",
    touchAction: "none",      // prevents scroll hijacking the drag gesture
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTapHighlightColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
    minHeight: 44,             // 44 px minimum touch target
  },
};
