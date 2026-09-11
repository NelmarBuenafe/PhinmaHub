import { supabase } from "../config/supabase.js";
import { randomBytes } from "node:crypto";
import { z } from "zod";

const COURSE_FIELDS =
  "id,teacher_id,course_code,title,description,category,difficulty,thumbnail_url,visibility,status,created_at,updated_at";
const TEACHER_COURSE_FIELDS = `${COURSE_FIELDS},join_code`;

const cleanText = (label, maximumLength) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(maximumLength, `${label} is too long.`);

export const courseCreationSchema = z
  .object({
    courseCode: cleanText("Course code", 50).regex(
      /^[A-Za-z0-9][A-Za-z0-9 -]*$/,
      "Course code may contain only letters, numbers, spaces, and hyphens.",
    ),
    title: cleanText("Course title", 200),
    description: z.string().trim().max(4000).optional().default(""),
    category: cleanText("Category", 120),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    visibility: z.enum(["private", "public", "unlisted"]).default("private"),
  })
  .strict();

const courseIdSchema = z.string().uuid();

export const joinCourseSchema = z
  .object({
    joinCode: z
      .string()
      .trim()
      .min(1, "Please enter a course join code.")
      .max(32, "Course join code is too long.")
      .transform((value) => value.toUpperCase()),
  })
  .strict();

export function normalizeJoinCode(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function buildStudentEnrollmentRecord(courseId, studentId, enrolledAt) {
  return {
    course_id: courseId,
    student_id: studentId,
    status: "active",
    enrolled_at: enrolledAt,
  };
}

export function generateJoinCode() {
  return randomBytes(6).toString("hex").toUpperCase();
}

export function buildNewCourseRecord(input, teacherId, joinCode) {
  return {
    teacher_id: teacherId,
    course_code: input.courseCode,
    title: input.title,
    description: input.description || null,
    category: input.category,
    difficulty: input.difficulty,
    visibility: input.visibility,
    status: "draft",
    join_code: joinCode,
  };
}

function fail(next, message, cause) {
  const error = new Error(message, { cause });
  error.statusCode = 500;
  return next(error);
}

function fullName(profile) {
  return (
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Faculty instructor"
  );
}

async function hydrateCourses(courses, studentId = null) {
  if (!courses.length) return [];

  const courseIds = courses.map((course) => course.id);
  const teacherIds = [
    ...new Set(courses.map((course) => course.teacher_id).filter(Boolean)),
  ];
  const [teacherResult, moduleResult] = await Promise.all([
    teacherIds.length
      ? supabase
          .from("profiles")
          .select("id,first_name,last_name")
          .in("id", teacherIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("course_modules")
      .select("id,course_id")
      .in("course_id", courseIds),
  ]);

  if (teacherResult.error) throw teacherResult.error;
  if (moduleResult.error) throw moduleResult.error;

  const modules = moduleResult.data || [];
  const moduleIds = modules.map((module) => module.id);
  const lessonResult = moduleIds.length
    ? await supabase
        .from("lessons")
        .select("id,module_id")
        .in("module_id", moduleIds)
        .eq("is_published", true)
    : { data: [], error: null };
  if (lessonResult.error) throw lessonResult.error;

  const lessons = lessonResult.data || [];
  const progressResult =
    studentId && lessons.length
      ? await supabase
          .from("lesson_progress")
          .select("lesson_id,is_completed")
          .eq("student_id", studentId)
          .in(
            "lesson_id",
            lessons.map((lesson) => lesson.id),
          )
      : { data: [], error: null };
  if (progressResult.error) throw progressResult.error;

  const teachers = new Map(
    (teacherResult.data || []).map((profile) => [profile.id, fullName(profile)]),
  );
  const courseByModule = new Map(
    modules.map((module) => [module.id, module.course_id]),
  );
  const lessonCounts = new Map();
  const lessonCourse = new Map();
  for (const lesson of lessons) {
    const courseId = courseByModule.get(lesson.module_id);
    lessonCourse.set(lesson.id, courseId);
    lessonCounts.set(courseId, (lessonCounts.get(courseId) || 0) + 1);
  }

  const completedCounts = new Map();
  for (const item of progressResult.data || []) {
    if (!item.is_completed) continue;
    const courseId = lessonCourse.get(item.lesson_id);
    completedCounts.set(courseId, (completedCounts.get(courseId) || 0) + 1);
  }

  return courses.map((course) => ({
    ...course,
    teacher_name: teachers.get(course.teacher_id) || "Faculty instructor",
    lesson_count: lessonCounts.get(course.id) || 0,
    ...(studentId
      ? { completed_lesson_count: completedCounts.get(course.id) || 0 }
      : {}),
  }));
}

async function addEnrollmentCounts(courses) {
  if (!courses.length) return { courses: [], totalStudents: 0 };

  const courseIds = courses.map((course) => course.id);
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("course_id,student_id")
    .in("course_id", courseIds)
    .eq("status", "active");
  if (enrollmentError) throw enrollmentError;

  const enrolledStudentIds = [
    ...new Set((enrollments || []).map((item) => item.student_id)),
  ];
  const { data: activeStudents, error: studentError } = enrolledStudentIds.length
    ? await supabase
        .from("profiles")
        .select("id")
        .in("id", enrolledStudentIds)
        .eq("approved_role", "student")
        .eq("account_status", "active")
    : { data: [], error: null };
  if (studentError) throw studentError;

  const activeStudentIds = new Set((activeStudents || []).map((item) => item.id));
  const counts = new Map();
  for (const enrollment of enrollments || []) {
    if (!activeStudentIds.has(enrollment.student_id)) continue;
    counts.set(
      enrollment.course_id,
      (counts.get(enrollment.course_id) || 0) + 1,
    );
  }

  return {
    courses: courses.map((course) => ({
      ...course,
      student_count: counts.get(course.id) || 0,
    })),
    totalStudents: activeStudentIds.size,
  };
}

async function getTeacherCourses(teacherId) {
  const { data, error } = await supabase
    .from("courses")
    .select(TEACHER_COURSE_FIELDS)
    .eq("teacher_id", teacherId)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const [hydrated, enrollmentData] = await Promise.all([
    hydrateCourses(data || []),
    addEnrollmentCounts(data || []),
  ]);
  const enrollmentCounts = new Map(
    enrollmentData.courses.map((course) => [course.id, course.student_count]),
  );
  return {
    courses: hydrated.map((course) => ({
      ...course,
      student_count: enrollmentCounts.get(course.id) || 0,
    })),
    totalStudents: enrollmentData.totalStudents,
  };
}

export async function listPublicCourses(_request, response, next) {
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_FIELDS)
    .eq("status", "published")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) return fail(next, "Unable to load public courses", error);

  try {
    return response.json({
      success: true,
      data: await hydrateCourses(data || []),
    });
  } catch (cause) {
    return fail(next, "Unable to load public course details", cause);
  }
}

export async function listStudentCourses(request, response, next) {
  const studentId = request.auth.user.id;
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("course_id,status,enrolled_at")
    .eq("student_id", studentId)
    .in("status", ["active", "completed"])
    .order("enrolled_at", { ascending: false });

  if (enrollmentError) {
    return fail(next, "Unable to load student enrollments", enrollmentError);
  }

  const courseIds = (enrollments || []).map((item) => item.course_id);
  if (!courseIds.length) {
    return response.json({ success: true, data: [] });
  }

  const { data: courses, error: courseError } = await supabase
    .from("courses")
    .select(COURSE_FIELDS)
    .in("id", courseIds);
  if (courseError) {
    return fail(next, "Unable to load student courses", courseError);
  }

  try {
    const enrollmentMap = new Map(
      enrollments.map((item) => [item.course_id, item]),
    );
    const hydrated = await hydrateCourses(courses || [], studentId);
    return response.json({
      success: true,
      data: hydrated.map((course) => ({
        ...course,
        enrollment_status: enrollmentMap.get(course.id)?.status,
        enrolled_at: enrollmentMap.get(course.id)?.enrolled_at,
      })),
    });
  } catch (cause) {
    return fail(next, "Unable to load student course details", cause);
  }
}

export async function joinStudentCourse(request, response, next) {
  const values = joinCourseSchema.safeParse(request.body);
  if (!values.success) {
    return response.status(400).json({
      success: false,
      code: "INVALID_JOIN_CODE",
      message: values.error.issues[0]?.message || "Please enter a course join code.",
    });
  }

  const studentId = request.auth.user.id;
  const joinCode = normalizeJoinCode(values.data.joinCode);

  try {
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id,course_code,title,teacher_id,status,visibility")
      .eq("join_code", joinCode)
      .maybeSingle();
    if (courseError) throw courseError;
    if (!course || course.status === "archived") {
      return response.status(404).json({
        success: false,
        code: "INVALID_JOIN_CODE",
        message: "Invalid course join code.",
      });
    }

    const { data: existing, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("id,status,enrolled_at,course_id,student_id")
      .eq("course_id", course.id)
      .eq("student_id", studentId)
      .maybeSingle();
    if (enrollmentError) throw enrollmentError;

    if (existing?.status === "active" || existing?.status === "completed") {
      return response.status(409).json({
        success: false,
        code: "ALREADY_ENROLLED",
        message: "You are already enrolled in this course.",
      });
    }

    const enrolledAt = new Date().toISOString();
    if (existing?.status === "removed") {
      const { data, error } = await supabase
        .from("enrollments")
        .update({ status: "active", enrolled_at: enrolledAt })
        .eq("id", existing.id)
        .select("id,status,enrolled_at,course_id,student_id")
        .single();
      if (error) throw error;
      return response.status(200).json({
        success: true,
        data: { enrollment: data, course },
        message: "You rejoined the course successfully.",
      });
    }

    const { data, error } = await supabase
      .from("enrollments")
      .insert(buildStudentEnrollmentRecord(course.id, studentId, enrolledAt))
      .select("id,status,enrolled_at,course_id,student_id")
      .single();
    if (error) {
      if (error.code === "23505") {
        return response.status(409).json({
          success: false,
          code: "ALREADY_ENROLLED",
          message: "You are already enrolled in this course.",
        });
      }
      throw error;
    }
    return response.status(201).json({
      success: true,
      data: { enrollment: data, course },
      message: "You joined the course successfully.",
    });
  } catch (cause) {
    return fail(next, "Unable to join the course", cause);
  }
}

export async function listTeacherCourses(request, response, next) {
  try {
    const { courses } = await getTeacherCourses(request.auth.user.id);
    return response.json({
      success: true,
      data: courses,
    });
  } catch (cause) {
    return fail(next, "Unable to load teacher course details", cause);
  }
}

export async function teacherDashboard(request, response, next) {
  try {
    const { courses, totalStudents } = await getTeacherCourses(
      request.auth.user.id,
    );
    return response.json({
      success: true,
      summary: {
        totalCourses: courses.length,
        publishedCourses: courses.filter((course) => course.status === "published")
          .length,
        draftCourses: courses.filter((course) => course.status === "draft").length,
        totalStudents,
      },
      data: courses,
    });
  } catch (cause) {
    return fail(next, "Unable to load the teacher dashboard", cause);
  }
}

export async function listTeacherCourseCategories(_request, response, next) {
  const { data, error } = await supabase
    .from("course_categories")
    .select("id,name")
    .eq("is_active", true)
    .order("name");
  if (error?.code === "PGRST205") {
    return response.status(503).json({
      success: false,
      code: "COURSE_CATEGORIES_NOT_CONFIGURED",
      message:
        "Course categories are not configured. Run supabase/phase4-admin.sql, then add an active category from the Admin Dashboard.",
    });
  }
  if (error) return fail(next, "Unable to load course categories", error);
  return response.json({ success: true, data: data || [] });
}

export async function createTeacherCourse(request, response, next) {
  const parsed = courseCreationSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({
      success: false,
      code: "INVALID_COURSE",
      message: parsed.error.issues[0]?.message || "Invalid course information.",
    });
  }

  const { data: category, error: categoryError } = await supabase
    .from("course_categories")
    .select("id")
    .eq("name", parsed.data.category)
    .eq("is_active", true)
    .maybeSingle();
  if (categoryError) return fail(next, "Unable to validate the course category", categoryError);
  if (!category) {
    return response.status(400).json({
      success: false,
      code: "INVALID_CATEGORY",
      message: "Select an active course category.",
    });
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from("courses")
      .insert(buildNewCourseRecord(parsed.data, request.auth.user.id, generateJoinCode()))
      .select(COURSE_FIELDS)
      .single();

    if (!error) {
      return response.status(201).json({
        success: true,
        data: { ...data, student_count: 0, lesson_count: 0 },
        message: "Course created successfully.",
      });
    }

    const databaseMessage = `${error.message || ""} ${error.details || ""}`;
    if (error.code === "23505" && /teacher_id.*course_code|courses_teacher_code_unique/i.test(databaseMessage)) {
      return response.status(409).json({
        success: false,
        code: "COURSE_CODE_EXISTS",
        message: "You already have a course with this course code.",
      });
    }
    if (error.code === "23505" && /join_code/i.test(databaseMessage) && attempt < 2) {
      continue;
    }
    return fail(next, "Unable to create the course", error);
  }

  return fail(next, "Unable to generate a unique join code");
}

export async function getTeacherCourse(request, response, next) {
  const parsedId = courseIdSchema.safeParse(request.params.courseId);
  if (!parsedId.success) {
    return response.status(400).json({ success: false, message: "Invalid course ID." });
  }

  const { data: course, error } = await supabase
    .from("courses")
    .select(TEACHER_COURSE_FIELDS)
    .eq("id", parsedId.data)
    .maybeSingle();
  if (error) return fail(next, "Unable to load the course", error);
  if (!course) {
    return response.status(404).json({ success: false, message: "Course not found." });
  }
  if (course.teacher_id !== request.auth.user.id) {
    return response.status(403).json({
      success: false,
      code: "COURSE_FORBIDDEN",
      message: "You can only manage courses that you own.",
    });
  }

  try {
    const [hydrated] = await getTeacherCourses(request.auth.user.id).then((result) =>
      result.courses.filter((item) => item.id === course.id),
    );
    return response.json({ success: true, data: hydrated || course });
  } catch (cause) {
    return fail(next, "Unable to load course details", cause);
  }
}
