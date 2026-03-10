import { useEffect, useRef, useState } from "react";
import styles from "./App.module.css";
import { useTrainingLogs, useNavigation, useAuth, useTrainingPlan, useInstallPWA, useWorkoutSessions } from "./hooks";
import { Header, LoadingScreen, AuthScreen, FeedbackModal, WhatsNewModal } from "./components/layout";
import { APP_VERSION, WHATS_NEW_STORAGE_KEY } from "./data/changelog";
import { PlanView, PlanGeneratorWizard, PlanImportWizard, ExerciseDetailView, SessionHistoryView } from "./components/views";
import type { TrainingPlan, WorkoutHistoryEntry, WorkoutSession } from "./services/types";

/**
 * Root application component.
 *
 * Orchestrates the hooks and renders a unified workout view with full-screen exercise detail navigation.
 */
export default function App() {
  const auth = useAuth();
  const storageScope = auth.user?.uid || "guest";
  const { logs, loading: logsLoading, saveMsg: logSaveMsg, addLog, deleteLog } = useTrainingLogs(storageScope);
  const { sessions: workoutHistory, loading: historyLoading, saveMsg: historySaveMsg, addSession } = useWorkoutSessions(storageScope);
  const {
    trainingPlan,
    dayKeys,
    dayColors,
    loading: planLoading,
    saveMsg: planSaveMsg,
    hasPlan,
    saveDay,
    addDay,
    removeDay,
    replacePlan,
  } = useTrainingPlan(storageScope, auth.loading);
  const nav = useNavigation(dayKeys);
  const { canInstall, install } = useInstallPWA();
  const [showGenerator, setShowGenerator] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null);

  // Show "What's New" once per version, after auth resolves.
  useEffect(() => {
    if (auth.loading) return;
    const seen = localStorage.getItem(WHATS_NEW_STORAGE_KEY);
    if (seen !== APP_VERSION) {
      setShowWhatsNew(true);
    }
  }, [auth.loading]);

  const dismissWhatsNew = () => {
    localStorage.setItem(WHATS_NEW_STORAGE_KEY, APP_VERSION);
    setShowWhatsNew(false);
  };

  // --- Login-redirect logic ---
  const authInitializedRef = useRef(false);
  const prevUserUidRef = useRef<string | null>(null);
  const [pendingLoginRedirect, setPendingLoginRedirect] = useState(false);

  useEffect(() => {
    if (auth.loading) return;

    const currUid = auth.user?.uid ?? null;

    if (!authInitializedRef.current) {
      authInitializedRef.current = true;
      prevUserUidRef.current = currUid;
      return;
    }

    const prevUid = prevUserUidRef.current;
    prevUserUidRef.current = currUid;

    if (prevUid === null && currUid !== null) {
      setPendingLoginRedirect(true);
    }
  }, [auth.user, auth.loading]);

  useEffect(() => {
    if (!pendingLoginRedirect || planLoading) return;
    setPendingLoginRedirect(false);
    if (!hasPlan) {
      setShowGenerator(true);
    }
  }, [pendingLoginRedirect, planLoading, hasPlan]);

  useEffect(() => {
    if (!workoutSession || workoutSession.restSecondsLeft <= 0) return;

    const timerId = window.setInterval(() => {
      setWorkoutSession((prev) => {
        if (!prev || prev.restSecondsLeft <= 0) return prev;
        return { ...prev, restSecondsLeft: prev.restSecondsLeft - 1 };
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [workoutSession?.restSecondsLeft]);

  useEffect(() => {
    if (!workoutSession || workoutSession.restSecondsLeft !== 0) return;
    const day = trainingPlan[workoutSession.dayKey];
    if (!day) return;

    if (workoutSession.endOnRestEnd) {
      endWorkoutSession(true);
      return;
    }

    if (!workoutSession.advanceOnRestEnd) return;
    if (workoutSession.currentExerciseIndex >= day.exercises.length - 1) return;

    const nextExercise = day.exercises[workoutSession.currentExerciseIndex + 1];
    if (!nextExercise) return;
    nav.selectExercise(nextExercise);
    setWorkoutSession((prev) => {
      if (!prev || prev.dayKey !== workoutSession.dayKey) return prev;
      return {
        ...prev,
        currentExerciseIndex: prev.currentExerciseIndex + 1,
        advanceOnRestEnd: false,
      };
    });
  }, [workoutSession?.advanceOnRestEnd, workoutSession?.endOnRestEnd, workoutSession?.restSecondsLeft, workoutSession?.currentExerciseIndex, workoutSession?.dayKey, trainingPlan, nav.selectExercise]);

  useEffect(() => {
    if (!workoutSession) return;

    const day = trainingPlan[workoutSession.dayKey];
    const currentExercise = day?.exercises[workoutSession.currentExerciseIndex];

    if (!day || !currentExercise) {
      setWorkoutSession(null);
      nav.clearExercise();
      return;
    }

    if (workoutSession.totalExercises === day.exercises.length) return;

    setWorkoutSession((prev) => {
      if (!prev || prev.dayKey !== workoutSession.dayKey) return prev;
      return {
        ...prev,
        totalExercises: day.exercises.length,
      };
    });
  }, [workoutSession, trainingPlan, nav.clearExercise]);
  // --- End login-redirect logic ---

  // Clear selected exercise if it no longer exists in the plan
  useEffect(() => {
    const selectedExercise = nav.selectedExercise;
    if (!selectedExercise) return;

    const exists = Object.values(trainingPlan)
      .some((day) => day.exercises.some((exercise) => exercise.id === selectedExercise.id));

    if (!exists) nav.clearExercise();
  }, [trainingPlan, nav.selectedExercise, nav.clearExercise]);

  const startWorkoutSession = (dayKey: string) => {
    const exercises = trainingPlan[dayKey]?.exercises || [];
    const firstExercise = exercises[0];
    if (!firstExercise) return;
    nav.setActiveDay(dayKey);
    nav.selectExercise(firstExercise);
    setWorkoutSession({
      dayKey,
      startedAt: Date.now(),
      currentExerciseIndex: 0,
      totalExercises: exercises.length,
      restSecondsLeft: 0,
      advanceOnRestEnd: false,
      endOnRestEnd: false,
      loggedSetsByExercise: {},
    });
  };

  const endWorkoutSession = (completed = false) => {
    if (workoutSession) {
      const historyEntry = buildWorkoutHistoryEntry(workoutSession, trainingPlan, completed);
      if (historyEntry) addSession(historyEntry);
    }
    setWorkoutSession(null);
    nav.clearExercise();
  };

  const resumeWorkoutSession = () => {
    if (!workoutSession) return;
    const currentExercise = getWorkoutSessionExercise(workoutSession, trainingPlan);
    if (!currentExercise) {
      endWorkoutSession();
      return;
    }

    nav.setActiveDay(workoutSession.dayKey);
    nav.selectExercise(currentExercise);
  };

  const handleSessionSetLogged = (data: { weight: string; reps: string; notes: string }) => {
    if (!workoutSession) return;
    const day = trainingPlan[workoutSession.dayKey];
    const currentExercise = day?.exercises[workoutSession.currentExerciseIndex];
    if (!day || !currentExercise) {
      endWorkoutSession();
      return;
    }

    const setTargetMatch = currentExercise.sets?.match(/(\d+)/);
    const targetSets = setTargetMatch ? Math.max(1, Number(setTargetMatch[1]) || 1) : 1;
    const currentSetCount = workoutSession.loggedSetsByExercise[currentExercise.id] || 0;
    const nextSetCount = currentSetCount + 1;
    const reachedTargetSets = nextSetCount >= targetSets;
    const isLastExercise = workoutSession.currentExerciseIndex >= day.exercises.length - 1;

    setWorkoutSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        restSecondsLeft: parseRestSeconds(currentExercise.rest),
        advanceOnRestEnd: reachedTargetSets && !isLastExercise,
        endOnRestEnd: reachedTargetSets && isLastExercise,
        loggedSetsByExercise: {
          ...prev.loggedSetsByExercise,
          [currentExercise.id]: nextSetCount,
        },
      };
    });
  };

  const skipWorkoutRest = () => {
    setWorkoutSession((prev) => (prev ? { ...prev, restSecondsLeft: 0 } : prev));
  };

  const currentWorkoutExercise = getWorkoutSessionExercise(workoutSession, trainingPlan);
  const isViewingActiveWorkoutExercise = !!(
    workoutSession
    && currentWorkoutExercise
    && nav.selectedExercise
    && nav.selectedExercise.id === currentWorkoutExercise.id
  );

  if (auth.loading || logsLoading || planLoading || historyLoading) return <LoadingScreen />;
  if (auth.enabled && !auth.user) {
    return <AuthScreen onSignIn={auth.loginWithGoogle} error={auth.error} />;
  }

  if (showGenerator) {
    return (
      <div className={styles.overlayShell}>
        <PlanGeneratorWizard
          onApply={(plan: TrainingPlan) => {
            replacePlan(plan);
            setShowGenerator(false);
            const firstDay = Object.keys(plan).sort()[0];
            if (firstDay) nav.setActiveDay(firstDay);
          }}
          onClose={() => setShowGenerator(false)}
        />
      </div>
    );
  }

  if (showImporter) {
    return (
      <div className={styles.overlayShell}>
        <PlanImportWizard
          onApply={(plan: TrainingPlan) => {
            replacePlan(plan);
            setShowImporter(false);
            const firstDay = Object.keys(plan).sort()[0];
            if (firstDay) nav.setActiveDay(firstDay);
          }}
          onClose={() => setShowImporter(false)}
        />
      </div>
    );
  }

  if (showSessionHistory) {
    return (
      <div className={styles.overlayShell}>
        <SessionHistoryView sessions={workoutHistory} onBack={() => setShowSessionHistory(false)} />
      </div>
    );
  }

  return (
    <div className={styles.appShell}>
      <Header
        saveMsg={planSaveMsg || logSaveMsg || historySaveMsg}
        authUserName={auth.user?.displayName}
        onSignOut={auth.enabled ? auth.logout : null}
        onOpenFeedback={() => setShowFeedback(true)}
        canInstall={canInstall}
        onInstall={install}
      />

      {/* Conditional rendering: Exercise detail view or workout plan view */}
      {nav.selectedExercise ? (
        <ExerciseDetailView
          exercise={nav.selectedExercise}
          accentColor={dayColors[nav.activeDay]}
          logs={logs}
          addLog={addLog}
          deleteLog={deleteLog}
          onBack={nav.clearExercise}
          workoutSession={isViewingActiveWorkoutExercise ? workoutSession : null}
          onLogSet={isViewingActiveWorkoutExercise ? handleSessionSetLogged : undefined}
          onSkipRest={isViewingActiveWorkoutExercise ? skipWorkoutRest : undefined}
          onEndWorkoutSession={isViewingActiveWorkoutExercise ? () => endWorkoutSession() : undefined}
        />
      ) : (
        <PlanView
          activeDay={nav.activeDay}
          setActiveDay={nav.setActiveDay}
          trainingPlan={trainingPlan}
          dayKeys={dayKeys}
          dayColors={dayColors}
          logs={logs}
          saveDay={saveDay}
          addDay={addDay}
          removeDay={removeDay}
          onOpenGenerator={() => setShowGenerator(true)}
          onOpenImporter={() => setShowImporter(true)}
          onOpenSessionHistory={() => setShowSessionHistory(true)}
          onExerciseClick={nav.selectExercise}
          workoutSession={workoutSession}
          activeSessionExerciseName={currentWorkoutExercise?.name || ""}
          onStartWorkoutSession={startWorkoutSession}
          onResumeWorkoutSession={resumeWorkoutSession}
          onEndWorkoutSession={() => endWorkoutSession()}
        />
      )}

      {showFeedback && (
        <FeedbackModal
          scope={storageScope}
          currentView="plan"
          onClose={() => setShowFeedback(false)}
        />
      )}
      {showWhatsNew && !showFeedback && (
        <WhatsNewModal onDismiss={dismissWhatsNew} />
      )}
    </div>
  );
}

function parseRestSeconds(rest: string | undefined) {
  if (!rest) return 0;
  const match = rest.match(/(\d+)/);
  if (!match) return 0;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getWorkoutSessionExercise(workoutSession: WorkoutSession | null, trainingPlan: TrainingPlan) {
  if (!workoutSession) return null;
  const day = trainingPlan[workoutSession.dayKey];
  if (!day) return null;
  return day.exercises[workoutSession.currentExerciseIndex] || null;
}

function buildWorkoutHistoryEntry(workoutSession: WorkoutSession, trainingPlan: TrainingPlan, completed: boolean): WorkoutHistoryEntry | null {
  const day = trainingPlan[workoutSession.dayKey];
  if (!day) return null;

  const exercises = day.exercises
    .map((exercise) => {
      const setTargetMatch = exercise.sets?.match(/(\d+)/);
      const plannedSets = setTargetMatch ? Math.max(1, Number(setTargetMatch[1]) || 1) : 1;
      return {
        exerciseId: exercise.id,
        name: exercise.name,
        plannedSets,
        completedSets: workoutSession.loggedSetsByExercise[exercise.id] || 0,
        rest: exercise.rest,
      };
    })
    .filter((exercise) => exercise.completedSets > 0);

  if (exercises.length === 0) return null;

  const endedAtMs = Date.now();
  const totalLoggedSets = exercises.reduce((sum, exercise) => sum + exercise.completedSets, 0);
  const completedExercises = exercises.filter((exercise) => exercise.completedSets >= exercise.plannedSets).length;

  return {
    id: String(workoutSession.startedAt),
    dayKey: workoutSession.dayKey,
    dayLabel: day.label,
    startedAt: new Date(workoutSession.startedAt).toISOString(),
    endedAt: new Date(endedAtMs).toISOString(),
    durationSeconds: Math.max(1, Math.floor((endedAtMs - workoutSession.startedAt) / 1000)),
    totalExercises: day.exercises.length,
    completedExercises,
    totalLoggedSets,
    completed,
    exercises,
  };
}
