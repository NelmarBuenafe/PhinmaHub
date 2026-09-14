import { supabase } from "../config/supabase.js";
import { resolveProfileAvatar } from "../controllers/profileAvatarController.js";
import { isGoogleUser, isInstitutionalEmail } from "../utils/auth.js";

function getBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== "string") return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function authenticateIdentity(request, response, next) {
  const accessToken = getBearerToken(request.headers.authorization);

  if (!accessToken) {
    return response.status(401).json({
      success: false,
      code: "AUTH_REQUIRED",
      message: "Authentication is required.",
    });
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return response.status(401).json({
        success: false,
        code: "INVALID_SESSION",
        message: "Your session is invalid or has expired.",
      });
    }

    if (!isInstitutionalEmail(user.email)) {
      return response.status(403).json({
        success: false,
        code: "INVALID_DOMAIN",
        message: "Please use your assigned PHINMA school email address.",
      });
    }

    request.auth = { accessToken, user };
    return next();
  } catch (cause) {
    const error = new Error("Authentication service unavailable", { cause });
    error.statusCode = 500;
    return next(error);
  }
}

export function requireGoogleIdentity(request, response, next) {
  if (!isGoogleUser(request.auth?.user)) {
    return response.status(403).json({
      success: false,
      code: "INVALID_PROVIDER",
      message: "Please continue with an approved Google account.",
    });
  }

  if (!request.auth.user.email_confirmed_at) {
    return response.status(403).json({
      success: false,
      code: "EMAIL_NOT_VERIFIED",
      message: "Your PHINMA email address must be verified.",
    });
  }
  return next();
}

export async function loadProfile(request, response, next) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, email, first_name, middle_name, last_name, avatar_url, school_id, requested_role, approved_role, account_status",
      )
      .eq("id", request.auth.user.id)
      .maybeSingle();

    if (profileError) {
      const error = new Error("Unable to load the user profile", {
        cause: profileError,
      });
      error.statusCode = 500;
      return next(error);
    }

    if (!profile) {
      return response.status(403).json({
        success: false,
        code: "PROFILE_MISSING",
        message:
          "Your account profile is not available. Please contact an administrator.",
      });
    }

    request.auth.profile = await resolveProfileAvatar(profile);
    return next();
  } catch (cause) {
    const error = new Error("Unable to load the user profile", { cause });
    error.statusCode = 500;
    return next(error);
  }
}

export const authenticate = [authenticateIdentity, loadProfile];
