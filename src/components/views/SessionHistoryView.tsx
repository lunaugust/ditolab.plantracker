import { useState } from "react";
import { BackButton, PageContainer, SectionLabel } from "../ui";
import { colors } from "../../theme";
import { useI18n } from "../../i18n";
import type { ReactNode } from "react";
import type { WorkoutHistoryEntry } from "../../services/types";
import classes from "./SessionHistoryView.module.css";

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
      <div className={classes.shell}>
        <BackButton onClick={onBack} />

        <div className={classes.heroCard}>
          <div className={classes.eyebrow}>{t("history.eyebrow")}</div>
          <div className={classes.heroTitle}>{t("history.title")}</div>
          <div className={classes.heroSubtitle}>{t("history.subtitle")}</div>
        </div>

        <div className={classes.metricsGrid}>
          <MetricCard label={t("history.metrics.sessions")} value={String(sessions.length)} />
          <MetricCard label={t("history.metrics.completed")} value={String(completedSessions)} />
          <MetricCard label={t("history.metrics.minutes")} value={String(totalMinutes)} />
          <MetricCard label={t("history.metrics.sets")} value={String(totalSets)} />
        </div>

        {sessions.length === 0 ? (
          <div className={classes.emptyCard}>
            <SectionLabel color={colors.accent.blue}>{t("history.emptyTitle")}</SectionLabel>
            <div className={classes.emptyText}>{t("history.emptySubtitle")}</div>
          </div>
        ) : (
          <div className={classes.listColumn}>
            {sessions.map((session) => {
              const expanded = expandedSessionId === session.id;
              return (
                <div key={session.id} className={`${classes.sessionCard} ${session.completed ? classes.sessionCardCompleted : classes.sessionCardIncomplete}`}>
                  <button
                    onClick={() => setExpandedSessionId((prev) => (prev === session.id ? null : session.id))}
                    className={classes.sessionHeaderButton}
                  >
                    <div className={classes.sessionHeaderTop}>
                      <div className={classes.sessionHeaderMain}>
                        <div className={classes.sessionDay}>{session.dayLabel}</div>
                        <div className={classes.sessionDate}>{formatDateTime(session.startedAt, t)}</div>
                      </div>
                      <div className={`${classes.statusPill} ${session.completed ? classes.statusCompleted : classes.statusIncomplete}`}>
                        {session.completed ? t("history.completed") : t("history.endedEarly")}
                      </div>
                    </div>
                    <div className={classes.sessionMeta}>
                      <span>{formatDuration(session.durationSeconds)}</span>
                      <span>{session.totalLoggedSets} {t("history.metrics.sets")}</span>
                      <span>{t("history.exerciseProgress", { current: session.completedExercises, total: session.totalExercises })}</span>
                    </div>
                  </button>

                  {expanded && (
                    <div className={classes.sessionBody}>
                      <div className={classes.detailRow}>
                        <DetailLabel>{t("history.startedAt")}</DetailLabel>
                        <DetailValue>{formatDateTime(session.startedAt, t)}</DetailValue>
                      </div>
                      <div className={classes.detailRow}>
                        <DetailLabel>{t("history.endedAt")}</DetailLabel>
                        <DetailValue>{formatDateTime(session.endedAt, t)}</DetailValue>
                      </div>

                      <div className={classes.exerciseList}>
                        {session.exercises.map((exercise) => (
                          <div key={exercise.exerciseId} className={classes.exerciseRow}>
                            <div>
                              <div className={classes.exerciseName}>{exercise.name}</div>
                              <div className={classes.exerciseRest}>{exercise.rest || t("history.noRest")}</div>
                            </div>
                            <div className={classes.exerciseSets}>{exercise.completedSets}/{exercise.plannedSets}</div>
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
      </div>
    </PageContainer>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={classes.metricCard}>
      <div className={classes.metricValue}>{value}</div>
      <div className={classes.metricLabel}>{label}</div>
    </div>
  );
}

function DetailLabel({ children }: { children: ReactNode }) {
  return <div className={classes.detailLabel}>{children}</div>;
}

function DetailValue({ children }: { children: ReactNode }) {
  return <div className={classes.detailValue}>{children}</div>;
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