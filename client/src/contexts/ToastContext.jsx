import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToastContext } from "./toastStore.js";
const DURATIONS = { success: 2800, info: 3000, warning: 3800, error: 4600 };
const MAX_VISIBLE_TOASTS = 3;

const styles = {
  success: { Icon: CheckCircle2, className: "border-emerald-200 text-emerald-900", iconClass: "bg-emerald-100 text-emerald-700" },
  error: { Icon: CircleAlert, className: "border-red-200 text-red-900", iconClass: "bg-red-100 text-red-700" },
  warning: { Icon: CircleAlert, className: "border-amber-200 text-amber-950", iconClass: "bg-amber-100 text-amber-700" },
  info: { Icon: Info, className: "border-sky-200 text-slate-900", iconClass: "bg-sky-100 text-sky-700" },
};

function normalizeToast(input) {
  const item = typeof input === "string" ? { message: input } : input || {};
  const type = styles[item.type] ? item.type : "info";
  return { type, message: String(item.message || "").trim(), duration: item.duration ?? DURATIONS[type] };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const activeKeys = useRef(new Map());

  const remove = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    activeKeys.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.map((toast) => toast.id === id ? { ...toast, leaving: true } : toast));
    const timer = window.setTimeout(() => remove(id), 180);
    timers.current.set(id, timer);
  }, [remove]);

  const show = useCallback((input) => {
    const toast = normalizeToast(input);
    if (!toast.message) return null;
    const key = `${toast.type}:${toast.message}`;
    if ([...activeKeys.current.values()].includes(key)) return null;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeKeys.current.set(id, key);
    setToasts((current) => {
      return [...current, { ...toast, id, leaving: false }].slice(-MAX_VISIBLE_TOASTS);
    });
    const timer = window.setTimeout(() => dismiss(id), toast.duration);
    timers.current.set(id, timer);
    return id;
  }, [dismiss]);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
    activeKeys.current.clear();
  }, []);

  const value = useMemo(() => ({
    show,
    dismiss,
    success: (message, options = {}) => show({ ...options, message, type: "success" }),
    error: (message, options = {}) => show({ ...options, message, type: "error" }),
    warning: (message, options = {}) => show({ ...options, message, type: "warning" }),
    info: (message, options = {}) => show({ ...options, message, type: "info" }),
  }), [dismiss, show]);

  return <ToastContext.Provider value={value}>{children}<ToastViewport toasts={toasts} onDismiss={dismiss} /></ToastContext.Provider>;
}

function ToastViewport({ onDismiss, toasts }) {
  return <section aria-label="Action notifications" className="pointer-events-none fixed inset-x-4 top-[76px] z-[100] flex flex-col gap-2 sm:left-auto sm:right-5 sm:w-[360px]">
    {toasts.map((toast) => {
      const style = styles[toast.type];
      const { Icon } = style;
      return <article aria-live={toast.type === "error" ? "assertive" : "polite"} className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg ${toast.leaving ? "ph-toast-exit" : "ph-toast-enter"} ${style.className}`} key={toast.id} role={toast.type === "error" ? "alert" : "status"}>
        <span className={`grid size-7 shrink-0 place-items-center rounded-full ${style.iconClass}`}><Icon aria-hidden="true" size={16} /></span>
        <p className="min-w-0 flex-1 pt-0.5 text-sm font-semibold leading-5">{toast.message}</p>
        <button aria-label="Dismiss notification" className="ph-action -mr-1 -mt-1 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900" onClick={() => onDismiss(toast.id)} type="button"><X aria-hidden="true" size={16} /></button>
      </article>;
    })}
  </section>;
}
