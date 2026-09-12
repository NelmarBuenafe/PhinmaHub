function FormField({ error, label, optional, ...inputProps }) {
  const id = inputProps.id || inputProps.name;
  return (
    <div>
      <label
        className="mb-1.5 flex justify-between text-sm font-bold text-slate-700"
        htmlFor={id}
      >
        <span>{label}</span>
        {optional && (
          <span className="font-normal text-slate-400">Optional</span>
        )}
      </label>
      <input
        {...inputProps}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-slate-950 outline-none transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-2 ${error ? "border-red-400 focus:ring-red-100" : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-100"}`}
        id={id}
      />
      {error && (
        <p
          className="mt-1.5 text-xs font-semibold text-red-700"
          id={`${id}-error`}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
