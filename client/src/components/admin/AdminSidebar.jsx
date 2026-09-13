import {
  BookOpen,
  ChevronDown,
  FileClock,
  FolderTree,
  Gauge,
  LogOut,
  Mail,
  Megaphone,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";

const links = [
  ["Dashboard", "/admin", Gauge],
  ["Users", "/admin/users", Users],
  ["Students", "/admin/users/students", Users, null, true],
  ["Teachers", "/admin/users/teachers", Users, null, true],
  ["Courses", "/admin/courses", BookOpen],
  ["Categories", "/admin/categories", FolderTree],
  ["Announcements", "/admin/announcements", Megaphone],
  ["Study Tools", "/admin/study-tools", Wrench],
  ["Contact Messages", "/admin/messages", Mail, "messages"],
  ["Audit Logs", "/admin/audit-logs", FileClock],
  ["Settings", "/admin/settings", Settings],
];

function AdminSidebar({ badges = {}, onClose, open }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Administrator";
  async function logout() {
    await signOut();
    navigate("/");
  }
  return (
    <>
      {open && (
        <button
          aria-label="Close navigation overlay"
          className="ph-dialog-backdrop fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-slate-300 transition-transform duration-200 motion-reduce:transition-none lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-5">
          <Link
            className="flex items-center gap-3 text-xl font-black text-white"
            onClick={onClose}
            to="/admin"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-600">
              P
            </span>
            <span>
              PhinmaHub
              <small className="block text-[10px] uppercase tracking-[.2em] text-emerald-400">
                Administration
              </small>
            </span>
          </Link>
          <button
            aria-label="Close menu"
            className="rounded-lg p-2 hover:bg-slate-800 lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <nav
          aria-label="Administration"
          className="flex-1 space-y-1 overflow-y-auto p-4"
        >
          {links.map(([label, path, Icon, badge, child]) => (
            <NavLink
              className={({ isActive }) =>
                `group flex transition-colors items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${child ? "ml-7" : ""} ${isActive || (path !== "/admin" && location.pathname.startsWith(`${path}/`)) ? "bg-emerald-900/80 text-emerald-50 ring-1 ring-inset ring-emerald-700" : "hover:bg-slate-800 hover:text-white"}`
              }
              end={path === "/admin"}
              key={path}
              onClick={onClose}
              title={label}
              to={path}
            >
              <Icon aria-hidden="true" size={child ? 17 : 19} />
              <span className="flex-1">{label}</span>
              {badge && badges[badge] > 0 && (
                <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-xs font-black text-slate-950">
                  {badges[badge]}
                </span>
              )}
              {label === "Users" && (
                <ChevronDown aria-hidden="true" size={15} />
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-inner">
            {profile?.avatar_url ? (
              <img
                alt="Admin profile"
                className="size-10 rounded-full object-cover"
                src={profile.avatar_url}
              />
            ) : (
              <span className="grid size-10 place-items-center rounded-full bg-emerald-600 font-black text-white">
                {displayName[0]}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {displayName}
              </p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>
          <Link
            className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-800 hover:text-white"
            to="/"
          >
            Return to Public Site
          </Link>
          <button
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-800 hover:text-white"
            onClick={logout}
            type="button"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
