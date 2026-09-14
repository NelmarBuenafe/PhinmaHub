import { LogOut, Settings, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { preloadWorkspaceRoute } from "../../utils/workspaceRoutes.js";

export default function AccountMenu({ profile, profileRoute, role, onSignOut, settingsRoute }) {
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const menuId = useId();
  const name = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ") || (role === "Admin" ? "Administrator" : role);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector('[role="menuitem"]')?.focus();

    function outsideClick(event) {
      if (!container.current?.contains(event.target)) setOpen(false);
    }

    function escape(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    }

    document.addEventListener("pointerdown", outsideClick);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outsideClick);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  function navigateMenu(event) {
    if (event.key === "Tab") {
      setOpen(false);
      trigger.current?.focus();
      return;
    }
    const items = Array.from(menu.current.querySelectorAll('[role="menuitem"]'));
    const index = items.indexOf(document.activeElement);
    let next;
    if (event.key === "ArrowDown") next = (index + 1) % items.length;
    if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      items[next]?.focus();
    }
  }

  return (
    <div className="relative shrink-0" ref={container}>
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="ph-action grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
        onClick={() => setOpen((value) => !value)}
        ref={trigger}
        type="button"
      >
        {profile?.avatar_url ? (
          <img alt="" className="size-9 rounded-full object-cover" src={profile.avatar_url} />
        ) : role === "Teacher" ? (
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-emerald-700 text-xs font-bold text-white">{initials}</span>
        ) : (
          <UserRound aria-hidden="true" size={21} />
        )}
      </button>
      {open && (
        <div className="ph-dialog-panel absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10">
          <div className="border-b border-slate-100 px-4 py-3.5">
            <p className="break-words text-sm font-bold text-slate-950">{name}</p>
            <p className="mt-1 text-xs text-slate-600">{role}</p>
            {profile?.email && <p className="mt-1 break-all text-xs leading-5 text-slate-500">{profile.email}</p>}
          </div>
          <div aria-label="Account actions" id={menuId} onKeyDown={navigateMenu} ref={menu} role="menu" className="p-1.5">
            {profileRoute && (
              <Link
                className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                onClick={() => setOpen(false)}
                onFocus={() => preloadWorkspaceRoute(profileRoute)}
                onMouseEnter={() => preloadWorkspaceRoute(profileRoute)}
                role="menuitem"
                tabIndex={-1}
                to={profileRoute}
              >
                <UserRound aria-hidden="true" size={17} /> Profile
              </Link>
            )}
            {settingsRoute && (
              <Link
                className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                onClick={() => setOpen(false)}
                onFocus={() => preloadWorkspaceRoute(settingsRoute)}
                onMouseEnter={() => preloadWorkspaceRoute(settingsRoute)}
                role="menuitem"
                tabIndex={-1}
                to={settingsRoute}
              >
                <Settings aria-hidden="true" size={17} /> Settings
              </Link>
            )}
            {(profileRoute || settingsRoute) && <div aria-hidden="true" className="my-1 border-t border-slate-100" />}
            <button
              className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
                onSignOut();
              }}
              role="menuitem"
              tabIndex={-1}
              type="button"
            >
              <LogOut aria-hidden="true" size={17} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
