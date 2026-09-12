import { Link, useLocation } from "react-router-dom";

export default function PolicyPage() {
  const { pathname } = useLocation();
  const isPrivacy = pathname === "/privacy-policy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Use";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <Link className="font-bold text-emerald-800 hover:underline" to="/">
          ← Back to PhinmaHub
        </Link>
        <p className="mt-8 text-sm font-bold uppercase tracking-wider text-emerald-700">
          PHINMA Hub policy page
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          This project-level policy page is informational only and requires
          institutional review before production deployment.
        </p>
        <p className="mt-6 leading-7 text-slate-700">
          PHINMA Hub is a learning management system for authorized students,
          teachers, and administrators. Access is protected by authentication,
          role authorization, and course enrollment rules.
        </p>
        <p className="mt-4 leading-7 text-slate-700">
          Use of this system must follow applicable institutional policies,
          academic integrity requirements, and instructions from PHINMA.
          Institutional owners should replace this summary with approved policy
          text before launch.
        </p>
      </article>
    </main>
  );
}
