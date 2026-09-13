import { Search } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";
import RoleNav from "../common/RoleNav.jsx";

const primaryLinks = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/courses", label: "Courses" },
];
const secondaryLinks = [
  { to: "/admin/users/students", label: "Students" },
  { to: "/admin/users/teachers", label: "Teachers" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/announcements", label: "Announcements" },
  { to: "/admin/study-tools", label: "Study Tools" },
  { to: "/admin/messages", label: "Contact Messages" },
  { to: "/admin/audit-logs", label: "Audit Logs" },
  { to: "/admin/settings", label: "Settings" },
];

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

function AdminTopbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
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
    <>
      <RoleNav links={primaryLinks} moreLinks={secondaryLinks} role="Admin" onSignOut={logout} />
      {searchable && (
        <form
          className="ph-app-container flex justify-end pt-4"
          onSubmit={submit}
        >
          <label className="relative block w-full sm:max-w-sm">
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
      )}
    </>
  );
}

export default AdminTopbar;
