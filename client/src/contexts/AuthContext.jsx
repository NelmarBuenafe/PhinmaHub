import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import { supabase } from "../services/supabase.js";
import { clearAuthFlow, saveAuthFlow } from "../utils/authFlow.js";
import { AuthContext } from "./authContext.js";

const DENIAL_STORAGE_KEY = "phinmahub_access_denied";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(
    () => window.sessionStorage.getItem(DENIAL_STORAGE_KEY) === "true",
  );

  const clearAuthState = useCallback(() => {
    setSession(null);
    setProfile(null);
    setIdentity(null);
  }, []);

  const denyAccess = useCallback(async () => {
    window.sessionStorage.setItem(DENIAL_STORAGE_KEY, "true");
    setAccessDenied(true);
    clearAuthState();
    await supabase.auth.signOut();
  }, [clearAuthState]);

  const validateSession = useCallback(
    async ({
      requireCaptcha = false,
      googleResult = false,
      flow,
      selectedRole,
    } = {}) => {
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !currentSession) {
        clearAuthState();
        const error = new Error("Authentication is required.");
        error.code = "AUTH_REQUIRED";
        throw error;
      }

      try {
        const response = requireCaptcha
          ? await api.post("/auth/validate", { flow, selectedRole })
          : googleResult
            ? await api.post("/auth/google-result", { flow, selectedRole })
            : await api.get("/auth/me");

        setSession(currentSession);
        setProfile(response.data.profile);
        window.sessionStorage.removeItem(DENIAL_STORAGE_KEY);
        setAccessDenied(false);
        return response.data;
      } catch (error) {
        const code = error.response?.data?.code;
        if (
          ["INVALID_DOMAIN", "INVALID_PROVIDER", "PROFILE_MISSING"].includes(
            code,
          )
        ) {
          await denyAccess();
        }
        throw error;
      }
    },
    [clearAuthState, denyAccess],
  );

  const validateIdentity = useCallback(async () => {
    const {
      data: { session: currentSession },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !currentSession) {
      const error = new Error("Authentication is required.");
      error.code = "AUTH_REQUIRED";
      throw error;
    }

    try {
      const response = await api.post("/auth/oauth-check");
      setSession(currentSession);
      setIdentity(response.data.user);
      return response.data;
    } catch (error) {
      const code = error.response?.data?.code;
      if (["INVALID_DOMAIN", "INVALID_PROVIDER"].includes(code))
        await denyAccess();
      throw error;
    }
  }, [denyAccess]);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (!active) return;

        setSession(currentSession);
        if (
          currentSession &&
          ![
            "/auth/callback",
            "/auth/accept-invite",
            "/security-check",
          ].includes(
            window.location.pathname,
          )
        ) {
          await validateSession();
        }
      } catch {
        if (active) clearAuthState();
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === "SIGNED_OUT") setProfile(null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [clearAuthState, validateSession]);

  const beginGoogleSignIn = useCallback(async ({ role, mode }) => {
    if (!saveAuthFlow(role, mode))
      throw new Error("Invalid authentication flow");
    window.sessionStorage.removeItem(DENIAL_STORAGE_KEY);
    setAccessDenied(false);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      await supabase.auth.signOut();
      clearAuthFlow();
      window.sessionStorage.removeItem(DENIAL_STORAGE_KEY);
      setAccessDenied(false);
      clearAuthState();
    }
  }, [clearAuthState]);

  const value = useMemo(
    () => ({
      accessDenied,
      beginGoogleSignIn,
      identity,
      loading,
      profile,
      session,
      signOut,
      validateSession,
      validateIdentity,
    }),
    [
      accessDenied,
      beginGoogleSignIn,
      identity,
      loading,
      profile,
      session,
      signOut,
      validateIdentity,
      validateSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
