import { randomUUID } from "node:crypto";
import { z } from "zod";
import { supabase } from "../config/supabase.js";

export const PROFILE_AVATAR_BUCKET = "profile-avatars";
export const MAX_PROFILE_AVATAR_BYTES = 2 * 1024 * 1024;
const SIGNED_URL_SECONDS = 60 * 60;

async function ensureProfileAvatarBucket() {
  const storage = supabase.storage;
  const { data: bucket, error: lookupError } = await storage.getBucket(PROFILE_AVATAR_BUCKET);
  if (bucket && !lookupError) return;
  // This makes local/staging deployments self-healing when phase8 SQL has not
  // been applied yet. Production should still run the migration explicitly.
  const { error: createError } = await storage.createBucket(PROFILE_AVATAR_BUCKET, {
    public: false,
    fileSizeLimit: `${MAX_PROFILE_AVATAR_BYTES}`,
  });
  if (createError && !/already exists|duplicate/i.test(createError.message || "")) throw createError;
}

const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  fileSize: z.coerce.number().int().positive(),
}).strict();

const saveAvatarSchema = z.object({
  storagePath: z.string().trim().min(1).max(600),
}).strict();

const allowedImages = new Map([
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
]);

function sendValidationError(response, parsed) {
  return response.status(400).json({
    success: false,
    message: parsed.error.issues[0]?.message || "Invalid profile photo information.",
  });
}

function sendUnexpected(next, message, cause) {
  const error = new Error(message, { cause });
  error.statusCode = cause?.statusCode || cause?.status;
  return next(error);
}

function profileFields() {
  return "id,email,first_name,middle_name,last_name,avatar_url,school_id,requested_role,approved_role,account_status";
}

function activeProfile(request, response) {
  if (request.auth.profile?.account_status === "active") return true;
  response.status(403).json({ success: false, message: "Your account cannot update a profile photo." });
  return false;
}

export function validateProfileAvatar(fileName, mimeType, fileSize) {
  const extension = String(fileName || "").split(".").pop()?.toLowerCase();
  const expectedMime = allowedImages.get(extension);
  const normalizedMime = String(mimeType || "").toLowerCase();

  if (!expectedMime || expectedMime !== normalizedMime) {
    return { valid: false, message: "Please upload a JPEG, PNG, or WEBP image." };
  }
  if (!Number.isInteger(Number(fileSize)) || Number(fileSize) <= 0) {
    return { valid: false, message: "Profile photo size must be valid." };
  }
  if (Number(fileSize) > MAX_PROFILE_AVATAR_BYTES) {
    return { valid: false, message: "Profile photo must be smaller than 2 MB." };
  }
  return { valid: true, extension };
}

export function isOwnedAvatarPath(path, userId) {
  return typeof path === "string"
    && path.startsWith(`${userId}/`)
    && new RegExp(`^${userId}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$`, "i").test(path);
}

export function validateProfileAvatarBytes(bytes, path, mimeType) {
  const validation = validateProfileAvatar(path, mimeType, bytes.byteLength);
  if (!validation.valid) return validation;
  const matches = (offset, signature) => signature.every((value, index) => bytes[offset + index] === value);
  const signatures = {
    jpg: matches(0, [0xff, 0xd8, 0xff]),
    jpeg: matches(0, [0xff, 0xd8, 0xff]),
    png: matches(0, [137, 80, 78, 71, 13, 10, 26, 10]),
    webp: matches(0, [82, 73, 70, 70]) && matches(8, [87, 69, 66, 80]),
  };
  return signatures[validation.extension]
    ? validation
    : { valid: false, message: "Please upload a valid JPEG, PNG, or WEBP image." };
}

export async function resolveProfileAvatar(profile) {
  if (!profile?.avatar_url || !isOwnedAvatarPath(profile.avatar_url, profile.id)) return profile;

  const { data, error } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .createSignedUrl(profile.avatar_url, SIGNED_URL_SECONDS);

  if (error || !data?.signedUrl) return { ...profile, avatar_url: null };
  return { ...profile, avatar_url: data.signedUrl };
}

export async function createProfileAvatarUploadUrl(request, response, next) {
  const values = uploadRequestSchema.safeParse(request.body);
  if (!values.success) return sendValidationError(response, values);
  if (!activeProfile(request, response)) return undefined;

  const validation = validateProfileAvatar(values.data.fileName, values.data.mimeType, values.data.fileSize);
  if (!validation.valid) return response.status(400).json({ success: false, message: validation.message });

  try {
    await ensureProfileAvatarBucket();
    const storagePath = `${request.auth.user.id}/${randomUUID()}.${validation.extension}`;
    const { data, error } = await supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .createSignedUploadUrl(storagePath);
    if (error) throw error;
    return response.status(201).json({ success: true, data: { storagePath, token: data.token } });
  } catch (cause) {
    return sendUnexpected(next, "Unable to prepare profile photo upload", cause);
  }
}

export async function saveProfileAvatar(request, response, next) {
  const values = saveAvatarSchema.safeParse(request.body);
  if (!values.success) return sendValidationError(response, values);
  if (!activeProfile(request, response)) return undefined;
  if (!isOwnedAvatarPath(values.data.storagePath, request.auth.user.id)) {
    return response.status(400).json({ success: false, message: "Invalid profile photo upload." });
  }

  try {
    const { data: uploaded, error: downloadError } = await supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .download(values.data.storagePath);
    if (downloadError || !uploaded) {
      return response.status(400).json({ success: false, message: "Profile photo upload was not found. Please try again." });
    }
    const validation = validateProfileAvatarBytes(
      new Uint8Array(await uploaded.arrayBuffer()), values.data.storagePath, uploaded.type,
    );
    if (!validation.valid) {
      return response.status(400).json({ success: false, message: validation.message });
    }
    const { data: current, error: currentError } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", request.auth.user.id)
      .single();
    if (currentError) throw currentError;

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: values.data.storagePath })
      .eq("id", request.auth.user.id)
      .select(profileFields())
      .single();
    if (updateError) {
      await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([values.data.storagePath]);
      throw updateError;
    }

    if (isOwnedAvatarPath(current?.avatar_url, request.auth.user.id)
      && current.avatar_url !== values.data.storagePath) {
      const { error: removeError } = await supabase.storage
        .from(PROFILE_AVATAR_BUCKET)
        .remove([current.avatar_url]);
      if (removeError) console.error("Unable to remove replaced profile photo", removeError.message);
    }

    return response.json({ success: true, data: { profile: await resolveProfileAvatar(updated) } });
  } catch (cause) {
    return sendUnexpected(next, "Unable to update profile photo", cause);
  }
}

export async function discardProfileAvatarUpload(request, response, next) {
  const values = saveAvatarSchema.safeParse(request.body);
  if (!values.success) return sendValidationError(response, values);
  if (!activeProfile(request, response)) return undefined;
  if (!isOwnedAvatarPath(values.data.storagePath, request.auth.user.id)) {
    return response.status(400).json({ success: false, message: "Invalid profile photo upload." });
  }

  try {
    const { data: current, error: currentError } = await supabase
      .from("profiles").select("avatar_url").eq("id", request.auth.user.id).single();
    if (currentError) throw currentError;
    if (current?.avatar_url === values.data.storagePath) {
      return response.status(409).json({ success: false, message: "This photo is currently in use. Use Remove Photo instead." });
    }
    const { error } = await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([values.data.storagePath]);
    if (error) throw error;
    return response.json({ success: true, message: "Profile photo upload removed." });
  } catch (cause) {
    return sendUnexpected(next, "Unable to clean up profile photo upload", cause);
  }
}

export async function removeProfileAvatar(request, response, next) {
  if (!activeProfile(request, response)) return undefined;

  try {
    const { data: current, error: currentError } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", request.auth.user.id)
      .single();
    if (currentError) throw currentError;

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", request.auth.user.id)
      .select(profileFields())
      .single();
    if (updateError) throw updateError;

    if (isOwnedAvatarPath(current?.avatar_url, request.auth.user.id)) {
      const { error: removeError } = await supabase.storage
        .from(PROFILE_AVATAR_BUCKET)
        .remove([current.avatar_url]);
      if (removeError) console.error("Unable to remove profile photo", removeError.message);
    }

    return response.json({ success: true, data: { profile: updated } });
  } catch (cause) {
    return sendUnexpected(next, "Unable to remove profile photo", cause);
  }
}
