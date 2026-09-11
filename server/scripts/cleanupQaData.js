import { rm } from "node:fs/promises";
import {
  manifestPath,
  productionWarning,
  qaClient,
  QA_COURSE_CODE,
  readManifest,
  report,
} from "./qaFixtures.js";

function validateManifest(manifest) {
  const arrays = ["moduleIds", "lessonIds", "assignmentIds", "announcementIds"];
  if (!manifest?.courseId || !manifest?.teacherId || !manifest?.studentAId) {
    throw new Error("QA manifest is missing required IDs. Cleanup stopped.");
  }
  for (const key of arrays) {
    if (!Array.isArray(manifest[key]) || manifest[key].length === 0) {
      throw new Error(`QA manifest has no ${key}. Cleanup stopped.`);
    }
  }
}

async function assertOnlyQaUserData(db, manifest) {
  const [enrollments, progress, submissions] = await Promise.all([
    db.from("enrollments").select("id,student_id").eq("course_id", manifest.courseId),
    db.from("lesson_progress").select("id,student_id").in("lesson_id", manifest.lessonIds),
    db.from("submissions").select("id,student_id").in("assignment_id", manifest.assignmentIds),
  ]);
  for (const result of [enrollments, progress, submissions]) {
    if (result.error) throw result.error;
  }

  const unexpected = [
    ...(enrollments.data || []),
    ...(progress.data || []),
    ...(submissions.data || []),
  ].filter((row) => row.student_id !== manifest.studentAId);
  if (unexpected.length) {
    throw new Error("Unexpected user data is attached to the QA fixture. Cleanup stopped to protect it.");
  }
  return {
    enrollmentIds: (enrollments.data || []).map((row) => row.id),
    progressIds: (progress.data || []).map((row) => row.id),
    submissionIds: (submissions.data || []).map((row) => row.id),
  };
}

async function deleteByIds(db, table, ids) {
  if (!ids.length) return 0;
  const { error } = await db.from(table).delete().in("id", ids);
  if (error) throw error;
  return ids.length;
}

async function main() {
  productionWarning();
  const manifest = await readManifest();
  if (!manifest) {
    console.log("No local QA manifest exists. Nothing was deleted.");
    return;
  }
  validateManifest(manifest);
  const db = qaClient();

  const { data: course, error: courseError } = await db
    .from("courses")
    .select("id,teacher_id,course_code,title")
    .eq("id", manifest.courseId)
    .maybeSingle();
  if (courseError) throw courseError;
  if (!course || course.teacher_id !== manifest.teacherId || course.course_code !== QA_COURSE_CODE || !course.title.startsWith("[QA]")) {
    throw new Error("Manifest course is not an exact [QA] fixture owned by the configured QA Teacher. Cleanup stopped.");
  }

  const related = await assertOnlyQaUserData(db, manifest);
  const removedProgress = await deleteByIds(db, "lesson_progress", related.progressIds);
  const removedSubmissions = await deleteByIds(db, "submissions", related.submissionIds);
  const removedEnrollments = await deleteByIds(db, "enrollments", related.enrollmentIds);
  const removedAnnouncements = await deleteByIds(db, "announcements", manifest.announcementIds);
  const removedAssignments = await deleteByIds(db, "assignments", manifest.assignmentIds);
  const removedLessons = await deleteByIds(db, "lessons", manifest.lessonIds);
  const removedModules = await deleteByIds(db, "course_modules", manifest.moduleIds);
  const removedCourses = await deleteByIds(db, "courses", [manifest.courseId]);

  await rm(manifestPath);
  report("lesson_progress", "REMOVED", String(removedProgress));
  report("submissions", "REMOVED", String(removedSubmissions));
  report("enrollments", "REMOVED", String(removedEnrollments));
  report("announcements", "REMOVED", String(removedAnnouncements));
  report("assignments", "REMOVED", String(removedAssignments));
  report("lessons", "REMOVED", String(removedLessons));
  report("modules", "REMOVED", String(removedModules));
  report("course", "REMOVED", String(removedCourses));
  console.log("QA cleanup complete. Profiles and Supabase Auth users were preserved.");
}

main().catch((error) => {
  console.error(`QA cleanup stopped: ${error.message}`);
  process.exitCode = 1;
});
