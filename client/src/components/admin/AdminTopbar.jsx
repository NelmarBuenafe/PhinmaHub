import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";

const titles = {
  "/admin": "Dashboard",
  "/admin/approvals": "Account Approvals",
  "/admin/users": "Users",
  "/admin/users/students": "Students",
  "/admin/users/teachers": "Teachers",
  "/admin/courses": "Courses",
  "/admin/categories": "Categories",
  "/admin/announcements": "Announcements",
  "/admin/study-tools": "Study Tools",
  "/admin/messages": "Contact Messages",
  "/admin/audit-logs": "Audit Logs",
  "/admin/settings": "Settings",
};

function AdminTopbar({ onMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(
    new URLSearchParams(location.search).get("search") || "",
  );
  const title = titles[location.pathname] || "Administration";
  const searchable = [
    "/admin/users",
    "/admin/users/students",
    "/admin/users/teachers",
    "/admin/courses",
  ].includes(location.pathname);
  const name =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Administrator";

  function submit(event) {
    event.preventDefault();
    if (!searchable) return;
    const params = new URLSearchParams(location.search);
    if (search) params.set("search", search);
    else params.delete("search");
    navigate(`${location.pathname}?${params}`);
    window.dispatchEvent(new CustomEvent("admin-search", { detail: search }));
  }

  async function logout() {
    await signOut();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6">
        <button
          aria-label="Open administration menu"
          className="rounded-xl border border-slate-200 p-2.5 lg:hidden"
          onClick={onMenu}
          type="button"
        >
          <Menu size={21} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-slate-400">
            Administration / {title}
          </p>
          <h1 className="truncate text-xl font-black text-slate-950">
            {title}
          </h1>
        </div>
        <form
          className="ml-auto hidden max-w-sm flex-1 md:block"
          onSubmit={submit}
        >
          <label className="relative block">
            <span className="sr-only">
              {searchable
                ? `Search ${title}`
                : "Search unavailable on this page"}
            </span>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-600"
              disabled={!searchable}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                searchable
                  ? `Search ${title.toLowerCase()}...`
                  : "Search is scoped to users and courses"
              }
              value={search}
            />
          </label>
        </form>
        <button
          aria-label="Review pending notifications"
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
          onClick={() => navigate("/admin/approvals")}
          type="button"
        >
          <Bell size={20} />
        </button>
        <div className="relative">
          <button
            aria-expanded={open}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"
            onClick={() => setOpen(!open)}
            type="button"
          >
            {profile?.avatar_url ? (
              <img
                alt="Admin profile"
                className="size-9 rounded-full object-cover"
                src={profile.avatar_url}
              />
            ) : (
              <span className="grid size-9 place-items-center rounded-full bg-emerald-700 font-black text-white">
                {name[0]}
              </span>
            )}
            <span className="hidden text-left xl:block">
              <span className="block max-w-36 truncate text-sm font-bold">
                {name}
              </span>
              <span className="block text-xs text-slate-500">Admin</span>
            </span>
            <ChevronDown className="hidden xl:block" size={15} />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <Link
                className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                to="/admin/settings"
              >
                View profile
              </Link>
              <Link
                className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                to="/admin/settings"
              >
                Settings
              </Link>
              <Link
                className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                to="/"
              >
                Return to public site
              </Link>
              <button
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                onClick={logout}
                type="button"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminTopbar;
