import { supabase } from "../config/supabase.js";
import {
  isPendingSubmission,
  progressPercent,
} from "../utils/studentDashboard.js";

const courseFields =
  "id,teacher_id,course_code,title,description,status,visibility";

function sendUnexpected(next, message, cause) {
  const error = new Error(message, { cause });
  error.statusCode = cause?.statusCode || cause?.status;
  return next(error);
}

function byDueDate(left, right) {
  if (!left.due_at && !right.due_at) return 0;
  if (!left.due_at) return 1;
  if (!right.due_at) return -1;
  return new Date(left.due_at).getTime() - new Date(right.due_at).getTime();
}

async function loadStudentData(studentId, announcementLimit = 5) {
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("course_id,enrolled_at")
    .eq("student_id", studentId)
    .eq("status", "active")
    .order("enrolled_at", { ascending: false });
  if (enrollmentError) throw enrollmentError;

  const enrollmentRows = enrollments || [];
  const courseIds = [...new Set(enrollmentRows.map((item) => item.course_id))];
  const [courseResult, globalAnnouncementResult] = await Promise.all([
    courseIds.length
      ? supabase.from("courses").select(courseFields).in("id", courseIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("announcements")
      .select("id,course_id,audience,title,body,published_at")
      .in("audience", ["all", "students"])
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(announcementLimit),
  ]);
  if (courseResult.error) throw courseResult.error;
  if (globalAnnouncementResult.error) throw globalAnnouncementResult.error;

  const courses = courseResult.data || [];
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const activeCourseIds = courseIds.filter((id) => courseById.has(id));
  const orderedCourses = enrollmentRows
    .map((enrollment) => ({
      ...courseById.get(enrollment.course_id),
      enrolled_at: enrollment.enrolled_at,
    }))
    .filter((course) => course.id);

  const [courseAnnouncementResult, teacherResult] = await Promise.all([
    activeCourseIds.length
      ? supabase
          .from("announcements")
          .select("id,course_id,audience,title,body,published_at")
          .eq("audience", "course")
          .in("course_id", activeCourseIds)
          .not("published_at", "is", null)
          .lte("published_at", new Date().toISOString())
          .order("published_at", { ascending: false })
          .limit(announcementLimit)
      : Promise.resolve({ data: [], error: null }),
    orderedCourses.length
      ? supabase
          .from("profiles")
          .select("id,first_name,last_name")
          .in(
            "id",
            [...new Set(orderedCourses.map((course) => course.teacher_id))],
          )
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (courseAnnouncementResult.error) throw courseAnnouncementResult.error;
  if (teacherResult.error) throw teacherResult.error;

  const moduleResult = activeCourseIds.length
    ? await supabase
        .from("course_modules")
        .select("id,course_id")
        .in("course_id", activeCourseIds)
    : { data: [], error: null };
  if (moduleResult.error) throw moduleResult.error;

  const modules = moduleResult.data || [];
  const moduleIds = modules.map((module) => module.id);
  const lessonResult = moduleIds.length
    ? await supabase
        .from("lessons")
        .select("id,module_id,title")
        .in("module_id", moduleIds)
        .eq("is_published", true)
    : { data: [], error: null };
  if (lessonResult.error) throw lessonResult.error;

  const lessons = lessonResult.data || [];
  const lessonCourse = new Map(
    modules.map((module) => [module.id, module.course_id]),
  );
  const lessonCourseById = new Map(
    lessons.map((lesson) => [lesson.id, lessonCourse.get(lesson.module_id)]),
  );
  const progressResult = lessons.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id,is_completed,completed_at")
        .eq("student_id", studentId)
        .in("lesson_id", lessons.map((lesson) => lesson.id))
    : { data: [], error: null };
  if (progressResult.error) throw progressResult.error;

  const totalLessonsByCourse = new Map();
  for (const lesson of lessons) {
    const courseId = lessonCourseById.get(lesson.id);
    totalLessonsByCourse.set(
      courseId,
      (totalLessonsByCourse.get(courseId) || 0) + 1,
    );
  }

  const completedLessons = (progressResult.data || []).filter(
    (item) => item.is_completed && lessonCourseById.has(item.lesson_id),
  );
  const completedLessonsByCourse = new Map();
  for (const item of completedLessons) {
    const courseId = lessonCourseById.get(item.lesson_id);
    completedLessonsByCourse.set(
      courseId,
      (completedLessonsByCourse.get(courseId) || 0) + 1,
    );
  }

  const assignmentResult = activeCourseIds.length
    ? await supabase
        .from("assignments")
        .select(
          "id,course_id,title,instructions,total_points,due_at,allow_late_submissions,is_published",
        )
        .in("course_id", activeCourseIds)
        .eq("is_published", true)
    : { data: [], error: null };
  if (assignmentResult.error) throw assignmentResult.error;

  const assignments = assignmentResult.data || [];
  const submissionResult = assignments.length
    ? await supabase
        .from("submissions")
        .select("id,assignment_id,status,submitted_at,score,feedback,graded_at")
        .eq("student_id", studentId)
        .in(
          "assignment_id",
          assignments.map((assignment) => assignment.id),
        )
    : { data: [], error: null };
  if (submissionResult.error) throw submissionResult.error;

  const submissionByAssignment = new Map(
    (submissionResult.data || []).map((submission) => [
      submission.assignment_id,
      submission,
    ]),
  );
  const teachers = new Map(
    (teacherResult.data || []).map((teacher) => [
      teacher.id,
      [teacher.first_name, teacher.last_name].filter(Boolean).join(" ") ||
        "Faculty instructor",
    ]),
  );

  const courseSummaries = orderedCourses.map((course) => {
    const totalLessons = totalLessonsByCourse.get(course.id) || 0;
    const completed = completedLessonsByCourse.get(course.id) || 0;
    return {
      ...course,
      teacher_name: teachers.get(course.teacher_id) || "Faculty instructor",
      total_lessons: totalLessons,
      completed_lessons: completed,
      progress: progressPercent(completed, totalLessons),
    };
  });

  const assignmentSummaries = assignments
    .map((assignment) => {
      const course = courseById.get(assignment.course_id);
      const submission = submissionByAssignment.get(assignment.id) || null;
      return {
        ...assignment,
        course_code: course?.course_code || "Course",
        course_title: course?.title || "Course",
        submission,
        submission_status: submission?.status || "pending",
      };
    })
    .sort(byDueDate);

  const announcements = [
    ...(globalAnnouncementResult.data || []),
    ...(courseAnnouncementResult.data || []),
  ]
    .map((announcement) => ({
      ...announcement,
      course_code: announcement.course_id
        ? courseById.get(announcement.course_id)?.course_code || "Course"
        : null,
      course_title: announcement.course_id
        ? courseById.get(announcement.course_id)?.title || "Course"
        : null,
    }))
    .sort(
      (left, right) =>
        new Date(right.published_at).getTime() -
        new Date(left.published_at).getTime(),
    )
    .slice(0, announcementLimit);

  const continueLearning =
    courseSummaries.find((course) => course.completed_lessons < course.total_lessons) ||
    courseSummaries[0] ||
    null;
  const totalLessons = lessons.length;
  const completedLessonCount = completedLessons.length;

  return {
    summary: {
      enrolledCourses: courseSummaries.length,
      completedLessons: completedLessonCount,
      pendingAssignments: assignmentSummaries.filter((assignment) =>
        isPendingSubmission(assignment.submission?.status),
      ).length,
      overallProgress: progressPercent(completedLessonCount, totalLessons),
    },
    continueLearning,
    upcomingAssignments: assignmentSummaries.slice(0, 5),
    assignments: assignmentSummaries,
    recentAnnouncements: announcements,
    courses: courseSummaries,
  };
}

export async function getStudentDashboard(request, response, next) {
  try {
    const data = await loadStudentData(request.auth.user.id);
    return response.json({
      success: true,
      data: {
        student: { firstName: request.auth.profile.first_name || "Student" },
        ...data,
      },
    });
  } catch (cause) {
    return sendUnexpected(next, "Unable to load student dashboard", cause);
  }
}

export async function listStudentAssignmentsOverview(request, response, next) {
  try {
    const data = await loadStudentData(request.auth.user.id);
    return response.json({ success: true, data: data.assignments });
  } catch (cause) {
    return sendUnexpected(next, "Unable to load student assignments", cause);
  }
}

export async function listStudentAnnouncements(request, response, next) {
  try {
    const data = await loadStudentData(request.auth.user.id, 50);
    return response.json({ success: true, data: data.recentAnnouncements });
  } catch (cause) {
    return sendUnexpected(next, "Unable to load student announcements", cause);
  }
}

export async function getStudentProfile(request, response, next) {
  try {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("student_id,campus,program,year_level,section")
      .eq("user_id", request.auth.user.id)
      .maybeSingle();
    if (error) throw error;
    return response.json({
      success: true,
      data: {
        profile: request.auth.profile,
        studentProfile: data,
      },
    });
  } catch (cause) {
    return sendUnexpected(next, "Unable to load student profile", cause);
  }
}
