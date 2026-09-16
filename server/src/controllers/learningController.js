import { z } from "zod";
import { supabase } from "../config/supabase.js";
import { publicMaterialFields, recalculateStoredLessonProgress } from "./lessonMaterialController.js";
import { attachSubmissionAttachments } from "./submissionAttachmentController.js";
import { deriveMaterialLearningProgress } from "../utils/materialProgress.js";

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
  score: z.coerce.number(),
  feedback: z.string().trim().max(12000).optional().default(""),
}).strict();
const readingProgressSchema = z.object({
  checkpointPercent: z.coerce.number().int().min(1).max(100),
}).strict();
const sectionSchema = z.object({
  title: z.string().trim().min(1, "Section title is required.").max(200),
  content: z.string().trim().max(30000).optional().default(""),
  isRequired: z.boolean().optional().default(true),
  isPublished: z.boolean().optional().default(true),
}).strict();
const sectionOrderSchema = z.object({
  sectionIds: z.array(z.string().uuid()).min(1),
}).strict();

function readingCheckpointPercents(content) {
  const blockCount = String(content || "").split(/\n\s*\n/).filter((block) => block.trim()).length;
  if (!blockCount) return [];
  const checkpointCount = blockCount <= 2 ? 1 : blockCount <= 4 ? 2 : blockCount <= 8 ? 3 : Math.min(6, Math.max(4, Math.ceil(blockCount / 3)));
  return Array.from({ length: checkpointCount }, (_, index) => Math.round(((index + 1) / checkpointCount) * 100));
}

export function validateGradeScore(score, totalPoints) {
  const numericScore = Number(score);
  const maximum = Number(totalPoints);

  if (!Number.isFinite(numericScore) || !Number.isFinite(maximum)) {
    return { valid: false, message: "Score must be a valid number." };
  }
  if (numericScore < 0 || numericScore > maximum) {
    return {
      valid: false,
      message: `Score must be between 0 and ${maximum}.`,
    };
  }
  return { valid: true, score: numericScore };
}

export function courseAllowsStudentMutation(course) {
  return course?.status !== "archived";
}

export function canEditSubmission(status) {
  return status !== "graded";
}

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
    .select("course_id,courses(id,teacher_id,course_code,title,description,status,visibility)")
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

async function getOwnedLesson(lessonId, teacherId) {
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id,module_id,title")
    .eq("id", lessonId)
    .maybeSingle();
  if (error) throw error;
  if (!lesson) return { error: "Lesson not found.", status: 404 };
  const result = await getOwnedModule(lesson.module_id, teacherId);
  return result.module ? { lesson, course: result.course } : result;
}

async function getOwnedAssignment(assignmentId, teacherId) {
  const { data: assignment, error } = await supabase
    .from("assignments")
    .select("id,course_id,title,total_points")
    .eq("id", assignmentId)
    .maybeSingle();
  if (error) throw error;
  if (!assignment) return { error: "Assignment not found.", status: 404 };
  const result = await getOwnedCourse(assignment.course_id, teacherId);
  return result.course ? { assignment, course: result.course } : result;
}

async function removeLessonMaterialFiles(lessonIds) {
  if (!lessonIds.length) return;
  const { data: materials, error } = await supabase
    .from("lesson_materials")
    .select("storage_path")
    .in("lesson_id", lessonIds)
    .not("storage_path", "is", null);
  if (error?.code === "PGRST205") return;
  if (error) throw error;

  const paths = (materials || []).map((material) => material.storage_path).filter(Boolean);
  if (!paths.length) return;
  const { error: storageError } = await supabase.storage
    .from("lesson-materials")
    .remove(paths);
  if (storageError) throw storageError;
}

export function attachLessonCompletionState(lessons, progressRecords) {
  const progressByLesson = new Map(
    (progressRecords || []).map((item) => [item.lesson_id, item]),
  );

  return (lessons || []).map((lesson) => {
    const progress = progressByLesson.get(lesson.id);
    return {
      ...lesson,
      completion: {
        isCompleted: progress?.is_completed === true,
        completedAt: progress?.completed_at || null,
        progressPercent: progress?.progress_percent || 0,
      },
    };
  });
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
    const { data: lessons, error: lessonError } = await supabase
      .from("lessons")
      .select("id")
      .eq("module_id", moduleId.data);
    if (lessonError) throw lessonError;
    await removeLessonMaterialFiles((lessons || []).map((lesson) => lesson.id));
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
    const { error: sectionError } = await supabase.from("lesson_sections").insert({
      lesson_id: data.id,
      title: "Lesson Content",
      content: values.data.content || null,
      display_position: 0,
      is_required: true,
      is_published: values.data.isPublished,
    });
    if (sectionError) throw sectionError;
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
    const { error: sectionError } = await supabase
      .from("lesson_sections")
      .update({ content: values.data.content || null, is_published: values.data.isPublished })
      .eq("lesson_id", lessonId.data)
      .eq("display_position", 0)
      .eq("title", "Lesson Content");
    if (sectionError) throw sectionError;
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
    await removeLessonMaterialFiles([lesson.id]);
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId.data);
    if (error) throw error;
    return response.json({ success: true, message: "Lesson deleted." });
  } catch (cause) { return sendUnexpected(next, "Unable to delete lesson", cause); }
}

export async function listLessonSections(request, response, next) {
  const lessonId = uuidSchema.safeParse(request.params.lessonId);
  if (!lessonId.success) return sendValidationError(response, lessonId);
  try {
    const owned = await getOwnedLesson(lessonId.data, request.auth.user.id);
    if (!owned.lesson) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data, error } = await supabase
      .from("lesson_sections")
      .select("id,lesson_id,title,content,display_position,is_required,is_published,created_at,updated_at")
      .eq("lesson_id", lessonId.data)
      .order("display_position");
    if (error) throw error;
    return response.json({ success: true, data: data || [] });
  } catch (cause) { return sendUnexpected(next, "Unable to load lesson sections", cause); }
}

export async function createLessonSection(request, response, next) {
  const lessonId = uuidSchema.safeParse(request.params.lessonId);
  const values = sectionSchema.safeParse(request.body);
  if (!lessonId.success || !values.success) return sendValidationError(response, values.success ? lessonId : values);
  try {
    const owned = await getOwnedLesson(lessonId.data, request.auth.user.id);
    if (!owned.lesson) return response.status(owned.status).json({ success: false, message: owned.error });
    const displayPosition = await nextPosition("lesson_sections", "lesson_id", lessonId.data);
    const { data, error } = await supabase
      .from("lesson_sections")
      .insert({ lesson_id: lessonId.data, title: values.data.title, content: values.data.content || null, is_required: values.data.isRequired, is_published: values.data.isPublished, display_position: displayPosition })
      .select("id,lesson_id,title,content,display_position,is_required,is_published,created_at,updated_at")
      .single();
    if (error) throw error;
    return response.status(201).json({ success: true, data, message: "Lesson section added." });
  } catch (cause) { return sendUnexpected(next, "Unable to add lesson section", cause); }
}

export async function updateLessonSection(request, response, next) {
  const sectionId = uuidSchema.safeParse(request.params.sectionId);
  const values = sectionSchema.safeParse(request.body);
  if (!sectionId.success || !values.success) return sendValidationError(response, values.success ? sectionId : values);
  try {
    const { data: section, error: sectionError } = await supabase.from("lesson_sections").select("id,lesson_id").eq("id", sectionId.data).maybeSingle();
    if (sectionError) throw sectionError;
    if (!section) return response.status(404).json({ success: false, message: "Section not found." });
    const owned = await getOwnedLesson(section.lesson_id, request.auth.user.id);
    if (!owned.lesson) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data, error } = await supabase
      .from("lesson_sections")
      .update({ title: values.data.title, content: values.data.content || null, is_required: values.data.isRequired, is_published: values.data.isPublished })
      .eq("id", section.id)
      .select("id,lesson_id,title,content,display_position,is_required,is_published,created_at,updated_at")
      .single();
    if (error) throw error;
    await recalculateStoredLessonProgress(section.lesson_id);
    return response.json({ success: true, data, message: "Lesson section updated." });
  } catch (cause) { return sendUnexpected(next, "Unable to update lesson section", cause); }
}

export async function deleteLessonSection(request, response, next) {
  const sectionId = uuidSchema.safeParse(request.params.sectionId);
  if (!sectionId.success) return sendValidationError(response, sectionId);
  try {
    const { data: section, error: sectionError } = await supabase.from("lesson_sections").select("id,lesson_id").eq("id", sectionId.data).maybeSingle();
    if (sectionError) throw sectionError;
    if (!section) return response.status(404).json({ success: false, message: "Section not found." });
    const owned = await getOwnedLesson(section.lesson_id, request.auth.user.id);
    if (!owned.lesson) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data: materials, error: materialError } = await supabase
      .from("lesson_materials")
      .select("storage_path")
      .eq("section_id", section.id)
      .not("storage_path", "is", null);
    if (materialError) throw materialError;
    const storagePaths = (materials || []).map((material) => material.storage_path).filter(Boolean);
    if (storagePaths.length) {
      const { error: storageError } = await supabase.storage.from("lesson-materials").remove(storagePaths);
      if (storageError) throw storageError;
    }
    const { error } = await supabase.from("lesson_sections").delete().eq("id", section.id);
    if (error) throw error;
    await recalculateStoredLessonProgress(section.lesson_id);
    return response.json({ success: true, message: "Lesson section removed." });
  } catch (cause) { return sendUnexpected(next, "Unable to remove lesson section", cause); }
}

export async function reorderLessonSections(request, response, next) {
  const lessonId = uuidSchema.safeParse(request.params.lessonId);
  const values = sectionOrderSchema.safeParse(request.body);
  if (!lessonId.success || !values.success) return sendValidationError(response, values.success ? lessonId : values);
  try {
    const owned = await getOwnedLesson(lessonId.data, request.auth.user.id);
    if (!owned.lesson) return response.status(owned.status).json({ success: false, message: owned.error });
    const { data: sections, error } = await supabase.from("lesson_sections").select("id").eq("lesson_id", lessonId.data);
    if (error) throw error;
    const actualIds = new Set((sections || []).map((section) => section.id));
    const requestedIds = new Set(values.data.sectionIds);
    if (actualIds.size !== requestedIds.size || [...actualIds].some((id) => !requestedIds.has(id))) {
      return response.status(400).json({ success: false, message: "Section order must include every section once." });
    }
    for (const [index, sectionId] of values.data.sectionIds.entries()) {
      const { error: updateError } = await supabase.from("lesson_sections").update({ display_position: 1000000 + index }).eq("id", sectionId);
      if (updateError) throw updateError;
    }
    for (const [index, sectionId] of values.data.sectionIds.entries()) {
      const { error: updateError } = await supabase.from("lesson_sections").update({ display_position: index }).eq("id", sectionId);
      if (updateError) throw updateError;
    }
    return response.json({ success: true, message: "Section order updated." });
  } catch (cause) { return sendUnexpected(next, "Unable to reorder lesson sections", cause); }
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

export async function deleteAssignment(request, response, next) {
  const assignmentId = uuidSchema.safeParse(request.params.assignmentId);
  if (!assignmentId.success) return sendValidationError(response, assignmentId);
  try {
    const owned = await getOwnedAssignment(assignmentId.data, request.auth.user.id);
    if (!owned.assignment) {
      return response.status(owned.status).json({ success: false, message: owned.error });
    }

    const { count, error: submissionError } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("assignment_id", assignmentId.data);
    if (submissionError) throw submissionError;
    if (count > 0) {
      return response.status(409).json({
        success: false,
        message: "This assignment cannot be deleted because Student submissions already exist.",
      });
    }

    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", assignmentId.data);
    if (error) throw error;
    return response.json({ success: true, message: "Assignment deleted." });
  } catch (cause) {
    return sendUnexpected(next, "Unable to delete assignment", cause);
  }
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
    const withAttachments = await attachSubmissionAttachments(data || []);
    return response.json({ success: true, data: withAttachments.map((item) => ({ ...item, student: profileById.get(item.student_id) || null })) });
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
    const grade = validateGradeScore(values.data.score, owned.assignment.total_points);
    if (!grade.valid) return response.status(400).json({ success: false, message: grade.message });
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
    const { data: teacher, error: teacherError } = await supabase
      .from("profiles")
      .select("first_name,last_name")
      .eq("id", access.course.teacher_id)
      .maybeSingle();
    if (teacherError) throw teacherError;

    const { data: modules, error } = await supabase.from("course_modules").select("id,title,description,display_position").eq("course_id", courseId.data).order("display_position");
    if (error) throw error;
    const moduleIds = (modules || []).map((item) => item.id);
    const { data: lessons, error: lessonError } = moduleIds.length ? await supabase.from("lessons").select("id,module_id,title,content,learning_objectives,display_position").in("module_id", moduleIds).eq("is_published", true).order("display_position") : { data: [], error: null };
    if (lessonError) throw lessonError;
    const lessonIds = (lessons || []).map((item) => item.id);
    const sectionResult = lessonIds.length
      ? await supabase
          .from("lesson_sections")
          .select("id,lesson_id,title,content,display_position,is_required,is_published")
          .in("lesson_id", lessonIds)
          .eq("is_published", true)
          .order("display_position")
      : { data: [], error: null };
    if (sectionResult.error) throw sectionResult.error;
    const sections = sectionResult.data || [];
    const materialResult = lessonIds.length
      ? await supabase
          .from("lesson_materials")
          .select(publicMaterialFields(true))
          .in("lesson_id", lessonIds)
          .order("sort_order")
          .order("created_at")
      : { data: [], error: null };
    if (materialResult.error && materialResult.error.code !== "PGRST205") {
      throw materialResult.error;
    }
    // Never expose private bucket paths to students. The source marker tells the
    // client which protected player to render; signed URLs still come from the
    // access endpoint after enrollment is checked.
    const materials = (materialResult.data || []).map(({ storage_path, ...material }) => ({
      ...material,
      source_type: storage_path ? "upload" : "external",
    }));
    const materialIds = materials.map((item) => item.id);
    const sectionIds = sections.map((item) => item.id);
    const { data: materialProgress, error: materialProgressError } = materialIds.length
      ? await supabase.from("lesson_material_progress").select("material_id,progress_percent,is_completed,completed_at,watched_ranges,last_position_seconds").eq("student_id", request.auth.user.id).in("material_id", materialIds)
      : { data: [], error: null };
    if (materialProgressError) throw materialProgressError;
    const { data: readingProgress, error: readingProgressError } = sectionIds.length
      ? await supabase.from("lesson_section_reading_progress").select("section_id,progress_percent").eq("student_id", request.auth.user.id).in("section_id", sectionIds)
      : { data: [], error: null };
    if (readingProgressError) throw readingProgressError;
    const materialsByLesson = new Map();
    for (const material of materials || []) {
      materialsByLesson.set(material.lesson_id, [
        ...(materialsByLesson.get(material.lesson_id) || []),
        material,
      ]);
    }
    const sectionsByLesson = new Map();
    for (const section of sections) {
      sectionsByLesson.set(section.lesson_id, [...(sectionsByLesson.get(section.lesson_id) || []), section]);
    }
    const lessonsWithCompletion = (lessons || []).map((lesson) => {
      const lessonSections = sectionsByLesson.get(lesson.id) || [];
      const lessonMaterials = materialsByLesson.get(lesson.id) || [];
      const derived = deriveMaterialLearningProgress(lessonSections, lessonMaterials, materialProgress || [], readingProgress || []);
      return {
        ...lesson,
        completion: derived.lesson,
        sections: lessonSections.map((section) => ({
          ...section,
          completion: derived.sectionStates.get(section.id),
          materials: (lessonMaterials.filter((material) => material.section_id === section.id)).map((material) => ({
            ...material,
            completion: derived.materialStates.get(material.id),
          })),
        })),
        // Kept briefly for older clients. New clients read section.materials.
        materials: lessonMaterials.map((material) => ({
          ...material,
          completion: derived.materialStates.get(material.id),
        })),
      };
    });
    if (access.course.status !== "archived" && lessonsWithCompletion.length) {
      const { error: persistError } = await supabase.from("lesson_progress").upsert(
        lessonsWithCompletion.map((lesson) => ({
          student_id: request.auth.user.id,
          lesson_id: lesson.id,
          progress_percent: lesson.completion.progressPercent,
          is_completed: lesson.completion.isCompleted,
          completed_at: lesson.completion.isCompleted ? new Date().toISOString() : null,
        })),
        { onConflict: "student_id,lesson_id" },
      );
      if (persistError) throw persistError;
    }
    const grouped = new Map();
    for (const lesson of lessonsWithCompletion) {
      grouped.set(lesson.module_id, [
        ...(grouped.get(lesson.module_id) || []),
        lesson,
      ]);
    }
    return response.json({
      success: true,
      data: {
        course: {
          ...access.course,
          teacher_name:
            [teacher?.first_name, teacher?.last_name].filter(Boolean).join(" ") ||
            "Faculty instructor",
        },
        modules: (modules || []).map((item) => ({
          ...item,
          lessons: grouped.get(item.id) || [],
        })),
      },
    });
  } catch (cause) { return sendUnexpected(next, "Unable to load course learning content", cause); }
}

export async function saveSectionReadingProgress(request, response, next) {
  const sectionId = uuidSchema.safeParse(request.params.sectionId);
  const values = readingProgressSchema.safeParse(request.body);
  if (!sectionId.success || !values.success) return sendValidationError(response, values.success ? sectionId : values);
  try {
    const { data: section, error: sectionError } = await supabase
      .from("lesson_sections")
      .select("id,lesson_id,content,is_required,is_published,lessons(id,is_published,module_id,course_modules(course_id))")
      .eq("id", sectionId.data)
      .maybeSingle();
    if (sectionError) throw sectionError;
    const lesson = section?.lessons;
    const courseId = lesson?.course_modules?.course_id;
    if (!section?.is_published || !lesson?.is_published || !courseId) {
      return response.status(404).json({ success: false, message: "Published lesson section not found." });
    }
    const allowedCheckpoints = readingCheckpointPercents(section.content);
    if (!allowedCheckpoints.includes(values.data.checkpointPercent)) {
      return response.status(400).json({ success: false, message: "Reading progress must match a valid section checkpoint." });
    }
    const access = await getStudentCourse(courseId, request.auth.user.id);
    if (!access.course) return response.status(access.status).json({ success: false, message: access.error });
    if (!courseAllowsStudentMutation(access.course)) {
      return response.status(409).json({ success: false, message: "This archived course is read-only and reading progress can no longer be changed." });
    }
    const { error: saveError } = await supabase.from("lesson_section_reading_progress").upsert({
      student_id: request.auth.user.id,
      section_id: section.id,
      progress_percent: values.data.checkpointPercent,
    }, { onConflict: "student_id,section_id" });
    if (saveError) throw saveError;

    const [sectionResult, materialResult] = await Promise.all([
      supabase.from("lesson_sections").select("id,lesson_id,content,is_required").eq("lesson_id", section.lesson_id).eq("is_published", true),
      supabase.from("lesson_materials").select("id,section_id,is_required").eq("lesson_id", section.lesson_id),
    ]);
    if (sectionResult.error) throw sectionResult.error;
    if (materialResult.error) throw materialResult.error;
    const materialIds = (materialResult.data || []).map((item) => item.id);
    const sectionIds = (sectionResult.data || []).map((item) => item.id);
    const [materialProgressResult, readingProgressResult] = await Promise.all([
      materialIds.length ? supabase.from("lesson_material_progress").select("material_id,progress_percent,is_completed,completed_at").eq("student_id", request.auth.user.id).in("material_id", materialIds) : Promise.resolve({ data: [], error: null }),
      sectionIds.length ? supabase.from("lesson_section_reading_progress").select("section_id,progress_percent").eq("student_id", request.auth.user.id).in("section_id", sectionIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (materialProgressResult.error) throw materialProgressResult.error;
    if (readingProgressResult.error) throw readingProgressResult.error;
    const derived = deriveMaterialLearningProgress(sectionResult.data || [], materialResult.data || [], materialProgressResult.data || [], readingProgressResult.data || []);
    const { error: lessonProgressError } = await supabase.from("lesson_progress").upsert({
      student_id: request.auth.user.id,
      lesson_id: section.lesson_id,
      progress_percent: derived.lesson.progressPercent,
      is_completed: derived.lesson.isCompleted,
      completed_at: derived.lesson.isCompleted ? new Date().toISOString() : null,
    }, { onConflict: "student_id,lesson_id" });
    if (lessonProgressError) throw lessonProgressError;
    return response.json({
      success: true,
      data: { section: derived.sectionStates.get(section.id), lesson: derived.lesson },
      message: "Reading checkpoint saved.",
    });
  } catch (cause) { return sendUnexpected(next, "Unable to save reading progress", cause); }
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
    if (!courseAllowsStudentMutation(access.course)) {
      return response.status(409).json({
        success: false,
        message: "This archived course is read-only and submissions can no longer be changed.",
      });
    }
    const { data: existing, error: existingError } = await supabase
      .from("submissions")
      .select("id,status")
      .eq("assignment_id", assignment.id)
      .eq("student_id", request.auth.user.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!canEditSubmission(existing?.status)) {
      return response.status(409).json({
        success: false,
        message: "This assignment has already been graded and can no longer be edited.",
      });
    }
    const isLate = Boolean(values.data.submit && assignment.due_at && new Date(assignment.due_at) < new Date());
    if (isLate && !assignment.allow_late_submissions) return response.status(400).json({ success: false, message: "The due date has passed and late submissions are not allowed." });
    const status = values.data.submit ? (isLate ? "late" : "submitted") : "draft";
    const { data, error: upsertError } = await supabase.from("submissions").upsert({ assignment_id: assignment.id, student_id: request.auth.user.id, written_answer: values.data.writtenAnswer || null, status, submitted_at: values.data.submit ? new Date().toISOString() : null }, { onConflict: "assignment_id,student_id" }).select("id,assignment_id,written_answer,status,submitted_at,score,feedback,graded_at").single();
    if (upsertError) throw upsertError;
    return response.json({ success: true, data, message: values.data.submit ? "Assignment submitted." : "Draft saved." });
  } catch (cause) { return sendUnexpected(next, "Unable to save submission", cause); }
}
