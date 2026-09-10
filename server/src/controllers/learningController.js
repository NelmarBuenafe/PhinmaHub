import { z } from "zod";
import { supabase } from "../config/supabase.js";

const uuidSchema = z.string().uuid();
const moduleSchema = z.object({
  title: z.string().trim().min(1, "Module title is required.").max(200),
  description: z.string().trim().max(4000).optional().default(""),
}).strict();
const lessonSchema = z.object({
  title: z.string().trim().min(1, "Lesson title is required.").max(200),
  content: z.string().trim().max(30000).optional().default(""),
  learningObjectives: z.string().trim().max(6000).optional().default(""),
  isPublished: z.boolean().optional().default(false),
}).strict();
const assignmentSchema = z.object({
  title: z.string().trim().min(1, "Assignment title is required.").max(200),
  instructions: z.string().trim().max(30000).optional().default(""),
  totalPoints: z.coerce.number().positive("Total points must be greater than zero.").max(100000),
  dueAt: z.string().datetime().nullable().optional().default(null),
  isPublished: z.boolean().optional().default(false),
  allowLateSubmissions: z.boolean().optional().default(false),
}).strict();
const enrollmentSchema = z.object({
  email: z.string().trim().email("Enter a valid student email.").max(320),
}).strict();
const courseSettingsSchema = z.object({
  status: z.enum(["draft", "published"]),
  visibility: z.enum(["private", "public", "unlisted"]),
}).strict();
const submissionSchema = z.object({
  writtenAnswer: z.string().trim().max(30000).optional().default(""),
  submit: z.boolean().optional().default(false),
}).strict();
const gradeSchema = z.object({
  score: z.coerce.number().min(0).max(100000),
  feedback: z.string().trim().max(12000).optional().default(""),
}).strict();

function sendValidationError(response, parsed) {
  return response.status(400).json({
    success: false,
    message: parsed.error.issues[0]?.message || "Invalid request.",
  });
}

function sendUnexpected(next, message, cause) {
  const error = new Error(message, { cause });
  error.statusCode = cause?.statusCode || cause?.status;
  return next(error);
}

async function getOwnedCourse(courseId, teacherId) {
  const { data, error } = await supabase
    .from("courses")
    .select("id,teacher_id,course_code,title,status,visibility")
    .eq("id", courseId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { error: "Course not found.", status: 404 };
  if (data.teacher_id !== teacherId) {
    return { error: "You can only manage courses that you own.", status: 403 };
  }
  return { course: data };
}

async function getStudentCourse(courseId, studentId) {
  const { data, error } = await supabase
    .from("enrollments")
    .select("course_id,courses(id,course_code,title,description,status,visibility)")
    .eq("course_id", courseId)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  if (!data?.courses) return { error: "You are not enrolled in this course.", status: 403 };
  return { course: data.courses };
}

async function nextPosition(table, parentColumn, parentId) {
  const { data, error } = await supabase
    .from(table)
    .select("display_position")
    .eq(parentColumn, parentId)
    .order("display_position", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0]?.display_position ?? -1) + 1;
}

async function getOwnedModule(moduleId, teacherId) {
  const { data: module, error } = await supabase
    .from("course_modules")
    .select("id,course_id,title,description,display_position")
    .eq("id", moduleId)
    .maybeSingle();
  if (error) throw error;
  if (!module) return { error: "Module not found.", status: 404 };
  const result = await getOwnedCourse(module.course_id, teacherId);
  return result.course ? { module, course: result.course } : result;
}

async function getOwnedAssignment(assignmentId, teacherId) {
  const { data: assignment, error } = await supabase
    .from("assignments")
    .select("id,course_id,title")
    .eq("id", assignmentId)
    .maybeSingle();
  if (error) throw error;
  if (!assignment) return { error: "Assignment not found.", status: 404 };
  const result = await getOwnedCourse(assignment.course_id, teacherId);
  return result.course ? { assignment, course: result.course } : result;
}

export async function updateCourseSettings(request, response, next) {
  const courseId = uuidSchema.safeParse(request.params.courseId);
  const values = courseSettingsSchema.safeParse(request.body);
  if (!courseId.success || !values.success) return sendValidationError(response, values.success ? courseId : values);
  try {
    const owned = await getOwnedCourse(courseId.data, request.auth.user.id);
    if (!owned.course) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data, error } = await supabase
      .from("courses")
      .update({ status: values.data.status, visibility: values.data.visibility })
      .eq("id", owned.course.id)
      .select("id,course_code,title,status,visibility")
      .single();
    if (error) throw error;
    return response.json({ success: true, data, message: "Course settings updated." });
  } catch (cause) {
    return sendUnexpected(next, "Unable to update course settings", cause);
  }
}

export async function listCourseStudents(request, response, next) {
  const courseId = uuidSchema.safeParse(request.params.courseId);
  if (!courseId.success) return sendValidationError(response, courseId);
  try {
    const owned = await getOwnedCourse(courseId.data, request.auth.user.id);
    if (!owned.course) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data, error } = await supabase
      .from("enrollments")
      .select("id,status,enrolled_at,student_id")
      .eq("course_id", courseId.data)
      .order("enrolled_at", { ascending: false });
    if (error) throw error;
    const ids = (data || []).map((item) => item.student_id);
    const { data: profiles, error: profileError } = ids.length
      ? await supabase.from("profiles").select("id,email,first_name,last_name,account_status,approved_role").in("id", ids)
      : { data: [], error: null };
    if (profileError) throw profileError;
    const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
    return response.json({ success: true, data: (data || []).map((item) => ({ ...item, student: profilesById.get(item.student_id) || null })) });
  } catch (cause) {
    return sendUnexpected(next, "Unable to load enrolled students", cause);
  }
}

export async function enrollStudent(request, response, next) {
  const courseId = uuidSchema.safeParse(request.params.courseId);
  const values = enrollmentSchema.safeParse(request.body);
  if (!courseId.success || !values.success) return sendValidationError(response, values.success ? courseId : values);
  try {
    const owned = await getOwnedCourse(courseId.data, request.auth.user.id);
    if (!owned.course) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data: student, error: studentError } = await supabase
      .from("profiles")
      .select("id,email,first_name,last_name")
      .ilike("email", values.data.email)
      .eq("approved_role", "student")
      .eq("account_status", "active")
      .maybeSingle();
    if (studentError) throw studentError;
    if (!student) return response.status(404).json({ success: false, message: "No active Student account uses that email." });
    const { data, error } = await supabase
      .from("enrollments")
      .upsert({ course_id: courseId.data, student_id: student.id, status: "active", enrolled_at: new Date().toISOString() }, { onConflict: "course_id,student_id" })
      .select("id,status,enrolled_at,student_id")
      .single();
    if (error) throw error;
    return response.status(201).json({ success: true, data: { ...data, student }, message: "Student enrolled successfully." });
  } catch (cause) {
    return sendUnexpected(next, "Unable to enroll the student", cause);
  }
}

export async function removeEnrollment(request, response, next) {
  const courseId = uuidSchema.safeParse(request.params.courseId);
  const enrollmentId = uuidSchema.safeParse(request.params.enrollmentId);
  if (!courseId.success || !enrollmentId.success) return sendValidationError(response, courseId.success ? enrollmentId : courseId);
  try {
    const owned = await getOwnedCourse(courseId.data, request.auth.user.id);
    if (!owned.course) return response.status(owned.status).json({ success: false, message: owned.error });
    const { error } = await supabase.from("enrollments").update({ status: "removed" }).eq("id", enrollmentId.data).eq("course_id", courseId.data);
    if (error) throw error;
    return response.json({ success: true, message: "Student removed from this course." });
  } catch (cause) {
    return sendUnexpected(next, "Unable to remove the student", cause);
  }
}

export async function listCourseModules(request, response, next) {
  const courseId = uuidSchema.safeParse(request.params.courseId);
  if (!courseId.success) return sendValidationError(response, courseId);
  try {
    const owned = await getOwnedCourse(courseId.data, request.auth.user.id);
    if (!owned.course) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data: modules, error } = await supabase.from("course_modules").select("id,course_id,title,description,display_position").eq("course_id", courseId.data).order("display_position");
    if (error) throw error;
    const moduleIds = (modules || []).map((item) => item.id);
    const { data: lessons, error: lessonError } = moduleIds.length
      ? await supabase.from("lessons").select("id,module_id,title,content,learning_objectives,display_position,is_published").in("module_id", moduleIds).order("display_position")
      : { data: [], error: null };
    if (lessonError) throw lessonError;
    const grouped = new Map();
    for (const lesson of lessons || []) grouped.set(lesson.module_id, [...(grouped.get(lesson.module_id) || []), lesson]);
    return response.json({ success: true, data: (modules || []).map((item) => ({ ...item, lessons: grouped.get(item.id) || [] })) });
  } catch (cause) {
    return sendUnexpected(next, "Unable to load modules", cause);
  }
}

export async function createModule(request, response, next) {
  const courseId = uuidSchema.safeParse(request.params.courseId);
  const values = moduleSchema.safeParse(request.body);
  if (!courseId.success || !values.success) return sendValidationError(response, values.success ? courseId : values);
  try {
    const owned = await getOwnedCourse(courseId.data, request.auth.user.id);
    if (!owned.course) return response.status(owned.status).json({ success: false, message: owned.error });
    const displayPosition = await nextPosition("course_modules", "course_id", courseId.data);
    const { data, error } = await supabase.from("course_modules").insert({ course_id: courseId.data, title: values.data.title, description: values.data.description || null, display_position: displayPosition }).select("id,course_id,title,description,display_position").single();
    if (error) throw error;
    return response.status(201).json({ success: true, data, message: "Module created." });
  } catch (cause) {
    return sendUnexpected(next, "Unable to create module", cause);
  }
}

export async function updateModule(request, response, next) {
  const moduleId = uuidSchema.safeParse(request.params.moduleId);
  const values = moduleSchema.safeParse(request.body);
  if (!moduleId.success || !values.success) return sendValidationError(response, values.success ? moduleId : values);
  try {
    const owned = await getOwnedModule(moduleId.data, request.auth.user.id);
    if (!owned.module) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data, error } = await supabase.from("course_modules").update({ title: values.data.title, description: values.data.description || null }).eq("id", moduleId.data).select("id,course_id,title,description,display_position").single();
    if (error) throw error;
    return response.json({ success: true, data, message: "Module updated." });
  } catch (cause) { return sendUnexpected(next, "Unable to update module", cause); }
}

export async function deleteModule(request, response, next) {
  const moduleId = uuidSchema.safeParse(request.params.moduleId);
  if (!moduleId.success) return sendValidationError(response, moduleId);
  try {
    const owned = await getOwnedModule(moduleId.data, request.auth.user.id);
    if (!owned.module) return response.status(owned.status).json({ success: false, message: owned.error });
    const { error } = await supabase.from("course_modules").delete().eq("id", moduleId.data);
    if (error) throw error;
    return response.json({ success: true, message: "Module deleted." });
  } catch (cause) { return sendUnexpected(next, "Unable to delete module", cause); }
}

export async function createLesson(request, response, next) {
  const moduleId = uuidSchema.safeParse(request.params.moduleId);
  const values = lessonSchema.safeParse(request.body);
  if (!moduleId.success || !values.success) return sendValidationError(response, values.success ? moduleId : values);
  try {
    const owned = await getOwnedModule(moduleId.data, request.auth.user.id);
    if (!owned.module) return response.status(owned.status).json({ success: false, message: owned.error });
    const displayPosition = await nextPosition("lessons", "module_id", moduleId.data);
    const { data, error } = await supabase.from("lessons").insert({ module_id: moduleId.data, title: values.data.title, content: values.data.content || null, learning_objectives: values.data.learningObjectives || null, is_published: values.data.isPublished, display_position: displayPosition }).select("id,module_id,title,content,learning_objectives,display_position,is_published").single();
    if (error) throw error;
    return response.status(201).json({ success: true, data, message: "Lesson created." });
  } catch (cause) { return sendUnexpected(next, "Unable to create lesson", cause); }
}

export async function updateLesson(request, response, next) {
  const lessonId = uuidSchema.safeParse(request.params.lessonId);
  const values = lessonSchema.safeParse(request.body);
  if (!lessonId.success || !values.success) return sendValidationError(response, values.success ? lessonId : values);
  try {
    const { data: lesson, error: lessonError } = await supabase.from("lessons").select("id,module_id").eq("id", lessonId.data).maybeSingle();
    if (lessonError) throw lessonError;
    if (!lesson) return response.status(404).json({ success: false, message: "Lesson not found." });
    const owned = await getOwnedModule(lesson.module_id, request.auth.user.id);
    if (!owned.module) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data, error } = await supabase.from("lessons").update({ title: values.data.title, content: values.data.content || null, learning_objectives: values.data.learningObjectives || null, is_published: values.data.isPublished }).eq("id", lessonId.data).select("id,module_id,title,content,learning_objectives,display_position,is_published").single();
    if (error) throw error;
    return response.json({ success: true, data, message: "Lesson updated." });
  } catch (cause) { return sendUnexpected(next, "Unable to update lesson", cause); }
}

export async function deleteLesson(request, response, next) {
  const lessonId = uuidSchema.safeParse(request.params.lessonId);
  if (!lessonId.success) return sendValidationError(response, lessonId);
  try {
    const { data: lesson, error: lessonError } = await supabase.from("lessons").select("id,module_id").eq("id", lessonId.data).maybeSingle();
    if (lessonError) throw lessonError;
    if (!lesson) return response.status(404).json({ success: false, message: "Lesson not found." });
    const owned = await getOwnedModule(lesson.module_id, request.auth.user.id);
    if (!owned.module) return response.status(owned.status).json({ success: false, message: owned.error });
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId.data);
    if (error) throw error;
    return response.json({ success: true, message: "Lesson deleted." });
  } catch (cause) { return sendUnexpected(next, "Unable to delete lesson", cause); }
}

export async function listCourseAssignments(request, response, next) {
  const courseId = uuidSchema.safeParse(request.params.courseId);
  if (!courseId.success) return sendValidationError(response, courseId);
  try {
    const owned = await getOwnedCourse(courseId.data, request.auth.user.id);
    if (!owned.course) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data, error } = await supabase.from("assignments").select("id,course_id,title,instructions,total_points,due_at,allow_late_submissions,is_published,created_at").eq("course_id", courseId.data).order("created_at", { ascending: false });
    if (error) throw error;
    return response.json({ success: true, data: data || [] });
  } catch (cause) { return sendUnexpected(next, "Unable to load assignments", cause); }
}

export async function createAssignment(request, response, next) {
  const courseId = uuidSchema.safeParse(request.params.courseId);
  const values = assignmentSchema.safeParse(request.body);
  if (!courseId.success || !values.success) return sendValidationError(response, values.success ? courseId : values);
  try {
    const owned = await getOwnedCourse(courseId.data, request.auth.user.id);
    if (!owned.course) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data, error } = await supabase.from("assignments").insert({ course_id: courseId.data, title: values.data.title, instructions: values.data.instructions || null, total_points: values.data.totalPoints, due_at: values.data.dueAt, is_published: values.data.isPublished, allow_late_submissions: values.data.allowLateSubmissions }).select("id,course_id,title,instructions,total_points,due_at,allow_late_submissions,is_published,created_at").single();
    if (error) throw error;
    return response.status(201).json({ success: true, data, message: "Assignment created." });
  } catch (cause) { return sendUnexpected(next, "Unable to create assignment", cause); }
}

export async function updateAssignment(request, response, next) {
  const assignmentId = uuidSchema.safeParse(request.params.assignmentId);
  const values = assignmentSchema.safeParse(request.body);
  if (!assignmentId.success || !values.success) return sendValidationError(response, values.success ? assignmentId : values);
  try {
    const owned = await getOwnedAssignment(assignmentId.data, request.auth.user.id);
    if (!owned.assignment) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data, error } = await supabase.from("assignments").update({ title: values.data.title, instructions: values.data.instructions || null, total_points: values.data.totalPoints, due_at: values.data.dueAt, is_published: values.data.isPublished, allow_late_submissions: values.data.allowLateSubmissions }).eq("id", assignmentId.data).select("id,course_id,title,instructions,total_points,due_at,allow_late_submissions,is_published,created_at").single();
    if (error) throw error;
    return response.json({ success: true, data, message: "Assignment updated." });
  } catch (cause) { return sendUnexpected(next, "Unable to update assignment", cause); }
}

export async function listAssignmentSubmissions(request, response, next) {
  const assignmentId = uuidSchema.safeParse(request.params.assignmentId);
  if (!assignmentId.success) return sendValidationError(response, assignmentId);
  try {
    const owned = await getOwnedAssignment(assignmentId.data, request.auth.user.id);
    if (!owned.assignment) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data, error } = await supabase.from("submissions").select("id,student_id,written_answer,status,submitted_at,score,feedback,graded_at").eq("assignment_id", assignmentId.data).order("submitted_at", { ascending: false });
    if (error) throw error;
    const ids = (data || []).map((item) => item.student_id);
    const { data: profiles, error: profileError } = ids.length ? await supabase.from("profiles").select("id,email,first_name,last_name").in("id", ids) : { data: [], error: null };
    if (profileError) throw profileError;
    const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
    return response.json({ success: true, data: (data || []).map((item) => ({ ...item, student: profileById.get(item.student_id) || null })) });
  } catch (cause) { return sendUnexpected(next, "Unable to load submissions", cause); }
}

export async function gradeSubmission(request, response, next) {
  const submissionId = uuidSchema.safeParse(request.params.submissionId);
  const values = gradeSchema.safeParse(request.body);
  if (!submissionId.success || !values.success) return sendValidationError(response, values.success ? submissionId : values);
  try {
    const { data: submission, error: submissionError } = await supabase.from("submissions").select("id,assignment_id").eq("id", submissionId.data).maybeSingle();
    if (submissionError) throw submissionError;
    if (!submission) return response.status(404).json({ success: false, message: "Submission not found." });
    const owned = await getOwnedAssignment(submission.assignment_id, request.auth.user.id);
    if (!owned.assignment) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data, error } = await supabase.from("submissions").update({ status: "graded", score: values.data.score, feedback: values.data.feedback || null, graded_by: request.auth.user.id, graded_at: new Date().toISOString() }).eq("id", submission.id).select("id,status,score,feedback,graded_at").single();
    if (error) throw error;
    return response.json({ success: true, data, message: "Submission graded." });
  } catch (cause) { return sendUnexpected(next, "Unable to grade submission", cause); }
}

export async function studentLearning(request, response, next) {
  const courseId = uuidSchema.safeParse(request.params.courseId);
  if (!courseId.success) return sendValidationError(response, courseId);
  try {
    const access = await getStudentCourse(courseId.data, request.auth.user.id);
    if (!access.course) return response.status(access.status).json({ success: false, message: access.error });
    const { data: modules, error } = await supabase.from("course_modules").select("id,title,description,display_position").eq("course_id", courseId.data).order("display_position");
    if (error) throw error;
    const moduleIds = (modules || []).map((item) => item.id);
    const { data: lessons, error: lessonError } = moduleIds.length ? await supabase.from("lessons").select("id,module_id,title,content,learning_objectives,display_position").in("module_id", moduleIds).eq("is_published", true).order("display_position") : { data: [], error: null };
    if (lessonError) throw lessonError;
    const lessonIds = (lessons || []).map((item) => item.id);
    const { data: progress, error: progressError } = lessonIds.length ? await supabase.from("lesson_progress").select("lesson_id,is_completed,completed_at").eq("student_id", request.auth.user.id).in("lesson_id", lessonIds) : { data: [], error: null };
    if (progressError) throw progressError;
    const progressByLesson = new Map((progress || []).map((item) => [item.lesson_id, item]));
    const grouped = new Map();
    for (const lesson of lessons || []) grouped.set(lesson.module_id, [...(grouped.get(lesson.module_id) || []), { ...lesson, progress: progressByLesson.get(lesson.id) || { is_completed: false } }]);
    return response.json({ success: true, data: { course: access.course, modules: (modules || []).map((item) => ({ ...item, lessons: grouped.get(item.id) || [] })) } });
  } catch (cause) { return sendUnexpected(next, "Unable to load course learning content", cause); }
}

export async function completeLesson(request, response, next) {
  const lessonId = uuidSchema.safeParse(request.params.lessonId);
  if (!lessonId.success) return sendValidationError(response, lessonId);
  try {
    const { data: lesson, error } = await supabase.from("lessons").select("id,module_id,is_published,course_modules(course_id)").eq("id", lessonId.data).maybeSingle();
    if (error) throw error;
    if (!lesson?.is_published || !lesson.course_modules?.course_id) return response.status(404).json({ success: false, message: "Published lesson not found." });
    const access = await getStudentCourse(lesson.course_modules.course_id, request.auth.user.id);
    if (!access.course) return response.status(access.status).json({ success: false, message: access.error });
    const { data, error: updateError } = await supabase.from("lesson_progress").upsert({ student_id: request.auth.user.id, lesson_id: lesson.id, is_completed: true, completed_at: new Date().toISOString() }, { onConflict: "student_id,lesson_id" }).select("lesson_id,is_completed,completed_at").single();
    if (updateError) throw updateError;
    return response.json({ success: true, data, message: "Lesson marked complete." });
  } catch (cause) { return sendUnexpected(next, "Unable to update lesson progress", cause); }
}

export async function listStudentAssignments(request, response, next) {
  const courseId = uuidSchema.safeParse(request.params.courseId);
  if (!courseId.success) return sendValidationError(response, courseId);
  try {
    const access = await getStudentCourse(courseId.data, request.auth.user.id);
    if (!access.course) return response.status(access.status).json({ success: false, message: access.error });
    const { data: assignments, error } = await supabase.from("assignments").select("id,title,instructions,total_points,due_at,allow_late_submissions,is_published").eq("course_id", courseId.data).eq("is_published", true).order("due_at");
    if (error) throw error;
    const ids = (assignments || []).map((item) => item.id);
    const { data: submissions, error: submissionError } = ids.length ? await supabase.from("submissions").select("id,assignment_id,written_answer,status,submitted_at,score,feedback,graded_at").eq("student_id", request.auth.user.id).in("assignment_id", ids) : { data: [], error: null };
    if (submissionError) throw submissionError;
    const submissionByAssignment = new Map((submissions || []).map((item) => [item.assignment_id, item]));
    return response.json({ success: true, data: (assignments || []).map((item) => ({ ...item, submission: submissionByAssignment.get(item.id) || null })) });
  } catch (cause) { return sendUnexpected(next, "Unable to load assignments", cause); }
}

export async function saveStudentSubmission(request, response, next) {
  const assignmentId = uuidSchema.safeParse(request.params.assignmentId);
  const values = submissionSchema.safeParse(request.body);
  if (!assignmentId.success || !values.success) return sendValidationError(response, values.success ? assignmentId : values);
  try {
    const { data: assignment, error } = await supabase.from("assignments").select("id,course_id,due_at,allow_late_submissions,is_published").eq("id", assignmentId.data).maybeSingle();
    if (error) throw error;
    if (!assignment?.is_published) return response.status(404).json({ success: false, message: "Published assignment not found." });
    const access = await getStudentCourse(assignment.course_id, request.auth.user.id);
    if (!access.course) return response.status(access.status).json({ success: false, message: access.error });
    const isLate = Boolean(values.data.submit && assignment.due_at && new Date(assignment.due_at) < new Date());
    if (isLate && !assignment.allow_late_submissions) return response.status(400).json({ success: false, message: "The due date has passed and late submissions are not allowed." });
    const status = values.data.submit ? (isLate ? "late" : "submitted") : "draft";
    const { data, error: upsertError } = await supabase.from("submissions").upsert({ assignment_id: assignment.id, student_id: request.auth.user.id, written_answer: values.data.writtenAnswer || null, status, submitted_at: values.data.submit ? new Date().toISOString() : null }, { onConflict: "assignment_id,student_id" }).select("id,assignment_id,written_answer,status,submitted_at,score,feedback,graded_at").single();
    if (upsertError) throw upsertError;
    return response.json({ success: true, data, message: values.data.submit ? "Assignment submitted." : "Draft saved." });
  } catch (cause) { return sendUnexpected(next, "Unable to save submission", cause); }
}
