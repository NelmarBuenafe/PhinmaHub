import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

function CourseCard({ course }) {
  const Icon = course.icon || BookOpen;
  const visual = course.visual || "bg-emerald-50 text-emerald-700";
  const lessonCount = course.lesson_count ?? course.lessons ?? 0;
  const teacher = course.teacher_name || course.teacher || "Faculty instructor";

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none">
      <div
        className={`grid size-12 place-items-center rounded-xl ${visual}`}
      >
        <Icon aria-hidden="true" size={24} />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
          {course.category}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
          {course.difficulty || "All levels"}
        </span>
      </div>
      <h3 className="mt-3 text-xl font-black text-slate-950">{course.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
        {course.description}
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <BookOpen aria-hidden="true" size={15} /> {lessonCount} lessons
        </span>
        <span>{teacher}</span>
      </div>
      <Link
        className="mt-5 inline-flex items-center gap-2 font-bold text-emerald-700 hover:text-emerald-900"
        to="/courses"
      >
        View Course{" "}
        <ArrowRight
          aria-hidden="true"
          className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
          size={17}
        />
      </Link>
    </article>
  );
}

export default CourseCard;
