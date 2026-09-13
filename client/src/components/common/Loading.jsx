function Loading({ label = "Loading...", variant = "compact" }) {
  if (variant === "compact") {
    return <div className="flex items-center justify-center gap-3 p-6" role="status"><span className="size-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" aria-hidden="true" /><span className="text-sm font-semibold text-slate-600">{label}</span></div>;
  }
  const dashboard = variant === "dashboard" || variant === "teacher-dashboard";
  const headings = variant === "dashboard" ? ["Continue Learning", "Upcoming Assignments"]
    : variant === "teacher-dashboard" ? ["My Courses", ""] : [];
  const grid = variant === "lesson" ? "gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[272px_minmax(0,1fr)]"
    : variant === "announcements" ? "gap-4" : variant === "courses" ? "gap-5 md:grid-cols-2 xl:grid-cols-3" : "gap-5 lg:grid-cols-2";
  const count = variant === "courses" ? 3 : 2;
  return (
    <div className="w-full" role="status">
      <p className="mb-5 text-sm font-semibold text-slate-600">{label}</p>
      {dashboard && <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4" aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <div className="ph-skeleton h-24 rounded-xl" key={index} />)}</div>}
      <div className={`grid ${grid}`}>
        {Array.from({ length: count }, (_, index) => (
          <section className="space-y-4" key={index}>
            {headings[index] && <h2 className="text-xl font-bold text-slate-950">{headings[index]}</h2>}
            <div aria-hidden="true" className="space-y-4 rounded-xl border border-slate-100 p-5">
              <div className="ph-skeleton h-3 w-1/3 rounded" />
              <div className="ph-skeleton h-5 w-4/5 rounded" />
              <div className="ph-skeleton h-3 w-2/3 rounded" />
              <div className={`ph-skeleton rounded-lg ${variant === "lesson" ? "h-44" : variant === "profile" ? "h-32" : "h-16"}`} />
              {variant !== "profile" && <div className="ph-skeleton h-9 w-32 rounded-lg" />}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default Loading;
