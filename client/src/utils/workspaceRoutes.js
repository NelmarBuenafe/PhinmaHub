export const workspaceRouteImports = {
  studentDashboard: () => import("../pages/student/StudentPage.jsx"),
  studentCourses: () => import("../pages/student/StudentCoursesPage.jsx"),
  studentAssignments: () => import("../pages/student/StudentAssignmentsPage.jsx"),
  studentProfile: () => import("../pages/student/StudentProfilePage.jsx"),
  studentSettings: () => import("../pages/common/SettingsPage.jsx"),
  teacherDashboard: () => import("../pages/teacher/TeacherPage.jsx"),
  teacherCourses: () => import("../pages/teacher/TeacherCourses.jsx"),
  teacherCreateCourse: () => import("../pages/teacher/CreateCoursePage.jsx"),
  teacherProfile: () => import("../pages/teacher/TeacherProfilePage.jsx"),
  teacherSettings: () => import("../pages/common/SettingsPage.jsx"),
};

const importsByPath = {
  "/student": workspaceRouteImports.studentDashboard,
  "/student/courses": workspaceRouteImports.studentCourses,
  "/student/assignments": workspaceRouteImports.studentAssignments,
  "/student/profile": workspaceRouteImports.studentProfile,
  "/student/settings": workspaceRouteImports.studentSettings,
  "/teacher": workspaceRouteImports.teacherDashboard,
  "/teacher/courses": workspaceRouteImports.teacherCourses,
  "/teacher/courses/create": workspaceRouteImports.teacherCreateCourse,
  "/teacher/profile": workspaceRouteImports.teacherProfile,
  "/teacher/settings": workspaceRouteImports.teacherSettings,
};

export function preloadWorkspaceRoute(path) {
  // Fetch code on navigation intent; this never fetches or authorizes account data.
  importsByPath[path]?.().catch(() => {});
}
