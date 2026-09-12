import { LogOut } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";

export default function RoleNav({ links, role }) {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 shadow-[0_1px_18px_rgb(15_23_42/0.04)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 px-4 py-3 sm:px-6">
        <Link className="ph-action inline-flex items-center gap-2 rounded-xl font-black text-emerald-800" to={`/${role.toLowerCase()}`}>
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 text-sm text-white shadow-sm">P</span>
          <span>PhinmaHub <span className="font-bold text-slate-500">{role}</span></span>
        </Link>
        <button
          className="ph-action inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
          onClick={signOut}
          type="button"
        >
          <LogOut aria-hidden="true" size={16} />
          <span>Sign out</span>
        </button>
        <nav
          aria-label={`${role} navigation`}
          className="order-3 -mx-1 mt-3 flex w-full gap-1 overflow-x-auto pb-1 sm:mx-0 sm:mt-2"
        >
          {links.map(({ to, label, Icon, end }) => (
            <NavLink
              className={({ isActive }) =>
                `ph-nav-link inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
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
      </div>
    </header>
  );
}
