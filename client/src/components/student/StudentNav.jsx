import {
  Bell,
  BookOpen,
  LayoutDashboard,
  LogOut,
  UserRound,
  ClipboardList,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";

const links = [
  { to: "/student", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/student/courses", label: "My Courses", Icon: BookOpen },
  { to: "/student/assignments", label: "Assignments", Icon: ClipboardList },
  { to: "/student/announcements", label: "Announcements", Icon: Bell },
  { to: "/student/profile", label: "Profile", Icon: UserRound },
];

export default function StudentNav() {
  const { signOut } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <Link className="font-black text-emerald-700" to="/student">
          PhinmaHub <span className="text-slate-500">Student</span>
        </Link>
        <nav aria-label="Student navigation" className="flex flex-wrap gap-1">
          {links.map(({ to, label, Icon, end }) => (
            <NavLink
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-600 hover:bg-slate-50"
                }`
              }
              end={end}
              key={to}
              to={to}
            >
              <Icon aria-hidden="true" size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          onClick={signOut}
          type="button"
        >
          <LogOut aria-hidden="true" size={16} />
          Sign out
        </button>
      </div>
    </header>
  );
}
