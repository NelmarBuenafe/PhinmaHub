import { randomUUID } from "node:crypto";
import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { deriveMaterialLearningProgress } from "../utils/materialProgress.js";

const BUCKET = "lesson-materials";
export const MAX_LESSON_MATERIAL_BYTES = 10 * 1024 * 1024;
export const MAX_LESSON_VIDEO_BYTES = 100 * 1024 * 1024;

const uuidSchema = z.string().uuid();
const materialTypes = ["document", "video", "external_link", "google_form"];
const documentExtensions = new Map([
  ["pdf", ["application/pdf"]],
  ["doc", ["application/msword", "application/octet-stream"]],
  ["docx", ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"]],
  ["ppt", ["application/vnd.ms-powerpoint", "application/octet-stream"]],
  ["pptx", ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/octet-stream"]],
]);
const videoExtensions = new Map([
  ["mp4", ["video/mp4"]],
  ["webm", ["video/webm"]],
]);

const materialSchema = z.object({
  materialType: z.enum(materialTypes),
  title: z.string().trim().min(1, "Material title is required.").max(200),
  description: z.string().trim().max(4000).optional().default(""),
  externalUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().url("Enter a valid HTTPS URL.").optional(),
  ),
  storagePath: z.string().trim().max(600).optional(),
  fileName: z.string().trim().max(255).optional(),
  mimeType: z.string().trim().max(255).optional(),
  fileSize: z.coerce.number().int().nonnegative().optional(),
  sectionId: z.string().uuid(),
  isRequired: z.boolean().optional(),
  sortOrder: z.coerce.number().int().nonnegative().optional(),
}).strict();

const uploadRequestSchema = z.object({
  materialType: z.enum(["document", "video"]),
  sectionId: z.string().uuid(),
  fileName: z.string().trim().min(1, "Choose a file to upload.").max(255),
  mimeType: z.string().trim().max(255),
  fileSize: z.coerce.number().int().positive(),
}).strict();

const discardUploadSchema = z.object({
  storagePath: z.string().trim().min(1).max(600),
}).strict();
const videoProgressSchema = z.object({
  durationSeconds: z.coerce.number().positive().max(86_400),
  lastPositionSeconds: z.coerce.number().nonnegative().max(86_400).optional(),
  watchedRanges: z.array(z.tuple([
    z.coerce.number().nonnegative().max(86_400),
    z.coerce.number().nonnegative().max(86_400),
  ])).max(300),
}).strict();
const VIDEO_COMPLETION_THRESHOLD = 95;

function sendUnexpected(next, message, cause) {
  const error = new Error(message, { cause });
  error.statusCode = cause?.statusCode || cause?.status;
  return next(error);
}

function sendValidationError(response, parsed) {
  return response.status(400).json({
    success: false,
    message: parsed.error.issues[0]?.message || "Invalid material information.",
  });
}

export function safeLessonMaterialUrl(value, type) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (type === "video") {
      return extractYouTubeVideoId(url.toString()) ? url.toString() : null;
    }
    if (type === "google_form") {
      const host = url.hostname.toLowerCase();
      const isFullForm = host === "docs.google.com" && url.pathname.startsWith("/forms/");
      const isShortForm = host === "forms.gle" && url.pathname.length > 1;
      return isFullForm || isShortForm ? url.toString() : null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function extractYouTubeVideoId(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id = null;
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0];
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (/^\/(?:embed|shorts)\//.test(url.pathname)) id = url.pathname.split("/")[2];
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

export function mergeWatchedRanges(ranges, durationSeconds) {
  const duration = Number(durationSeconds);
  const sorted = (ranges || [])
    .map(([start, end]) => [Math.max(0, Number(start)), Math.min(duration, Number(end))])
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && end > start)
    .sort((left, right) => left[0] - right[0]);
  const merged = [];
  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && range[0] <= previous[1] + 0.5) previous[1] = Math.max(previous[1], range[1]);
    else merged.push(range);
  }
  return merged.map(([start, end]) => [Math.round(start * 10) / 10, Math.round(end * 10) / 10]);
}

export function watchedPercent(ranges, durationSeconds) {
  const duration = Number(durationSeconds);
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  const seconds = mergeWatchedRanges(ranges, duration).reduce((sum, [start, end]) => sum + end - start, 0);
  return Math.min(100, Math.round((seconds / duration) * 100));
}

export function validateLessonMaterialDocument(fileName, mimeType, fileSize) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const supportedMimes = documentExtensions.get(extension);
  if (!supportedMimes || !supportedMimes.includes(mimeType.toLowerCase())) {
    return "Unsupported file type. Please upload a PDF, Word document, or PowerPoint file.";
  }
  if (fileSize > MAX_LESSON_MATERIAL_BYTES) {
    return "This file is too large to upload.";
  }
  return null;
}

export function validateLessonMaterialVideo(fileName, mimeType, fileSize) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const supportedMimes = videoExtensions.get(extension);
  if (!supportedMimes || !supportedMimes.includes(mimeType.toLowerCase())) {
    return "Unsupported video type. Please upload an MP4 or WebM video file.";
  }
  if (fileSize > MAX_LESSON_VIDEO_BYTES) return "This video is too large to upload.";
  return null;
}

async function getTeacherLesson(lessonId, teacherId) {
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id,module_id,course_modules(course_id,courses(teacher_id))")
    .eq("id", lessonId)
    .maybeSingle();
  if (error) throw error;
  const course = lesson?.course_modules?.courses;
  if (!lesson) return { status: 404, message: "Lesson not found." };
  if (course?.teacher_id !== teacherId) {
    return { status: 403, message: "You can only manage materials for lessons in your courses." };
  }
  return { lesson, courseId: lesson.course_modules.course_id };
}

async function getStudentMaterial(materialId, studentId) {
  const { data: material, error } = await supabase
    .from("lesson_materials")
    .select("id,lesson_id,section_id,material_type,external_url,storage_path,lesson_sections(is_published),lessons(is_published,module_id,course_modules(course_id,courses(status)))")
    .eq("id", materialId)
    .maybeSingle();
  if (error) throw error;
  const courseId = material?.lessons?.course_modules?.course_id;
  if (!material || !material.lessons?.is_published || (material.section_id && !material.lesson_sections?.is_published) || !courseId) {
    return { status: 404, message: "Material not found." };
  }
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();
  if (enrollmentError) throw enrollmentError;
  if (!enrollment) return { status: 403, message: "You are not enrolled in this course." };
  return { material, courseId, courseStatus: material.lessons?.course_modules?.courses?.status };
}

function materialFields(includeStoragePath = false) {
  return [
    "id",
    "lesson_id",
    "section_id",
    "is_required",
    "material_type",
    "title",
    "description",
    ...(includeStoragePath ? ["storage_path"] : []),
    "external_url",
    "file_name",
    "mime_type",
    "file_size",
    "sort_order",
    "created_at",
  ].join(",");
}

export async function recalculateStoredLessonProgress(lessonId) {
  const [sectionResult, materialResult, lessonProgressResult] = await Promise.all([
    supabase.from("lesson_sections").select("id,content,is_required").eq("lesson_id", lessonId).eq("is_published", true),
    supabase.from("lesson_materials").select("id,section_id,is_required").eq("lesson_id", lessonId),
    supabase.from("lesson_progress").select("student_id").eq("lesson_id", lessonId),
  ]);
  if (sectionResult.error) throw sectionResult.error;
  if (materialResult.error) throw materialResult.error;
  if (lessonProgressResult.error) throw lessonProgressResult.error;
  const materials = materialResult.data || [];
  const materialIds = materials.map((material) => material.id);
  const materialProgressResult = materialIds.length
    ? await supabase.from("lesson_material_progress").select("student_id,material_id,progress_percent,is_completed,completed_at").in("material_id", materialIds)
    : { data: [], error: null };
  if (materialProgressResult.error) throw materialProgressResult.error;
  const sectionIds = (sectionResult.data || []).map((section) => section.id);
  const readingProgressResult = sectionIds.length
    ? await supabase.from("lesson_section_reading_progress").select("student_id,section_id,progress_percent").in("section_id", sectionIds)
    : { data: [], error: null };
  if (readingProgressResult.error) throw readingProgressResult.error;
  const studentIds = new Set([
    ...(lessonProgressResult.data || []).map((record) => record.student_id),
    ...(materialProgressResult.data || []).map((record) => record.student_id),
    ...(readingProgressResult.data || []).map((record) => record.student_id),
  ]);
  if (!studentIds.size) return;
  const rows = [...studentIds].map((studentId) => {
    const derived = deriveMaterialLearningProgress(
      sectionResult.data || [],
      materials,
      (materialProgressResult.data || []).filter((record) => record.student_id === studentId),
      (readingProgressResult.data || []).filter((record) => record.student_id === studentId),
    ).lesson;
    return {
      student_id: studentId,
      lesson_id: lessonId,
      progress_percent: derived.progressPercent,
      is_completed: derived.isCompleted,
      completed_at: derived.isCompleted ? new Date().toISOString() : null,
    };
  });
  const { error } = await supabase.from("lesson_progress").upsert(rows, { onConflict: "student_id,lesson_id" });
  if (error) throw error;
}

export async function listTeacherLessonMaterials(request, response, next) {
  const lessonId = uuidSchema.safeParse(request.params.lessonId);
  if (!lessonId.success) return sendValidationError(response, lessonId);
  try {
    const access = await getTeacherLesson(lessonId.data, request.auth.user.id);
    if (!access.lesson) return response.status(access.status).json({ success: false, message: access.message });
    const { data, error } = await supabase
      .from("lesson_materials")
      .select(materialFields(true))
      .eq("lesson_id", lessonId.data)
      .order("sort_order")
      .order("created_at");
    if (error) throw error;
    return response.json({ success: true, data: data || [] });
  } catch (cause) {
    return sendUnexpected(next, "Unable to load lesson materials", cause);
  }
}

export async function createUploadUrl(request, response, next) {
  const lessonId = uuidSchema.safeParse(request.params.lessonId);
  const values = uploadRequestSchema.safeParse(request.body);
  if (!lessonId.success || !values.success) return sendValidationError(response, values.success ? lessonId : values);
  const validationMessage = values.data.materialType === "video"
    ? validateLessonMaterialVideo(values.data.fileName, values.data.mimeType, values.data.fileSize)
    : validateLessonMaterialDocument(values.data.fileName, values.data.mimeType, values.data.fileSize);
  if (validationMessage) return response.status(400).json({ success: false, message: validationMessage });
  try {
    const access = await getTeacherLesson(lessonId.data, request.auth.user.id);
    if (!access.lesson) return response.status(access.status).json({ success: false, message: access.message });
    const { data: section, error: sectionError } = await supabase
      .from("lesson_sections").select("id").eq("id", values.data.sectionId).eq("lesson_id", lessonId.data).maybeSingle();
    if (sectionError) throw sectionError;
    if (!section) return response.status(400).json({ success: false, message: "Choose a section in this lesson." });
    const extension = values.data.fileName.split(".").pop().toLowerCase();
    const folder = values.data.materialType === "video" ? "videos" : "documents";
    const storagePath = `courses/${access.courseId}/lessons/${lessonId.data}/sections/${section.id}/${folder}/${randomUUID()}.${extension}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(storagePath);
    if (error) throw error;
    return response.status(201).json({
      success: true,
      data: { storagePath, token: data.token, signedUrl: data.signedUrl },
    });
  } catch (cause) {
    return sendUnexpected(next, "Unable to prepare file upload", cause);
  }
}

export async function createLessonMaterial(request, response, next) {
  const lessonId = uuidSchema.safeParse(request.params.lessonId);
  const values = materialSchema.safeParse(request.body);
  if (!lessonId.success || !values.success) return sendValidationError(response, values.success ? lessonId : values);
  try {
    const access = await getTeacherLesson(lessonId.data, request.auth.user.id);
    if (!access.lesson) return response.status(access.status).json({ success: false, message: access.message });
    const input = values.data;
    const { data: section, error: sectionError } = await supabase
      .from("lesson_sections")
      .select("id")
      .eq("id", input.sectionId)
      .eq("lesson_id", lessonId.data)
      .maybeSingle();
    if (sectionError) throw sectionError;
    if (!section) return response.status(400).json({ success: false, message: "Choose a section in this lesson." });
    const isStorageUpload = input.materialType === "document" || (input.materialType === "video" && Boolean(input.storagePath));
    const validatedUrl = !isStorageUpload && safeLessonMaterialUrl(input.externalUrl, input.materialType);
    const uploadPrefix = `courses/${access.courseId}/lessons/${lessonId.data}/sections/${input.sectionId}/${input.materialType === "video" ? "videos" : "documents"}/`;
    const uploadError = isStorageUpload && (input.materialType === "video"
      ? validateLessonMaterialVideo(input.fileName || "", input.mimeType || "", input.fileSize || 0)
      : validateLessonMaterialDocument(input.fileName || "", input.mimeType || "", input.fileSize || 0));
    if (uploadError) return response.status(400).json({ success: false, message: uploadError });
    if (isStorageUpload && (!input.storagePath?.startsWith(uploadPrefix) || !input.fileName || !input.mimeType || input.fileSize === undefined)) {
      return response.status(400).json({ success: false, message: "Invalid uploaded material path." });
    }
    if (!isStorageUpload && !validatedUrl) {
      const message = input.materialType === "google_form"
        ? "Enter a valid Google Forms URL."
        : input.materialType === "video"
          ? "Enter a valid YouTube video URL."
          : "Enter a valid HTTPS resource URL.";
      return response.status(400).json({ success: false, message });
    }
    const { data: last, error: lastError } = await supabase
      .from("lesson_materials")
      .select("sort_order")
      .eq("lesson_id", lessonId.data)
      .order("sort_order", { ascending: false })
      .limit(1);
    if (lastError) throw lastError;
    const { data, error } = await supabase
      .from("lesson_materials")
      .insert({
        lesson_id: lessonId.data,
        section_id: input.sectionId,
        is_required: input.isRequired ?? true,
        material_type: input.materialType,
        title: input.title,
        description: input.description || null,
        storage_path: isStorageUpload ? input.storagePath : null,
        external_url: isStorageUpload ? null : validatedUrl,
        file_name: isStorageUpload ? input.fileName : null,
        mime_type: isStorageUpload ? input.mimeType : null,
        file_size: isStorageUpload ? input.fileSize : null,
        sort_order: input.sortOrder ?? (last?.[0]?.sort_order ?? -1) + 1,
      })
      .select(materialFields(true))
      .single();
    if (error) throw error;
    await recalculateStoredLessonProgress(lessonId.data);
    return response.status(201).json({ success: true, data, message: "Lesson material added." });
  } catch (cause) {
    return sendUnexpected(next, "Unable to add lesson material", cause);
  }
}

export async function discardUploadedMaterial(request, response, next) {
  const lessonId = uuidSchema.safeParse(request.params.lessonId);
  const values = discardUploadSchema.safeParse(request.body);
  if (!lessonId.success || !values.success) {
    return sendValidationError(response, values.success ? lessonId : values);
  }

  try {
    const access = await getTeacherLesson(lessonId.data, request.auth.user.id);
    if (!access.lesson) {
      return response.status(access.status).json({ success: false, message: access.message });
    }

    const expectedPrefix = `courses/${access.courseId}/lessons/${lessonId.data}/`;
    if (!values.data.storagePath.startsWith(expectedPrefix)) {
      return response.status(400).json({
        success: false,
        message: "Invalid uploaded material path.",
      });
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([values.data.storagePath]);
    if (error) throw error;

    return response.json({ success: true, message: "Unused upload removed." });
  } catch (cause) {
    return sendUnexpected(next, "Unable to discard uploaded material", cause);
  }
}

export async function updateLessonMaterial(request, response, next) {
  const materialId = uuidSchema.safeParse(request.params.materialId);
  const values = materialSchema.pick({ title: true, description: true, externalUrl: true, sortOrder: true, isRequired: true }).partial().strict().safeParse(request.body);
  if (!materialId.success || !values.success) return sendValidationError(response, values.success ? materialId : values);
  try {
    const { data: material, error } = await supabase.from("lesson_materials").select("id,lesson_id,section_id,material_type").eq("id", materialId.data).maybeSingle();
    if (error) throw error;
    if (!material) return response.status(404).json({ success: false, message: "Material not found." });
    const access = await getTeacherLesson(material.lesson_id, request.auth.user.id);
    if (!access.lesson) return response.status(access.status).json({ success: false, message: access.message });
    const patch = {};
    if (values.data.title !== undefined) patch.title = values.data.title;
    if (values.data.description !== undefined) patch.description = values.data.description || null;
    if (values.data.sortOrder !== undefined) patch.sort_order = values.data.sortOrder;
    if (values.data.isRequired !== undefined) patch.is_required = values.data.isRequired;
    if (values.data.externalUrl !== undefined) {
      const url = safeLessonMaterialUrl(values.data.externalUrl, material.material_type);
      if (!url || material.material_type === "document") return response.status(400).json({ success: false, message: "Invalid resource URL." });
      patch.external_url = url;
    }
    const { data, error: updateError } = await supabase.from("lesson_materials").update(patch).eq("id", material.id).select(materialFields(true)).single();
    if (updateError) throw updateError;
    await recalculateStoredLessonProgress(material.lesson_id);
    return response.json({ success: true, data, message: "Lesson material updated." });
  } catch (cause) {
    return sendUnexpected(next, "Unable to update lesson material", cause);
  }
}

export async function deleteLessonMaterial(request, response, next) {
  const materialId = uuidSchema.safeParse(request.params.materialId);
  if (!materialId.success) return sendValidationError(response, materialId);
  try {
    const { data: material, error } = await supabase.from("lesson_materials").select("id,lesson_id,material_type,storage_path").eq("id", materialId.data).maybeSingle();
    if (error) throw error;
    if (!material) return response.status(404).json({ success: false, message: "Material not found." });
    const access = await getTeacherLesson(material.lesson_id, request.auth.user.id);
    if (!access.lesson) return response.status(access.status).json({ success: false, message: access.message });
    if (material.storage_path) {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([material.storage_path]);
      if (storageError) throw storageError;
    }
    const { error: deleteError } = await supabase.from("lesson_materials").delete().eq("id", material.id);
    if (deleteError) throw deleteError;
    await recalculateStoredLessonProgress(material.lesson_id);
    return response.json({ success: true, message: "Lesson material removed." });
  } catch (cause) {
    return sendUnexpected(next, "Unable to delete lesson material", cause);
  }
}

export async function saveStudentVideoProgress(request, response, next) {
  const materialId = uuidSchema.safeParse(request.params.materialId);
  const values = videoProgressSchema.safeParse(request.body);
  if (!materialId.success || !values.success) return sendValidationError(response, values.success ? materialId : values);
  try {
    const access = await getStudentMaterial(materialId.data, request.auth.user.id);
    if (!access.material) return response.status(access.status).json({ success: false, message: access.message });
    if (access.material.material_type !== "video" || (!access.material.storage_path && !extractYouTubeVideoId(access.material.external_url))) {
      return response.status(400).json({ success: false, message: "This material is not a supported video." });
    }
    if (access.courseStatus === "archived") {
      return response.status(409).json({ success: false, message: "This archived course is read-only and video progress can no longer be changed." });
    }
    const { data: existing, error: existingError } = await supabase
      .from("lesson_material_progress")
      .select("watched_ranges,progress_percent,is_completed")
      .eq("student_id", request.auth.user.id)
      .eq("material_id", access.material.id)
      .maybeSingle();
    if (existingError) throw existingError;
    const ranges = mergeWatchedRanges([
      ...(existing?.watched_ranges || []),
      ...values.data.watchedRanges,
    ], values.data.durationSeconds);
    const progressPercent = watchedPercent(ranges, values.data.durationSeconds);
    const isCompleted = existing?.is_completed === true || progressPercent >= VIDEO_COMPLETION_THRESHOLD;
    const { data, error } = await supabase.from("lesson_material_progress").upsert({
      student_id: request.auth.user.id,
      material_id: access.material.id,
      watched_ranges: ranges,
      last_position_seconds: Math.min(values.data.durationSeconds, values.data.lastPositionSeconds || 0),
      progress_percent: isCompleted ? 100 : Math.max(existing?.progress_percent || 0, progressPercent),
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    }, { onConflict: "student_id,material_id" }).select("progress_percent,is_completed,completed_at,watched_ranges,last_position_seconds").single();
    if (error) throw error;
    await recalculateStoredLessonProgress(access.material.lesson_id);
    return response.json({ success: true, data: {
      isCompleted: data.is_completed === true,
      progressPercent: data.progress_percent || 0,
      watchedRanges: data.watched_ranges || [],
      lastPositionSeconds: data.last_position_seconds || 0,
    }, message: data.is_completed ? "Video completed." : "Video progress saved." });
  } catch (cause) { return sendUnexpected(next, "Unable to save video progress", cause); }
}

export async function studentMaterialAccess(request, response, next) {
  const materialId = uuidSchema.safeParse(request.params.materialId);
  if (!materialId.success) return sendValidationError(response, materialId);
  try {
    const access = await getStudentMaterial(materialId.data, request.auth.user.id);
    if (!access.material) return response.status(access.status).json({ success: false, message: access.message });
    if (!access.material.storage_path || !["document", "video"].includes(access.material.material_type)) {
      return response.status(400).json({ success: false, message: "This material does not require a protected file URL." });
    }
    const expiresIn = access.material.material_type === "video" ? 3600 : 300;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(access.material.storage_path, expiresIn);
    if (error) throw error;
    return response.json({ success: true, data: { url: data.signedUrl, expiresIn } });
  } catch (cause) {
    return sendUnexpected(next, "Unable to access lesson material", cause);
  }
}

export async function teacherMaterialAccess(request, response, next) {
  const materialId = uuidSchema.safeParse(request.params.materialId);
  if (!materialId.success) return sendValidationError(response, materialId);
  try {
    const { data: material, error } = await supabase
      .from("lesson_materials")
      .select("id,lesson_id,material_type,storage_path")
      .eq("id", materialId.data)
      .maybeSingle();
    if (error) throw error;
    if (!material) return response.status(404).json({ success: false, message: "Material not found." });
    const access = await getTeacherLesson(material.lesson_id, request.auth.user.id);
    if (!access.lesson) return response.status(access.status).json({ success: false, message: access.message });
    if (material.material_type !== "video" || !material.storage_path) {
      return response.status(400).json({ success: false, message: "This material is not an uploaded video." });
    }
    const { data, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrl(material.storage_path, 3600);
    if (signedError) throw signedError;
    return response.json({ success: true, data: { url: data.signedUrl, expiresIn: 3600 } });
  } catch (cause) {
    return sendUnexpected(next, "Unable to access lesson video", cause);
  }
}

export function publicMaterialFields(includeStoragePath = false) {
  return materialFields(includeStoragePath);
}
