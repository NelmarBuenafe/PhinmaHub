export default function PageHeader({
  action,
  description,
  eyebrow,
  title,
}) {
  return (
    <header className="ph-page-enter ph-surface-soft relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div aria-hidden="true" className="absolute -right-14 -top-20 size-48 rounded-full border-[28px] border-emerald-100/70" />
      <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            {eyebrow}
          </p>
        )}
        <h1 className={`${eyebrow ? "mt-2" : ""} text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl`}>
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
