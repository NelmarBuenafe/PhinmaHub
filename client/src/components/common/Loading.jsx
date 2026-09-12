function Loading({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 p-6" role="status">
      <span
        className="size-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700 shadow-sm"
        aria-hidden="true"
      />
      <span className="text-sm font-semibold text-slate-600">{label}</span>
    </div>
  );
}

export default Loading;
