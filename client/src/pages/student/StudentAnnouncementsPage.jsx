import { useCallback, useState } from "react";
import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StudentNav from "../../components/student/StudentNav.jsx";
import api from "../../services/api.js";
import { useDeferredLoad } from "../../utils/useDeferredLoad.js";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/student/announcements");
      setAnnouncements(response.data.data);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.status >= 500
          ? "We couldn't load announcements."
          : requestError.response?.data?.message ||
              "We couldn't load announcements.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useDeferredLoad(loadAnnouncements);

  return (
    <main className="min-h-screen bg-slate-50">
      <StudentNav />
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <PageHeader
          description="Read published course and platform updates."
          eyebrow="Student workspace"
          title="Announcements"
        />
        {loading && <div className="mt-8 rounded-2xl border bg-white p-8"><Loading label="Loading announcements..." /></div>}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p>{error}</p>
            <button className="mt-3 font-bold underline" onClick={loadAnnouncements} type="button">
              Retry
            </button>
          </div>
        )}
        {!loading && !error && !announcements.length && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            No recent announcements.
          </div>
        )}
        {!loading && !error && announcements.length > 0 && (
          <div className="mt-8 space-y-4">
            {announcements.map((announcement) => (
              <article className="ph-card-enter ph-surface relative overflow-hidden rounded-2xl p-6" key={announcement.id}>
                <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-1 bg-emerald-500" />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">{announcement.course_code || "PhinmaHub"}</p>
                    <h2 className="mt-2 text-xl font-black text-slate-950">{announcement.title}</h2>
                  </div>
                  <time className="text-sm text-slate-500" dateTime={announcement.published_at}>{formatDate(announcement.published_at)}</time>
                </div>
                <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">{announcement.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
