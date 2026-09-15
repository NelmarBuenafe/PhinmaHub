export const NOTIFICATION_STALE_MS = 45_000;

export const emptyNotificationState = {
  error: "",
  hasLoaded: false,
  initialLoading: false,
  lastFetchedAt: null,
  notifications: [],
  refreshing: false,
  unreadCount: 0,
};

export function countUnreadNotifications(notifications = []) {
  return notifications.reduce(
    (count, notification) => count + (notification.is_read ? 0 : 1),
    0,
  );
}

export function notificationCacheIsFresh(
  { hasLoaded, lastFetchedAt },
  now = Date.now(),
) {
  return (
    hasLoaded &&
    typeof lastFetchedAt === "number" &&
    now - lastFetchedAt < NOTIFICATION_STALE_MS
  );
}

export function withNotificationMarkedRead(state, notificationId) {
  const notifications = state.notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, is_read: true }
      : notification,
  );
  return { ...state, notifications, unreadCount: countUnreadNotifications(notifications) };
}

export function withAllNotificationsMarkedRead(state) {
  const notifications = state.notifications.map((notification) => ({
    ...notification,
    is_read: true,
  }));
  return { ...state, notifications, unreadCount: 0 };
}
