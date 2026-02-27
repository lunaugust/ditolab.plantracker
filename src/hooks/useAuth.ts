import { useEffect, useState, useCallback } from "react";
import type { User } from "firebase/auth";
import {
  isAuthEnabled,
  subscribeToAuthState,
  signInWithGoogle,
  signOutUser,
} from "../services/authService";
import { useI18n } from "../i18n";

export function useAuth() {
  const { t } = useI18n();
  const enabled = isAuthEnabled();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");

  const resolveAuthError = useCallback((err: unknown, fallbackKey: string): string => {
    const message = err instanceof Error ? err.message : undefined;
    if (message === "FIREBASE_AUTH_NOT_CONFIGURED") return t("auth.loginError");
    return message || t(fallbackKey);
  }, [t]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToAuthState((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [enabled]);

  const loginWithGoogle = useCallback(async () => {
    try {
      setError("");
      await signInWithGoogle();
    } catch (err) {
      setError(resolveAuthError(err, "auth.loginError"));
    }
  }, [resolveAuthError]);

  const logout = useCallback(async () => {
    try {
      setError("");
      await signOutUser();
    } catch (err) {
      setError(resolveAuthError(err, "auth.logoutError"));
    }
  }, [resolveAuthError]);

  return { enabled, user, loading, error, loginWithGoogle, logout };
}
