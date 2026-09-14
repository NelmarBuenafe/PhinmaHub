import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useAuth } from "./authContext.js";
import { defaultUserPreferences, UserPreferencesContext } from "./userPreferencesStore.js";
import { useLocation } from "react-router-dom";
import { resolveVisualTheme } from "../utils/themeRoutes.js";

const STORAGE_PREFIX = "phinmahub:preferences:";
const LAST_KEY = "phinmahub:last-preferences-key";
const validTheme = new Set(["light", "dark", "system"]);
const validDensity = new Set(["comfortable", "compact"]);
const validMotion = new Set(["system", "reduce", "allow"]);

function normalizePreferences(value) {
  const candidate = value && typeof value === "object" ? value : {};
  return {
    theme: validTheme.has(candidate.theme) ? candidate.theme : defaultUserPreferences.theme,
    density: validDensity.has(candidate.density) ? candidate.density : defaultUserPreferences.density,
    motion: validMotion.has(candidate.motion) ? candidate.motion : defaultUserPreferences.motion,
  };
}

function readPreferences(key) {
  try {
    return normalizePreferences(JSON.parse(window.localStorage.getItem(key) || "{}"));
  } catch {
    return defaultUserPreferences;
  }
}

function applyPreferences(preferences, pathname) {
  const root = document.documentElement;
  root.dataset.theme = resolveVisualTheme(preferences, pathname, window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.themePreference = preferences.theme;
  root.dataset.density = preferences.density;
  root.dataset.motion = preferences.motion;
}

function preferencesReducer(current, action) {
  if (action.type === "hydrate") return action.state;
  if (action.type === "update") return { ...current, preferences: normalizePreferences({ ...current.preferences, ...action.updates }) };
  if (action.type === "reset") return { ...current, preferences: defaultUserPreferences };
  return current;
}

export function UserPreferencesProvider({ children }) {
  const { loading, profile } = useAuth();
  const { pathname } = useLocation();
  const [state, dispatch] = useReducer(preferencesReducer, { key: null, preferences: defaultUserPreferences, ready: false });
  const userId = profile?.id;

  useEffect(() => {
    if (loading) return;
    if (!userId) {
      dispatch({ type: "hydrate", state: { key: null, preferences: defaultUserPreferences, ready: true } });
      applyPreferences(defaultUserPreferences, pathname);
      return;
    }
    const key = `${STORAGE_PREFIX}${userId}`;
    const preferences = readPreferences(key);
    dispatch({ type: "hydrate", state: { key, preferences, ready: true } });
    applyPreferences(preferences, pathname);
    try {
      window.localStorage.setItem(LAST_KEY, key);
    } catch {
      // A blocked storage area should not prevent a user from using the app.
    }
  }, [loading, userId, pathname]);

  useEffect(() => {
    if (!state.ready) return;
    applyPreferences(state.preferences, pathname);
    if (!state.key) return;
    try {
      window.localStorage.setItem(state.key, JSON.stringify(state.preferences));
      window.localStorage.setItem(LAST_KEY, state.key);
    } catch {
      // Preferences continue for the active session if browser storage is unavailable.
    }
  }, [pathname, state]);

  useEffect(() => {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const handleColorSchemeChange = () => {
      if (state.preferences.theme === "system") applyPreferences(state.preferences, pathname);
    };
    colorScheme.addEventListener("change", handleColorSchemeChange);
    return () => colorScheme.removeEventListener("change", handleColorSchemeChange);
  }, [pathname, state.preferences]);

  const updatePreferences = useCallback((updates) => {
    dispatch({ type: "update", updates });
  }, []);

  const resetPreferences = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);

  const value = useMemo(() => ({ ...state.preferences, resetPreferences, updatePreferences }), [resetPreferences, state.preferences, updatePreferences]);
  return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>;
}
