import { BookOpen, ClipboardList, LayoutDashboard, PanelLeftClose, PanelLeftOpen, PlusCircle } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { preloadWorkspaceRoute } from "../../utils/workspaceRoutes.js";

export default function RoleSidebar({ role, expanded, onNavigate, onToggle, mobile = false }) {
  const { pathname } = useLocation();
  const base = `/${role.toLowerCase()}`;
  const links = [
    { to: base, label: "Dashboard", Icon: LayoutDashboard, end: true },
    { to: `${base}/courses`, label: "My Courses", Icon: BookOpen },
    role === "Student"
      ? { to: `${base}/assignments`, label: "Assignments", Icon: ClipboardList }
      : { to: `${base}/courses/create`, label: "Create Course", Icon: PlusCircle, end: true },
  ];

  return (
    <>
      <div className="ph-sidebar-brand-row relative" data-expanded={expanded}>
        <Link aria-hidden={!expanded} aria-label={`PhinmaHub ${role} dashboard`} className="ph-sidebar-brand flex min-w-0 items-center gap-3 rounded-lg" inert={!expanded} onClick={onNavigate} to={base}>
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-700 text-sm font-bold text-white">P</span>
          <span className="min-w-0"><span className="block text-base font-bold tracking-tight text-emerald-900">PhinmaHub</span><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{role}</span></span>
        </Link>
        {!mobile && onToggle && <button aria-expanded={expanded} aria-label={expanded ? "Collapse navigation" : "Expand navigation"} className="ph-sidebar-toggle ph-action group grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-800" onClick={onToggle} type="button">
          {expanded ? <PanelLeftClose aria-hidden="true" size={18} /> : <PanelLeftOpen aria-hidden="true" size={18} />}
          <span aria-hidden="true" className="ph-nav-tooltip pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{expanded ? "Collapse navigation" : "Expand navigation"}</span>
        </button>}
      </div>
      <nav aria-label={`${role}${mobile ? " mobile" : " primary"} navigation`} className="space-y-1 px-3">
        {links.map(({ to, label, Icon, end }) => (
          <NavLink aria-label={label} end={end || (to === `${base}/courses` && pathname === `${base}/courses/create`)} key={to} onClick={onNavigate} onFocus={() => preloadWorkspaceRoute(to)} onMouseEnter={() => preloadWorkspaceRoute(to)} onPointerDown={() => preloadWorkspaceRoute(to)} to={to}
            className={({ isActive }) => {
              const active = isActive && !(to === `${base}/courses` && pathname === `${base}/courses/create`);
              return `ph-sidebar-link group relative flex h-11 items-center gap-3 rounded-lg text-sm font-semibold ${expanded ? "px-3" : "justify-center"} ${active ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`;
            }}>
            <Icon aria-hidden="true" className="shrink-0" size={20} />
            {expanded ? <span className="whitespace-nowrap">{label}</span> : <span aria-hidden="true" className="ph-nav-tooltip pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
