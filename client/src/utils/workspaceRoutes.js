export const workspaceRouteImports = {
  studentDashboard: () => import("../pages/student/StudentPage.jsx"),
  studentCourses: () => import("../pages/student/StudentCoursesPage.jsx"),
  studentAssignments: () => import("../pages/student/StudentAssignmentsPage.jsx"),
  studentProfile: () => import("../pages/student/StudentProfilePage.jsx"),
  teacherDashboard: () => import("../pages/teacher/TeacherPage.jsx"),
  teacherCourses: () => import("../pages/teacher/TeacherCourses.jsx"),
  teacherCreateCourse: () => import("../pages/teacher/CreateCoursePage.jsx"),
  teacherProfile: () => import("../pages/teacher/TeacherProfilePage.jsx"),
};

const importsByPath = {
  "/student": workspaceRouteImports.studentDashboard,
  "/student/courses": workspaceRouteImports.studentCourses,
  "/student/assignments": workspaceRouteImports.studentAssignments,
  "/student/profile": workspaceRouteImports.studentProfile,
  "/teacher": workspaceRouteImports.teacherDashboard,
  "/teacher/courses": workspaceRouteImports.teacherCourses,
  "/teacher/courses/create": workspaceRouteImports.teacherCreateCourse,
  "/teacher/profile": workspaceRouteImports.teacherProfile,
};

export function preloadWorkspaceRoute(path) {
  // Fetch code on navigation intent; this never fetches or authorizes account data.
  importsByPath[path]?.().catch(() => {});
}
