import { ChevronDown, Menu } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";
import AccountMenu from "./AccountMenu.jsx";
import HeaderDropdown from "./HeaderDropdown.jsx";
import NotificationMenu from "./NotificationMenu.jsx";

function NavigationLinks({ links, onSelect, mobile = false }) {
  return links.map(({ to, label, end }) => (
    <NavLink
      className={({ isActive }) =>
        `ph-nav-link flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-sm font-semibold ${mobile ? "w-full" : ""} ${
          isActive ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
        }`
      }
      end={end}
      key={to}
      onClick={onSelect}
      to={to}
    >
      {label}
    </NavLink>
  ));
}

export default function RoleNav({ links, role, moreLinks = [], onSignOut }) {
  const { profile, signOut } = useAuth();
  const rolePath = role.toLowerCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_18px_rgb(15_23_42/0.04)] backdrop-blur-xl">
      <div className="ph-app-container flex items-center gap-3 py-3 lg:gap-4">
        <Link className="ph-action inline-flex shrink-0 items-center gap-2 rounded-xl font-bold text-emerald-800" to={`/${rolePath}`}>
          <span className="grid size-8 place-items-center rounded-lg bg-emerald-700 text-sm text-white">P</span>
          <span>PhinmaHub <span className="hidden font-semibold text-slate-500 lg:inline">{role}</span></span>
        </Link>
        <nav aria-label={`${role} navigation`} className="hidden items-center gap-1 lg:flex">
          <NavigationLinks links={links} />
          {moreLinks.length > 0 && (
            <HeaderDropdown label="More navigation" buttonContent={<>More <ChevronDown aria-hidden="true" size={15} /></>}>
              {({ close }) => <nav aria-label="More management pages"><NavigationLinks links={moreLinks} onSelect={close} mobile /></nav>}
            </HeaderDropdown>
          )}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <NotificationMenu role={role} />
          <AccountMenu
            profile={profile}
            profileRoute={role === "Admin" ? "/admin/profile" : `/${rolePath}/profile`}
            role={role}
            onSignOut={onSignOut || signOut}
            settingsRoute={`/${rolePath}/settings`}
          />
          <HeaderDropdown className="lg:hidden" label={`${role} navigation menu`} buttonContent={<Menu aria-hidden="true" size={21} />}>
            {({ close }) => (
              <nav aria-label={`${role} mobile navigation`}>
                <NavigationLinks links={[...links, ...moreLinks]} onSelect={close} mobile />
              </nav>
            )}
          </HeaderDropdown>
        </div>
      </div>
    </header>
  );
}
