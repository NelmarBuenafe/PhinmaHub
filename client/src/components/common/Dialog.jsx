import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export default function Dialog({ children, description, footer, onClose, open, processing = false, size, title, wide = true }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector("input:not([disabled]), textarea:not([disabled]), button:not([disabled])")?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !processing) onCloseRef.current();
      if (event.key !== "Tab") return;
      const controls = dialog?.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, processing]);

  if (!open) return null;

  return (
    <div className="ph-dialog-backdrop fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-[2px]" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !processing) onClose();
    }}>
      <section aria-describedby={description ? descriptionId : undefined} aria-labelledby={titleId} aria-modal="true" className={`ph-dialog-panel flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl ${size === "medium" ? "max-w-2xl" : wide ? "max-w-3xl" : "max-w-xl"}`} ref={dialogRef} role="dialog" tabIndex="-1">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950" id={titleId}>{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-600" id={descriptionId}>{description}</p>}
          </div>
          <button aria-label="Close dialog" className="ph-action -mr-2 -mt-1 grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-950" disabled={processing} onClick={onClose} type="button"><X aria-hidden="true" size={19} /></button>
        </header>
        <div className="min-h-0 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex shrink-0 justify-end gap-3 border-t border-slate-100 px-6 py-4">{footer}</footer>}
      </section>
    </div>
  );
}
