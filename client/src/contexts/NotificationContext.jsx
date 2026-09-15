import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api.js";
import { useAuth } from "./authContext.js";
import { NotificationContext } from "./notificationContext.js";
import {
  countUnreadNotifications,
  emptyNotificationState,
  notificationCacheIsFresh,
  withAllNotificationsMarkedRead,
  withNotificationMarkedRead,
} from "./notificationState.js";

function getErrorMessage() {
  return "We couldn't load notifications. Please try again.";
}

export function NotificationProvider({ children }) {
  const { profile } = useAuth();
  const userId = profile?.account_status === "active" ? profile.id : null;
  const [state, setState] = useState(emptyNotificationState);
  const stateRef = useRef(state);
  const requestRef = useRef(null);
  const generationRef = useRef(0);
  const ownerRef = useRef(null);

  const updateState = useCallback((updater) => {
    setState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      stateRef.current = next;
      return next;
    });
  }, []);

  const refreshNotifications = useCallback(
    async ({ force = false, initial = false } = {}) => {
      if (!userId) return [];

      const current = stateRef.current;
      if (!force && notificationCacheIsFresh(current)) return current.notifications;
      if (requestRef.current?.userId === userId) return requestRef.current.promise;

      const generation = generationRef.current;
      const firstLoad = initial || !current.hasLoaded;
      updateState((previous) => ({
        ...previous,
        error: firstLoad ? "" : previous.error,
        initialLoading: firstLoad,
        refreshing: !firstLoad,
      }));

      const promise = Promise.all([
        api.get("/notifications"),
        api.get("/notifications/unread-count"),
      ])
        .then(([notificationsResponse, countResponse]) => {
          const notifications = notificationsResponse.data.data || [];
          if (generation !== generationRef.current) return notifications;
          updateState({
            error: "",
            hasLoaded: true,
            initialLoading: false,
            lastFetchedAt: Date.now(),
            notifications,
            refreshing: false,
            unreadCount:
              countResponse.data.data?.count ?? countUnreadNotifications(notifications),
          });
          return notifications;
        })
        .catch((error) => {
          if (generation === generationRef.current) {
            updateState((previous) => ({
              ...previous,
              error: getErrorMessage(error),
              initialLoading: false,
              refreshing: false,
            }));
          }
          throw error;
        })
        .finally(() => {
          if (requestRef.current?.promise === promise) requestRef.current = null;
        });
      requestRef.current = { promise, userId };
      return promise;
    },
    [updateState, userId],
  );

  useEffect(() => {
    if (ownerRef.current === userId) return;
    ownerRef.current = userId;
    generationRef.current += 1;
    requestRef.current = null;
    updateState(emptyNotificationState);
    if (userId) {
      void refreshNotifications({ force: true, initial: true }).catch(() => {});
    }
  }, [refreshNotifications, updateState, userId]);

  useEffect(() => {
    function refreshWhenStale() {
      void refreshNotifications().catch(() => {});
    }
    window.addEventListener("focus", refreshWhenStale);
    return () => window.removeEventListener("focus", refreshWhenStale);
  }, [refreshNotifications]);

  const markAsRead = useCallback(
    async (notification) => {
      if (!notification || notification.is_read) return;
      const previous = stateRef.current;
      updateState((current) => withNotificationMarkedRead(current, notification.id));
      try {
        await api.patch(`/notifications/${notification.id}/read`);
      } catch {
        updateState((current) => {
          const original = previous.notifications.find((item) => item.id === notification.id);
          if (!original) return current;
          const notifications = current.notifications.map((item) =>
            item.id === notification.id ? original : item,
          );
          return { ...current, notifications, unreadCount: countUnreadNotifications(notifications) };
        });
        void refreshNotifications({ force: true }).catch(() => {});
      }
    },
    [refreshNotifications, updateState],
  );

  const markAllAsRead = useCallback(async () => {
    const previous = stateRef.current;
    if (!previous.unreadCount) return;
    updateState((current) => withAllNotificationsMarkedRead(current));
    try {
      await api.patch("/notifications/read-all");
    } catch {
      updateState((current) => {
        const originals = new Map(previous.notifications.map((item) => [item.id, item]));
        const notifications = current.notifications.map((item) => originals.get(item.id) || item);
        return { ...current, notifications, unreadCount: countUnreadNotifications(notifications) };
      });
      void refreshNotifications({ force: true }).catch(() => {});
    }
  }, [refreshNotifications, updateState]);

  const value = useMemo(
    () => ({ ...state, markAllAsRead, markAsRead, refreshNotifications }),
    [markAllAsRead, markAsRead, refreshNotifications, state],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
