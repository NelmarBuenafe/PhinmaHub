import { z } from "zod";
import { supabase } from "../config/supabase.js";
import {
  CAPTCHA_COOKIE_NAME,
  captchaClearCookieOptions,
  captchaCookieOptions,
  createCaptchaChallenge,
  createCaptchaVerificationToken,
  verifyCaptchaChallenge,
} from "../utils/captcha.js";
import {
  getAuthenticationResult,
  getProfileDestination,
  isInstitutionalEmail,
} from "../utils/auth.js";

const validationSchema = z
  .object({
    flow: z.enum(["login", "register"]),
    selectedRole: z.enum(["admin", "student", "teacher"]),
  })
  .refine(
    ({ flow, selectedRole }) => flow !== "register" || selectedRole !== "admin",
  );

const emailCheckSchema = z
  .object({ email: z.string().trim().email() })
  .strict();

function roleLabel(role) {
  return `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
}

export async function checkRegistrationEmail(request, response, next) {
  const parsedBody = emailCheckSchema.safeParse(request.body);
  if (
    !parsedBody.success ||
    !isInstitutionalEmail(parsedBody.data?.email)
  ) {
    return response.status(400).json({
      success: false,
      code: "INVALID_DOMAIN",
      message: "Please use your assigned PHINMA school email address.",
    });
  }

  const email = parsedBody.data.email.toLowerCase();
  const { data: existingProfile, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) {
    const error = new Error("Unable to check the school email", {
      cause: lookupError,
    });
    error.statusCode = 500;
    return next(error);
  }
  if (existingProfile) {
    return response.status(409).json({
      success: false,
      code: "EMAIL_ALREADY_REGISTERED",
      message: "This school email is already registered. Please sign in instead.",
    });
  }
  return response
    .status(200)
    .json({ success: true, message: "School email address verified." });
}

export function getCaptcha(_request, response) {
  // This simple challenge satisfies the school-project requirement. For a
  // production deployment, prefer a managed anti-bot service such as Turnstile.
  const challenge = createCaptchaChallenge(process.env.CAPTCHA_SECRET);
  response.set("Cache-Control", "no-store");
  response.status(200).json({ success: true, ...challenge });
}

export function verifyCaptcha(request, response) {
  const result = verifyCaptchaChallenge({
    token: request.body?.token,
    answer: request.body?.answer,
    secret: process.env.CAPTCHA_SECRET,
  });

  if (!result.valid) {
    return response.status(400).json({
      success: false,
      code:
        result.reason === "expired" ? "CAPTCHA_EXPIRED" : "CAPTCHA_INCORRECT",
      message:
        result.reason === "expired"
          ? "The CAPTCHA expired. Please try a new one."
          : "The CAPTCHA answer is incorrect.",
    });
  }

  response.cookie(
    CAPTCHA_COOKIE_NAME,
    createCaptchaVerificationToken(process.env.CAPTCHA_SECRET),
    captchaCookieOptions(),
  );

  return response.status(200).json({
    success: true,
    message: "CAPTCHA verified.",
  });
}

function authenticationResponse(request, response) {
  return response.status(200).json({
    success: true,
    user: {
      id: request.auth.user.id,
      email: request.auth.user.email,
    },
    profile: request.auth.profile,
    destination: getProfileDestination(request.auth.profile),
  });
}

export function validateOAuthIdentity(request, response) {
  return response.status(200).json({
    success: true,
    user: {
      id: request.auth.user.id,
      email: request.auth.user.email,
      fullName:
        request.auth.user.user_metadata?.full_name ||
        request.auth.user.user_metadata?.name ||
        "",
      avatarUrl:
        request.auth.user.user_metadata?.avatar_url ||
        request.auth.user.user_metadata?.picture ||
        null,
    },
  });
}

export function validateAuthentication(request, response) {
  const parsedBody = validationSchema.safeParse(request.body);

  if (!parsedBody.success) {
    return response.status(400).json({
      success: false,
      code: "INVALID_AUTH_FLOW",
      message: "The authentication flow is invalid. Please start again.",
    });
  }

  const { flow, selectedRole } = parsedBody.data;
  const { profile } = request.auth;

  if (profile.account_status === "rejected") {
    return response.status(403).json({
      success: false,
      code: "ACCOUNT_REJECTED",
      message: "Your account application was rejected.",
    });
  }

  if (profile.account_status === "suspended") {
    return response.status(403).json({
      success: false,
      code: "ACCOUNT_SUSPENDED",
      message: "Your account is currently suspended.",
    });
  }
  const { destination, roleMismatch } = getAuthenticationResult(profile, {
    flow,
    selectedRole,
  });

  if (roleMismatch) {
    response.clearCookie(CAPTCHA_COOKIE_NAME, captchaClearCookieOptions());
    return response.status(409).json({
      success: false,
      code: "ROLE_MISMATCH",
      message: `This account is registered as a ${roleLabel(profile.approved_role)}.`,
      approvedRole: profile.approved_role,
    });
  }

  if (flow === "login" || !destination.startsWith("/register/")) {
    response.clearCookie(CAPTCHA_COOKIE_NAME, captchaClearCookieOptions());
  }

  return response.status(200).json({
    success: true,
    user: {
      id: request.auth.user.id,
      email: request.auth.user.email,
    },
    profile,
    destination,
    roleMismatch: false,
    approvedRole: profile.approved_role,
  });
}

export function getCurrentUser(request, response) {
  return authenticationResponse(request, response);
}

export function logout(_request, response) {
  response.clearCookie(CAPTCHA_COOKIE_NAME, captchaClearCookieOptions());
  return response.status(200).json({ success: true, message: "Signed out." });
}
