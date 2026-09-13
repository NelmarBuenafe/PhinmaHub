import { useEffect, useId, useRef, useState } from "react";

export default function HeaderDropdown({ label, buttonContent, children, onOpen, className = "" }) {
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const panel = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector("a[href], button:not([disabled])")?.focus();
    function outside(event) {
      if (!container.current?.contains(event.target)) setOpen(false);
    }
    function escape(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div
      className={`relative shrink-0 ${className}`}
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      ref={container}
    >
      <button
        aria-controls={open ? panelId : undefined}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={label}
        className="ph-action flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full px-2 text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
        onClick={() => {
          if (!open) onOpen?.();
          setOpen((value) => !value);
        }}
        ref={trigger}
        type="button"
      >
        {buttonContent}
      </button>
      {open && (
        <section
          aria-label={label}
          className="ph-dialog-panel fixed right-4 top-[var(--ph-menu-top,4.5rem)] z-50 mt-2 max-h-[calc(100dvh-6rem)] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-900/10 lg:absolute lg:right-0 lg:top-full"
          id={panelId}
          ref={panel}
        >
          {children({ close: () => setOpen(false) })}
        </section>
      )}
    </div>
  );
}
