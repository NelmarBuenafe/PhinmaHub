export const MAX_LESSON_MATERIAL_BYTES = 10 * 1024 * 1024;
export const MAX_LESSON_VIDEO_BYTES = 100 * 1024 * 1024;
export const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx";
export const VIDEO_ACCEPT = "video/mp4,video/webm,.mp4,.webm";

const DOCUMENT_MIME_TYPES = new Map([
  ["pdf", ["application/pdf"]],
  ["doc", ["application/msword", "application/octet-stream"]],
  ["docx", ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"]],
  ["ppt", ["application/vnd.ms-powerpoint", "application/octet-stream"]],
  ["pptx", ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/octet-stream"]],
]);

// Keep client-side selection feedback aligned with the upload URL endpoint.
// The endpoint repeats this validation before issuing an upload URL.
export function validateLessonMaterialFile(file) {
  const extension = file?.name?.split(".").pop()?.toLowerCase();
  const supportedMimes = DOCUMENT_MIME_TYPES.get(extension);
  const mimeType = (file?.type || "application/octet-stream").toLowerCase();

  if (!supportedMimes || !supportedMimes.includes(mimeType)) {
    return "This file type is not supported.";
  }
  if (file.size > MAX_LESSON_MATERIAL_BYTES) {
    return "File size must not exceed 10 MB.";
  }
  return null;
}

export function validateLessonVideoFile(file) {
  const extension = file?.name?.split(".").pop()?.toLowerCase();
  const mimeType = (file?.type || "").toLowerCase();
  if (!(["mp4", "webm"].includes(extension) && (!mimeType || ["video/mp4", "video/webm"].includes(mimeType)))) {
    return "Please upload an MP4 or WebM video file.";
  }
  if (file.size > MAX_LESSON_VIDEO_BYTES) return "Video size must not exceed 100 MB.";
  return null;
}
