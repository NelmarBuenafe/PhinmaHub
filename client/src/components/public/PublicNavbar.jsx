import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Study Tools", href: "/#study-tools" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  function isActive(href) {
    if (href === "/") return location.pathname === "/" && !location.hash;
    return (
      `${location.pathname}${location.hash}` === href ||
      (href === "/courses" && location.pathname === "/courses")
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8"
      >
        <Link
          className="flex items-center gap-3"
          onClick={() => setOpen(false)}
          to="/"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-700 text-lg font-black text-white shadow-sm">
            P
          </span>
          <span className="text-xl font-black tracking-tight text-slate-950">
            Phinma<span className="text-emerald-700">Hub</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <a
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive(item.href) ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
              href={item.href}
              key={item.label}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            className="rounded-lg px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            to="/choose-role"
          >
            Login
          </Link>
          <Link
            className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
            to="/choose-role"
          >
            Get Started
          </Link>
        </div>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={open}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          className="grid size-11 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? (
            <X aria-hidden="true" size={22} />
          ) : (
            <Menu aria-hidden="true" size={22} />
          )}
        </button>
      </nav>

      {open && (
        <div
          className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden"
          id="mobile-navigation"
        >
          <div className="mx-auto max-w-7xl space-y-1">
            {navigation.map((item) => (
              <a
                className="block rounded-lg px-3 py-3 font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                href={item.href}
                key={item.label}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <Link
                className="rounded-lg border border-slate-300 px-4 py-3 text-center font-bold text-slate-700"
                onClick={() => setOpen(false)}
                to="/choose-role"
              >
                Login
              </Link>
              <Link
                className="rounded-lg bg-emerald-700 px-4 py-3 text-center font-bold text-white"
                onClick={() => setOpen(false)}
                to="/choose-role"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default PublicNavbar;
