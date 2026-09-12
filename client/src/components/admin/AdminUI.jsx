import { AlertCircle, Inbox, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import CommonPageHeader from "../common/PageHeader.jsx";
import CommonStatusBadge from "../common/StatusBadge.jsx";

export function PageHeader(props) {
  return <div className="mb-7"><CommonPageHeader {...props} /></div>;
}
export function StatusBadge(props) {
  return <CommonStatusBadge {...props} />;
}
export function LoadingSkeleton({ rows = 4 }) {
  return (
    <div aria-label="Loading" className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div
          className="ph-skeleton h-16 rounded-xl"
          key={i}
        />
      ))}
    </div>
  );
}
export function EmptyState({ message = "No records found." }) {
  return (
    <div className="ph-surface rounded-2xl border-dashed p-10 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Inbox /></span>
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
        className="ph-action mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
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
          className="ph-action rounded-lg border bg-white px-3 py-2 hover:border-emerald-500 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          type="button"
        >
          Previous
        </button>
        <button
          className="ph-action rounded-lg border bg-white px-3 py-2 hover:border-emerald-500 disabled:opacity-40"
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
  const titleId = useId();
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
          "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])",
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
      className="ph-dialog-backdrop fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !processing) onCloseRef.current();
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="ph-dialog-panel max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/80 bg-white p-6 shadow-2xl"
        ref={dialog}
        role="dialog"
        tabIndex="-1"
      >
        <div className="flex justify-between gap-4">
          <h2 className="text-xl font-black" id={titleId}>{title}</h2>
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
            className="ph-action rounded-lg border px-4 py-2 font-bold hover:bg-slate-50"
            disabled={processing}
            onClick={() => onCloseRef.current()}
            type="button"
          >
            Cancel
          </button>
          <button
            className={`ph-action rounded-lg px-4 py-2 font-bold text-white ${destructive ? "bg-red-700 hover:bg-red-800" : "bg-emerald-700 hover:bg-emerald-800"}`}
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
      className="ph-toast-enter fixed bottom-4 left-4 right-4 z-[80] flex max-w-sm items-center
        justify-between gap-3 rounded-xl bg-slate-950 px-4 py-3 text-sm
        font-bold text-white shadow-xl sm:bottom-5 sm:left-auto sm:right-5"
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
    <div className="ph-surface mb-5 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:flex-wrap">
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
        className="ph-action rounded-xl bg-slate-900 px-4 py-2.5 font-bold text-white hover:bg-slate-800"
        onClick={onSearch}
        type="button"
      >
        Apply
      </button>
    </div>
  );
}
