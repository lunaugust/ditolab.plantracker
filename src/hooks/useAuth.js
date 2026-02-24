import { useEffect, useState, useCallback } from "react";
import {
  isAuthEnabled,
  subscribeToAuthState,
  signInWithGoogle,
  signOutUser,
} from "../services/authService";

export function useAuth() {
  const enabled = isAuthEnabled();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");

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
      setError(err?.message || "No se pudo iniciar sesión");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setError("");
      await signOutUser();
    } catch (err) {
      setError(err?.message || "No se pudo cerrar sesión");
    }
  }, []);

  return { enabled, user, loading, error, loginWithGoogle, logout };
}
