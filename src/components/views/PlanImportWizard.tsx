import { useState, useCallback, useRef, DragEvent, ChangeEvent } from "react";
import { colors } from "../../theme";
import { SectionLabel, PageContainer, BackButton } from "../ui";
import { useI18n } from "../../i18n";
import { importPlanFromFile, isImportAvailable, detectMimeType } from "../../services/planImporter";
import type { TrainingPlan } from "../../services/types";
import classes from "./PlanImportWizard.module.css";

/**
 * Full-screen overlay wizard that lets users import a training plan
 * from a PDF or CSV/TXT file via Firebase AI Logic (Gemini).
 *
 * Steps:
 *   0 — Drop-zone / file picker
 *   1 — Loading (auto-triggered once a file is chosen)
 *   2 — Preview extracted plan → Apply or Discard
 *
 * @param {{
 *   onApply: (plan: TrainingPlan) => void,
 *   onClose: () => void,
 * }} props
 */
export function PlanImportWizard({
  onApply,
  onClose,
}: {
  onApply: (plan: TrainingPlan) => void;
  onClose: () => void;
}) {
  const { t, language } = useI18n();
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<TrainingPlan | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiAvailable = isImportAvailable();

  // ---------------------------------------------------------------------------
  // File processing
  // ---------------------------------------------------------------------------

  const processFile = useCallback(
    async (file: File) => {
      setError("");
      setFileName(file.name);

      // Validate file type before even calling the service
      if (!detectMimeType(file)) {
        setError(t("importer.errorUnsupported"));
        return;
      }

      const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
      if (file.size > MAX_BYTES) {
        setError(t("importer.errorUnsupported"));
        return;
      }

      setStep(1); // → loading
      try {
        const { plan } = await importPlanFromFile(file, language);
        setPreview(plan);
        // Expand the first day by default
        const firstKey = Object.keys(plan)[0];
        if (firstKey) setOpenDays({ [firstKey]: true });
        setStep(2); // → preview
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "AI_UNAVAILABLE") {
          setError(t("importer.errorNoAI"));
        } else if (msg === "UNSUPPORTED_FILE_TYPE") {
          setError(t("importer.errorUnsupported"));
        } else if (msg === "NO_PLAN_FOUND") {
          setError(t("importer.errorEmpty"));
        } else {
          setError(t("importer.errorGeneric"));
        }
        setStep(0); // back to drop zone on failure
      }
    },
    [language, t]
  );

  // ---------------------------------------------------------------------------
  // Drag & drop handlers
  // ---------------------------------------------------------------------------

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset so the same file can be re-selected if user re-tries
    e.target.value = "";
  };

  // ---------------------------------------------------------------------------
  // Actions on preview screen
  // ---------------------------------------------------------------------------

  const handleApply = () => {
    if (!preview) return;
    if (!window.confirm(t("importer.confirmReplace"))) return;
    onApply(preview);
  };

  const handleTryAnother = () => {
    setPreview(null);
    setFileName("");
    setError("");
    setOpenDays({});
    setStep(0);
  };

  const toggleDay = (dayKey: string) => {
    setOpenDays((prev) => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  // ---------------------------------------------------------------------------
  // Derived data for preview
  // ---------------------------------------------------------------------------

  const previewDays = preview ? Object.keys(preview) : [];
  const totalExercises = preview
    ? previewDays.reduce((sum, d) => sum + preview[d].exercises.length, 0)
    : 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <PageContainer>
      <div className={classes.shell}>
      {/* Header */}
      <div className={classes.headerRow}>
        <BackButton onClick={onClose} />
        <SectionLabel color={colors.accent.blue}>{t("importer.title")}</SectionLabel>
      </div>

      <div className={classes.heroCard}>
        <div className={classes.heroTopRow}>
          <div>
            <div className={classes.heroTitle}>{t("importer.subtitle")}</div>
            <div className={classes.heroSubtitle}>{fileName || t("importer.supported")}</div>
          </div>
          <div className={classes.heroMetric}>{step === 2 ? t("generator.preview") : `${step + 1}/3`}</div>
        </div>
      </div>

      {/* ── Step 0: Drop Zone ── */}
      {step === 0 && (
        <div>
          <p className={classes.supportText}>
            {t("importer.subtitle")}
          </p>

          {/* Guest warning */}
          {!aiAvailable && (
            <div className={classes.warningBanner}>
              {t("importer.guestNote")}
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`${classes.dropZone}${dragActive ? ` ${classes.dropZoneActive}` : ""}`}
          >
            <div className={classes.dropIcon}>📂</div>
            <div className={classes.dropHint}>
              {t("importer.dropHint")}
            </div>
            <div className={classes.orLabel}>
              {t("importer.orLabel")}
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv,.txt,application/pdf,text/plain,text/csv"
              aria-label={t("importer.selectFile")}
              className={classes.fileInput}
              onChange={onFileChange}
              disabled={!aiAvailable}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!aiAvailable}
              className={`${classes.primaryButton}${!aiAvailable ? ` ${classes.primaryButtonDisabled}` : ""}`}
            >
              {t("importer.selectFile")}
            </button>

            <div className={classes.supportedText}>
              {t("importer.supported")}
            </div>
          </div>

          {/* Inline error */}
          {error && (
            <div className={classes.errorBanner}>{error}</div>
          )}
        </div>
      )}

      {/* ── Step 1: Loading ── */}
      {step === 1 && (
        <div className={classes.loadingContainer}>
          <div className={classes.spinner} />
          <div className={classes.loadingLabel}>
            {t("importer.analysing")}
          </div>
          {fileName && (
            <div className={classes.loadingFileName}>
              {fileName}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === 2 && preview && (
        <div>
          {/* Summary bar */}
          <div className={classes.summaryBar}>
            <span className={classes.summaryText}>
              <strong className={classes.summaryStrong}>{previewDays.length}</strong>{" "}
              {t("importer.days")} · <strong className={classes.summaryStrong}>{totalExercises}</strong>{" "}
              {t("importer.exercises")}
            </span>
          </div>

          {/* Day list */}
          <div className={classes.dayList}>
            {previewDays.map((dayKey, i) => {
              const day = preview[dayKey];
              const color = day.color ?? colors.accent.blue;
              const isOpen = !!openDays[dayKey];

              return (
                <div key={dayKey} className={`${classes.dayCard} ${classes.dayCardTone}`}>
                  {/* Day header — tap to expand/collapse */}
                  <button
                    onClick={() => toggleDay(dayKey)}
                    className={classes.dayHeader}
                  >
                    <div className={classes.dayHeaderInfo}>
                      <span
                        className={`${classes.dayDot} ${getToneClass(color)}`}
                      />
                      <span className={classes.dayIndex}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={classes.dayName}>
                        {dayKey}
                      </span>
                      {day.label && (
                        <span className={classes.dayLabel}>
                          — {day.label}
                        </span>
                      )}
                    </div>
                    <div className={classes.dayHeaderMeta}>
                      <span className={classes.dayCount}>
                        {day.exercises.length}x
                      </span>
                      <span className={classes.dayChevron}>
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </div>
                  </button>

                  {/* Exercise list (collapsible) */}
                  {isOpen && (
                    <div className={classes.exerciseList}>
                      {day.exercises.map((ex, j) => (
                        <div key={ex.id} className={classes.exerciseRow}>
                          <span className={classes.exerciseIndex}>{String(j + 1).padStart(2, "0")}</span>
                          <div className={classes.exerciseContent}>
                            <div className={classes.exerciseName}>{ex.name || "—"}</div>
                            {(ex.sets || ex.reps || ex.rest) && (
                              <div className={classes.exerciseMeta}>
                                {[ex.sets && `${ex.sets}s`, ex.reps && `${ex.reps}r`, ex.rest].filter(Boolean).join(" · ")}
                              </div>
                            )}
                            {ex.note && (
                              <div className={classes.exerciseNote}>
                                {ex.note}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className={classes.actions}>
            <button onClick={handleApply} className={classes.primaryButton}>
              {t("importer.apply")}
            </button>
            <div className={classes.secondaryActions}>
              <button onClick={handleTryAnother} className={`${classes.ghostButton} ${classes.ghostButtonAccent}`}>
                {t("importer.tryAnother")}
              </button>
              <button onClick={onClose} className={classes.ghostButton}>
                {t("importer.discard")}
              </button>
            </div>
          </div>
        </div>
      )}
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
