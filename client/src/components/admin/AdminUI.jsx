import { AlertCircle, Inbox, X } from "lucide-react";
import { useEffect, useRef } from "react";

export function PageHeader({ action, description, title }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
export function StatusBadge({ value }) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-900",
    active: "bg-emerald-100 text-emerald-800",
    published: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    suspended: "bg-red-100 text-red-800",
    archived: "bg-slate-200 text-slate-700",
    draft: "bg-blue-100 text-blue-800",
    student: "bg-blue-100 text-blue-800",
    teacher: "bg-violet-100 text-violet-800",
    new: "bg-yellow-100 text-yellow-900",
    resolved: "bg-emerald-100 text-emerald-800",
    in_progress: "bg-blue-100 text-blue-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black capitalize ${styles[value] || "bg-slate-100 text-slate-700"}`}
    >
      {String(value || "unknown").replace("_", " ")}
    </span>
  );
}
export function LoadingSkeleton({ rows = 4 }) {
  return (
    <div aria-label="Loading" className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div
          className="h-16 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none"
          key={i}
        />
      ))}
    </div>
  );
}
export function EmptyState({ message = "No records found." }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <Inbox className="mx-auto text-slate-400" />
      <p className="mt-3 font-bold text-slate-700">{message}</p>
    </div>
  );
}
export function ErrorState({ onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="mx-auto text-red-600" />
      <p className="mt-3 font-bold text-red-800">
        This information could not be loaded.
      </p>
      <button
        className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}
export function Pagination({ onPage, page = 1, pages = 1 }) {
  return (
    <div className="mt-5 flex items-center justify-between text-sm">
      <span className="text-slate-500">
        Page {page} of {Math.max(pages, 1)}
      </span>
      <div className="flex gap-2">
        <button
          className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          type="button"
        >
          Previous
        </button>
        <button
          className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
export function ConfirmationDialog({
  children,
  confirmLabel = "Confirm",
  destructive = false,
  onClose,
  onConfirm,
  open,
  processing,
  title,
}) {
  const dialog = useRef(null),
    previous = useRef(null),
    onCloseRef = useRef(onClose),
    processingRef = useRef(processing);

  useEffect(() => {
    onCloseRef.current = onClose;
    processingRef.current = processing;
  }, [onClose, processing]);

  useEffect(() => {
    if (!open) return;
    previous.current = document.activeElement;
    dialog.current?.focus();
    function key(e) {
      if (e.key === "Escape" && !processingRef.current)
        onCloseRef.current();
      if (e.key === "Tab") {
        const buttons = dialog.current?.querySelectorAll(
          "button,input,select,textarea",
        );
        if (!buttons?.length) return;
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous.current?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !processing) onCloseRef.current();
      }}
    >
      <section
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        ref={dialog}
        role="dialog"
        tabIndex="-1"
      >
        <div className="flex justify-between gap-4">
          <h2 className="text-xl font-black">{title}</h2>
          <button
            aria-label="Close dialog"
            disabled={processing}
            onClick={() => onCloseRef.current()}
            type="button"
          >
            <X />
          </button>
        </div>
        <div className="mt-4 text-sm leading-6 text-slate-600">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-lg border px-4 py-2 font-bold"
            disabled={processing}
            onClick={() => onCloseRef.current()}
            type="button"
          >
            Cancel
          </button>
          <button
            className={`rounded-lg px-4 py-2 font-bold text-white ${destructive ? "bg-red-700" : "bg-emerald-700"}`}
            disabled={processing}
            onClick={onConfirm}
            type="button"
          >
            {processing ? "Processing…" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
export function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-5 right-5 z-[80] flex max-w-sm items-center gap-3 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-xl"
      role="status"
    >
      {message}
      <button aria-label="Dismiss notification" onClick={onClose} type="button">
        <X size={17} />
      </button>
    </div>
  );
}
export function SearchFilters({ children, onSearch, search, setSearch }) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap">
      <label className="min-w-56 flex-1">
        <span className="sr-only">Search</span>
        <input
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5"
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          placeholder="Search…"
          value={search}
        />
      </label>
      {children}
      <button
        className="rounded-xl bg-slate-900 px-4 py-2.5 font-bold text-white"
        onClick={onSearch}
        type="button"
      >
        Apply
      </button>
    </div>
  );
}
