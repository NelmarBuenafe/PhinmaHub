import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";
import AccountMenu from "./AccountMenu.jsx";
import NotificationMenu from "./NotificationMenu.jsx";

export default function TopUtilityHeader({ role, drawerOpen, drawerId, onOpenDrawer }) {
  const { pathname } = useLocation();
  const { profile, signOut } = useAuth();
  const base = `/${role.toLowerCase()}`;
  const context = pathname === base ? "Dashboard"
    : pathname === `${base}/courses/create` ? "Create Course"
    : pathname.endsWith("/materials") ? "Lesson Materials"
    : pathname === `${base}/courses` ? "My Courses"
    : pathname.startsWith(`${base}/courses/`) ? (role === "Student" ? "Course Learning" : "My Courses / Course Overview")
    : pathname === `${base}/assignments` ? "Assignments"
    : pathname.startsWith(`${base}/assignments/`) ? "Assignment"
    : pathname === `${base}/announcements` ? "Announcements"
    : pathname === `${base}/settings` ? "Settings" : "My Profile";

  return (
    <header className={`ph-utility-header sticky top-0 z-30 flex min-w-0 items-center gap-2 border-b border-slate-200/80 bg-white px-4 md:gap-3 md:px-6 min-[1200px]:px-7 ${role === "Teacher" ? "h-16" : "h-[60px]"}`}>
      <button aria-controls={drawerId} aria-expanded={drawerOpen} aria-label="Open navigation menu" className="ph-action grid size-11 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden" onClick={onOpenDrawer} type="button"><Menu aria-hidden="true" size={21} /></button>
      <Link className="min-w-0 truncate text-sm font-bold text-emerald-900 md:hidden" to={base}>PhinmaHub</Link>
      <p className="hidden min-w-0 truncate text-sm font-semibold text-slate-700 md:block">{context}</p>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <NotificationMenu role={role} />
        <AccountMenu onSignOut={signOut} profile={profile} profileRoute={`${base}/profile`} role={role} settingsRoute={`${base}/settings`} />
      </div>
    </header>
  );
}
