import test from "node:test";
import assert from "node:assert/strict";
import {
  NOTIFICATION_STALE_MS,
  countUnreadNotifications,
  notificationCacheIsFresh,
  withAllNotificationsMarkedRead,
  withNotificationMarkedRead,
} from "./notificationState.js";

const notifications = [
  { id: "new", is_read: false },
  { id: "seen", is_read: true },
];

test("a fresh successful notification load does not require another request", () => {
  assert.equal(
    notificationCacheIsFresh({ hasLoaded: true, lastFetchedAt: 100 }, 100 + NOTIFICATION_STALE_MS - 1),
    true,
  );
  assert.equal(
    notificationCacheIsFresh({ hasLoaded: true, lastFetchedAt: 100 }, 100 + NOTIFICATION_STALE_MS),
    false,
  );
});

test("marking notifications read updates the shared unread count immediately", () => {
  const state = { notifications, unreadCount: countUnreadNotifications(notifications) };
  assert.deepEqual(withNotificationMarkedRead(state, "new"), {
    notifications: [
      { id: "new", is_read: true },
      { id: "seen", is_read: true },
    ],
    unreadCount: 0,
  });
  assert.equal(withAllNotificationsMarkedRead(state).unreadCount, 0);
});
