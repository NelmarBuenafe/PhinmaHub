import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

function PasswordInput({
  error,
  label = "Password",
  name = "password",
  ...props
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-bold text-slate-700"
        htmlFor={name}
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          aria-describedby={error ? `${name}-error` : undefined}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-slate-50 px-4 py-3 pr-12 text-slate-950 outline-none focus:bg-white focus:ring-2 ${error ? "border-red-400 focus:ring-red-100" : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-100"}`}
          id={name}
          name={name}
          type={visible ? "text" : "password"}
        />
        <button
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 hover:text-emerald-700"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? (
            <EyeOff aria-hidden="true" size={19} />
          ) : (
            <Eye aria-hidden="true" size={19} />
          )}
        </button>
      </div>
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

export default PasswordInput;
