import { Router } from "express";
import {
  listPublicCourses,
  listStudentCourses,
  listTeacherCourses,
  teacherDashboard,
  listTeacherCourseCategories,
  createTeacherCourse,
  getTeacherCourse,
} from "../controllers/courseController.js";
import {
  completeLesson,
  createAssignment,
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  enrollStudent,
  gradeSubmission,
  listAssignmentSubmissions,
  listCourseAssignments,
  listCourseModules,
  listCourseStudents,
  listStudentAssignments,
  removeEnrollment,
  saveStudentSubmission,
  studentLearning,
  updateAssignment,
  updateCourseSettings,
  updateLesson,
  updateModule,
} from "../controllers/learningController.js";
import {
  getStudentDashboard,
  getStudentProfile,
  listStudentAnnouncements,
  listStudentAssignmentsOverview,
} from "../controllers/studentController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRole } from "../middleware/authorizeRole.js";

export const publicCourseRouter = Router();
publicCourseRouter.get("/", listPublicCourses);

export const studentCourseRouter = Router();
studentCourseRouter.use(authenticate, authorizeRole("student"));
studentCourseRouter.get("/dashboard", getStudentDashboard);
studentCourseRouter.get("/assignments", listStudentAssignmentsOverview);
studentCourseRouter.get("/announcements", listStudentAnnouncements);
studentCourseRouter.get("/profile", getStudentProfile);
studentCourseRouter.get("/courses", listStudentCourses);
studentCourseRouter.get("/courses/:courseId/learning", studentLearning);
studentCourseRouter.get("/courses/:courseId/assignments", listStudentAssignments);
studentCourseRouter.post("/lessons/:lessonId/complete", completeLesson);
studentCourseRouter.put("/assignments/:assignmentId/submission", saveStudentSubmission);

export const teacherCourseRouter = Router();
teacherCourseRouter.use(authenticate, authorizeRole("teacher"));
teacherCourseRouter.get("/dashboard", teacherDashboard);
teacherCourseRouter.get("/course-categories", listTeacherCourseCategories);
teacherCourseRouter.get("/courses", listTeacherCourses);
teacherCourseRouter.post("/courses", createTeacherCourse);
teacherCourseRouter.get("/courses/:courseId", getTeacherCourse);
teacherCourseRouter.patch("/courses/:courseId/settings", updateCourseSettings);
teacherCourseRouter.get("/courses/:courseId/students", listCourseStudents);
teacherCourseRouter.post("/courses/:courseId/students", enrollStudent);
teacherCourseRouter.delete("/courses/:courseId/students/:enrollmentId", removeEnrollment);
teacherCourseRouter.get("/courses/:courseId/modules", listCourseModules);
teacherCourseRouter.post("/courses/:courseId/modules", createModule);
teacherCourseRouter.put("/modules/:moduleId", updateModule);
teacherCourseRouter.delete("/modules/:moduleId", deleteModule);
teacherCourseRouter.post("/modules/:moduleId/lessons", createLesson);
teacherCourseRouter.put("/lessons/:lessonId", updateLesson);
teacherCourseRouter.delete("/lessons/:lessonId", deleteLesson);
teacherCourseRouter.get("/courses/:courseId/assignments", listCourseAssignments);
teacherCourseRouter.post("/courses/:courseId/assignments", createAssignment);
teacherCourseRouter.put("/assignments/:assignmentId", updateAssignment);
teacherCourseRouter.get("/assignments/:assignmentId/submissions", listAssignmentSubmissions);
teacherCourseRouter.put("/submissions/:submissionId/grade", gradeSubmission);
