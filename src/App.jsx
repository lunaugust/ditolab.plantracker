import { useTrainingLogs, useNavigation } from "./hooks";
import { Header, LoadingScreen } from "./components/layout";
import { PlanView, LogView, ProgressView } from "./components/views";
import { colors } from "./theme";

/**
 * Root application component.
 *
 * Orchestrates the two custom hooks and delegates
 * rendering to the appropriate view component.
 */
export default function App() {
  const { logs, loading, saveMsg, addLog, deleteLog } = useTrainingLogs();
  const nav = useNavigation();

  if (loading) return <LoadingScreen />;

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
    <div style={{ background: colors.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: colors.textPrimary }}>
      <Header view={nav.view} onViewChange={nav.setView} saveMsg={saveMsg} />
      {viewComponents[nav.view]}
    </div>
  );
}
