import { z } from "zod";
import { supabase } from "../config/supabase.js";
import {
  saveStudentProfile,
  saveTeacherProfile,
  studentRegistrationSchema,
  teacherRegistrationSchema,
} from "./registrationController.js";
import { isInstitutionalEmail } from "../utils/auth.js";
import { createAnnouncementNotifications } from "../services/notificationService.js";
import {
  pageRange,
  paginationSchema,
  sendValidationError,
  uuidSchema,
} from "../utils/adminValidation.js";

const clean = (label, max = 5000) =>
  z.string().trim().min(1, `${label} is required.`).max(max);
const userStatusSchema = z
  .object({ status: z.enum(["active", "suspended"]) })
  .strict();
const courseStatusSchema = z
  .object({ status: z.enum(["draft", "published", "archived"]) })
  .strict();
const categorySchema = z
  .object({
    name: clean("Category name", 100),
    description: z.string().trim().max(500).optional(),
    color: z.string().trim().max(30).optional(),
    icon: z.string().trim().max(50).optional(),
    isActive: z.boolean().default(true),
  })
  .strict();
const announcementSchema = z
  .object({
    title: clean("Title", 160),
    message: clean("Message"),
    audience: z.enum(["all", "teachers", "students", "course"]),
    courseId: z.string().uuid().nullable().optional(),
    publishNow: z.boolean().default(false),
  })
  .strict();
const studyToolSchema = z
  .object({
    title: clean("Title", 160),
    description: z.string().trim().max(1000).optional(),
    toolType: clean("Tool type", 80),
    url: z.string().url().max(2000),
    isActive: z.boolean().default(true),
  })
  .strict();
const messageStatusSchema = z
  .object({ status: z.enum(["new", "in_progress", "resolved", "spam"]) })
  .strict();
const invitationSchema = z
  .object({
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    firstName: clean("First name", 100),
    middleName: z.string().trim().max(100).optional(),
    lastName: clean("Last name", 100),
    role: z.enum(["student", "teacher"]),
    details: z.unknown(),
  })
  .strict();

function fail(next, message, statusCode = 500, cause) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.statusCode = statusCode;
  return next(error);
}
async function audit(actorId, action, entityType, entityId, metadata = {}) {
  await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}
function name(profile) {
  return (
    [profile.first_name, profile.middle_name, profile.last_name]
      .filter(Boolean)
      .join(" ") || "Unnamed user"
  );
}
function safeSearch(value) {
  return value.replace(/[,%()]/g, "");
}

async function enrichProfiles(profiles) {
  const ids = profiles.map((item) => item.id);
  if (!ids.length) return [];

  const [studentResult, teacherResult] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("user_id, student_id, campus, program, year_level, section")
      .in("user_id", ids),
    supabase
      .from("teacher_profiles")
      .select("user_id, employee_id, campus, department")
      .in("user_id", ids),
  ]);

  if (studentResult.error) throw studentResult.error;
  if (teacherResult.error) throw teacherResult.error;

  const students = studentResult.data || [];
  const teachers = teacherResult.data || [];
  const studentMap = new Map(students.map((item) => [item.user_id, item]));
  const teacherMap = new Map(teachers.map((item) => [item.user_id, item]));
  return profiles.map((profile) => ({
    ...profile,
    full_name: name(profile),
    role_details:
      profile.requested_role === "student" ||
      profile.approved_role === "student"
        ? studentMap.get(profile.id) || null
        : teacherMap.get(profile.id) || null,
  }));
}

async function profileIdsForCampus(campus) {
  if (!campus) return null;
  const term = safeSearch(campus);

  const [studentResult, teacherResult] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("user_id")
      .ilike("campus", `%${term}%`),
    supabase
      .from("teacher_profiles")
      .select("user_id")
      .ilike("campus", `%${term}%`),
  ]);

  if (studentResult.error) throw studentResult.error;
  if (teacherResult.error) throw teacherResult.error;

  const students = studentResult.data || [];
  const teachers = teacherResult.data || [];
  return [...new Set([...students, ...teachers].map((item) => item.user_id))];
}

export async function dashboard(_request, response, next) {
  try {
    const count = (query) =>
      query.then(({ count: value, error }) => {
        if (error) throw error;
        return value || 0;
      });
    const [
      students,
      teachers,
      courses,
      pending,
      unreadMessages,
      draft,
      published,
      archived,
    ] = await Promise.all([
      count(
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("approved_role", "student")
          .eq("account_status", "active"),
      ),
      count(
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("approved_role", "teacher")
          .eq("account_status", "active"),
      ),
      count(
        supabase
          .from("courses")
          .select("*", { count: "exact", head: true })
          .eq("status", "published"),
      ),
      count(
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("account_status", "pending")
          .not("requested_role", "is", null),
      ),
      count(
        supabase
          .from("contact_messages")
          .select("*", { count: "exact", head: true })
          .eq("status", "new"),
      ),
      count(
        supabase
          .from("courses")
          .select("*", { count: "exact", head: true })
          .eq("status", "draft"),
      ),
      count(
        supabase
          .from("courses")
          .select("*", { count: "exact", head: true })
          .eq("status", "published"),
      ),
      count(
        supabase
          .from("courses")
          .select("*", { count: "exact", head: true })
          .eq("status", "archived"),
      ),
    ]);
    const [
      { data: pendingRows, error: pendingError },
      { data: courseRows, error: courseError },
      { data: activity, error: activityError },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id,email,first_name,middle_name,last_name,avatar_url,requested_role,account_status,created_at",
        )
        .eq("account_status", "pending")
        .not("requested_role", "is", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("courses")
        .select("id,teacher_id,course_code,title,status,created_at,updated_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("audit_logs")
        .select("id,actor_id,action,entity_type,entity_id,metadata,created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);
    if (pendingError || courseError || activityError) {
      return fail(
        next,
        "Unable to load dashboard data",
        500,
        pendingError || courseError || activityError,
      );
    }
    const applications = await enrichProfiles(pendingRows || []);
    const personIds = [
      ...new Set(
        [
          ...(courseRows || []).map((row) => row.teacher_id),
          ...(activity || []).map((row) => row.actor_id),
        ].filter(Boolean),
      ),
    ];
    const peopleResult = personIds.length
      ? await supabase
          .from("profiles")
          .select("id,first_name,last_name")
          .in("id", personIds)
      : { data: [] };
    if (peopleResult.error) throw peopleResult.error;

    const people = peopleResult.data || [];
    const peopleById = new Map(people.map((item) => [item.id, name(item)]));
    return response.json({
      success: true,
      summary: {
        activeStudents: students,
        activeTeachers: teachers,
        publishedCourses: courses,
        pendingApprovals: pending,
        unreadMessages,
      },
      courseStatus: { draft, published, archived },
      applications,
      courses: (courseRows || []).map((item) => ({
        ...item,
        teacher_name: peopleById.get(item.teacher_id) || "Unknown teacher",
      })),
      activity: (activity || []).map((item) => ({
        ...item,
        actor_name: peopleById.get(item.actor_id) || null,
      })),
    });
  } catch (error) {
    return fail(next, "Unable to load dashboard data", 500, error);
  }
}

export async function listApplications(request, response, next) {
  const parsed = paginationSchema.safeParse(request.query);
  if (!parsed.success) return sendValidationError(response);
  const { page, limit, search, role, sort, campus } = parsed.data;
  const { from, to } = pageRange(page, limit);
  if (role && !["student", "teacher"].includes(role))
    return sendValidationError(response, "Invalid requested-role filter.");
  let query = supabase
    .from("profiles")
    .select(
      "id,email,first_name,middle_name,last_name,avatar_url,requested_role,approved_role,account_status,created_at",
      { count: "exact" },
    )
    .eq("account_status", "pending")
    .not("requested_role", "is", null);
  if (role && role !== "admin") query = query.eq("requested_role", role);
  if (request.query.date && !/^\d{4}-\d{2}-\d{2}$/.test(request.query.date))
    return sendValidationError(response, "Invalid date filter.");
  if (request.query.date) {
    const nextDay = new Date(`${request.query.date}T00:00:00.000Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    query = query.gte("created_at", `${request.query.date}T00:00:00.000Z`);
    query = query.lt("created_at", nextDay.toISOString());
  }
  const campusIds = await profileIdsForCampus(campus);
  if (campusIds)
    query = campusIds.length
      ? query.in("id", campusIds)
      : query.eq("id", "00000000-0000-0000-0000-000000000000");
  if (search) {
    const term = safeSearch(search);
    query = query.or(
      `email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`,
    );
  }
  query =
    sort === "oldest"
      ? query.order("created_at")
      : query.order("created_at", { ascending: false });
  const { data, count, error } = await query.range(from, to);
  if (error) return fail(next, "Unable to load applications", 500, error);

  let applications;
  try {
    applications = await enrichProfiles(data || []);
  } catch (profileError) {
    return fail(next, "Unable to load applications", 500, profileError);
  }

  return response.json({
    success: true,
    data: applications,
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  });
}

export async function listUsers(request, response, next) {
  const parsed = paginationSchema.safeParse(request.query);
  if (!parsed.success) return sendValidationError(response);
  const { page, limit, search, role, status, sort, campus } = parsed.data;
  const { from, to } = pageRange(page, limit);
  let query = supabase
    .from("profiles")
    .select(
      "id,email,first_name,middle_name,last_name,avatar_url,requested_role,approved_role,account_status,created_at,updated_at",
      { count: "exact" },
    );
  if (role && !["admin", "teacher", "student"].includes(role))
    return sendValidationError(response, "Invalid role filter.");
  if (
    status &&
    !["pending", "active", "suspended", "rejected"].includes(status)
  )
    return sendValidationError(response, "Invalid status filter.");
  if (role) query = query.eq("approved_role", role);
  if (status) query = query.eq("account_status", status);
  const campusIds = await profileIdsForCampus(campus);
  if (campusIds)
    query = campusIds.length
      ? query.in("id", campusIds)
      : query.eq("id", "00000000-0000-0000-0000-000000000000");
  if (search) {
    const term = safeSearch(search);
    query = query.or(
      `email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`,
    );
  }
  query =
    sort === "oldest"
      ? query.order("created_at")
      : sort === "name"
        ? query.order("first_name")
        : query.order("created_at", { ascending: false });
  const { data, count, error } = await query.range(from, to);
  if (error) return fail(next, "Unable to load users", 500, error);
  const [{ count: active }, { count: pending }, { count: suspended }] =
    await Promise.all(
      ["active", "pending", "suspended"].map((value) =>
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("account_status", value),
      ),
    );
  let users;
  try {
    users = await enrichProfiles(data || []);
  } catch (profileError) {
    return fail(next, "Unable to load users", 500, profileError);
  }

  return response.json({
    success: true,
    data: users,
    summary: {
      total: count || 0,
      active: active || 0,
      pending: pending || 0,
      suspended: suspended || 0,
    },
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  });
}

export async function inviteUser(request, response, next) {
  const parsedInvitation = invitationSchema.safeParse(request.body);
  if (!parsedInvitation.success) {
    return sendValidationError(
      response,
      parsedInvitation.error.issues[0]?.message || "Invalid invitation.",
    );
  }

  const { email, firstName, middleName, lastName, role } =
    parsedInvitation.data;
  if (!isInstitutionalEmail(email)) {
    return sendValidationError(
      response,
      "Enter an assigned PHINMA school email address.",
    );
  }

  const detailsSchema =
    role === "student" ? studentRegistrationSchema : teacherRegistrationSchema;
  const parsedDetails = detailsSchema.safeParse(parsedInvitation.data.details);
  if (!parsedDetails.success) {
    return sendValidationError(
      response,
      parsedDetails.error.issues[0]?.message || "Invalid role details.",
    );
  }

  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existingError) {
    return fail(next, "Unable to check the school email", 500, existingError);
  }
  if (existingProfile) {
    return response.status(409).json({
      success: false,
      code: "EMAIL_ALREADY_REGISTERED",
      message: "This school email is already registered.",
    });
  }

  const { data: invitation, error: invitationError } =
    await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/auth/accept-invite`,
      data: {
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        requested_role: role,
        registration_details: parsedDetails.data,
        registration_source: "admin_invitation",
      },
    });

  if (invitationError || !invitation?.user) {
    const invitationMessage = invitationError?.message || "";
    const duplicate = /already|registered|exists/i.test(invitationMessage);
    if (duplicate) {
      return response.status(409).json({
        success: false,
        code: "EMAIL_ALREADY_REGISTERED",
        message: "This school email is already registered.",
      });
    }
    if (/redirect.*(allow|valid)|redirect_to/i.test(invitationMessage)) {
      return response.status(400).json({
        success: false,
        code: "INVITATION_REDIRECT_NOT_ALLOWED",
        message:
          "Allow the invitation URL in Supabase Authentication → URL Configuration, then try again.",
      });
    }
    return response.status(502).json({
      success: false,
      code: "INVITATION_DELIVERY_FAILED",
      message: invitationMessage
        ? `Supabase could not send the invitation: ${invitationMessage}`
        : "Supabase could not send the invitation. Check the Auth email and URL configuration.",
    });
  }

  const userId = invitation.user.id;
  const { error: roleProfileError } =
    role === "student"
      ? await saveStudentProfile(userId, parsedDetails.data)
      : await saveTeacherProfile(userId, parsedDetails.data);
  if (roleProfileError) {
    return fail(
      next,
      "The invitation was sent, but the school profile could not be saved",
      500,
      roleProfileError,
    );
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName,
      requested_role: role,
      approved_role: null,
      account_status: "pending",
    })
    .eq("id", userId);
  if (profileError) {
    return fail(
      next,
      "The invitation was sent, but the account profile could not be updated",
      500,
      profileError,
    );
  }

  await audit(request.auth.user.id, "user_invited", "profile", userId, {
    requested_role: role,
  });
  return response.status(201).json({
    success: true,
    data: { id: userId, email, requested_role: role, account_status: "pending" },
    message: "Invitation sent to the school email address.",
  });
}

export async function changeUserStatus(request, response, next) {
  const id = uuidSchema.safeParse(request.params.id);
  const body = userStatusSchema.safeParse(request.body);
  if (!id.success || !body.success) return sendValidationError(response);
  if (id.data === request.auth.user.id && body.data.status === "suspended")
    return response.status(409).json({
      success: false,
      message: "You cannot suspend your own account.",
    });
  const { data, error } = await supabase
    .from("profiles")
    .update({ account_status: body.data.status })
    .eq("id", id.data)
    .select("id,email,approved_role,account_status")
    .maybeSingle();
  if (error) return fail(next, "Unable to update user");
  if (!data)
    return response
      .status(404)
      .json({ success: false, message: "User not found." });
  await audit(
    request.auth.user.id,
    `user_${body.data.status}`,
    "profile",
    id.data,
  );
  return response.json({
    success: true,
    data,
    message: `User ${body.data.status}.`,
  });
}

async function listSimple(
  table,
  fields,
  request,
  response,
  next,
  filters = {},
) {
  const parsed = paginationSchema.safeParse(request.query);
  if (!parsed.success) return sendValidationError(response);
  const { page, limit, search } = parsed.data;
  const { from, to } = pageRange(page, limit);
  let query = supabase
    .from(table)
    .select(fields, { count: "exact" })
    .order("created_at", { ascending: false });
  if (search && filters.searchColumns) {
    const term = safeSearch(search);
    query = query.or(
      filters.searchColumns
        .map((column) => `${column}.ilike.%${term}%`)
        .join(","),
    );
  }
  for (const [key, allowed] of Object.entries(filters.enums || {})) {
    if (request.query[key] && !allowed.includes(request.query[key]))
      return sendValidationError(response, `Invalid ${key} filter.`);
    if (request.query[key]) query = query.eq(key, request.query[key]);
  }
  for (const [key, column] of Object.entries(filters.exact || {}))
    if (request.query[key]) query = query.eq(column, request.query[key]);
  const { data, count, error } = await query.range(from, to);
  if (error) return fail(next, `Unable to load ${table}`);
  return response.json({
    success: true,
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  });
}

export async function listCourses(req, res, next) {
  const parsed = paginationSchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res);
  if (req.query.teacher && !uuidSchema.safeParse(req.query.teacher).success)
    return sendValidationError(res, "Teacher filter must be a valid ID.");
  if (
    req.query.status &&
    !["draft", "published", "archived"].includes(req.query.status)
  )
    return sendValidationError(res, "Invalid status filter.");
  const { page, limit, search } = parsed.data;
  const { from, to } = pageRange(page, limit);
  let query = supabase
    .from("courses")
    .select(
      "id,teacher_id,course_code,title,category,thumbnail_url,status,visibility,created_at,updated_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });
  if (search) {
    const term = safeSearch(search);
    query = query.or(`title.ilike.%${term}%,course_code.ilike.%${term}%`);
  }
  if (req.query.teacher) query = query.eq("teacher_id", req.query.teacher);
  if (req.query.category) query = query.eq("category", req.query.category);
  if (req.query.status) query = query.eq("status", req.query.status);
  const { data = [], count, error } = await query.range(from, to);
  if (error) return fail(next, "Unable to load courses");
  const teacherIds = [...new Set(data.map((item) => item.teacher_id))];
  const courseIds = data.map((item) => item.id);
  const [{ data: teachers = [] }, { data: enrollments = [] }] =
    await Promise.all([
      teacherIds.length
        ? supabase
            .from("profiles")
            .select("id,first_name,last_name")
            .in("id", teacherIds)
        : Promise.resolve({ data: [] }),
      courseIds.length
        ? supabase
            .from("enrollments")
            .select("course_id")
            .in("course_id", courseIds)
            .neq("status", "removed")
        : Promise.resolve({ data: [] }),
    ]);
  const teacherMap = new Map(teachers.map((item) => [item.id, name(item)]));
  const enrollmentCounts = new Map();
  for (const enrollment of enrollments)
    enrollmentCounts.set(
      enrollment.course_id,
      (enrollmentCounts.get(enrollment.course_id) || 0) + 1,
    );
  return res.json({
    success: true,
    data: data.map((item) => ({
      ...item,
      teacher_name: teacherMap.get(item.teacher_id) || "Unknown teacher",
      enrollment_count: enrollmentCounts.get(item.id) || 0,
    })),
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  });
}
export const listCategories = (req, res, next) =>
  listSimple(
    "course_categories",
    "id,name,description,color,icon,is_active,created_at,updated_at",
    req,
    res,
    next,
    { searchColumns: ["name", "description"] },
  );
export const listAnnouncements = (req, res, next) =>
  listSimple(
    "announcements",
    "id,author_id,course_id,audience,title,body,published_at,created_at,updated_at",
    req,
    res,
    next,
    {
      searchColumns: ["title", "body"],
      enums: { audience: ["all", "teachers", "students", "course"] },
    },
  );
export const listStudyTools = (req, res, next) =>
  listSimple(
    "study_tools",
    "id,creator_id,title,description,tool_type,url,is_active,created_at,updated_at",
    req,
    res,
    next,
    { searchColumns: ["title", "description", "tool_type"] },
  );
export const listMessages = (req, res, next) =>
  listSimple(
    "contact_messages",
    "id,sender_name,sender_email,subject,message,status,created_at,updated_at",
    req,
    res,
    next,
    {
      searchColumns: ["sender_name", "sender_email", "subject"],
      enums: { status: ["new", "in_progress", "resolved", "spam"] },
    },
  );
export const listAuditLogs = (req, res, next) =>
  listSimple(
    "audit_logs",
    "id,actor_id,action,entity_type,entity_id,metadata,created_at",
    req,
    res,
    next,
    { searchColumns: ["action", "entity_type"] },
  );

async function updateStatus(
  table,
  id,
  statusField,
  status,
  actor,
  response,
  next,
) {
  const { data, error } = await supabase
    .from(table)
    .update({ [statusField]: status })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) return fail(next, `Unable to update ${table}`);
  if (!data)
    return response
      .status(404)
      .json({ success: false, message: "Record not found." });
  await audit(actor, `${table}_${status}`, table, id);
  return response.json({ success: true, data });
}
export function changeCourseStatus(req, res, next) {
  const id = uuidSchema.safeParse(req.params.id),
    body = courseStatusSchema.safeParse(req.body);
  if (!id.success || !body.success) return sendValidationError(res);
  return updateStatus(
    "courses",
    id.data,
    "status",
    body.data.status,
    req.auth.user.id,
    res,
    next,
  );
}

export async function createCategory(req, res, next) {
  const body = categorySchema.safeParse(req.body);
  if (!body.success)
    return sendValidationError(res, body.error.issues[0]?.message);
  const { data, error } = await supabase
    .from("course_categories")
    .insert({
      name: body.data.name,
      description: body.data.description,
      color: body.data.color,
      icon: body.data.icon,
      is_active: body.data.isActive,
    })
    .select()
    .single();
  if (error?.code === "23505")
    return res.status(409).json({
      success: false,
      message: "A category with that name already exists.",
    });
  if (error) return fail(next, "Unable to create category");
  await audit(req.auth.user.id, "category_created", "course_category", data.id);
  return res.status(201).json({ success: true, data });
}
export async function updateCategory(req, res, next) {
  const id = uuidSchema.safeParse(req.params.id),
    body = categorySchema.partial().safeParse(req.body);
  if (!id.success || !body.success || !Object.keys(body.data).length)
    return sendValidationError(res);
  const changes = { ...body.data };
  if ("isActive" in changes) {
    changes.is_active = changes.isActive;
    delete changes.isActive;
  }
  const { data, error } = await supabase
    .from("course_categories")
    .update(changes)
    .eq("id", id.data)
    .select()
    .maybeSingle();
  if (error?.code === "23505")
    return res.status(409).json({
      success: false,
      message: "A category with that name already exists.",
    });
  if (error) return fail(next, "Unable to update category");
  if (!data)
    return res
      .status(404)
      .json({ success: false, message: "Category not found." });
  await audit(req.auth.user.id, "category_updated", "course_category", id.data);
  return res.json({ success: true, data });
}
export async function createAnnouncement(req, res, next) {
  const body = announcementSchema.safeParse(req.body);
  if (
    !body.success ||
    (body.data?.audience === "course" && !body.data.courseId)
  )
    return sendValidationError(res, body.error?.issues[0]?.message);
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      author_id: req.auth.user.id,
      title: body.data.title,
      body: body.data.message,
      audience: body.data.audience,
      course_id: body.data.courseId || null,
      published_at: body.data.publishNow ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error) return fail(next, "Unable to create announcement");
  if (body.data.publishNow) {
    try {
      await createAnnouncementNotifications(data);
    } catch (cause) {
      await supabase.from("announcements").delete().eq("id", data.id);
      return fail(next, cause?.code === "42P01" ? "Notifications are not enabled yet. Run the phase9-notifications.sql migration." : "Unable to create announcement notifications", 503, cause);
    }
  }
  await audit(
    req.auth.user.id,
    "announcement_created",
    "announcement",
    data.id,
    { published: body.data.publishNow },
  );
  return res.status(201).json({ success: true, data });
}
export async function createStudyTool(req, res, next) {
  const body = studyToolSchema.safeParse(req.body);
  if (!body.success)
    return sendValidationError(res, body.error.issues[0]?.message);
  const { data, error } = await supabase
    .from("study_tools")
    .insert({
      creator_id: req.auth.user.id,
      title: body.data.title,
      description: body.data.description,
      tool_type: body.data.toolType,
      url: body.data.url,
      is_active: body.data.isActive,
    })
    .select()
    .single();
  if (error) return fail(next, "Unable to create study tool");
  await audit(req.auth.user.id, "study_tool_created", "study_tool", data.id);
  return res.status(201).json({ success: true, data });
}
export async function updateStudyTool(req, res, next) {
  const id = uuidSchema.safeParse(req.params.id),
    body = studyToolSchema.partial().safeParse(req.body);
  if (!id.success || !body.success || !Object.keys(body.data).length)
    return sendValidationError(res);
  const changes = {};
  for (const [key, value] of Object.entries(body.data))
    changes[
      key === "toolType" ? "tool_type" : key === "isActive" ? "is_active" : key
    ] = value;
  const { data, error } = await supabase
    .from("study_tools")
    .update(changes)
    .eq("id", id.data)
    .select()
    .maybeSingle();
  if (error) return fail(next, "Unable to update study tool");
  if (!data)
    return res
      .status(404)
      .json({ success: false, message: "Study tool not found." });
  await audit(req.auth.user.id, "study_tool_updated", "study_tool", id.data);
  return res.json({ success: true, data });
}
export function changeMessageStatus(req, res, next) {
  const id = uuidSchema.safeParse(req.params.id),
    body = messageStatusSchema.safeParse(req.body);
  if (!id.success || !body.success) return sendValidationError(res);
  return updateStatus(
    "contact_messages",
    id.data,
    "status",
    body.data.status,
    req.auth.user.id,
    res,
    next,
  );
}
