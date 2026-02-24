import { useTrainingLogs, useNavigation, useAuth } from "./hooks";
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
  const { logs, loading, saveMsg, addLog, deleteLog } = useTrainingLogs(auth.user?.uid || "guest");
  const nav = useNavigation();

  if (auth.loading || loading) return <LoadingScreen />;
  if (auth.enabled && !auth.user) {
    return <AuthScreen onSignIn={auth.loginWithGoogle} error={auth.error} />;
  }

  /** Map view key → component */
  const viewComponents = {
    plan: (
      <PlanView
        activeDay={nav.activeDay}
        setActiveDay={nav.setActiveDay}
        logs={logs}
      />
    ),
    log: (
      <LogView
        activeDay={nav.activeDay}
        setActiveDay={nav.setActiveDay}
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
        saveMsg={saveMsg}
        authUserName={auth.user?.displayName}
        onSignOut={auth.enabled ? auth.logout : null}
      />
      {viewComponents[nav.view]}
    </div>
  );
}
