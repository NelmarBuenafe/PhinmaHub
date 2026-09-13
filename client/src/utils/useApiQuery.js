import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "../contexts/authContext.js";
import api from "../services/api.js";
import { clientQueryCache } from "./queryCache.js";

export function useApiQuery(endpoint, { enabled = true, errorMessage = "This information could not be loaded." } = {}) {
  const { session, profile } = useAuth();
  const scope = JSON.stringify([session?.user?.id, profile?.approved_role, profile?.account_status]);
  const key = `${scope}|${endpoint}`;
  const subscribe = useCallback((notify) => clientQueryCache.subscribe(key, notify), [key]);
  const read = useCallback(() => clientQueryCache.read(key), [key]);
  const snapshot = useSyncExternalStore(subscribe, read, read);
  const load = useCallback((force = false) => {
    if (!enabled) return Promise.resolve();
    return clientQueryCache.request(key, async () => (await api.get(endpoint)).data, {
      force,
      onSuccess(data) {
        if (endpoint === "/student/dashboard" && Array.isArray(data.data?.assignments)) {
          clientQueryCache.seed(`${scope}|/student/assignments`, { success: true, data: data.data.assignments });
        }
        if (endpoint === "/teacher/dashboard" && Array.isArray(data.data)) {
          clientQueryCache.seed(`${scope}|/teacher/courses`, { success: true, data: data.data });
        }
      },
    }).catch(() => undefined);
  }, [enabled, endpoint, key, scope]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (snapshot.stale) load();
  }, [load, snapshot.stale]);
  const reload = useCallback(() => load(true), [load]);
  const update = useCallback((updater) => clientQueryCache.update(key, updater), [key]);
  const status = snapshot.error?.response?.status;
  const error = snapshot.error
    ? status === 403 ? "You are not authorized to view this information."
      : status === 401 ? "Your session has expired. Please sign in again."
        : status >= 500 ? errorMessage : snapshot.error.response?.data?.message || errorMessage
    : "";
  return {
    data: enabled ? snapshot.data : undefined,
    loading: enabled && snapshot.data === undefined && !snapshot.error,
    refreshing: enabled && snapshot.pending && snapshot.data !== undefined,
    error: enabled ? error : "",
    reload,
    update,
  };
}
