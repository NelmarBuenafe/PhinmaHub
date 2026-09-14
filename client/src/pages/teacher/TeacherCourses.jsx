import { BookOpen, PlusCircle, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useCourseList } from "../../utils/useCourseList.js";

export function CourseCards({ courses, emptyAction = false, emptyMessage = "You don't have any courses yet." }) {
  if (!courses.length) {
    return (
      <div className="ph-surface rounded-2xl p-8 text-center">
        <BookOpen className="mx-auto text-emerald-700" size={32} />
        <p className="mt-4 font-bold text-slate-800">{emptyMessage}</p>
        {emptyAction && (
          <Link
            className="ph-action mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800"
            to="/teacher/courses/create"
          >
            <PlusCircle size={18} /> Create Your First Course
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <article className="ph-interactive-card ph-course-card" key={course.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                {course.course_code}
              </p>
            </div>
            <StatusBadge value={course.status} />
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-950">{course.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
            {course.description || "No course description yet."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="flex items-center gap-1.5"><Users size={16} /> {course.student_count || 0} {course.student_count === 1 ? "Student" : "Students"}</span>
            <span className="text-slate-300">·</span>
            <span className="capitalize">{course.visibility}</span>
          </div>
          <Link
            className="ph-action mt-5 inline-flex w-full justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
            to={`/teacher/courses/${course.id}`}
          >
            Manage Course
          </Link>
        </article>
      ))}
    </div>
  );
}

export default function TeacherCourses() {
  const { courses, error, loading, reload } = useCourseList("/teacher/courses");
  const [filter, setFilter] = useState("all");
  const visibleCourses = courses.filter((course) => filter === "all" || course.status === filter);
  const filters = [
    ["all", "All"],
    ["published", "Published"],
    ["draft", "Draft"],
    ["archived", "Archived"],
  ];

  return (
    <div className="min-w-0">

      <section className="ph-role-page">
        <PageHeader
          action={
            <Link
              className="ph-action inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white shadow-sm hover:bg-emerald-800"
              to="/teacher/courses/create"
            >
              <PlusCircle aria-hidden="true" size={18} /> Create Course
            </Link>
          }
          description="Create, publish, and manage your learning spaces."
          eyebrow="Teacher workspace"
          title="My Courses"
        />
        {loading && (
          <div className="mt-6 rounded-2xl border bg-white p-8">
            <Loading variant="courses" label="Loading your courses..." />
          </div>
        )}
        {error && (
          <div className="mt-6 ph-error p-6">
            <p>{error}</p>
            <button
              className="mt-3 font-bold underline"
              onClick={reload}
              type="button"
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !error && (
          <div className="mt-6">
            <div aria-label="Course filters" className="mb-8 flex flex-wrap gap-2" role="group">
              {filters.map(([value, label]) => (
                <button
                  aria-pressed={filter === value}
                  className={`ph-action rounded-lg border px-4 py-2 text-sm font-semibold ${filter === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-800"}`}
                  key={value}
                  onClick={() => setFilter(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <CourseCards courses={visibleCourses} emptyAction={filter === "all"} emptyMessage={filter === "all" ? "You don't have any courses yet." : `No ${filter} courses yet.`} />
          </div>
        )}
      </section>
    </div>
  );
}
