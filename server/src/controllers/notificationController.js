import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { notificationFields } from "../services/notificationService.js";

const uuid = z.string().uuid();
function fail(next, message, cause) {
  const error = new Error(cause?.code === "42P01" ? "Notifications are not enabled yet. Run the phase9-notifications.sql migration." : message, { cause });
  error.statusCode = cause?.code === "42P01" ? 503 : cause?.status || cause?.statusCode;
  return next(error);
}

export async function listNotifications(request, response, next) {
  try {
    const { data, error } = await supabase.from("notifications").select(notificationFields).eq("recipient_id", request.auth.user.id).order("created_at", { ascending: false }).limit(30);
    if (error) throw error;
    return response.json({ success: true, data: data || [] });
  } catch (cause) { return fail(next, "Unable to load notifications", cause); }
}

export async function unreadNotificationCount(request, response, next) {
  try {
    const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", request.auth.user.id).eq("is_read", false);
    if (error) throw error;
    return response.json({ success: true, data: { count: count || 0 } });
  } catch (cause) { return fail(next, "Unable to load notification count", cause); }
}

export async function markNotificationRead(request, response, next) {
  const parsed = uuid.safeParse(request.params.id);
  if (!parsed.success) return response.status(400).json({ success: false, message: "Invalid notification." });
  try {
    const { data, error } = await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", parsed.data).eq("recipient_id", request.auth.user.id).select(notificationFields).maybeSingle();
    if (error) throw error;
    if (!data) return response.status(404).json({ success: false, message: "Notification not found." });
    return response.json({ success: true, data });
  } catch (cause) { return fail(next, "Unable to mark notification as read", cause); }
}

export async function markAllNotificationsRead(request, response, next) {
  try {
    const { error } = await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("recipient_id", request.auth.user.id).eq("is_read", false);
    if (error) throw error;
    return response.json({ success: true });
  } catch (cause) { return fail(next, "Unable to mark notifications as read", cause); }
}
