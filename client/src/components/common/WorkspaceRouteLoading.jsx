import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";
import Loading from "./Loading.jsx";
import PageHeader from "./PageHeader.jsx";

export default function WorkspaceRouteLoading({ role }) {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const base = `/${role.toLowerCase()}`;
  const title = pathname === base ? `Welcome back, ${profile?.first_name || role}`
    : pathname === `${base}/courses` ? "My Courses"
    : pathname.endsWith("/courses/create") ? "Create Course"
    : pathname.endsWith("/assignments") ? "Assignments"
    : pathname.endsWith("/profile") ? "My Profile"
    : pathname.endsWith("/announcements") ? "Announcements"
    : pathname.endsWith("/join-course") ? "Join Course"
    : pathname.endsWith("/materials") ? "Lesson Materials"
    : role === "Student" ? "Course Learning" : "Manage Course";
  const variant = pathname === base ? (role === "Teacher" ? "teacher-dashboard" : "dashboard")
    : title === "My Profile" ? "profile"
    : title === "Assignments" ? "assignments"
    : title === "Announcements" ? "announcements"
    : title === "Course Learning" || title === "Lesson Materials" ? "lesson" : "courses";
  return <section className="ph-role-page"><PageHeader eyebrow={`${role} workspace`} title={title} /><div className="mt-6"><Loading label={`Loading ${title.toLowerCase()}...`} variant={variant} /></div></section>;
}
