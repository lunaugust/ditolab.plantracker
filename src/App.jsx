import { useEffect } from "react";
import { useTrainingLogs, useNavigation, useAuth, useTrainingPlan } from "./hooks";
import { Header, LoadingScreen, AuthScreen } from "./components/layout";
import { PlanView, LogView, ProgressView } from "./components/views";
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
    saveDay,
    addDay,
    removeDay,
  } = useTrainingPlan(storageScope);
  const nav = useNavigation(dayKeys);

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
      />
      {viewComponents[nav.view]}
    </div>
  );
}
