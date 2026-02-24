import { useState, useCallback, useRef, DragEvent, ChangeEvent } from "react";
import { colors, fonts } from "../../theme";
import { SectionLabel, PageContainer, BackButton } from "../ui";
import { useI18n } from "../../i18n";
import { importPlanFromFile, isImportAvailable, detectMimeType } from "../../services/planImporter";
import type { TrainingPlan } from "../../services/types";

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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <BackButton onClick={onClose} />
        <SectionLabel>{t("importer.title")}</SectionLabel>
      </div>

      {/* ── Step 0: Drop Zone ── */}
      {step === 0 && (
        <div>
          <p style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            {t("importer.subtitle")}
          </p>

          {/* Guest warning */}
          {!aiAvailable && (
            <div style={styles.warningBanner}>
              {t("importer.guestNote")}
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={{
              ...styles.dropZone,
              borderColor: dragActive ? colors.accent.blue : colors.border,
              background: dragActive ? colors.surface : colors.bg,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
            <div style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 6 }}>
              {t("importer.dropHint")}
            </div>
            <div style={{ color: colors.textGhost, fontSize: 12, marginBottom: 20 }}>
              {t("importer.orLabel")}
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv,.txt,application/pdf,text/plain,text/csv"
              aria-label={t("importer.selectFile")}
              style={{ display: "none" }}
              onChange={onFileChange}
              disabled={!aiAvailable}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!aiAvailable}
              style={{
                ...styles.primaryButton,
                opacity: aiAvailable ? 1 : 0.4,
                cursor: aiAvailable ? "pointer" : "not-allowed",
              }}
            >
              {t("importer.selectFile")}
            </button>

            <div style={{ color: colors.textGhost, fontSize: 11, marginTop: 16 }}>
              {t("importer.supported")}
            </div>
          </div>

          {/* Inline error */}
          {error && (
            <div style={styles.errorBanner}>{error}</div>
          )}
        </div>
      )}

      {/* ── Step 1: Loading ── */}
      {step === 1 && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <div style={{ color: colors.textSecondary, fontSize: 14, marginTop: 20 }}>
            {t("importer.analysing")}
          </div>
          {fileName && (
            <div style={{ color: colors.textGhost, fontSize: 12, marginTop: 6 }}>
              {fileName}
            </div>
          )}
          <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === 2 && preview && (
        <div>
          {/* Summary bar */}
          <div style={styles.summaryBar}>
            <span style={{ color: colors.textSecondary }}>
              <strong style={{ color: colors.textPrimary }}>{previewDays.length}</strong>{" "}
              {t("importer.days")} · <strong style={{ color: colors.textPrimary }}>{totalExercises}</strong>{" "}
              {t("importer.exercises")}
            </span>
          </div>

          {/* Day list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {previewDays.map((dayKey, i) => {
              const day = preview[dayKey];
              const color = day.color ?? colors.accent.blue;
              const isOpen = !!openDays[dayKey];

              return (
                <div key={dayKey} style={styles.dayCard}>
                  {/* Day header — tap to expand/collapse */}
                  <button
                    onClick={() => toggleDay(dayKey)}
                    style={styles.dayHeader}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: color,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textGhost }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>
                        {dayKey}
                      </span>
                      {day.label && (
                        <span style={{ fontSize: 12, color: colors.textSecondary }}>
                          — {day.label}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: colors.textGhost, fontFamily: fonts.mono }}>
                        {day.exercises.length}x
                      </span>
                      <span style={{ color: colors.textGhost, fontSize: 12 }}>
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </div>
                  </button>

                  {/* Exercise list (collapsible) */}
                  {isOpen && (
                    <div style={{ padding: "4px 14px 12px" }}>
                      {day.exercises.map((ex, j) => (
                        <div key={ex.id} style={styles.exRow}>
                          <span style={styles.exIndex}>{String(j + 1).padStart(2, "0")}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, color: colors.textPrimary }}>{ex.name || "—"}</div>
                            {(ex.sets || ex.reps || ex.rest) && (
                              <div style={{ fontSize: 11, color: colors.textGhost, fontFamily: fonts.mono, marginTop: 2 }}>
                                {[ex.sets && `${ex.sets}s`, ex.reps && `${ex.reps}r`, ex.rest].filter(Boolean).join(" · ")}
                              </div>
                            )}
                            {ex.note && (
                              <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2, fontStyle: "italic" }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={handleApply} style={styles.primaryButton}>
              {t("importer.apply")}
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleTryAnother} style={{ ...styles.ghostButton, flex: 1 }}>
                {t("importer.tryAnother")}
              </button>
              <button onClick={onClose} style={{ ...styles.ghostButton, flex: 1 }}>
                {t("importer.discard")}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  dropZone: {
    border: `2px dashed ${colors.border}`,
    borderRadius: 16,
    padding: "40px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    transition: "border-color 0.2s, background 0.2s",
  },
  primaryButton: {
    width: "100%",
    background: colors.accent.blue,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 20px",
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.04em",
  },
  ghostButton: {
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.textSecondary,
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  errorBanner: {
    marginTop: 16,
    padding: "12px 16px",
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    color: "#e85a5a",
    fontSize: 13,
  },
  warningBanner: {
    marginBottom: 16,
    padding: "12px 16px",
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    color: colors.textSecondary,
    fontSize: 13,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  spinner: {
    width: 40,
    height: 40,
    border: `3px solid ${colors.border}`,
    borderTop: `3px solid ${colors.accent.blue}`,
    borderRadius: "50%",
    animation: "_spin 0.9s linear infinite",
  },
  summaryBar: {
    marginBottom: 16,
    fontSize: 14,
  },
  dayCard: {
    background: colors.surface,
    borderRadius: 12,
    border: `1px solid ${colors.borderLight ?? colors.border}`,
    overflow: "hidden",
  },
  dayHeader: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    background: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
  },
  exRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    paddingTop: 8,
    borderTop: `1px solid ${colors.borderLight ?? colors.border}`,
    marginTop: 4,
  },
  exIndex: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textGhost,
    minWidth: 20,
    paddingTop: 3,
  },
};
