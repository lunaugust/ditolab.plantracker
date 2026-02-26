import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "../hooks/useAuth";

/* ================================================================
 * Mock authService
 * ================================================================ */
vi.mock("../services/authService", () => ({
  isAuthEnabled: vi.fn(() => false),
  subscribeToAuthState: vi.fn(() => () => {}),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
}));

import {
  isAuthEnabled,
  subscribeToAuthState,
  signInWithGoogle,
  signOutUser,
} from "../services/authService";

beforeEach(() => {
  vi.clearAllMocks();
  isAuthEnabled.mockReturnValue(false);
});

describe("useAuth", () => {
  /* ----------------------------------------------------------
   * Disabled auth (guest mode)
   * ---------------------------------------------------------- */
  it("returns disabled state when auth is not enabled", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.enabled).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("does not subscribe to auth state when disabled", () => {
    renderHook(() => useAuth());
    expect(subscribeToAuthState).not.toHaveBeenCalled();
  });

  /* ----------------------------------------------------------
   * Enabled auth — subscription
   * ---------------------------------------------------------- */
  it("subscribes to auth state and sets user on callback", async () => {
    isAuthEnabled.mockReturnValue(true);

    let authCallback;
    subscribeToAuthState.mockImplementation((cb) => {
      authCallback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.enabled).toBe(true);
    expect(result.current.loading).toBe(true);
    expect(subscribeToAuthState).toHaveBeenCalledTimes(1);

    // Simulate auth state change
    const mockUser = { uid: "user123", displayName: "Augusto" };
    act(() => authCallback(mockUser));

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it("unsubscribes on unmount", () => {
    isAuthEnabled.mockReturnValue(true);
    const unsubscribe = vi.fn();
    subscribeToAuthState.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useAuth());
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  /* ----------------------------------------------------------
   * loginWithGoogle
   * ---------------------------------------------------------- */
  it("loginWithGoogle calls signInWithGoogle", async () => {
    signInWithGoogle.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.loginWithGoogle();
    });

    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe("");
  });

  it("loginWithGoogle sets error on failure", async () => {
    signInWithGoogle.mockRejectedValue(new Error("popup closed"));
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.loginWithGoogle();
    });

    expect(result.current.error).toBe("popup closed");
  });

  it("loginWithGoogle maps FIREBASE_AUTH_NOT_CONFIGURED to localized message", async () => {
    signInWithGoogle.mockRejectedValue(new Error("FIREBASE_AUTH_NOT_CONFIGURED"));
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.loginWithGoogle();
    });

    // Default language is ES — "No se pudo iniciar sesión"
    expect(result.current.error).toBe("No se pudo iniciar sesión");
  });

  it("loginWithGoogle clears previous errors before attempting", async () => {
    // First call fails
    signInWithGoogle.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.loginWithGoogle();
    });
    expect(result.current.error).toBe("fail");

    // Second call succeeds — error should clear
    signInWithGoogle.mockResolvedValueOnce(undefined);
    await act(async () => {
      await result.current.loginWithGoogle();
    });
    expect(result.current.error).toBe("");
  });

  /* ----------------------------------------------------------
   * logout
   * ---------------------------------------------------------- */
  it("logout calls signOutUser", async () => {
    signOutUser.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(signOutUser).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe("");
  });

  it("logout sets error on failure", async () => {
    signOutUser.mockRejectedValue(new Error("network error"));
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.error).toBe("network error");
  });

  it("logout uses fallback key when error has no message", async () => {
    signOutUser.mockRejectedValue({});
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    // t("auth.logoutError") in ES = "No se pudo cerrar sesión"
    expect(result.current.error).toBe("No se pudo cerrar sesión");
  });
});
