import { z } from "zod";
import { supabase } from "../config/supabase.js";
import {
  CAPTCHA_COOKIE_NAME,
  captchaClearCookieOptions,
} from "../utils/captcha.js";
import { getRegistrationActivationError } from "../utils/auth.js";

const cleanText = (label, maximumLength) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(maximumLength, `${label} is too long.`)
    .transform((value) => value.replace(/[\u0000-\u001F\u007F]/g, ""))
    .refine((value) => value.length > 0, `${label} is required.`);

export const studentRegistrationSchema = z
  .object({
    studentId: cleanText("Student ID", 50).refine(
      (value) => /^[A-Za-z0-9-]+$/.test(value),
      "Student ID may contain only letters, numbers and hyphens.",
    ),
    campus: cleanText("Campus", 120),
    program: cleanText("Program", 160),
    yearLevel: cleanText("Year level", 40),
    section: cleanText("Section", 80),
  })
  .strict();

export const teacherRegistrationSchema = z
  .object({
    employeeId: cleanText("Employee ID", 50).refine(
      (value) => /^[A-Za-z0-9-]+$/.test(value),
      "Employee ID may contain only letters, numbers and hyphens.",
    ),
    campus: cleanText("Campus", 120),
    department: cleanText("Department", 160),
    position: cleanText("Position", 120).optional().or(z.literal("")),
  })
  .strict();

function invalidRegistrationResponse(response, parsedBody) {
  return response.status(400).json({
    success: false,
    code: "INVALID_REGISTRATION",
    message:
      parsedBody.error.issues[0]?.message ||
      "Check the registration form and try again.",
  });
}

function validateActivation(profile, user, role, response) {
  const problem = getRegistrationActivationError(
    profile,
    role,
    Boolean(user.email_confirmed_at),
  );
  if (!problem) return true;

  const messages = {
    EMAIL_NOT_VERIFIED: "Verify your school email before activating your account.",
    INVALID_ROLE: "Only Student and Teacher registrations can be activated.",
    ACCOUNT_BLOCKED: "This account cannot be activated. Contact an administrator.",
    ROLE_CONFLICT: "This account is already registered for another role.",
  };
  response.status(problem === "EMAIL_NOT_VERIFIED" ? 403 : 409).json({
    success: false,
    code: problem,
    message: messages[problem],
  });
  return false;
}

async function activateProfile(userId, role) {
  return supabase
    .from("profiles")
    .update({
      requested_role: role,
      approved_role: role,
      account_status: "active",
    })
    .eq("id", userId)
    .select(
      "id, email, first_name, middle_name, last_name, avatar_url, requested_role, approved_role, account_status",
    )
    .single();
}

async function auditActivation(userId, role, source) {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: userId,
    action: `${role}_self_registration_activated`,
    entity_type: "profile",
    entity_id: userId,
    metadata: { approved_role: role, source },
  });

  if (error && process.env.NODE_ENV !== "test") {
    console.error("Unable to record registration activation", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }
}

export async function saveStudentProfile(userId, details) {
  const { studentId, campus, program, yearLevel, section } = details;
  return supabase.from("student_profiles").upsert(
    {
      user_id: userId,
      student_id: studentId,
      campus,
      program,
      year_level: yearLevel,
      section,
    },
    { onConflict: "user_id" },
  );
}

export async function saveTeacherProfile(userId, details) {
  const { employeeId, campus, department, position } = details;
  return supabase.from("teacher_profiles").upsert(
    {
      user_id: userId,
      employee_id: employeeId,
      campus,
      department,
      position: position || null,
    },
    { onConflict: "user_id" },
  );
}

async function completeRegistration(request, response, next, role, details) {
  if (
    !validateActivation(
      request.auth.profile,
      request.auth.user,
      role,
      response,
    )
  ) {
    return undefined;
  }

  if (
    request.auth.profile.account_status === "active" &&
    request.auth.profile.approved_role === role
  ) {
    return response.json({
      success: true,
      profile: request.auth.profile,
      destination: `/${role}`,
      message: "Registration is already active.",
    });
  }

  const { error: roleProfileError } =
    role === "student"
      ? await saveStudentProfile(request.auth.user.id, details)
      : await saveTeacherProfile(request.auth.user.id, details);

  if (roleProfileError) {
    const duplicateId = roleProfileError.code === "23505";
    const error = new Error(
      duplicateId
        ? `That ${role === "student" ? "Student" : "Employee"} ID is already registered.`
        : `Unable to save the ${role} registration`,
      { cause: roleProfileError },
    );
    error.statusCode = duplicateId ? 409 : 500;
    return next(error);
  }

  const { data: profile, error: profileError } = await activateProfile(
    request.auth.user.id,
    role,
  );
  if (profileError) {
    const error = new Error("Unable to activate the registration", {
      cause: profileError,
    });
    error.statusCode = 500;
    return next(error);
  }

  await auditActivation(request.auth.user.id, role, "email_verification");
  response.clearCookie(CAPTCHA_COOKIE_NAME, captchaClearCookieOptions());
  return response.json({
    success: true,
    profile,
    destination: `/${role}`,
    message: "Your verified school account is now active.",
  });
}

export async function registerStudent(request, response, next) {
  const parsedBody = studentRegistrationSchema.safeParse(request.body);
  if (!parsedBody.success)
    return invalidRegistrationResponse(response, parsedBody);
  return completeRegistration(
    request,
    response,
    next,
    "student",
    parsedBody.data,
  );
}

export async function registerTeacher(request, response, next) {
  const parsedBody = teacherRegistrationSchema.safeParse(request.body);
  if (!parsedBody.success)
    return invalidRegistrationResponse(response, parsedBody);
  return completeRegistration(
    request,
    response,
    next,
    "teacher",
    parsedBody.data,
  );
}

export async function activateRegistration(request, response, next) {
  const role = request.auth.profile.requested_role;
  if (!["student", "teacher"].includes(role)) {
    return response.status(400).json({
      success: false,
      code: "REGISTRATION_DETAILS_REQUIRED",
      message: "Complete your Student or Teacher registration first.",
    });
  }

  if (
    request.auth.profile.account_status === "active" &&
    request.auth.profile.approved_role === role
  ) {
    return response.json({
      success: true,
      profile: request.auth.profile,
      destination: `/${role}`,
      message: "Registration is already active.",
    });
  }

  const table = role === "student" ? "student_profiles" : "teacher_profiles";
  const fields =
    role === "student"
      ? "student_id,campus,program,year_level,section"
      : "employee_id,campus,department,position";
  const { data: storedDetails, error: storedDetailsError } = await supabase
    .from(table)
    .select(fields)
    .eq("user_id", request.auth.user.id)
    .maybeSingle();
  if (storedDetailsError) {
    const error = new Error("Unable to load the registration details", {
      cause: storedDetailsError,
    });
    error.statusCode = 500;
    return next(error);
  }

  const rawDetails = storedDetails
    ? role === "student"
      ? {
          studentId: storedDetails.student_id,
          campus: storedDetails.campus,
          program: storedDetails.program,
          yearLevel: storedDetails.year_level,
          section: storedDetails.section,
        }
      : {
          employeeId: storedDetails.employee_id,
          campus: storedDetails.campus,
          department: storedDetails.department,
          position: storedDetails.position || "",
        }
    : request.auth.user.user_metadata?.registration_details;
  const schema =
    role === "student" ? studentRegistrationSchema : teacherRegistrationSchema;
  const parsedDetails = schema.safeParse(rawDetails);
  if (!parsedDetails.success) {
    return response.status(400).json({
      success: false,
      code: "REGISTRATION_DETAILS_REQUIRED",
      message: "Your registration details must be completed again.",
    });
  }

  return completeRegistration(
    request,
    response,
    next,
    role,
    parsedDetails.data,
  );
}
