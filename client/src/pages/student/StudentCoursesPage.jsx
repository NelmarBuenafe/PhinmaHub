import { BookOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import StudentNav from "../../components/student/StudentNav.jsx";
import { useCourseList } from "../../utils/useCourseList.js";

function ProgressBar({ value }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${value}%` }} />
    </div>
  );
}

export default function StudentCoursesPage() {
  const { courses, error, loading, reload } = useCourseList("/student/courses");
  const location = useLocation();
  const successMessage = location.state?.success;

  return (
    <main className="min-h-screen bg-slate-50">
      <StudentNav />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Student workspace</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="mt-2 text-3xl font-black text-slate-950">My Courses</h1>
          <Link
            className="inline-flex items-center rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white hover:bg-emerald-800"
            to="/student/join-course"
          >
            + Join Course
          </Link>
        </div>
        {successMessage && (
          <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            {successMessage}
          </p>
        )}
        {loading && <div className="mt-8 rounded-2xl border bg-white p-8"><Loading label="Loading your courses..." /></div>}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p>We couldn't load your courses.</p>
            <button className="mt-3 font-bold underline" onClick={reload} type="button">
              Retry
            </button>
          </div>
        )}
        {!loading && !error && !courses.length && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            <p>You haven&apos;t joined any courses yet.</p>
            <Link
              className="mt-4 inline-flex rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white hover:bg-emerald-800"
              to="/student/join-course"
            >
              Join a Course
            </Link>
          </div>
        )}
        {!loading && !error && courses.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {courses.map((course) => {
              const total = course.lesson_count || 0;
              const completed = course.completed_lesson_count || 0;
              const progress = total ? Math.round((completed / total) * 100) : 0;
              return (
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={course.id}>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">{course.course_code}</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">{course.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">Instructor: {course.teacher_name}</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex-1"><ProgressBar value={progress} /></div>
                    <span className="text-sm font-black text-emerald-800">{progress}%</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{completed} / {total} published lessons completed</p>
                  <Link
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                    to={`/student/courses/${course.id}`}
                  >
                    <BookOpen size={16} /> Open course
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
