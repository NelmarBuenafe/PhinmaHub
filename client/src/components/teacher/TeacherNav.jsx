import { BookOpen, LayoutDashboard, LogOut, PlusCircle } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";

const links = [
  { to: "/teacher", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/teacher/courses", label: "My Courses", Icon: BookOpen },
  { to: "/teacher/courses/create", label: "Create Course", Icon: PlusCircle },
];

function TeacherNav() {
  const { signOut } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <Link className="font-black text-emerald-700" to="/teacher">
          PhinmaHub <span className="text-slate-500">Teacher</span>
        </Link>
        <nav aria-label="Teacher navigation" className="flex flex-wrap gap-1">
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

export default TeacherNav;
