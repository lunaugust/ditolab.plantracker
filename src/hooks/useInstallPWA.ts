import { useState, useEffect, useCallback } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Captures the browser's `beforeinstallprompt` event and exposes a
 * one-shot `install()` helper.
 *
 * `canInstall` is false when:
 *   - the app is already running in standalone mode (already installed), or
 *   - the browser hasn't fired `beforeinstallprompt` yet / doesn't support it
 *     (e.g. iOS Safari, Firefox).
 */
export function useInstallPWA() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  const isStandalone =
    typeof window !== "undefined" &&
    ((typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) ||
      navigatorWithStandalone.standalone === true);

  useEffect(() => {
    if (isStandalone) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setPromptEvent(null);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [isStandalone]);

  const install = useCallback(async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      setPromptEvent(null);
      setInstalled(true);
    }
  }, [promptEvent]);

  return {
    /** True when the browser is ready to show the install prompt. */
    canInstall: !isStandalone && !installed && promptEvent !== null,
    install,
  };
}
