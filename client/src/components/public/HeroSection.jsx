import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Code2,
} from "lucide-react";
import { Link } from "react-router-dom";

function HeroSection() {
  return (
    <section className="relative border-b border-slate-200 bg-slate-50">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-emerald-700"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-24">
        <div>
          <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-800">
            PHINMA Education Learning Platform
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Learn, Teach and{" "}
            <span className="text-emerald-700">Build Your Future</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Study programming, complete activities and connect with teachers—all
            in one organized learning platform built for the PHINMA community.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 font-bold text-white shadow-sm transition hover:bg-emerald-800"
              to="/courses"
            >
              Explore Courses <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold text-slate-800 shadow-sm transition hover:border-emerald-600 hover:text-emerald-800"
              to="/choose-role"
            >
              Get Started
            </Link>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2
              aria-hidden="true"
              className="text-emerald-700"
              size={17}
            />{" "}
            Available for authorized PHINMA students and teachers.
          </p>
        </div>

        <div
          className="relative mx-auto w-full max-w-xl"
          aria-label="PhinmaHub learning dashboard preview"
        >
          <div
            aria-hidden="true"
            className="absolute -right-3 -top-3 size-20 rounded-2xl bg-yellow-300/70"
          />
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  My learning
                </p>
                <p className="mt-1 font-bold">Student workspace</p>
              </div>
              <div className="grid size-9 place-items-center rounded-full bg-emerald-600 text-sm font-black">
                AB
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-[1.35fr_0.85fr]">
              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Code2 aria-hidden="true" size={22} />
                  </div>
                  <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-800">
                    In progress
                  </span>
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Web Development
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  JavaScript Essentials
                </h2>
                <div className="mt-5 flex justify-between text-xs font-bold text-slate-500">
                  <span>Course progress</span>
                  <span>68%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[68%] rounded-full bg-emerald-600" />
                </div>
                <div className="mt-5 rounded-xl bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-300">
                  <p>
                    <span className="text-sky-400">const</span> learner ={" "}
                    <span className="text-yellow-300">'you'</span>;
                  </p>
                  <p>
                    <span className="text-emerald-400">learn</span>(learner);
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <CalendarDays
                    aria-hidden="true"
                    className="text-emerald-700"
                    size={20}
                  />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Upcoming
                  </p>
                  <p className="mt-1 font-bold text-slate-900">DOM Activity</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Due Friday, 5:00 PM
                  </p>
                </div>
                <div className="hidden rounded-2xl border border-slate-200 p-4 sm:block">
                  <BookOpen
                    aria-hidden="true"
                    className="text-blue-700"
                    size={20}
                  />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Next lesson
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    Functions & scope
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Lesson 8 of 12</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
