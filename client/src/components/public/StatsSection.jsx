const stats = [
  ["Courses", "Organized classrooms"],
  ["Lessons", "Structured content"],
  ["Activities", "Submission workflows"],
  ["Progress", "Visible milestones"],
];

function StatsSection() {
  return (
    <section aria-labelledby="stats-title" className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-6 lg:px-8">
        <div className="ph-card-enter ph-surface flex flex-col gap-6 rounded-2xl p-6 lg:flex-row lg:items-center">
          <div className="lg:w-48">
            <h2 className="font-black text-slate-950" id="stats-title">
              Built for learning
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Real workflows already available in PhinmaHub.
            </p>
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-5 sm:grid-cols-4">
            {stats.map(([value, label]) => (
              <div className="border-l-2 border-emerald-600 pl-4" key={label}>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
                <dd className="mt-1 text-lg font-black text-slate-950 sm:text-xl">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
