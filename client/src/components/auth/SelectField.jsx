function SelectField({ children, error, label, name, placeholder, ...props }) {
  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-bold text-slate-700"
        htmlFor={name}
      >
        {label}
      </label>
      <select
        {...props}
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-slate-950 outline-none focus:bg-white focus:ring-2 ${error ? "border-red-400 focus:ring-red-100" : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-100"}`}
        id={name}
        name={name}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      {error && (
        <p
          className="mt-1.5 text-xs font-semibold text-red-700"
          id={`${name}-error`}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default SelectField;
