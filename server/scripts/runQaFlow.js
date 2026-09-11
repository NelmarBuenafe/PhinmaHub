import {
  loadQaConfig,
  qaClient,
  readManifest,
  report,
  verifyQaProfiles,
} from "./qaFixtures.js";

function check(name, condition, detail) {
  report(name, condition ? "PASS" : "FAIL", detail);
  return condition;
}

async function apiRequest(token, path, options = {}) {
  const baseUrl = process.env.QA_API_URL || "http://localhost:5000/api";
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

async function runAuthenticatedFlow(db, manifest, config) {
  const studentToken = process.env.QA_STUDENT_A_ACCESS_TOKEN;
  const teacherToken = process.env.QA_TEACHER_ACCESS_TOKEN;
  if (!studentToken || !teacherToken || process.env.QA_RUN_MUTATIONS !== "true") {
    report("Student/Teacher API flow", "MANUAL TEST REQUIRED", "Set local QA access tokens and QA_RUN_MUTATIONS=true to run real authenticated API checks.");
    return;
  }

  const [lessonOne, lessonTwo, lessonThree] = manifest.lessonIds;
  const [assignmentOne] = manifest.assignmentIds;
  const initialDashboard = await apiRequest(studentToken, "/student/dashboard");
  const initial = initialDashboard.body?.data?.summary;
  if (!check("Dashboard initial state", initialDashboard.status === 200 && initial?.enrolledCourses === 1 && initial?.completedLessons === 0 && initial?.pendingAssignments === 2 && initial?.overallProgress === 0, "1 course, 0 lessons, 2 pending, 0%")) {
    report("Lesson/assignment mutation tests", "SKIPPED WITH REASON", "Run qa:reset, then qa:seed before executing the authenticated flow.");
    return;
  }

  const completeOne = await apiRequest(studentToken, `/student/lessons/${lessonOne}/complete`, { method: "POST" });
  const completeAgain = await apiRequest(studentToken, `/student/lessons/${lessonOne}/complete`, { method: "POST" });
  const lessonOneProgress = await db.from("lesson_progress").select("id").eq("student_id", config.studentAId).eq("lesson_id", lessonOne);
  const afterOne = await apiRequest(studentToken, "/student/dashboard");
  check("Lesson 1 completion", completeOne.status === 200, "real Student completion endpoint");
  check("Duplicate completion", completeAgain.status === 200 && lessonOneProgress.data?.length === 1, "one lesson_progress row");
  check("Progress after Lesson 1", afterOne.body?.data?.summary?.completedLessons === 1 && afterOne.body?.data?.summary?.overallProgress === 33, "1 of 3 lessons / 33%");

  const completeTwo = await apiRequest(studentToken, `/student/lessons/${lessonTwo}/complete`, { method: "POST" });
  const afterTwo = await apiRequest(studentToken, "/student/dashboard");
  check("Lesson 2 completion", completeTwo.status === 200, "real Student completion endpoint");
  check("Progress after Lesson 2", afterTwo.body?.data?.summary?.completedLessons === 2 && afterTwo.body?.data?.summary?.overallProgress === 67, "2 of 3 lessons / 67%");

  const completeThree = await apiRequest(studentToken, `/student/lessons/${lessonThree}/complete`, { method: "POST" });
  const afterThree = await apiRequest(studentToken, "/student/dashboard");
  check("Lesson 3 completion", completeThree.status === 200, "real Student completion endpoint");
  check("Progress after Lesson 3", afterThree.body?.data?.summary?.completedLessons === 3 && afterThree.body?.data?.summary?.overallProgress === 100, "3 of 3 lessons / 100%");

  const draft = await apiRequest(studentToken, `/student/assignments/${assignmentOne}/submission`, {
    method: "PUT",
    body: { writtenAnswer: "[QA] Draft answer.", submit: false },
  });
  const draftRead = await apiRequest(studentToken, `/student/courses/${manifest.courseId}/assignments`);
  const draftSubmission = draftRead.body?.data?.find((item) => item.id === assignmentOne)?.submission;
  check("Assignment draft", draft.status === 200 && draftSubmission?.status === "draft" && draftSubmission.written_answer === "[QA] Draft answer.", "draft persists after refetch");

  const submitted = await apiRequest(studentToken, `/student/assignments/${assignmentOne}/submission`, {
    method: "PUT",
    body: { writtenAnswer: "[QA] Final answer.", submit: true },
  });
  const submittedRead = await apiRequest(studentToken, `/student/courses/${manifest.courseId}/assignments`);
  const submittedAssignment = submittedRead.body?.data?.find((item) => item.id === assignmentOne)?.submission;
  check("Final submission", submitted.status === 200 && submittedAssignment?.status === "submitted" && Boolean(submittedAssignment?.submitted_at), "submitted_at is present");
  check("Pending assignments after submit", submittedRead.body?.data?.filter((item) => !item.submission || item.submission.status === "draft").length === 1, "2 pending → 1 pending");

  const teacherSubmissions = await apiRequest(teacherToken, `/teacher/assignments/${assignmentOne}/submissions`);
  const studentSubmission = teacherSubmissions.body?.data?.find((item) => item.student_id === config.studentAId);
  const grade = studentSubmission
    ? await apiRequest(teacherToken, `/teacher/submissions/${studentSubmission.id}/grade`, {
        method: "PUT",
        body: { score: 85, feedback: "[QA] Good work." },
      })
    : { status: 0 };
  const gradedRead = await apiRequest(studentToken, `/student/courses/${manifest.courseId}/assignments`);
  const gradedSubmission = gradedRead.body?.data?.find((item) => item.id === assignmentOne)?.submission;
  check("Teacher grading", grade.status === 200, "85 points with QA feedback");
  check("Student grade display data", gradedSubmission?.status === "graded" && gradedSubmission?.score === 85 && gradedSubmission?.feedback === "[QA] Good work.", "Student API returns score and feedback");

  const studentTeacherRoute = await apiRequest(studentToken, "/teacher/dashboard");
  const studentAdminRoute = await apiRequest(studentToken, "/admin/dashboard");
  const teacherAdminRoute = await apiRequest(teacherToken, "/admin/dashboard");
  check("Student → Teacher API", studentTeacherRoute.status === 403, "403 expected");
  check("Student → Admin API", studentAdminRoute.status === 403, "403 expected");
  check("Teacher → Admin API", teacherAdminRoute.status === 403, "403 expected");

  const announcementRead = await apiRequest(studentToken, "/student/announcements");
  check("Student A announcement", announcementRead.status === 200 && announcementRead.body?.data?.some((item) => item.id === manifest.announcementIds[0]), "course QA announcement is visible");

  if (config.studentBId && process.env.QA_STUDENT_B_ACCESS_TOKEN) {
    const studentBToken = process.env.QA_STUDENT_B_ACCESS_TOKEN;
    const before = await db.from("lesson_progress").select("id").eq("student_id", config.studentBId).in("lesson_id", manifest.lessonIds);
    const [learning, completion, assignment, announcements] = await Promise.all([
      apiRequest(studentBToken, `/student/courses/${manifest.courseId}/learning`),
      apiRequest(studentBToken, `/student/lessons/${lessonOne}/complete`, { method: "POST" }),
      apiRequest(studentBToken, `/student/assignments/${assignmentOne}/submission`, { method: "PUT", body: { writtenAnswer: "[QA] Unauthorized.", submit: true } }),
      apiRequest(studentBToken, "/student/announcements"),
    ]);
    const after = await db.from("lesson_progress").select("id").eq("student_id", config.studentBId).in("lesson_id", manifest.lessonIds);
    check("Unenrolled course access", learning.status === 403, "Student B denied");
    check("Unauthorized lesson completion", completion.status === 403 && before.data?.length === after.data?.length, "no progress row created");
    check("Unauthorized assignment submission", assignment.status === 403, "Student B denied");
    check("Course announcement isolation", announcements.status === 200 && !announcements.body?.data?.some((item) => item.id === manifest.announcementIds[0]), "Student B cannot see QA course announcement");
  } else {
    report("Cross-student isolation", "MANUAL TEST REQUIRED", "Configure QA Student B and a local short-lived access token.");
  }
}

async function main() {
  const manifest = await readManifest();
  if (!manifest) {
    throw new Error("No QA fixture manifest found. Run npm run qa:seed after configuring server/.env.qa.");
  }

  const config = loadQaConfig();
  const db = qaClient();
  await verifyQaProfiles(db, config);
  if (manifest.teacherId !== config.teacherId || manifest.studentAId !== config.studentAId) {
    throw new Error("The local QA configuration does not match the fixture manifest. QA test stopped.");
  }

  const [courseResult, enrollmentResult, lessonsResult, assignmentsResult, announcementResult, progressResult] = await Promise.all([
    db.from("courses").select("id,course_code,title,status,visibility").eq("id", manifest.courseId).maybeSingle(),
    db.from("enrollments").select("id,status").eq("course_id", manifest.courseId).eq("student_id", manifest.studentAId).maybeSingle(),
    db.from("lessons").select("id,is_published").in("id", manifest.lessonIds),
    db.from("assignments").select("id,title,total_points,due_at,is_published").in("id", manifest.assignmentIds),
    db.from("announcements").select("id,title,audience,published_at").in("id", manifest.announcementIds),
    db.from("lesson_progress").select("id,lesson_id,is_completed,completed_at").eq("student_id", manifest.studentAId).in("lesson_id", manifest.lessonIds),
  ]);
  for (const result of [courseResult, enrollmentResult, lessonsResult, assignmentsResult, announcementResult, progressResult]) {
    if (result.error) throw result.error;
  }

  const course = courseResult.data;
  const lessons = lessonsResult.data || [];
  const assignments = assignmentsResult.data || [];
  const announcements = announcementResult.data || [];
  const completed = (progressResult.data || []).filter((item) => item.is_completed);
  const assignmentOne = assignments.find((item) => item.title === "[QA] Assignment 1");
  const assignmentTwo = assignments.find((item) => item.title === "[QA] Assignment 2");
  const duplicateLessonIds = completed
    .map((item) => item.lesson_id)
    .filter((id, index, all) => all.indexOf(id) !== index);

  const results = [
    check("QA course", course?.course_code === "QA_IT101" && course?.title.startsWith("[QA]"), "isolated QA course found"),
    check("Student A enrollment", enrollmentResult.data?.status === "active", "active enrollment"),
    check("Published lessons", lessons.length === 3 && lessons.every((lesson) => lesson.is_published), `${lessons.length} of 3 published`),
    check("Published assignments", assignments.length === 2 && assignments.every((item) => item.is_published), `${assignments.length} of 2 published`),
    check("Assignment points", assignments.some((item) => item.total_points === 100) && assignments.some((item) => item.total_points === 50), "100 and 50 points"),
    check("Assignment due-date order", Boolean(assignmentOne?.due_at) && Boolean(assignmentTwo?.due_at) && new Date(assignmentOne.due_at) < new Date(assignmentTwo.due_at), "Assignment 1 is due before Assignment 2"),
    check("Course announcement", announcements.length === 1 && announcements[0].audience === "course" && Boolean(announcements[0].published_at), "published QA announcement"),
    check("Lesson progress uniqueness", duplicateLessonIds.length === 0, `${completed.length} completed of 3`),
  ];

  if (completed.length === 0) {
    report("Initial dashboard progress", "PASS", "0 completed lessons / 0% expected");
  } else {
    report("Initial dashboard progress", "SKIPPED WITH REASON", `${completed.length} QA lesson(s) are already complete; run qa:reset for a 0% baseline.`);
  }

  report("Teacher course ownership", "MANUAL TEST REQUIRED", "A second dedicated QA Teacher is not configured.");

  if (results.every(Boolean)) {
    console.log("Fixture data checks passed.");
  } else {
    process.exitCode = 1;
  }

  await runAuthenticatedFlow(db, manifest, config);
}

main().catch((error) => {
  console.error(`QA test stopped: ${error.message}`);
  process.exitCode = 1;
});
