import { ArrowRight, BookOpen, CheckCircle2, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-emerald-100 bg-[#f4f9f6]">
      <div aria-hidden="true" className="absolute -right-24 top-0 size-[36rem] rounded-full bg-emerald-100/60 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-8 lg:py-24">
        <div className="ph-page-enter">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">PHINMAHUB · Learning connected</p>
          <h1 className="mt-5 max-w-xl text-4xl font-bold leading-[1.12] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
            Your next chapter<br className="hidden sm:block" /> starts <span className="text-emerald-700">here.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg font-medium leading-7 text-slate-800">
            A connected learning space for PHINMA students and teachers.
          </p>
          <p className="mt-3 max-w-lg text-base leading-7 text-slate-600">
            Move from lessons to assignments with clarity. Keep your courses,
            learning materials, feedback, and progress together in PhinmaHub.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="ph-action inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white shadow-sm hover:bg-emerald-800" to="/choose-role">
              Get Started <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link className="ph-action inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-800" to="/courses">
              Explore Courses
            </Link>
          </div>
          <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-600">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700" size={15} />
            For authorized PHINMA students and teachers.
          </p>
        </div>
        <figure className="ph-card-enter relative mx-auto w-full max-w-xl">
          <div className="ph-elevated overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
                <span className="grid size-7 place-items-center rounded-lg bg-emerald-700 text-xs text-white">P</span>
                PhinmaHub
              </div>
              <span className="text-xs font-medium text-slate-500">Student workspace</span>
            </div>
            <div className="bg-slate-50/80 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Your learning, at a glance</p>
                  <p className="mt-1 text-lg font-bold tracking-tight text-slate-950">Ready for your next lesson?</p>
                </div>
                <BookOpen aria-hidden="true" className="shrink-0 text-emerald-700" size={22} />
              </div>
              <div className="rounded-xl border border-emerald-200 bg-white p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800">Continue learning</p>
                <p className="mt-4 text-xs font-semibold text-slate-500">IT101</p>
                <h2 className="mt-1 text-xl font-bold leading-7 tracking-tight text-slate-950">Introduction to Information Technology</h2>
                <div className="mt-5 flex justify-between text-xs text-slate-600">
                  <span>2 of 3 lessons completed</span>
                  <span className="font-bold text-emerald-800">67%</span>
                </div>
                <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-2/3 rounded-full bg-emerald-600" />
                </div>
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Up next · Lesson 3</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">Introduction to Networking</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white">
                  Continue learning <ArrowRight aria-hidden="true" size={14} />
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><ClipboardList aria-hidden="true" size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800">Networking reflection</p>
                  <p className="mt-1 text-[11px] text-slate-500">Assignment · IT101</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-900">Not started</span>
              </div>
            </div>
          </div>
          <figcaption className="mt-3 text-center text-xs text-slate-500">Interface preview · Illustrative course and progress</figcaption>
        </figure>
      </div>
    </section>
  );
}

export default HeroSection;
