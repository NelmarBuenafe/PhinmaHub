import {
  BookOpenCheck,
  ChartNoAxesCombined,
  CheckCircle2,
  Presentation,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

const content = {
  student: {
    heading: "Learn, practice and achieve your goals.",
    text: "Keep lessons, activities and learning progress together in one focused workspace.",
    features: [
      "Organized courses and lessons",
      "Programming practice resources",
      "Clear activity and progress tracking",
    ],
    Icon: BookOpenCheck,
  },
  teacher: {
    heading: "Create meaningful learning experiences.",
    text: "Build organized classes and help students move confidently through every lesson.",
    features: [
      "Create courses and lessons",
      "Publish and review activities",
      "Monitor student learning progress",
    ],
    Icon: Presentation,
  },
  admin: {
    heading: "Secure platform administration.",
    text: "Administrative access is available only to authorized accounts.",
    features: [
      "Protected Administrator access",
      "Secure Google authentication",
      "Protected administration workspace",
    ],
    Icon: ShieldCheck,
  },
};

function AuthLayout({ role = "student", children }) {
  const details = content[role] || content.student;
  const PreviewIcon = details.Icon;

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative overflow-hidden bg-slate-950 px-6 py-5 text-white lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-12 xl:px-18">
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 h-1.5 w-full bg-emerald-500"
        />
        <Link
          className="relative inline-flex items-center gap-3 text-xl font-black"
          to="/"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-600">
            P
          </span>
          PhinmaHub
        </Link>
        <div className="relative my-10 hidden max-w-lg lg:my-16 lg:block">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-300">
            PHINMA Education
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl xl:text-5xl">
            {details.heading}
          </h1>
          <p className="mt-5 leading-7 text-slate-300">{details.text}</p>
          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="grid size-12 place-items-center rounded-xl bg-emerald-600">
                <PreviewIcon aria-hidden="true" size={24} />
              </span>
              <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-300">
                {role === "teacher"
                  ? "Teaching workspace"
                  : role === "admin"
                    ? "Admin workspace"
                    : "Learning workspace"}
              </span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-3/4 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-800 p-4">
                <ChartNoAxesCombined
                  aria-hidden="true"
                  className="text-emerald-300"
                  size={19}
                />
                <p className="mt-3 text-sm font-bold">Progress at a glance</p>
              </div>
              <div className="rounded-xl bg-slate-800 p-4">
                <CheckCircle2
                  aria-hidden="true"
                  className="text-emerald-400"
                  size={19}
                />
                <p className="mt-3 text-sm font-bold">Work stays organized</p>
              </div>
            </div>
          </div>
          <ul className="mt-7 space-y-3 text-sm text-slate-300">
            {details.features.map((feature) => (
              <li className="flex items-center gap-3" key={feature}>
                <CheckCircle2
                  aria-hidden="true"
                  className="text-emerald-400"
                  size={18}
                />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative hidden text-xs text-slate-400 lg:block">
          Learning made accessible.
        </p>
      </section>
      <section className="flex items-start justify-center px-5 py-10 sm:px-8 lg:min-h-screen lg:items-center lg:py-14">
        <div className="ph-elevated w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-9">
          {children}
        </div>
      </section>
    </main>
  );
}

export default AuthLayout;
