import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

function CallToAction() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 py-16 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-5 text-center sm:px-6 lg:flex-row lg:px-8 lg:text-left">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-yellow-300">
            Your next lesson starts here
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Start Learning with PhinmaHub
          </h2>
          <p className="mt-3 max-w-2xl text-emerald-50">
            Join an organized learning community for courses, programming
            practice and steady progress.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            className="ph-action inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-bold text-emerald-800 shadow-sm hover:bg-emerald-50"
            to="/choose-role"
          >
            Get Started <ArrowRight aria-hidden="true" size={18} />
          </Link>
          <Link
            className="ph-action inline-flex items-center justify-center rounded-xl border border-emerald-300 px-5 py-3.5 font-bold text-white hover:bg-emerald-800"
            to="/courses"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CallToAction;
