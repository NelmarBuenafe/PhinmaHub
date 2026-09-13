export default function ProfileDetails({ details, profile, sections }) {
  const name = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ");
  const initials = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || "PH";
  const role = details?.student_id
    ? "Student"
    : details?.employee_id
      ? "Teacher"
      : "Member";

  return (
    <div className="mt-6 space-y-6">
      <section className="ph-card-enter relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/15 sm:p-8">
        <div aria-hidden="true" className="absolute -right-12 -top-16 size-48 rounded-full border-[30px] border-white/5" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid size-20 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-black tracking-tight shadow-inner backdrop-blur">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">{role} profile · PhinmaHub account</p>
            <h2 className="mt-2 break-words text-2xl font-black tracking-tight">{name || "Profile"}</h2>
            <p className="mt-1 break-all text-sm text-slate-300">{profile.email}</p>
          </div>
        </div>
      </section>
      {sections.map((section, index) => (
        <section
          className="ph-card-enter ph-surface rounded-2xl p-5 sm:p-6"
          key={section.title}
          style={{ "--ph-delay": `${120 + index * 60}ms` }}
        >
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-6 w-1 rounded-full bg-emerald-600" />
            <h2 className="text-lg font-black text-slate-950">{section.title}</h2>
          </div>
          <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {section.fields.map(([label, getValue]) => (
              <div className="min-w-0 rounded-xl bg-slate-50/70 px-4 py-3" key={label}>
                <dt className="text-sm font-semibold text-slate-600">{label}</dt>
                <dd className="mt-1 break-words font-semibold text-slate-950">
                  {getValue(profile, details) || "Not provided"}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
