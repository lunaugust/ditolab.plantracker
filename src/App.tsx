import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTrainingLogs, useNavigation, useAuth, useMultiPlan, useInstallPWA } from "./hooks";
import { Header, LoadingScreen, AuthScreen, FeedbackModal, WhatsNewModal, PlanManagerModal } from "./components/layout";
import { APP_VERSION, WHATS_NEW_STORAGE_KEY } from "./data/changelog";
import { PlanView, PlanGeneratorWizard, PlanImportWizard, ExerciseDetailView } from "./components/views";
import { colors } from "./theme";
import { compareDayKeys, DEFAULT_DAY_COLORS } from "./utils/planNormalization";
import type { TrainingPlan } from "./services/types";
import { useI18n } from "./i18n";

/**
 * Root application component.
 *
 * Orchestrates the hooks and renders a unified workout view with full-screen exercise detail navigation.
 */
export default function App() {
  const auth = useAuth();
  const { t } = useI18n();
  const userId = auth.user?.uid || "guest";
  const { logs, loading: logsLoading, saveMsg: logSaveMsg, addLog, deleteLog } = useTrainingLogs(userId);
  const {
    plans,
    activePlanId,
    activePlan,
    activePlanMetadata,
    loading: planLoading,
    error: planError,
    hasPlan,
    isOwned,
    canEdit,
    switchActivePlan,
    createPlan,
    updateActivePlan,
    renamePlan,
    removePlan,
    shareActivePlan,
    copySharedPlan,
  } = useMultiPlan(userId, auth.loading);

  // Derive dayKeys and dayColors from activePlan
  const dayKeys = useMemo(
    () => activePlan ? Object.keys(activePlan).sort(compareDayKeys) : [],
    [activePlan]
  );

  const dayColors = useMemo(
    () => Object.fromEntries(
      dayKeys.map((dayKey, index) => [
        dayKey,
        activePlan?.[dayKey]?.color || DEFAULT_DAY_COLORS[index % DEFAULT_DAY_COLORS.length] || "#e8643a"
      ])
    ),
    [dayKeys, activePlan]
  );

  const nav = useNavigation(dayKeys);
  const { canInstall, install } = useInstallPWA();
  const [showGenerator, setShowGenerator] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showPlanManager, setShowPlanManager] = useState(false);
  const [planSaveMsg, setPlanSaveMsg] = useState("");

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
  // --- End login-redirect logic ---

  // Plan manager handlers
  const handleCreatePlan = useCallback(async () => {
    try {
      await createPlan(t("planManager.newPlanName"), {}, "manual");
      setPlanSaveMsg(t("planManager.createSuccess"));
      setShowPlanManager(false);
    } catch (error) {
      setPlanSaveMsg(t("planManager.createError"));
    }
    setTimeout(() => setPlanSaveMsg(""), 2000);
  }, [createPlan, t]);

  const handleSharePlan = useCallback(async (planId: string) => {
    // Note: This is a simplified implementation
    // In production, you'd need a proper UI to collect emails and convert to UIDs
    const response = window.prompt(t("planManager.shareSubtitle"));
    if (!response) return;

    try {
      const emails = response.split(",").map(e => e.trim());
      // For now, we'll just show a warning that this needs UID conversion
      if (userId !== "guest") {
        alert("Email-to-UID conversion not implemented. Use UIDs directly for now.");
      }
      setPlanSaveMsg(t("planManager.shareSuccess"));
    } catch (error) {
      setPlanSaveMsg(t("planManager.shareError"));
    }
    setTimeout(() => setPlanSaveMsg(""), 2000);
  }, [userId, t]);

  // Clear selected exercise if it no longer exists in the plan
  useEffect(() => {
    const selectedExercise = nav.selectedExercise;
    if (!selectedExercise || !activePlan) return;

    const exists = Object.values(activePlan)
      .some((day) => day.exercises.some((exercise) => exercise.id === selectedExercise.id));

    if (!exists) nav.clearExercise();
  }, [activePlan, nav.selectedExercise, nav.clearExercise]);

  if (auth.loading || logsLoading || planLoading) return <LoadingScreen />;
  if (auth.enabled && !auth.user) {
    return <AuthScreen onSignIn={auth.loginWithGoogle} error={auth.error} />;
  }

  if (showGenerator) {
    return (
      <div style={{ background: colors.bg, minHeight: "100dvh", fontFamily: "'DM Sans', sans-serif", color: colors.textPrimary }}>
        <PlanGeneratorWizard
          onApply={async (plan: TrainingPlan) => {
            await createPlan(t("generator.title"), plan, "generated");
            setShowGenerator(false);
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
          onApply={async (plan: TrainingPlan) => {
            await createPlan(t("importer.title"), plan, "imported");
            setShowImporter(false);
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
        onOpenPlanManager={() => setShowPlanManager(true)}
        activePlanName={activePlanMetadata?.name}
        canEdit={canEdit}
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
        />
      ) : (
        <PlanView
          activeDay={nav.activeDay}
          setActiveDay={nav.setActiveDay}
          trainingPlan={activePlan || {}}
          dayKeys={dayKeys}
          dayColors={dayColors}
          logs={logs}
          saveDay={(dayKey, nextDay) => {
            if (!activePlan || !canEdit) return;
            const nextPlan = {
              ...activePlan,
              [dayKey]: {
                ...activePlan[dayKey],
                ...nextDay,
              },
            };
            updateActivePlan(nextPlan);
          }}
          addDay={() => {
            if (!activePlan || !canEdit) return "";
            const existingKeys = Object.keys(activePlan);
            const newDayKey = `Día ${existingKeys.length + 1}`;
            const nextPlan = {
              ...activePlan,
              [newDayKey]: {
                label: t("plan.dayLabelPlaceholder"),
                color: DEFAULT_DAY_COLORS[existingKeys.length % DEFAULT_DAY_COLORS.length] || "#e8643a",
                exercises: [],
              },
            };
            updateActivePlan(nextPlan);
            return newDayKey;
          }}
          removeDay={(dayKey) => {
            if (!activePlan || !canEdit) return;
            const keys = Object.keys(activePlan);
            if (keys.length <= 1) return;
            const nextPlan = { ...activePlan };
            delete nextPlan[dayKey];
            updateActivePlan(nextPlan);
          }}
          onOpenGenerator={() => setShowGenerator(true)}
          onOpenImporter={() => setShowImporter(true)}
          onExerciseClick={nav.selectExercise}
        />
      )}

      {showFeedback && (
        <FeedbackModal
          scope={userId}
          currentView="plan"
          onClose={() => setShowFeedback(false)}
        />
      )}
      {showWhatsNew && !showFeedback && (
        <WhatsNewModal onDismiss={dismissWhatsNew} />
      )}
      {showPlanManager && (
        <PlanManagerModal
          plans={plans}
          activePlanId={activePlanId}
          userId={userId}
          onSwitchPlan={switchActivePlan}
          onCreatePlan={handleCreatePlan}
          onRenamePlan={renamePlan}
          onDeletePlan={removePlan}
          onSharePlan={handleSharePlan}
          onCopyPlan={copySharedPlan}
          onClose={() => setShowPlanManager(false)}
        />
      )}
    </div>
  );
}
