import { Router } from "express";
import {
  listPublicCourses,
  listStudentCourses,
  joinStudentCourse,
  listTeacherCourses,
  teacherDashboard,
  listTeacherCourseCategories,
  createTeacherCourse,
  getTeacherCourse,
} from "../controllers/courseController.js";
import {
  createLessonSection,
  createAssignment,
  deleteAssignment,
  createLesson,
  createModule,
  deleteLesson,
  deleteLessonSection,
  deleteModule,
  enrollStudent,
  gradeSubmission,
  listAssignmentSubmissions,
  listCourseAssignments,
  listCourseModules,
  listCourseStudents,
  listLessonSections,
  listStudentAssignments,
  removeEnrollment,
  reorderLessonSections,
  saveSectionReadingProgress,
  saveStudentSubmission,
  studentLearning,
  updateAssignment,
  updateCourseSettings,
  updateLesson,
  updateLessonSection,
  updateModule,
} from "../controllers/learningController.js";
import {
  createLessonMaterial,
  createUploadUrl,
  discardUploadedMaterial,
  deleteLessonMaterial,
  listTeacherLessonMaterials,
  saveStudentVideoProgress,
  studentMaterialAccess,
  teacherMaterialAccess,
  updateLessonMaterial,
} from "../controllers/lessonMaterialController.js";
import {
  getStudentDashboard,
  getStudentProfile,
  getTeacherProfile,
  listStudentAnnouncements,
  listStudentAssignmentsOverview,
} from "../controllers/studentController.js";
import {
  addSubmissionLink,
  cleanupSubmissionUpload,
  confirmSubmissionAttachment,
  createSubmissionUploadUrl,
  getStudentAssignmentDetail,
  removeSubmissionAttachment,
  studentSubmissionAttachmentAccess,
  teacherSubmissionAttachmentAccess,
} from "../controllers/submissionAttachmentController.js";
import {
  createTeacherAnnouncement,
  deleteTeacherAnnouncement,
  listTeacherAnnouncements,
  updateTeacherAnnouncement,
} from "../controllers/teacherAnnouncementController.js";
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
studentCourseRouter.post("/courses/join", joinStudentCourse);
studentCourseRouter.get("/courses/:courseId/learning", studentLearning);
studentCourseRouter.patch("/sections/:sectionId/reading-progress", saveSectionReadingProgress);
studentCourseRouter.patch("/materials/:materialId/video-progress", saveStudentVideoProgress);
studentCourseRouter.get("/courses/:courseId/assignments", listStudentAssignments);
studentCourseRouter.get("/materials/:materialId/access", studentMaterialAccess);
studentCourseRouter.put("/assignments/:assignmentId/submission", saveStudentSubmission);
studentCourseRouter.get("/assignments/:assignmentId/detail", getStudentAssignmentDetail);
studentCourseRouter.post("/assignments/:assignmentId/submission/upload-url", createSubmissionUploadUrl);
studentCourseRouter.post("/assignments/:assignmentId/submission/attachments", confirmSubmissionAttachment);
studentCourseRouter.post("/assignments/:assignmentId/submission/links", addSubmissionLink);
studentCourseRouter.delete("/assignments/:assignmentId/submission/attachments/:attachmentId", removeSubmissionAttachment);
studentCourseRouter.delete("/assignments/:assignmentId/submission/upload", cleanupSubmissionUpload);
studentCourseRouter.get("/assignments/:assignmentId/submission/attachments/:attachmentId/access", studentSubmissionAttachmentAccess);

export const teacherCourseRouter = Router();
teacherCourseRouter.use(authenticate, authorizeRole("teacher"));
teacherCourseRouter.get("/dashboard", teacherDashboard);
teacherCourseRouter.get("/profile", getTeacherProfile);
teacherCourseRouter.get("/course-categories", listTeacherCourseCategories);
teacherCourseRouter.get("/courses", listTeacherCourses);
teacherCourseRouter.post("/courses", createTeacherCourse);
teacherCourseRouter.get("/courses/:courseId", getTeacherCourse);
teacherCourseRouter.patch("/courses/:courseId/settings", updateCourseSettings);
teacherCourseRouter.get("/courses/:courseId/students", listCourseStudents);
teacherCourseRouter.post("/courses/:courseId/students", enrollStudent);
teacherCourseRouter.delete("/courses/:courseId/students/:enrollmentId", removeEnrollment);
teacherCourseRouter.get("/courses/:courseId/announcements", listTeacherAnnouncements);
teacherCourseRouter.post("/courses/:courseId/announcements", createTeacherAnnouncement);
teacherCourseRouter.put("/announcements/:announcementId", updateTeacherAnnouncement);
teacherCourseRouter.delete("/announcements/:announcementId", deleteTeacherAnnouncement);
teacherCourseRouter.get("/courses/:courseId/modules", listCourseModules);
teacherCourseRouter.post("/courses/:courseId/modules", createModule);
teacherCourseRouter.put("/modules/:moduleId", updateModule);
teacherCourseRouter.delete("/modules/:moduleId", deleteModule);
teacherCourseRouter.post("/modules/:moduleId/lessons", createLesson);
teacherCourseRouter.put("/lessons/:lessonId", updateLesson);
teacherCourseRouter.delete("/lessons/:lessonId", deleteLesson);
teacherCourseRouter.get("/lessons/:lessonId/sections", listLessonSections);
teacherCourseRouter.post("/lessons/:lessonId/sections", createLessonSection);
teacherCourseRouter.put("/lessons/:lessonId/sections/order", reorderLessonSections);
teacherCourseRouter.put("/sections/:sectionId", updateLessonSection);
teacherCourseRouter.delete("/sections/:sectionId", deleteLessonSection);
teacherCourseRouter.get("/lessons/:lessonId/materials", listTeacherLessonMaterials);
teacherCourseRouter.post("/lessons/:lessonId/materials/upload-url", createUploadUrl);
teacherCourseRouter.delete("/lessons/:lessonId/materials/upload", discardUploadedMaterial);
teacherCourseRouter.post("/lessons/:lessonId/materials", createLessonMaterial);
teacherCourseRouter.patch("/materials/:materialId", updateLessonMaterial);
teacherCourseRouter.delete("/materials/:materialId", deleteLessonMaterial);
teacherCourseRouter.get("/materials/:materialId/access", teacherMaterialAccess);
teacherCourseRouter.get("/courses/:courseId/assignments", listCourseAssignments);
teacherCourseRouter.post("/courses/:courseId/assignments", createAssignment);
teacherCourseRouter.put("/assignments/:assignmentId", updateAssignment);
teacherCourseRouter.delete("/assignments/:assignmentId", deleteAssignment);
teacherCourseRouter.get("/assignments/:assignmentId/submissions", listAssignmentSubmissions);
teacherCourseRouter.put("/submissions/:submissionId/grade", gradeSubmission);
teacherCourseRouter.get("/submissions/:submissionId/attachments/:attachmentId/access", teacherSubmissionAttachmentAccess);
