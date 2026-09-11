import { randomUUID } from "node:crypto";
import { z } from "zod";
import { supabase } from "../config/supabase.js";

const BUCKET = "lesson-materials";
export const MAX_LESSON_MATERIAL_BYTES = 10 * 1024 * 1024;

const uuidSchema = z.string().uuid();
const materialTypes = ["document", "video", "external_link", "google_form"];
const documentExtensions = new Map([
  ["pdf", ["application/pdf"]],
  ["doc", ["application/msword", "application/octet-stream"]],
  ["docx", ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"]],
  ["ppt", ["application/vnd.ms-powerpoint", "application/octet-stream"]],
  ["pptx", ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/octet-stream"]],
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
  sortOrder: z.coerce.number().int().nonnegative().optional(),
}).strict();

const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1, "Choose a file to upload.").max(255),
  mimeType: z.string().trim().max(255),
  fileSize: z.coerce.number().int().positive(),
}).strict();

const discardUploadSchema = z.object({
  storagePath: z.string().trim().min(1).max(600),
}).strict();

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
      const supported = ["youtube.com", "www.youtube.com", "youtu.be", "www.youtube-nocookie.com"];
      return supported.includes(url.hostname.toLowerCase()) ? url.toString() : null;
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
    .select("id,lesson_id,material_type,storage_path,lessons(is_published,module_id,course_modules(course_id))")
    .eq("id", materialId)
    .maybeSingle();
  if (error) throw error;
  const courseId = material?.lessons?.course_modules?.course_id;
  if (!material || !material.lessons?.is_published || !courseId) {
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
  return { material };
}

function materialFields(includeStoragePath = false) {
  return [
    "id",
    "lesson_id",
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
  const validationMessage = validateLessonMaterialDocument(values.data.fileName, values.data.mimeType, values.data.fileSize);
  if (validationMessage) return response.status(400).json({ success: false, message: validationMessage });
  try {
    const access = await getTeacherLesson(lessonId.data, request.auth.user.id);
    if (!access.lesson) return response.status(access.status).json({ success: false, message: access.message });
    const extension = values.data.fileName.split(".").pop().toLowerCase();
    const storagePath = `courses/${access.courseId}/lessons/${lessonId.data}/${randomUUID()}.${extension}`;
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
    const isDocument = input.materialType === "document";
    const validatedUrl = !isDocument && safeLessonMaterialUrl(input.externalUrl, input.materialType);
    const documentPrefix = `courses/${access.courseId}/lessons/${lessonId.data}/`;
    const documentError = isDocument && validateLessonMaterialDocument(input.fileName || "", input.mimeType || "", input.fileSize || 0);
    if (documentError) return response.status(400).json({ success: false, message: documentError });
    if (isDocument && (!input.storagePath?.startsWith(documentPrefix) || !input.fileName || !input.mimeType || input.fileSize === undefined)) {
      return response.status(400).json({ success: false, message: "Invalid document upload path." });
    }
    if (!isDocument && !validatedUrl) {
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
        material_type: input.materialType,
        title: input.title,
        description: input.description || null,
        storage_path: isDocument ? input.storagePath : null,
        external_url: isDocument ? null : validatedUrl,
        file_name: isDocument ? input.fileName : null,
        mime_type: isDocument ? input.mimeType : null,
        file_size: isDocument ? input.fileSize : null,
        sort_order: input.sortOrder ?? (last?.[0]?.sort_order ?? -1) + 1,
      })
      .select(materialFields(true))
      .single();
    if (error) throw error;
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
        message: "Invalid document upload path.",
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
  const values = materialSchema.pick({ title: true, description: true, externalUrl: true, sortOrder: true }).partial().strict().safeParse(request.body);
  if (!materialId.success || !values.success) return sendValidationError(response, values.success ? materialId : values);
  try {
    const { data: material, error } = await supabase.from("lesson_materials").select("id,lesson_id,material_type").eq("id", materialId.data).maybeSingle();
    if (error) throw error;
    if (!material) return response.status(404).json({ success: false, message: "Material not found." });
    const access = await getTeacherLesson(material.lesson_id, request.auth.user.id);
    if (!access.lesson) return response.status(access.status).json({ success: false, message: access.message });
    const patch = {};
    if (values.data.title !== undefined) patch.title = values.data.title;
    if (values.data.description !== undefined) patch.description = values.data.description || null;
    if (values.data.sortOrder !== undefined) patch.sort_order = values.data.sortOrder;
    if (values.data.externalUrl !== undefined) {
      const url = safeLessonMaterialUrl(values.data.externalUrl, material.material_type);
      if (!url || material.material_type === "document") return response.status(400).json({ success: false, message: "Invalid resource URL." });
      patch.external_url = url;
    }
    const { data, error: updateError } = await supabase.from("lesson_materials").update(patch).eq("id", material.id).select(materialFields(true)).single();
    if (updateError) throw updateError;
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
    if (material.material_type === "document" && material.storage_path) {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([material.storage_path]);
      if (storageError) throw storageError;
    }
    const { error: deleteError } = await supabase.from("lesson_materials").delete().eq("id", material.id);
    if (deleteError) throw deleteError;
    return response.json({ success: true, message: "Lesson material removed." });
  } catch (cause) {
    return sendUnexpected(next, "Unable to delete lesson material", cause);
  }
}

export async function studentMaterialAccess(request, response, next) {
  const materialId = uuidSchema.safeParse(request.params.materialId);
  if (!materialId.success) return sendValidationError(response, materialId);
  try {
    const access = await getStudentMaterial(materialId.data, request.auth.user.id);
    if (!access.material) return response.status(access.status).json({ success: false, message: access.message });
    if (access.material.material_type !== "document" || !access.material.storage_path) {
      return response.status(400).json({ success: false, message: "This material does not require a document URL." });
    }
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(access.material.storage_path, 300);
    if (error) throw error;
    return response.json({ success: true, data: { url: data.signedUrl, expiresIn: 300 } });
  } catch (cause) {
    return sendUnexpected(next, "Unable to access lesson material", cause);
  }
}

export function publicMaterialFields() {
  return materialFields(false);
}
