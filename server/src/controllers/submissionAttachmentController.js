import { randomUUID } from "node:crypto";
import { z } from "zod";
import { supabase } from "../config/supabase.js";

export const ASSIGNMENT_SUBMISSION_BUCKET = "assignment-submissions";
export const MAX_SUBMISSION_FILES = 5;
export const MAX_SUBMISSION_LINKS = 5;
export const MAX_SUBMISSION_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_SUBMISSION_VIDEO_BYTES = 50 * 1024 * 1024;
export const SUBMISSION_SIGNED_URL_SECONDS = 300;

const uuidSchema = z.string().uuid();
const uploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  fileSize: z.coerce.number().int().positive(),
}).strict();
const attachmentSchema = z.object({
  submissionId: uuidSchema,
  storagePath: z.string().trim().min(1).max(600),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  fileSize: z.coerce.number().int().positive(),
}).strict();
const linkSchema = z.object({
  submissionId: uuidSchema,
  url: z.string().trim().min(1).max(2048),
}).strict();
const removeUploadSchema = z.object({
  submissionId: uuidSchema,
  storagePath: z.string().trim().min(1).max(600),
}).strict();

const allowedFiles = new Map([
  ["jpg", { type: "image", mimes: ["image/jpeg"], limit: MAX_SUBMISSION_FILE_BYTES }],
  ["jpeg", { type: "image", mimes: ["image/jpeg"], limit: MAX_SUBMISSION_FILE_BYTES }],
  ["png", { type: "image", mimes: ["image/png"], limit: MAX_SUBMISSION_FILE_BYTES }],
  ["webp", { type: "image", mimes: ["image/webp"], limit: MAX_SUBMISSION_FILE_BYTES }],
  ["doc", { type: "document", mimes: ["application/msword"], limit: MAX_SUBMISSION_FILE_BYTES }],
  ["docx", { type: "document", mimes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], limit: MAX_SUBMISSION_FILE_BYTES }],
  ["pdf", { type: "document", mimes: ["application/pdf"], limit: MAX_SUBMISSION_FILE_BYTES }],
  ["mp4", { type: "video", mimes: ["video/mp4"], limit: MAX_SUBMISSION_VIDEO_BYTES }],
  ["webm", { type: "video", mimes: ["video/webm"], limit: MAX_SUBMISSION_VIDEO_BYTES }],
]);

export const submissionAttachmentFields = "id,submission_id,student_id,assignment_id,type,file_name,mime_type,file_size,external_url,created_at";

export function sanitizeSubmissionFileName(fileName) {
  const baseName = String(fileName || "").split(/[\\/]/).pop() || "submission-file";
  return baseName.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 180) || "submission-file";
}

export function validateSubmissionFile(fileName, mimeType, fileSize) {
  const extension = String(fileName || "").split(".").pop()?.toLowerCase();
  const normalizedMime = String(mimeType || "").toLowerCase();
  const definition = allowedFiles.get(extension);
  if (!definition || !definition.mimes.includes(normalizedMime)) {
    return { valid: false, message: "Unsupported file type. Upload JPG, PNG, WEBP, DOC, DOCX, PDF, MP4, or WEBM files." };
  }
  if (!Number.isInteger(Number(fileSize)) || Number(fileSize) <= 0) {
    return { valid: false, message: "File size must be a positive whole number." };
  }
  if (Number(fileSize) > definition.limit) {
    const limit = definition.type === "video" ? "50 MB" : "10 MB";
    return { valid: false, message: `This ${definition.type} file exceeds the ${limit} limit.` };
  }
  return { valid: true, type: definition.type, extension, limit: definition.limit };
}

export function validateSubmissionLink(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported protocol");
    return { valid: true, url: url.toString() };
  } catch {
    return { valid: false, message: "Links must use a valid http:// or https:// URL." };
  }
}

function sendValidationError(response, parsed) {
  return response.status(400).json({ success: false, message: parsed.error.issues[0]?.message || "Invalid attachment information." });
}

function sendUnexpected(next, message, cause) {
  const error = new Error(message, { cause });
  error.statusCode = cause?.statusCode || cause?.status;
  return next(error);
}

function publicAttachment(attachment) {
  if (!attachment) return null;
  const { storage_path: _storagePath, ...safeAttachment } = attachment;
  return safeAttachment;
}

export async function listSubmissionAttachments(submissionId) {
  const { data, error } = await supabase.from("submission_attachments").select(`${submissionAttachmentFields},storage_path`).eq("submission_id", submissionId).order("created_at");
  if (error?.code === "PGRST205") return [];
  if (error) throw error;
  return (data || []).map(publicAttachment);
}

export async function attachSubmissionAttachments(submissions) {
  const ids = (submissions || []).map((submission) => submission.id).filter(Boolean);
  if (!ids.length) return submissions || [];
  const { data, error } = await supabase.from("submission_attachments").select(`${submissionAttachmentFields},storage_path`).in("submission_id", ids).order("created_at");
  if (error?.code === "PGRST205") return (submissions || []).map((submission) => ({ ...submission, attachments: [] }));
  if (error) throw error;
  const grouped = new Map();
  for (const attachment of data || []) grouped.set(attachment.submission_id, [...(grouped.get(attachment.submission_id) || []), publicAttachment(attachment)]);
  return (submissions || []).map((submission) => ({ ...submission, attachments: grouped.get(submission.id) || [] }));
}

async function getStudentAssignment(assignmentId, studentId) {
  const { data: assignment, error } = await supabase.from("assignments").select("id,course_id,title,instructions,total_points,due_at,allow_late_submissions,is_published").eq("id", assignmentId).maybeSingle();
  if (error) throw error;
  if (!assignment?.is_published) return { status: 404, message: "Published assignment not found." };
  const { data: enrollment, error: enrollmentError } = await supabase.from("enrollments").select("id,courses(id,teacher_id,course_code,title,description,status,visibility)").eq("course_id", assignment.course_id).eq("student_id", studentId).eq("status", "active").maybeSingle();
  if (enrollmentError) throw enrollmentError;
  if (!enrollment?.courses) return { status: 403, message: "You are not enrolled in this course." };
  return { assignment, course: enrollment.courses };
}

async function getEditableStudentSubmission(assignmentId, studentId, createDraft = false) {
  const { data: existing, error } = await supabase.from("submissions").select("id,assignment_id,student_id,written_answer,status,submitted_at,score,feedback,graded_at").eq("assignment_id", assignmentId).eq("student_id", studentId).maybeSingle();
  if (error) throw error;
  if (existing?.status === "graded" && createDraft) return { status: 409, message: "This assignment has already been graded and can no longer be edited." };
  if (existing || !createDraft) return { submission: existing || null };
  const { data: created, error: createError } = await supabase.from("submissions").insert({ assignment_id: assignmentId, student_id: studentId, status: "draft" }).select("id,assignment_id,student_id,written_answer,status,submitted_at,score,feedback,graded_at").single();
  if (createError) throw createError;
  return { submission: created };
}

async function getAttachmentContext(assignmentId, submissionId, studentId, allowArchived = false) {
  const access = await getStudentAssignment(assignmentId, studentId);
  if (!access.assignment) return access;
  if (!allowArchived && access.course.status === "archived") return { status: 409, message: "This archived course is read-only and submissions can no longer be changed." };
  const { data: submission, error } = await supabase.from("submissions").select("id,assignment_id,student_id,status").eq("id", submissionId).eq("assignment_id", assignmentId).eq("student_id", studentId).maybeSingle();
  if (error) throw error;
  if (!submission) return { status: 404, message: "Submission not found." };
  if (!allowArchived && submission.status === "graded") return { status: 409, message: "This assignment has already been graded and can no longer be edited." };
  return { ...access, submission };
}

async function countAttachments(submissionId, type) {
  const { count, error } = await supabase.from("submission_attachments").select("id", { count: "exact", head: true }).eq("submission_id", submissionId).eq("type", type);
  if (error?.code === "PGRST205") return 0;
  if (error) throw error;
  return count || 0;
}

function isOwnedStoragePath(storagePath, studentId, assignmentId, submissionId) {
  const prefix = `${studentId}/${assignmentId}/${submissionId}/`;
  return storagePath.startsWith(prefix) && storagePath.split("/").length === 4 && !storagePath.includes("..") && sanitizeSubmissionFileName(storagePath.split("/").pop()) === storagePath.split("/").pop();
}

export async function getStudentAssignmentDetail(request, response, next) {
  const assignmentId = uuidSchema.safeParse(request.params.assignmentId);
  if (!assignmentId.success) return sendValidationError(response, assignmentId);
  try {
    const access = await getStudentAssignment(assignmentId.data, request.auth.user.id);
    if (!access.assignment) return response.status(access.status).json({ success: false, message: access.message });
    const submissionResult = await getEditableStudentSubmission(assignmentId.data, request.auth.user.id);
    const submission = submissionResult.submission || null;
    return response.json({ success: true, data: { assignment: { ...access.assignment, course_code: access.course.course_code, course_title: access.course.title }, course: access.course, submission: submission ? { ...submission, attachments: await listSubmissionAttachments(submission.id) } : null } });
  } catch (cause) { return sendUnexpected(next, "Unable to load assignment details", cause); }
}

export async function createSubmissionUploadUrl(request, response, next) {
  const assignmentId = uuidSchema.safeParse(request.params.assignmentId);
  const values = uploadSchema.safeParse(request.body);
  if (!assignmentId.success || !values.success) return sendValidationError(response, values.success ? assignmentId : values);
  const validation = validateSubmissionFile(values.data.fileName, values.data.mimeType, values.data.fileSize);
  if (!validation.valid) return response.status(400).json({ success: false, message: validation.message });
  try {
    const access = await getStudentAssignment(assignmentId.data, request.auth.user.id);
    if (!access.assignment) return response.status(access.status).json({ success: false, message: access.message });
    if (access.course.status === "archived") return response.status(409).json({ success: false, message: "This archived course is read-only and submissions can no longer be changed." });
    const result = await getEditableStudentSubmission(assignmentId.data, request.auth.user.id, true);
    if (!result.submission) return response.status(result.status).json({ success: false, message: result.message });
    if (await countAttachments(result.submission.id, "image") + await countAttachments(result.submission.id, "document") + await countAttachments(result.submission.id, "video") >= MAX_SUBMISSION_FILES) return response.status(400).json({ success: false, message: "You can upload up to five files." });
    const storagePath = `${request.auth.user.id}/${assignmentId.data}/${result.submission.id}/${randomUUID()}-${sanitizeSubmissionFileName(values.data.fileName)}`;
    const { data, error } = await supabase.storage.from(ASSIGNMENT_SUBMISSION_BUCKET).createSignedUploadUrl(storagePath);
    if (error) throw error;
    return response.status(201).json({ success: true, data: { submissionId: result.submission.id, storagePath, token: data.token, signedUrl: data.signedUrl } });
  } catch (cause) { return sendUnexpected(next, "Unable to prepare submission upload", cause); }
}

export async function confirmSubmissionAttachment(request, response, next) {
  const assignmentId = uuidSchema.safeParse(request.params.assignmentId);
  const values = attachmentSchema.safeParse(request.body);
  if (!assignmentId.success || !values.success) return sendValidationError(response, values.success ? assignmentId : values);
  const validation = validateSubmissionFile(values.data.fileName, values.data.mimeType, values.data.fileSize);
  if (!validation.valid) return response.status(400).json({ success: false, message: validation.message });
  try {
    const access = await getAttachmentContext(assignmentId.data, values.data.submissionId, request.auth.user.id);
    if (!access.submission) return response.status(access.status).json({ success: false, message: access.message });
    if (!isOwnedStoragePath(values.data.storagePath, request.auth.user.id, assignmentId.data, values.data.submissionId)) return response.status(400).json({ success: false, message: "Invalid submission storage path." });
    const totalFiles = await countAttachments(values.data.submissionId, "image") + await countAttachments(values.data.submissionId, "document") + await countAttachments(values.data.submissionId, "video");
    if (totalFiles >= MAX_SUBMISSION_FILES) return response.status(400).json({ success: false, message: "You can upload up to five files." });
    const record = { submission_id: values.data.submissionId, student_id: request.auth.user.id, assignment_id: assignmentId.data, type: validation.type, file_name: sanitizeSubmissionFileName(values.data.fileName), storage_path: values.data.storagePath, mime_type: values.data.mimeType, file_size: values.data.fileSize };
    const { data, error } = await supabase.from("submission_attachments").insert(record).select(`${submissionAttachmentFields},storage_path`).single();
    if (error) {
      await supabase.storage.from(ASSIGNMENT_SUBMISSION_BUCKET).remove([values.data.storagePath]);
      throw error;
    }
    return response.status(201).json({ success: true, data: { attachment: publicAttachment(data), submission: access.submission } });
  } catch (cause) { return sendUnexpected(next, "Unable to save submission attachment", cause); }
}

export async function addSubmissionLink(request, response, next) {
  const assignmentId = uuidSchema.safeParse(request.params.assignmentId);
  const values = linkSchema.safeParse(request.body);
  if (!assignmentId.success || !values.success) return sendValidationError(response, values.success ? assignmentId : values);
  const validation = validateSubmissionLink(values.data.url);
  if (!validation.valid) return response.status(400).json({ success: false, message: validation.message });
  try {
    const access = await getAttachmentContext(assignmentId.data, values.data.submissionId, request.auth.user.id);
    if (!access.submission) return response.status(access.status).json({ success: false, message: access.message });
    if (await countAttachments(values.data.submissionId, "link") >= MAX_SUBMISSION_LINKS) return response.status(400).json({ success: false, message: "You can add up to five links." });
    const { data, error } = await supabase.from("submission_attachments").insert({ submission_id: values.data.submissionId, student_id: request.auth.user.id, assignment_id: assignmentId.data, type: "link", external_url: validation.url }).select(submissionAttachmentFields).single();
    if (error) throw error;
    return response.status(201).json({ success: true, data: { attachment: publicAttachment(data), submission: access.submission } });
  } catch (cause) { return sendUnexpected(next, "Unable to save submission link", cause); }
}

export async function removeSubmissionAttachment(request, response, next) {
  const assignmentId = uuidSchema.safeParse(request.params.assignmentId);
  const attachmentId = uuidSchema.safeParse(request.params.attachmentId);
  if (!assignmentId.success || !attachmentId.success) return sendValidationError(response, assignmentId.success ? attachmentId : assignmentId);
  try {
    const { data: attachment, error } = await supabase.from("submission_attachments").select(`${submissionAttachmentFields},storage_path`).eq("id", attachmentId.data).eq("assignment_id", assignmentId.data).eq("student_id", request.auth.user.id).maybeSingle();
    if (error) throw error;
    if (!attachment) return response.status(404).json({ success: false, message: "Attachment not found." });
    const access = await getAttachmentContext(assignmentId.data, attachment.submission_id, request.auth.user.id);
    if (!access.submission) return response.status(access.status).json({ success: false, message: access.message });
    if (attachment.storage_path) {
      const { error: storageError } = await supabase.storage.from(ASSIGNMENT_SUBMISSION_BUCKET).remove([attachment.storage_path]);
      if (storageError) throw storageError;
    }
    const { error: deleteError } = await supabase.from("submission_attachments").delete().eq("id", attachment.id);
    if (deleteError) throw deleteError;
    return response.json({ success: true, message: "Attachment removed." });
  } catch (cause) { return sendUnexpected(next, "Unable to remove submission attachment", cause); }
}

export async function cleanupSubmissionUpload(request, response, next) {
  const assignmentId = uuidSchema.safeParse(request.params.assignmentId);
  const values = removeUploadSchema.safeParse(request.body);
  if (!assignmentId.success || !values.success) return sendValidationError(response, values.success ? assignmentId : values);
  try {
    const access = await getAttachmentContext(assignmentId.data, values.data.submissionId, request.auth.user.id);
    if (!access.submission) return response.status(access.status).json({ success: false, message: access.message });
    if (!isOwnedStoragePath(values.data.storagePath, request.auth.user.id, assignmentId.data, values.data.submissionId)) return response.status(400).json({ success: false, message: "Invalid submission storage path." });
    const { error } = await supabase.storage.from(ASSIGNMENT_SUBMISSION_BUCKET).remove([values.data.storagePath]);
    if (error) throw error;
    return response.json({ success: true, message: "Upload cleaned up." });
  } catch (cause) { return sendUnexpected(next, "Unable to clean up upload", cause); }
}

export async function studentSubmissionAttachmentAccess(request, response, next) {
  const assignmentId = uuidSchema.safeParse(request.params.assignmentId);
  const attachmentId = uuidSchema.safeParse(request.params.attachmentId);
  if (!assignmentId.success || !attachmentId.success) return sendValidationError(response, assignmentId.success ? attachmentId : assignmentId);
  try {
    const { data: attachment, error } = await supabase.from("submission_attachments").select("id,submission_id,storage_path,external_url").eq("id", attachmentId.data).eq("assignment_id", assignmentId.data).eq("student_id", request.auth.user.id).maybeSingle();
    if (error) throw error;
    if (!attachment) return response.status(404).json({ success: false, message: "Attachment not found." });
    if (attachment.external_url) return response.json({ success: true, data: { url: attachment.external_url, expiresIn: null } });
    const { data, error: signedError } = await supabase.storage.from(ASSIGNMENT_SUBMISSION_BUCKET).createSignedUrl(attachment.storage_path, SUBMISSION_SIGNED_URL_SECONDS);
    if (signedError) throw signedError;
    return response.json({ success: true, data: { url: data.signedUrl, expiresIn: SUBMISSION_SIGNED_URL_SECONDS } });
  } catch (cause) { return sendUnexpected(next, "Unable to open submission attachment", cause); }
}

async function getTeacherAttachment(attachmentId, submissionId, teacherId) {
  const { data: attachment, error } = await supabase.from("submission_attachments").select("id,submission_id,assignment_id,storage_path,external_url").eq("id", attachmentId).eq("submission_id", submissionId).maybeSingle();
  if (error) throw error;
  if (!attachment) return { status: 404, message: "Attachment not found." };
  const { data: submission, error: submissionError } = await supabase.from("submissions").select("id,assignment_id,assignments(course_id,courses(teacher_id))").eq("id", submissionId).maybeSingle();
  if (submissionError) throw submissionError;
  if (!submission) return { status: 404, message: "Submission not found." };
  if (submission.assignments?.courses?.teacher_id !== teacherId) return { status: 403, message: "You can only access submissions from your courses." };
  return { attachment };
}

export async function teacherSubmissionAttachmentAccess(request, response, next) {
  const submissionId = uuidSchema.safeParse(request.params.submissionId);
  const attachmentId = uuidSchema.safeParse(request.params.attachmentId);
  if (!submissionId.success || !attachmentId.success) return sendValidationError(response, submissionId.success ? attachmentId : submissionId);
  try {
    const access = await getTeacherAttachment(attachmentId.data, submissionId.data, request.auth.user.id);
    if (!access.attachment) return response.status(access.status).json({ success: false, message: access.message });
    if (access.attachment.external_url) return response.json({ success: true, data: { url: access.attachment.external_url, expiresIn: null } });
    const { data, error } = await supabase.storage.from(ASSIGNMENT_SUBMISSION_BUCKET).createSignedUrl(access.attachment.storage_path, SUBMISSION_SIGNED_URL_SECONDS);
    if (error) throw error;
    return response.json({ success: true, data: { url: data.signedUrl, expiresIn: SUBMISSION_SIGNED_URL_SECONDS } });
  } catch (cause) { return sendUnexpected(next, "Unable to open student attachment", cause); }
}
