import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Loading from "../components/common/Loading.jsx";
import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import RequireSession from "../components/common/RequireSession.jsx";
import AdminLayout from "../components/admin/AdminLayout.jsx";

const AdminPage = lazy(() => import("../pages/admin/AdminPage.jsx"));
const AcceptInvitePage = lazy(
  () => import("../pages/public/AcceptInvitePage.jsx"),
);
const CoursesAdminPage = lazy(
  () => import("../pages/admin/CoursesAdminPage.jsx"),
);
const UsersPage = lazy(() => import("../pages/admin/UsersPage.jsx"));
const CategoriesPage = lazy(() =>
  import("../pages/admin/ResourcePages.jsx").then((module) => ({
    default: module.CategoriesPage,
  })),
);
const AnnouncementsPage = lazy(() =>
  import("../pages/admin/ResourcePages.jsx").then((module) => ({
    default: module.AnnouncementsPage,
  })),
);
const StudyToolsPage = lazy(() =>
  import("../pages/admin/ResourcePages.jsx").then((module) => ({
    default: module.StudyToolsPage,
  })),
);
const MessagesPage = lazy(() =>
  import("../pages/admin/ResourcePages.jsx").then((module) => ({
    default: module.MessagesPage,
  })),
);
const AuditLogsPage = lazy(() =>
  import("../pages/admin/ResourcePages.jsx").then((module) => ({
    default: module.AuditLogsPage,
  })),
);
const SettingsPage = lazy(() =>
  import("../pages/admin/ResourcePages.jsx").then((module) => ({
    default: module.SettingsPage,
  })),
);
const LandingPage = lazy(() => import("../pages/public/LandingPage.jsx"));
const ChooseRolePage = lazy(() => import("../pages/public/ChooseRolePage.jsx"));
const CoursesPage = lazy(() => import("../pages/public/CoursesPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/public/NotFoundPage.jsx"));
const OAuthCallbackPage = lazy(
  () => import("../pages/public/OAuthCallbackPage.jsx"),
);
const PendingApprovalPage = lazy(
  () => import("../pages/public/PendingApprovalPage.jsx"),
);
const RegistrationPage = lazy(
  () => import("../pages/public/RegistrationPage.jsx"),
);
const RoleAuthPage = lazy(() => import("../pages/public/RoleAuthPage.jsx"));
const SecurityCheckPage = lazy(
  () => import("../pages/public/SecurityCheckPage.jsx"),
);
const SchoolEmailRequiredPage = lazy(
  () => import("../pages/public/SchoolEmailRequiredPage.jsx"),
);
const UnauthorizedPage = lazy(
  () => import("../pages/public/UnauthorizedPage.jsx"),
);
const StudentPage = lazy(() => import("../pages/student/StudentPage.jsx"));
const StudentCoursesPage = lazy(
  () => import("../pages/student/StudentCoursesPage.jsx"),
);
const StudentAssignmentsPage = lazy(
  () => import("../pages/student/StudentAssignmentsPage.jsx"),
);
const StudentAnnouncementsPage = lazy(
  () => import("../pages/student/StudentAnnouncementsPage.jsx"),
);
const StudentProfilePage = lazy(
  () => import("../pages/student/StudentProfilePage.jsx"),
);
const StudentCoursePage = lazy(
  () => import("../pages/student/StudentCoursePage.jsx"),
);
const TeacherPage = lazy(() => import("../pages/teacher/TeacherPage.jsx"));
const TeacherCourses = lazy(
  () => import("../pages/teacher/TeacherCourses.jsx"),
);
const CreateCoursePage = lazy(
  () => import("../pages/teacher/CreateCoursePage.jsx"),
);
const TeacherCourseOverviewPage = lazy(
  () => import("../pages/teacher/TeacherCourseOverviewPage.jsx"),
);

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <Loading />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/choose-role" element={<ChooseRolePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/login" element={<Navigate to="/choose-role" replace />} />
        <Route path="/auth/:role" element={<RoleAuthPage />} />
        <Route
          path="/admin/login"
          element={<Navigate to="/auth/admin" replace />}
        />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/auth/accept-invite" element={<AcceptInvitePage />} />
        <Route
          path="/security-check"
          element={
            <RequireSession>
              <SecurityCheckPage />
            </RequireSession>
          }
        />
        <Route
          path="/register/:role"
          element={
            <RequireSession>
              <RegistrationPage />
            </RequireSession>
          }
        />
        <Route
          path="/select-role"
          element={<Navigate to="/choose-role" replace />}
        />
        <Route path="/pending" element={<PendingApprovalPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          path="/school-email-required"
          element={<SchoolEmailRequiredPage />}
        />
        <Route
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminPage />} />
          <Route
            path="/admin/approvals"
            element={<Navigate to="/admin/users" replace />}
          />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route
            path="/admin/users/students"
            element={<UsersPage presetRole="student" />}
          />
          <Route
            path="/admin/users/teachers"
            element={<UsersPage presetRole="teacher" />}
          />
          <Route path="/admin/courses" element={<CoursesAdminPage />} />
          <Route path="/admin/categories" element={<CategoriesPage />} />
          <Route path="/admin/announcements" element={<AnnouncementsPage />} />
          <Route path="/admin/study-tools" element={<StudyToolsPage />} />
          <Route path="/admin/messages" element={<MessagesPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>
        <Route
          path="/teacher"
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses"
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/create"
          element={
            <ProtectedRoute requiredRole="teacher">
              <CreateCoursePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseId"
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherCourseOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentCoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/assignments"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentAssignmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/announcements"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentAnnouncementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses/:courseId"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentCoursePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
