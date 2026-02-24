import { useEffect, useState } from "react";
import { TRAINING_PLAN, DAY_KEYS, DAY_COLORS } from "../../data/trainingPlan";
import { getLastLog, formatDate } from "../../utils/helpers";
import { DayTabs, SectionLabel, BackButton, PageContainer } from "../ui";
import { ExerciseRow } from "../exercises";
import { colors, fonts } from "../../theme";

/**
 * "Registrar" screen — exercise log form + history.
 *
 * @param {{
 *   activeDay: string,
 *   setActiveDay: (d: string) => void,
 *   selectedExercise: import("../../data/trainingPlan").Exercise | null,
 *   selectExercise: (ex: import("../../data/trainingPlan").Exercise) => void,
 *   clearExercise: () => void,
 *   logs: Record<string, import("../../services/types").LogEntry[]>,
 *   addLog: (exId: string, data: { weight: string, reps: string, notes: string }) => void,
 *   deleteLog: (exId: string, idx: number) => void,
 * }} props
 */
export function LogView({
  activeDay,
  setActiveDay,
  selectedExercise,
  selectExercise,
  clearExercise,
  logs,
  addLog,
  deleteLog,
}) {
  const [form, setForm] = useState({ weight: "", reps: "", notes: "" });

  useEffect(() => {
    if (!selectedExercise) return;

    const entries = logs[selectedExercise.id] || [];
    const latest = entries[entries.length - 1];

    setForm({
      weight: latest?.weight ?? "",
      reps: latest?.reps ?? "",
      notes: "",
    });
  }, [selectedExercise, logs]);

  const handleSubmit = () => {
    addLog(selectedExercise.id, form);
    setForm((prev) => ({ weight: prev.weight, reps: prev.reps, notes: "" }));
  };

  const adjustWeight = (delta) => {
    const current = Number(form.weight);
    const safeCurrent = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, safeCurrent + delta);
    setForm((prev) => ({ ...prev, weight: String(next) }));
  };

  /* ---- Exercise picker ---- */
  if (!selectedExercise) {
    return (
      <PageContainer>
        <SectionLabel>SELECCIONÁ UN EJERCICIO</SectionLabel>

        <DayTabs
          days={DAY_KEYS}
          activeDay={activeDay}
          dayColors={DAY_COLORS}
          onSelect={setActiveDay}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {TRAINING_PLAN[activeDay].exercises.map((ex, i) => {
            const exLogs = logs[ex.id] || [];
            const last = getLastLog(logs, ex.id);
            return (
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                index={i}
                accentColor={DAY_COLORS[activeDay]}
                lastLog={last}
                totalLogs={exLogs.length}
                showDetails={true}
                showChevron
                onClick={() => selectExercise(ex)}
              />
            );
          })}
        </div>
      </PageContainer>
    );
  }

  /* ---- Log form + history ---- */
  const entries = logs[selectedExercise.id] || [];
  const accentColor = DAY_COLORS[activeDay];

  return (
    <PageContainer>
      <BackButton onClick={clearExercise} />

      {/* Exercise header */}
      <div style={{ marginBottom: 24 }}>
        <SectionLabel color={accentColor}>REGISTRAR</SectionLabel>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{selectedExercise.name}</div>
        <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted }}>
          {selectedExercise.sets} series · {selectedExercise.reps} · {selectedExercise.rest}
        </div>
        {selectedExercise.note && (
          <div style={{ fontSize: 11, color: colors.warning, marginTop: 6, fontStyle: "italic" }}>
            ⚠ {selectedExercise.note}
          </div>
        )}
      </div>

      {/* Form */}
      <div style={formStyles.card}>
        <div style={formStyles.grid}>
          {[
            ["weight", "Peso (kg)", "0"],
            ["reps", "Reps realizadas", "0"],
          ].map(([field, label, placeholder]) => (
            <div key={field}>
              <div style={formStyles.fieldLabel}>{label.toUpperCase()}</div>
              {field === "weight" ? (
                <div style={formStyles.weightControls}>
                  <button type="button" onClick={() => adjustWeight(-5)} style={formStyles.adjustBtn}>
                    -5
                  </button>
                  <input
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    type="number"
                    style={formStyles.numberInput}
                  />
                  <button type="button" onClick={() => adjustWeight(5)} style={formStyles.adjustBtn}>
                    +5
                  </button>
                </div>
              ) : (
                <input
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  placeholder={placeholder}
                  type="number"
                  style={formStyles.numberInput}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={formStyles.fieldLabel}>NOTAS (OPCIONAL)</div>
          <input
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Ej: técnica mejorada, RPE 8..."
            style={formStyles.textInput}
          />
        </div>

        <button onClick={handleSubmit} style={{ ...formStyles.submit, background: accentColor }}>
          Guardar registro
        </button>
      </div>

      {/* History */}
      <SectionLabel>HISTORIAL</SectionLabel>

      {entries.length === 0 ? (
        <div style={styles.emptyState}>Sin registros aún</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[...entries].reverse().map((entry, ri) => {
            const originalIdx = entries.length - 1 - ri;
            return (
              <div
                key={originalIdx}
                style={styles.logEntry}
              >
                <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, minWidth: 40 }}>
                  {formatDate(entry.date)}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: fonts.mono, fontSize: 14, color: accentColor, fontWeight: 600 }}>
                    {entry.weight ? `${entry.weight} kg` : "—"}
                  </span>
                  {entry.reps && (
                    <span style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted, marginLeft: 10 }}>
                      × {entry.reps} reps
                    </span>
                  )}
                  {entry.notes && (
                    <div style={{ fontSize: 11, color: colors.textDim, marginTop: 3 }}>{entry.notes}</div>
                  )}
                </div>
                <button
                  className="del-btn"
                  onClick={() => deleteLog(selectedExercise.id, originalIdx)}
                  style={styles.deleteBtn}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

/* ---- Styles ---- */
const formStyles = {
  card: {
    background: colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    border: `1px solid ${colors.border}`,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 1,
  },
  numberInput: {
    width: "100%",
    background: colors.bg,
    border: `1px solid #222`,
    borderRadius: 10,
    padding: "14px 14px",
    color: colors.textPrimary,
    fontFamily: fonts.mono,
    fontSize: 18,
    WebkitAppearance: "none",
  },
  weightControls: {
    display: "grid",
    gridTemplateColumns: "48px 1fr 48px",
    gap: 8,
    alignItems: "center",
  },
  adjustBtn: {
    border: `1px solid ${colors.border}`,
    background: colors.bg,
    color: colors.textPrimary,
    borderRadius: 10,
    minHeight: 48,
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  textInput: {
    width: "100%",
    background: colors.bg,
    border: `1px solid #222`,
    borderRadius: 10,
    padding: "14px 14px",
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  submit: {
    width: "100%",
    padding: 16,
    border: "none",
    borderRadius: 12,
    color: colors.bg,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    minHeight: 50,
    WebkitTapHighlightColor: "transparent",
  },
};

const styles = {
  emptyState: {
    color: colors.textGhost,
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    padding: "30px 0",
  },
  logEntry: {
    background: colors.surface,
    borderRadius: 10,
    padding: "14px 14px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: `1px solid ${colors.borderLight}`,
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: colors.textGhost,
    cursor: "pointer",
    fontSize: 18,
    padding: "8px",
    minWidth: 36,
    minHeight: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    opacity: 0.6,
    transition: "opacity 0.15s",
    WebkitTapHighlightColor: "transparent",
  },
};
