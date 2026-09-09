const stats = [
  ["2,500+", "Active learners"],
  ["48", "Available courses"],
  ["320+", "Learning activities"],
  ["1", "PHINMA community"],
];

function StatsSection() {
  return (
    <section aria-labelledby="stats-title" className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
          <div className="lg:w-48">
            <h2 className="font-black text-slate-950" id="stats-title">
              Learning at a glance
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Demo data until analytics are connected.
            </p>
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-5 sm:grid-cols-4">
            {stats.map(([value, label]) => (
              <div className="border-l-2 border-emerald-600 pl-4" key={label}>
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="mt-1 text-2xl font-black text-slate-950">
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
