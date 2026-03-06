import { useEffect, useRef, useState } from "react";
import { useTrainingLogs, useNavigation, useAuth, useTrainingPlan, useInstallPWA } from "./hooks";
import { Header, LoadingScreen, AuthScreen, FeedbackModal, WhatsNewModal } from "./components/layout";
import { APP_VERSION, WHATS_NEW_STORAGE_KEY } from "./data/changelog";
import { PlanView, PlanGeneratorWizard, PlanImportWizard, ExerciseDetailView } from "./components/views";
import { colors } from "./theme";
import type { TrainingPlan } from "./services/types";

/**
 * Root application component.
 *
 * Orchestrates the hooks and renders a unified workout view with full-screen exercise detail navigation.
 */
export default function App() {
  const auth = useAuth();
  const storageScope = auth.user?.uid || "guest";
  const { logs, loading: logsLoading, saveMsg: logSaveMsg, addLog, deleteLog } = useTrainingLogs(storageScope);
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [workoutSession, setWorkoutSession] = useState<{
    dayKey: string;
    startedAt: number;
    currentExerciseIndex: number;
    totalExercises: number;
    restSecondsLeft: number;
    advanceOnRestEnd: boolean;
  } | null>(null);

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
    if (!workoutSession || !workoutSession.advanceOnRestEnd || workoutSession.restSecondsLeft !== 0) return;
    const day = trainingPlan[workoutSession.dayKey];
    if (!day) return;
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
  }, [workoutSession?.advanceOnRestEnd, workoutSession?.restSecondsLeft, workoutSession?.currentExerciseIndex, workoutSession?.dayKey, trainingPlan, nav.selectExercise]);
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
    });
  };

  const endWorkoutSession = () => {
    setWorkoutSession(null);
    nav.clearExercise();
  };

  const finishSessionExercise = () => {
    if (!workoutSession) return;
    const day = trainingPlan[workoutSession.dayKey];
    const currentExercise = day?.exercises[workoutSession.currentExerciseIndex];
    if (!day || !currentExercise) {
      endWorkoutSession();
      return;
    }
    const isLastExercise = workoutSession.currentExerciseIndex >= day.exercises.length - 1;
    if (isLastExercise) {
      endWorkoutSession();
      return;
    }
    setWorkoutSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        restSecondsLeft: parseRestSeconds(currentExercise.rest),
        advanceOnRestEnd: true,
      };
    });
  };

  const skipWorkoutRest = () => {
    setWorkoutSession((prev) => (prev ? { ...prev, restSecondsLeft: 0 } : prev));
  };

  if (auth.loading || logsLoading || planLoading) return <LoadingScreen />;
  if (auth.enabled && !auth.user) {
    return <AuthScreen onSignIn={auth.loginWithGoogle} error={auth.error} />;
  }

  if (showGenerator) {
    return (
      <div style={{ background: colors.bg, minHeight: "100dvh", fontFamily: "'DM Sans', sans-serif", color: colors.textPrimary }}>
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
      <div style={{ background: colors.bg, minHeight: "100dvh", fontFamily: "'DM Sans', sans-serif", color: colors.textPrimary }}>
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

  return (
    <div style={{ background: colors.bg, minHeight: "100dvh", fontFamily: "'DM Sans', sans-serif", color: colors.textPrimary, paddingBottom: 24 }}>
      <Header
        saveMsg={planSaveMsg || logSaveMsg}
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
          onBack={workoutSession ? endWorkoutSession : nav.clearExercise}
          workoutSession={workoutSession}
          onFinishExercise={finishSessionExercise}
          onSkipRest={skipWorkoutRest}
          onEndWorkoutSession={endWorkoutSession}
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
          onExerciseClick={nav.selectExercise}
          onStartWorkoutSession={startWorkoutSession}
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
