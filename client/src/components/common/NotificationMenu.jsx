import { ArrowRight, Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api.js";
import HeaderDropdown from "./HeaderDropdown.jsx";

export default function NotificationMenu({ role }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(true);
  const requesting = useRef(false);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  async function loadAnnouncements() {
    if (role !== "Student" || requesting.current) return;
    requesting.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/student/announcements");
      if (active.current) setAnnouncements(response.data.data || []);
    } catch {
      if (active.current) setError("We couldn't load announcements. Please try again.");
    } finally {
      requesting.current = false;
      if (active.current) setLoading(false);
    }
  }

  const destination = role === "Student" ? "/student/announcements"
    : role === "Admin" ? "/admin/announcements" : "/teacher/courses";

  return (
    <HeaderDropdown label="Notifications" buttonContent={<Bell aria-hidden="true" size={20} />} onOpen={loadAnnouncements}>
      {({ close }) => (
        <>
          <h2 className="px-3 py-2 text-sm font-bold text-slate-950">Notifications</h2>
          {role === "Student" ? (
            <div className="px-3 py-2">
              {loading && <p className="text-sm text-slate-600" role="status">Loading announcements...</p>}
              {error && <p className="text-sm text-slate-600" role="alert">{error}</p>}
              {!loading && !error && !announcements.length && <p className="text-sm text-slate-500">No announcements yet.</p>}
              {!loading && !error && [...announcements].sort((a, b) => (Date.parse(b.published_at) || 0) - (Date.parse(a.published_at) || 0)).slice(0, 3).map((item) => (
                <article className="border-b border-slate-100 py-3 first:pt-0 last:border-0" key={item.id}>
                  <p className="text-xs font-semibold text-emerald-800">{item.course_code || "PhinmaHub"}</p>
                  <h3 className="mt-1 break-words text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{item.body}</p>
                  {item.published_at && Number.isFinite(Date.parse(item.published_at)) && <time className="mt-1.5 block text-[11px] text-slate-500" dateTime={item.published_at}>{new Date(item.published_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>}
                </article>
              ))}
            </div>
          ) : (
            <p className="px-3 py-2 text-sm leading-6 text-slate-600">
              {role === "Teacher" ? "Manage and review course announcements inside each course." : "Review published and draft platform announcements."}
            </p>
          )}
          <Link className="mt-2 flex min-h-11 items-center justify-between gap-2 border-t border-slate-100 px-3 pt-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50" onClick={close} to={destination}>
            {role === "Teacher" ? "Open my courses" : "View all announcements"}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </>
      )}
    </HeaderDropdown>
  );
}
