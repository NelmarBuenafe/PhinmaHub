import { supabase } from "../config/supabase.js";

const notificationFields = "id,type,title,message,source_type,source_id,course_id,is_read,created_at";

async function recipientIdsForAnnouncement(announcement) {
  if (announcement.audience === "course" && announcement.course_id) {
    const { data, error } = await supabase.from("enrollments").select("student_id").eq("course_id", announcement.course_id).eq("status", "active");
    if (error) throw error;
    return [...new Set((data || []).map((row) => row.student_id))];
  }
  let query = supabase.from("profiles").select("id").eq("account_status", "active").in("approved_role", announcement.audience === "students" ? ["student"] : announcement.audience === "teachers" ? ["teacher"] : ["student", "teacher"]);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => row.id).filter((id) => id !== announcement.author_id);
}

export async function createAnnouncementNotifications(announcement) {
  if (announcement.audience === "course" && announcement.course_id && !announcement.course_code) {
    const { data: course, error } = await supabase.from("courses").select("course_code").eq("id", announcement.course_id).maybeSingle();
    if (error) throw error;
    announcement = { ...announcement, course_code: course?.course_code };
  }
  const recipientIds = await recipientIdsForAnnouncement(announcement);
  if (!recipientIds.length) return 0;
  const rows = recipientIds.map((recipientId) => ({
    recipient_id: recipientId,
    type: "announcement",
    title: announcement.audience === "course" ? `New announcement in ${announcement.course_code || "your course"}` : "PhinmaHub Announcement",
    message: announcement.title,
    source_type: "announcement",
    source_id: announcement.id,
    course_id: announcement.course_id || null,
  }));
  const { error } = await supabase.from("notifications").upsert(rows, { onConflict: "recipient_id,source_type,source_id", ignoreDuplicates: true });
  if (error) throw error;
  return rows.length;
}

export { notificationFields };
