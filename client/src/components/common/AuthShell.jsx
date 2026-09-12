function AuthShell({
  eyebrow = "PHINMA EDUCATION",
  title,
  description,
  children,
}) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-50 px-5 py-10">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-emerald-700" />
      <div aria-hidden="true" className="ph-float absolute -left-24 top-20 size-72 rounded-full bg-emerald-100/70 blur-sm" />
      <div
        aria-hidden="true"
        className="ph-float absolute -right-24 bottom-10 size-72 rounded-full bg-yellow-100/70 blur-sm [animation-delay:-3s]"
      />

      <section className="ph-page-enter relative w-full max-w-md rounded-3xl border border-white/80 bg-white/95 p-7 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-9">
        <p className="text-xs font-bold tracking-[0.22em] text-emerald-700">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>
        {description && (
          <p className="mt-3 leading-7 text-slate-600">{description}</p>
        )}
        <div className="mt-7">{children}</div>
      </section>
    </main>
  );
}

export default AuthShell;
