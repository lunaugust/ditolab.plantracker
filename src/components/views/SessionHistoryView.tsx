import { useState } from "react";
import { BackButton, PageContainer, SectionLabel } from "../ui";
import { colors, fonts } from "../../theme";
import { useI18n } from "../../i18n";
import type { CSSProperties, ReactNode } from "react";
import type { WorkoutHistoryEntry } from "../../services/types";

interface SessionHistoryViewProps {
  sessions: WorkoutHistoryEntry[];
  onBack: () => void;
}

export function SessionHistoryView({ sessions, onBack }: SessionHistoryViewProps) {
  const { t } = useI18n();
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(sessions[0]?.id ?? null);

  const totalMinutes = Math.round(sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 60);
  const totalSets = sessions.reduce((sum, session) => sum + session.totalLoggedSets, 0);
  const completedSessions = sessions.filter((session) => session.completed).length;

  return (
    <PageContainer>
      <BackButton onClick={onBack} />

      <div style={styles.heroCard}>
        <div style={styles.eyebrow}>{t("history.eyebrow")}</div>
        <div style={styles.heroTitle}>{t("history.title")}</div>
        <div style={styles.heroSubtitle}>{t("history.subtitle")}</div>
      </div>

      <div style={styles.metricsGrid}>
        <MetricCard label={t("history.metrics.sessions")} value={String(sessions.length)} />
        <MetricCard label={t("history.metrics.completed")} value={String(completedSessions)} />
        <MetricCard label={t("history.metrics.minutes")} value={String(totalMinutes)} />
        <MetricCard label={t("history.metrics.sets")} value={String(totalSets)} />
      </div>

      {sessions.length === 0 ? (
        <div style={styles.emptyCard}>
          <SectionLabel>{t("history.emptyTitle")}</SectionLabel>
          <div style={styles.emptyText}>{t("history.emptySubtitle")}</div>
        </div>
      ) : (
        <div style={styles.listColumn}>
          {sessions.map((session) => {
            const expanded = expandedSessionId === session.id;
            return (
              <div key={session.id} style={styles.sessionCard}>
                <button
                  onClick={() => setExpandedSessionId((prev) => (prev === session.id ? null : session.id))}
                  style={styles.sessionHeaderButton}
                >
                  <div style={styles.sessionHeaderTop}>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={styles.sessionDay}>{session.dayLabel}</div>
                      <div style={styles.sessionDate}>{formatDateTime(session.startedAt, t)}</div>
                    </div>
                    <div style={{ ...styles.statusPill, color: session.completed ? colors.accent.green : colors.warning }}>
                      {session.completed ? t("history.completed") : t("history.endedEarly")}
                    </div>
                  </div>
                  <div style={styles.sessionMeta}>
                    <span>{formatDuration(session.durationSeconds)}</span>
                    <span>{session.totalLoggedSets} {t("history.metrics.sets")}</span>
                    <span>{t("history.exerciseProgress", { current: session.completedExercises, total: session.totalExercises })}</span>
                  </div>
                </button>

                {expanded && (
                  <div style={styles.sessionBody}>
                    <div style={styles.detailRow}>
                      <DetailLabel>{t("history.startedAt")}</DetailLabel>
                      <DetailValue>{formatDateTime(session.startedAt, t)}</DetailValue>
                    </div>
                    <div style={styles.detailRow}>
                      <DetailLabel>{t("history.endedAt")}</DetailLabel>
                      <DetailValue>{formatDateTime(session.endedAt, t)}</DetailValue>
                    </div>

                    <div style={styles.exerciseList}>
                      {session.exercises.map((exercise) => (
                        <div key={exercise.exerciseId} style={styles.exerciseRow}>
                          <div>
                            <div style={styles.exerciseName}>{exercise.name}</div>
                            <div style={styles.exerciseRest}>{exercise.rest || t("history.noRest")}</div>
                          </div>
                          <div style={styles.exerciseSets}>{exercise.completedSets}/{exercise.plannedSets}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricValue}>{value}</div>
      <div style={styles.metricLabel}>{label}</div>
    </div>
  );
}

function DetailLabel({ children }: { children: ReactNode }) {
  return <div style={styles.detailLabel}>{children}</div>;
}

function DetailValue({ children }: { children: ReactNode }) {
  return <div style={styles.detailValue}>{children}</div>;
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function formatDateTime(value: string, t: (key: string) => string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("history.invalidDate");

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const styles: Record<string, CSSProperties> = {
  heroCard: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.accent.blue,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 18,
  },
  metricCard: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 14,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.mono,
  },
  emptyCard: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 18,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 1.5,
  },
  listColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sessionCard: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    overflow: "hidden",
  },
  sessionHeaderButton: {
    width: "100%",
    background: "transparent",
    border: "none",
    padding: 14,
    cursor: "pointer",
    color: colors.textPrimary,
    display: "block",
  },
  sessionHeaderTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  sessionDay: {
    fontSize: 15,
    fontWeight: 700,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sessionDate: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  statusPill: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sessionMeta: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fonts.mono,
    textAlign: "left",
  },
  sessionBody: {
    borderTop: `1px solid ${colors.borderLight}`,
    padding: 14,
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  detailLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  detailValue: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  exerciseList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 12,
  },
  exerciseRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    background: colors.surfaceAlt,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: 10,
    padding: 10,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
  },
  exerciseRest: {
    color: colors.textMuted,
    fontSize: 11,
  },
  exerciseSets: {
    color: colors.accent.blue,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
};