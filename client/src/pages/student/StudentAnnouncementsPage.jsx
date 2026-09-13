import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import { useApiQuery } from "../../utils/useApiQuery.js";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function StudentAnnouncementsPage() {
  const { data: response, error, loading, reload: loadAnnouncements } = useApiQuery("/student/announcements", { errorMessage: "We couldn't load announcements." });
  const announcements = response?.data || [];

  return (
    <div className="min-w-0">

      <section className="ph-role-page max-w-[960px]">
        <PageHeader
          description="Read published course and platform updates."
          eyebrow="Student workspace"
          title="Announcements"
        />
        {loading && <div className="mt-6 rounded-2xl border bg-white p-8"><Loading variant="announcements" label="Loading announcements..." /></div>}
        {error && (
          <div className="mt-6 ph-error p-6">
            <p>{error}</p>
            <button className="mt-3 font-bold underline" onClick={loadAnnouncements} type="button">
              Retry
            </button>
          </div>
        )}
        {!loading && !error && !announcements.length && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            No recent announcements.
          </div>
        )}
        {!loading && !error && announcements.length > 0 && (
          <div className="mt-6 space-y-4">
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
                <p className="mt-4 max-w-[72ch] whitespace-pre-wrap leading-7 text-slate-700">{announcement.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
