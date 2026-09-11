import { z } from "zod";
import { supabase } from "../config/supabase.js";

const uuidSchema = z.string().uuid();
export const teacherAnnouncementSchema = z.object({
  title: z.string().trim().min(1, "Announcement title is required.").max(200),
  body: z.string().trim().min(1, "Announcement content is required.").max(30000),
  isPublished: z.boolean().optional().default(false),
}).strict();

function validationError(response, parsed) {
  return response.status(400).json({
    success: false,
    message: parsed.error.issues[0]?.message || "Invalid announcement information.",
  });
}

function unexpected(next, message, cause) {
  const error = new Error(message, { cause });
  error.statusCode = cause?.statusCode || cause?.status;
  return next(error);
}

async function ownedCourse(courseId, teacherId) {
  const { data, error } = await supabase
    .from("courses")
    .select("id,teacher_id")
    .eq("id", courseId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { status: 404, message: "Course not found." };
  if (data.teacher_id !== teacherId) {
    return { status: 403, message: "You can only manage announcements for your courses." };
  }
  return { course: data };
}

async function ownedAnnouncement(announcementId, teacherId) {
  const { data, error } = await supabase
    .from("announcements")
    .select("id,course_id,title,body,audience,published_at,created_at,updated_at")
    .eq("id", announcementId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { status: 404, message: "Announcement not found." };
  if (data.audience !== "course" || !data.course_id) {
    return { status: 403, message: "Only course announcements can be managed here." };
  }
  const course = await ownedCourse(data.course_id, teacherId);
  return course.course ? { announcement: data, course: course.course } : course;
}

const fields = "id,course_id,title,body,audience,published_at,created_at,updated_at";

export async function listTeacherAnnouncements(request, response, next) {
  const courseId = uuidSchema.safeParse(request.params.courseId);
  if (!courseId.success) return validationError(response, courseId);
  try {
    const access = await ownedCourse(courseId.data, request.auth.user.id);
    if (!access.course) return response.status(access.status).json({ success: false, message: access.message });
    const { data, error } = await supabase
      .from("announcements")
      .select(fields)
      .eq("course_id", courseId.data)
      .eq("audience", "course")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return response.json({ success: true, data: data || [] });
  } catch (cause) {
    return unexpected(next, "Unable to load course announcements", cause);
  }
}

export async function createTeacherAnnouncement(request, response, next) {
  const courseId = uuidSchema.safeParse(request.params.courseId);
  const values = teacherAnnouncementSchema.safeParse(request.body);
  if (!courseId.success || !values.success) return validationError(response, values.success ? courseId : values);
  try {
    const access = await ownedCourse(courseId.data, request.auth.user.id);
    if (!access.course) return response.status(access.status).json({ success: false, message: access.message });
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        author_id: request.auth.user.id,
        course_id: courseId.data,
        audience: "course",
        title: values.data.title,
        body: values.data.body,
        published_at: values.data.isPublished ? new Date().toISOString() : null,
      })
      .select(fields)
      .single();
    if (error) throw error;
    return response.status(201).json({ success: true, data, message: "Announcement created." });
  } catch (cause) {
    return unexpected(next, "Unable to create announcement", cause);
  }
}

export async function updateTeacherAnnouncement(request, response, next) {
  const announcementId = uuidSchema.safeParse(request.params.announcementId);
  const values = teacherAnnouncementSchema.safeParse(request.body);
  if (!announcementId.success || !values.success) return validationError(response, values.success ? announcementId : values);
  try {
    const access = await ownedAnnouncement(announcementId.data, request.auth.user.id);
    if (!access.announcement) return response.status(access.status).json({ success: false, message: access.message });
    const { data, error } = await supabase
      .from("announcements")
      .update({
        title: values.data.title,
        body: values.data.body,
        published_at: values.data.isPublished
          ? access.announcement.published_at || new Date().toISOString()
          : null,
      })
      .eq("id", announcementId.data)
      .select(fields)
      .single();
    if (error) throw error;
    return response.json({ success: true, data, message: "Announcement updated." });
  } catch (cause) {
    return unexpected(next, "Unable to update announcement", cause);
  }
}

export async function deleteTeacherAnnouncement(request, response, next) {
  const announcementId = uuidSchema.safeParse(request.params.announcementId);
  if (!announcementId.success) return validationError(response, announcementId);
  try {
    const access = await ownedAnnouncement(announcementId.data, request.auth.user.id);
    if (!access.announcement) return response.status(access.status).json({ success: false, message: access.message });
    const { error } = await supabase.from("announcements").delete().eq("id", announcementId.data);
    if (error) throw error;
    return response.json({ success: true, message: "Announcement deleted." });
  } catch (cause) {
    return unexpected(next, "Unable to delete announcement", cause);
  }
}
