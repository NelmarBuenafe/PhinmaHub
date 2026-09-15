import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { getProfileDestination, isInstitutionalEmail } from "../utils/auth.js";

const googleResultSchema = z
  .object({
    flow: z.enum(["login", "register"]),
    selectedRole: z.enum(["admin", "student", "teacher"]),
  })
  .strict()
  .refine(
    ({ flow, selectedRole }) => flow !== "register" || selectedRole !== "admin",
  );

function roleLabel(role) {
  return `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
}

function roleMismatch(response, existingRole) {
  return response.status(409).json({
    success: false,
    code: "ROLE_MISMATCH",
    message: `This account is already registered as a ${roleLabel(existingRole)}.`,
    approvedRole: existingRole,
  });
}

function fail(next, message, cause) {
  const error = new Error(message, { cause });
  error.statusCode = 500;
  return next(error);
}

async function ensureRoleProfile(userId, role) {
  const table = role === "student" ? "student_profiles" : "teacher_profiles";
  return supabase
    .from(table)
    .upsert(
      { user_id: userId },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
}

async function recordGoogleActivation(userId, role) {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: userId,
    action: `${role}_institutional_account_activated`,
    entity_type: "profile",
    entity_id: userId,
    metadata: { role, source: "google_oauth" },
  });

  if (error && process.env.NODE_ENV !== "test") {
    console.error("Unable to record institutional account activation", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }
}

export async function finalizeGoogleAuthentication(request, response, next) {
  const parsedBody = googleResultSchema.safeParse(request.body);
  if (!parsedBody.success) {
    return response.status(400).json({
      success: false,
      code: "INVALID_AUTH_FLOW",
      message: "The authentication flow is invalid. Please start again.",
    });
  }

  const { selectedRole } = parsedBody.data;
  const { profile } = request.auth;

  if (selectedRole === "admin") {
    if (
      profile.approved_role !== "admin" ||
      profile.account_status !== "active"
    ) {
      return response.status(403).json({
        success: false,
        code: "ACCESS_DENIED",
        message: "This account is not an active administrator.",
      });
    }

    return response.json({
      success: true,
      profile,
      destination: "/admin",
      approvedRole: "admin",
      roleMismatch: false,
    });
  }

  const institutional = isInstitutionalEmail(request.auth.user.email);
  if (!institutional) {
    return response.status(403).json({
      success: false,
      code: "INVALID_DOMAIN",
      message: "Please use your assigned PHINMA school email address.",
    });
  }

  const existingRole = profile.approved_role || profile.requested_role;
  if (existingRole && existingRole !== selectedRole) {
    return roleMismatch(response, existingRole);
  }

  if (["rejected", "suspended"].includes(profile.account_status)) {
    return response.status(403).json({
      success: false,
      code: profile.account_status.toUpperCase(),
      message:
        profile.account_status === "rejected"
          ? "Your account application was rejected."
          : "Your account is currently suspended.",
    });
  }

  if (
    profile.account_status === "active" &&
    profile.approved_role === selectedRole
  ) {
    return response.json({
      success: true,
      profile,
      destination: `/${selectedRole}`,
      approvedRole: selectedRole,
      roleMismatch: false,
      institutional: true,
    });
  }

  const { error: roleProfileError } = await ensureRoleProfile(
    request.auth.user.id,
    selectedRole,
  );
  if (roleProfileError) {
    return fail(
      next,
      `Unable to prepare the ${selectedRole} profile`,
      roleProfileError,
    );
  }

  const updates = {
    requested_role: selectedRole,
    approved_role: selectedRole,
    account_status: "active",
  };

  const { data: updatedProfile, error: profileError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", request.auth.user.id)
    .select(
      "id,email,first_name,middle_name,last_name,avatar_url,school_id,requested_role,approved_role,account_status",
    )
    .single();

  if (profileError) {
    return fail(next, "Unable to complete Google authentication", profileError);
  }

  if (profile.account_status !== "active") {
    await recordGoogleActivation(request.auth.user.id, selectedRole);
  }

  return response.json({
    success: true,
    profile: updatedProfile,
    destination: getProfileDestination(updatedProfile),
    approvedRole: updatedProfile.approved_role,
    roleMismatch: false,
    institutional: true,
  });
}
