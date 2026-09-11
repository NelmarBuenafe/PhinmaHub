import {
  futureDate,
  loadQaConfig,
  productionWarning,
  qaClient,
  qaJoinCode,
  QA_COURSE_CODE,
  verifyQaProfiles,
  writeManifest,
} from "./qaFixtures.js";

async function findOrCreateCourse(db, teacherId) {
  const { data: existing, error: findError } = await db
    .from("courses")
    .select("id,course_code,title")
    .eq("teacher_id", teacherId)
    .eq("course_code", QA_COURSE_CODE)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) {
    if (!existing.title.startsWith("[QA]")) {
      throw new Error("The configured QA Teacher already has QA_IT101 but it is not a QA fixture. No data was changed.");
    }
    return existing;
  }

  const { data, error } = await db
    .from("courses")
    .insert({
      teacher_id: teacherId,
      course_code: QA_COURSE_CODE,
      title: "[QA] Introduction to Information Technology",
      description: "Automated QA course for PhinmaHub testing.",
      category: "[QA] Information Technology",
      difficulty: "beginner",
      visibility: "private",
      status: "published",
      join_code: qaJoinCode(),
    })
    .select("id,course_code,title")
    .single();
  if (error) throw error;
  return data;
}

async function findOrCreateModule(db, courseId, title, description, position) {
  const { data: existing, error: findError } = await db
    .from("course_modules")
    .select("id,title")
    .eq("course_id", courseId)
    .eq("title", title)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const { data, error } = await db
    .from("course_modules")
    .insert({ course_id: courseId, title, description, display_position: position })
    .select("id,title")
    .single();
  if (error) throw error;
  return data;
}

async function findOrCreateLesson(db, moduleId, title, content, position) {
  const { data: existing, error: findError } = await db
    .from("lessons")
    .select("id,title")
    .eq("module_id", moduleId)
    .eq("title", title)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const { data, error } = await db
    .from("lessons")
    .insert({
      module_id: moduleId,
      title,
      content,
      learning_objectives: "[QA] Verify published lesson availability.",
      display_position: position,
      is_published: true,
    })
    .select("id,title")
    .single();
  if (error) throw error;
  return data;
}

async function findOrCreateAssignment(db, courseId, title, totalPoints, dueAt) {
  const { data: existing, error: findError } = await db
    .from("assignments")
    .select("id,title")
    .eq("course_id", courseId)
    .eq("title", title)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const { data, error } = await db
    .from("assignments")
    .insert({
      course_id: courseId,
      title,
      instructions: `${title}: [QA] automated test instructions.`,
      total_points: totalPoints,
      due_at: dueAt,
      allow_late_submissions: false,
      is_published: true,
    })
    .select("id,title")
    .single();
  if (error) throw error;
  return data;
}

async function findOrCreateAnnouncement(db, courseId, teacherId) {
  const title = "[QA] Welcome Announcement";
  const { data: existing, error: findError } = await db
    .from("announcements")
    .select("id,title")
    .eq("course_id", courseId)
    .eq("title", title)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const { data, error } = await db
    .from("announcements")
    .insert({
      author_id: teacherId,
      course_id: courseId,
      audience: "course",
      title,
      body: "[QA] This announcement verifies course-restricted student visibility.",
      published_at: new Date().toISOString(),
    })
    .select("id,title")
    .single();
  if (error) throw error;
  return data;
}

async function assertStudentBIsUnenrolled(db, courseId, studentBId) {
  if (!studentBId) return;
  const { data, error } = await db
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("student_id", studentBId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  if (data) {
    throw new Error("QA Student B is already enrolled in this QA course. Run qa:cleanup or remove only that QA enrollment before isolation testing.");
  }
}

async function main() {
  productionWarning();
  const config = loadQaConfig();
  const db = qaClient();
  await verifyQaProfiles(db, config);

  const course = await findOrCreateCourse(db, config.teacherId);
  await assertStudentBIsUnenrolled(db, course.id, config.studentBId);

  const moduleOne = await findOrCreateModule(
    db,
    course.id,
    "[QA] Module 1",
    "[QA] First module for progress testing.",
    0,
  );
  const moduleTwo = await findOrCreateModule(
    db,
    course.id,
    "[QA] Module 2",
    "[QA] Second module for progress testing.",
    1,
  );
  const lessonOne = await findOrCreateLesson(db, moduleOne.id, "[QA] Lesson 1", "[QA] Lesson 1 content.", 0);
  const lessonTwo = await findOrCreateLesson(db, moduleOne.id, "[QA] Lesson 2", "[QA] Lesson 2 content.", 1);
  const lessonThree = await findOrCreateLesson(db, moduleTwo.id, "[QA] Lesson 3", "[QA] Lesson 3 content.", 0);

  const { data: enrollment, error: enrollmentError } = await db
    .from("enrollments")
    .upsert(
      { course_id: course.id, student_id: config.studentAId, status: "active" },
      { onConflict: "course_id,student_id" },
    )
    .select("id")
    .single();
  if (enrollmentError) throw enrollmentError;

  const assignmentOne = await findOrCreateAssignment(db, course.id, "[QA] Assignment 1", 100, futureDate(14));
  const assignmentTwo = await findOrCreateAssignment(db, course.id, "[QA] Assignment 2", 50, futureDate(21));
  const announcement = await findOrCreateAnnouncement(db, course.id, config.teacherId);

  const manifest = {
    version: 1,
    createdBy: "PhinmaHub QA fixture system",
    teacherId: config.teacherId,
    studentAId: config.studentAId,
    studentBId: config.studentBId,
    courseId: course.id,
    enrollmentId: enrollment.id,
    moduleIds: [moduleOne.id, moduleTwo.id],
    lessonIds: [lessonOne.id, lessonTwo.id, lessonThree.id],
    assignmentIds: [assignmentOne.id, assignmentTwo.id],
    announcementIds: [announcement.id],
  };
  await writeManifest(manifest);

  console.log("QA fixture seed complete.");
  console.log(`Course: ${QA_COURSE_CODE} (${course.id})`);
  console.log("Modules: 2 | Published lessons: 3 | Published assignments: 2 | Announcement: 1");
  console.log("Student A is enrolled. Student B remains unenrolled when configured.");
  console.log("No lesson_progress rows are seeded; use qa:reset for a fresh 0% progress state.");
}

main().catch((error) => {
  console.error(`QA seed stopped: ${error.message}`);
  process.exitCode = 1;
});
