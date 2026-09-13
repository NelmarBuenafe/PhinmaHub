export default function PageHeader({
  action,
  description,
  eyebrow,
  title,
}) {
  return (
    <header className="ph-page-enter border-b border-slate-200 pb-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              {eyebrow}
            </p>
          )}
          <h1 className={`${eyebrow ? "mt-2" : ""} break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl`}>
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
