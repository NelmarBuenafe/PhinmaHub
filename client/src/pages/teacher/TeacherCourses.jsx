import { BookOpen, PlusCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";
import TeacherNav from "../../components/teacher/TeacherNav.jsx";
import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useCourseList } from "../../utils/useCourseList.js";

export function CourseCards({ courses, emptyAction = false }) {
  if (!courses.length) {
    return (
      <div className="ph-surface rounded-2xl p-8 text-center">
        <BookOpen className="mx-auto text-emerald-700" size={32} />
        <p className="mt-4 font-bold text-slate-800">You don't have any courses yet.</p>
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
    <div className="grid gap-5 md:grid-cols-2">
      {courses.map((course) => (
        <article className="ph-interactive-card rounded-2xl p-6" key={course.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                {course.course_code}
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-950">{course.title}</h2>
            </div>
            <StatusBadge value={course.status} />
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
            {course.description || "No course description yet."}
          </p>
          <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
            <span className="flex items-center gap-2"><Users size={17} /> {course.student_count || 0} Students</span>
            <span className="capitalize">{course.visibility}</span>
          </div>
          <Link
            className="ph-action mt-5 inline-flex rounded-lg border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
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

  return (
    <main className="min-h-screen bg-slate-50">
      <TeacherNav />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
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
          <div className="mt-8 rounded-2xl border bg-white p-8">
            <Loading label="Loading your courses..." />
          </div>
        )}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
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
          <div className="mt-8">
            <CourseCards courses={courses} emptyAction />
          </div>
        )}
      </section>
    </main>
  );
}
