import { useEffect, useRef, useState } from "react";
import { useTrainingLogs, useNavigation, useAuth, useTrainingPlan, useInstallPWA } from "./hooks";
import { Header, LoadingScreen, AuthScreen, FeedbackModal, WhatsNewModal } from "./components/layout";
import { APP_VERSION, WHATS_NEW_STORAGE_KEY } from "./data/changelog";
import { PlanView, LogView, ProgressView, PlanGeneratorWizard, PlanImportWizard } from "./components/views";
import { SingleViewPrototypes } from "./components/prototypes/SingleViewPrototypes";
import { colors } from "./theme";

/**
 * Root application component.
 *
 * Orchestrates the two custom hooks and delegates
 * rendering to the appropriate view component.
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
  // Tracks whether the first auth resolution has been recorded.
  // On initial app load (user already signed in), we skip the redirect;
  // only a sign-in that happens *during* this session triggers it.
  const authInitializedRef = useRef(false);
  const prevUserUidRef = useRef(null);
  const [pendingLoginRedirect, setPendingLoginRedirect] = useState(false);

  // Detect a new login (null → user) that happens after the first auth settlement.
  useEffect(() => {
    if (auth.loading) return;

    const currUid = auth.user?.uid ?? null;

    if (!authInitializedRef.current) {
      // First auth resolution: just record the baseline, no redirect.
      authInitializedRef.current = true;
      prevUserUidRef.current = currUid;
      return;
    }

    const prevUid = prevUserUidRef.current;
    prevUserUidRef.current = currUid;

    if (prevUid === null && currUid !== null) {
      // User signed in during this session.
      setPendingLoginRedirect(true);
    }
  }, [auth.user, auth.loading]);

  // Once the plan finishes loading after login, redirect accordingly.
  useEffect(() => {
    if (!pendingLoginRedirect || planLoading) return;
    setPendingLoginRedirect(false);
    if (!hasPlan) {
      setShowGenerator(true);
    } else {
      nav.setView("plan");
    }
  }, [pendingLoginRedirect, planLoading, hasPlan]);
  // --- End login-redirect logic ---

  // Clear selected exercise if it no longer exists in the plan
  useEffect(() => {
    if (!nav.selectedExercise) return;

    const exists = Object.values(trainingPlan)
      .some((day) => day.exercises.some((exercise) => exercise.id === nav.selectedExercise.id));

    if (!exists) nav.clearExercise();
  }, [trainingPlan, nav.selectedExercise, nav.clearExercise]);

  if (auth.loading || logsLoading || planLoading) return <LoadingScreen />;
  if (auth.enabled && !auth.user) {
    return <AuthScreen onSignIn={auth.loginWithGoogle} error={auth.error} />;
  }

  const isPrototypeMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("prototype") === "single";
  if (isPrototypeMode) {
    return (
      <div style={{ background: colors.bg, minHeight: "100dvh", fontFamily: "'DM Sans', sans-serif", color: colors.textPrimary }}>
        <SingleViewPrototypes
          trainingPlan={trainingPlan}
          dayKeys={dayKeys}
          dayColors={dayColors}
          logs={logs}
          onExit={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete("prototype");
            window.location.href = url.toString();
          }}
        />
      </div>
    );
  }

  if (showGenerator) {
    return (
      <div style={{ background: colors.bg, minHeight: "100dvh", fontFamily: "'DM Sans', sans-serif", color: colors.textPrimary }}>
        <PlanGeneratorWizard
          onApply={(plan) => {
            replacePlan(plan);
            setShowGenerator(false);
            nav.setView("plan");
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
          onApply={(plan) => {
            replacePlan(plan);
            setShowImporter(false);
            nav.setView("plan");
            const firstDay = Object.keys(plan).sort()[0];
            if (firstDay) nav.setActiveDay(firstDay);
          }}
          onClose={() => setShowImporter(false)}
        />
      </div>
    );
  }

  /** Map view key → component */
  const viewComponents = {
    plan: (
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
      />
    ),
    log: (
      <LogView
        activeDay={nav.activeDay}
        setActiveDay={nav.setActiveDay}
        trainingPlan={trainingPlan}
        dayKeys={dayKeys}
        dayColors={dayColors}
        selectedExercise={nav.selectedExercise}
        selectExercise={nav.selectExercise}
        clearExercise={nav.clearExercise}
        logs={logs}
        addLog={addLog}
        deleteLog={deleteLog}
      />
    ),
    progress: (
      <ProgressView
        activeDay={nav.activeDay}
        setActiveDay={nav.setActiveDay}
        trainingPlan={trainingPlan}
        dayKeys={dayKeys}
        dayColors={dayColors}
        selectedExercise={nav.selectedExercise}
        selectExercise={nav.selectExercise}
        clearExercise={nav.clearExercise}
        logs={logs}
      />
    ),
  };

  return (
    <div style={{ background: colors.bg, minHeight: "100dvh", fontFamily: "'DM Sans', sans-serif", color: colors.textPrimary, paddingBottom: 72 }}>
      <Header
        view={nav.view}
        onViewChange={nav.setView}
        saveMsg={planSaveMsg || logSaveMsg}
        authUserName={auth.user?.displayName}
        onSignOut={auth.enabled ? auth.logout : null}
        onOpenFeedback={() => setShowFeedback(true)}
        canInstall={canInstall}
        onInstall={install}
      />
      {viewComponents[nav.view]}
      {showFeedback && (
        <FeedbackModal
          scope={storageScope}
          currentView={nav.view}
          onClose={() => setShowFeedback(false)}
        />
      )}
      {showWhatsNew && !showFeedback && (
        <WhatsNewModal onDismiss={dismissWhatsNew} />
      )}
    </div>
  );
}
