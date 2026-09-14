import { Menu } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";
import AccountMenu from "../common/AccountMenu.jsx";
import NotificationMenu from "../common/NotificationMenu.jsx";

export default function StudentWorkspaceHeader({ children }) {
  const { drawerId, drawerOpen, onOpenDrawer } = useOutletContext() || {};
  const { profile, signOut } = useAuth();

  return (
    <header className="ph-student-workspace-header flex h-[60px] min-w-0 items-center gap-2 border-b border-slate-200 bg-white px-4 sm:gap-3 sm:px-6">
      <button aria-controls={drawerId} aria-expanded={drawerOpen} aria-label="Open navigation menu" className="ph-action grid size-10 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden" onClick={onOpenDrawer} type="button"><Menu aria-hidden="true" size={20} /></button>
      <Link className="truncate text-sm font-bold text-emerald-900 md:hidden" to="/student">PhinmaHub</Link>
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 overflow-x-auto text-xs font-semibold text-slate-500 sm:text-sm">{children}</nav>
      <div className="ml-auto flex shrink-0 items-center gap-1.5"><NotificationMenu role="Student" /><AccountMenu onSignOut={signOut} profile={profile} profileRoute="/student/profile" role="Student" settingsRoute="/student/settings" /></div>
    </header>
  );
}
