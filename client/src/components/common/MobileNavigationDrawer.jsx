import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import RoleSidebar from "./RoleSidebar.jsx";

export default function MobileNavigationDrawer({ id, role, onClose }) {
  const panel = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector("button")?.focus();
    function keyboard(event) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const items = [...panel.current.querySelectorAll('a[href], button:not([disabled])')];
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    const media = window.matchMedia("(min-width: 768px)");
    function resize() { if (media.matches) onClose(); }
    document.addEventListener("keydown", keyboard);
    media.addEventListener("change", resize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keyboard);
      media.removeEventListener("change", resize);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div aria-hidden="true" className="absolute inset-0 bg-slate-950/35" onClick={onClose} />
      <aside aria-label={`${role} navigation menu`} aria-modal="true" className="ph-navigation-drawer relative h-full w-[272px] max-w-[calc(100vw-3rem)] overflow-y-auto border-r border-slate-200 bg-white pb-6 shadow-xl" id={id} ref={panel} role="dialog">
        <div className="flex justify-end px-3 pt-3"><button aria-label="Close navigation menu" className="ph-action grid size-11 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" onClick={onClose} type="button"><X aria-hidden="true" size={21} /></button></div>
        <RoleSidebar expanded mobile onNavigate={onClose} role={role} />
      </aside>
    </div>
  );
}
