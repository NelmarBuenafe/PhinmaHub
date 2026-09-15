import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Loading from "../components/common/Loading.jsx";
import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import RequireSession from "../components/common/RequireSession.jsx";
import AdminLayout from "../components/admin/AdminLayout.jsx";
import AuthenticatedShell from "../components/common/AuthenticatedShell.jsx";
import { workspaceRouteImports } from "../utils/workspaceRoutes.js";

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
const UserSettingsPage = lazy(() => import("../pages/common/SettingsPage.jsx"));
const LandingPage = lazy(() => import("../pages/public/LandingPage.jsx"));
const ChooseRolePage = lazy(() => import("../pages/public/ChooseRolePage.jsx"));
const CoursesPage = lazy(() => import("../pages/public/CoursesPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/public/NotFoundPage.jsx"));
const PolicyPage = lazy(() => import("../pages/public/PolicyPage.jsx"));
const OAuthCallbackPage = lazy(
  () => import("../pages/public/OAuthCallbackPage.jsx"),
);
const EmailConfirmationPage = lazy(
  () => import("../pages/public/EmailConfirmationPage.jsx"),
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
const StudentPage = lazy(workspaceRouteImports.studentDashboard);
const StudentCoursesPage = lazy(workspaceRouteImports.studentCourses);
const StudentAssignmentsPage = lazy(workspaceRouteImports.studentAssignments);
const StudentAnnouncementsPage = lazy(
  () => import("../pages/student/StudentAnnouncementsPage.jsx"),
);
const StudentProfilePage = lazy(workspaceRouteImports.studentProfile);
const StudentCoursePage = lazy(
  () => import("../pages/student/StudentCoursePage.jsx"),
);
const TeacherPage = lazy(workspaceRouteImports.teacherDashboard);
const TeacherCourses = lazy(workspaceRouteImports.teacherCourses);
const CreateCoursePage = lazy(workspaceRouteImports.teacherCreateCourse);
const TeacherCourseOverviewPage = lazy(
  () => import("../pages/teacher/TeacherCourseOverviewPage.jsx"),
);
const TeacherLessonMaterialsPage = lazy(
  () => import("../pages/teacher/TeacherLessonMaterialsPage.jsx"),
);
const TeacherProfilePage = lazy(workspaceRouteImports.teacherProfile);

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
        <Route path="/privacy-policy" element={<PolicyPage />} />
        <Route path="/terms-of-use" element={<PolicyPage />} />
        <Route path="/login" element={<Navigate to="/choose-role" replace />} />
        <Route path="/auth/:role" element={<RoleAuthPage />} />
        <Route
          path="/admin/login"
          element={<Navigate to="/auth/admin" replace />}
        />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/auth/confirm" element={<EmailConfirmationPage />} />
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
          <Route path="/admin/profile" element={<UserSettingsPage initialSection="account" profileOnly role="Admin" />} />
          <Route path="/admin/settings" element={<UserSettingsPage role="Admin" />} />
        </Route>
        <Route path="/teacher" element={<ProtectedRoute requiredRole="teacher"><AuthenticatedShell role="Teacher" /></ProtectedRoute>}>
          <Route index element={<TeacherPage />} />
          <Route path="courses" element={<TeacherCourses />} />
          <Route path="profile" element={<TeacherProfilePage />} />
          <Route path="settings" element={<UserSettingsPage role="Teacher" />} />
          <Route path="courses/create" element={<CreateCoursePage />} />
          <Route path="courses/:courseId" element={<TeacherCourseOverviewPage />} />
          <Route path="courses/:courseId/materials" element={<TeacherLessonMaterialsPage />} />
        </Route>
        <Route path="/student" element={<ProtectedRoute requiredRole="student"><AuthenticatedShell role="Student" /></ProtectedRoute>}>
          <Route index element={<StudentPage />} />
          <Route path="courses" element={<StudentCoursesPage />} />
          <Route path="assignments" element={<StudentAssignmentsPage />} />
          <Route path="assignments/:assignmentId" element={<StudentAssignmentsPage />} />
          <Route path="announcements" element={<StudentAnnouncementsPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="settings" element={<UserSettingsPage role="Student" />} />
          <Route path="courses/:courseId" element={<StudentCoursePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
