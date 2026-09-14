import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useCourseList } from "../../utils/useCourseList.js";

function ProgressBar({ value }) {
  return (
    <div
      aria-label={`${value}% complete`}
      aria-valuemax="100"
      aria-valuemin="0"
      aria-valuenow={value}
      className="h-2.5 overflow-hidden rounded-full bg-slate-100"
      role="progressbar"
    >
      <div className="ph-progress-fill h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500" style={{ width: `${value}%` }} />
    </div>
  );
}

export default function StudentCoursesPage() {
  const { courses, error, loading, reload } = useCourseList("/student/courses");

  return (
    <div className="min-w-0">

      <section className="ph-role-page">
        <PageHeader
          action={
            <Link
              className="ph-action inline-flex items-center rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white shadow-sm hover:bg-emerald-800"
              to="/student/join-course"
            >
              + Join Course
            </Link>
          }
          description="Open your active and archived courses in one place."
          eyebrow="Student workspace"
          title="My Courses"
        />
        {loading && <div className="mt-6 rounded-2xl border bg-white p-8"><Loading variant="courses" label="Loading your courses..." /></div>}
        {error && (
          <div className="mt-6 ph-error p-6">
            <p>We couldn't load your courses.</p>
            <button className="mt-3 font-bold underline" onClick={reload} type="button">
              Retry
            </button>
          </div>
        )}
        {!loading && !error && !courses.length && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            <BookOpen aria-hidden="true" className="mb-4 text-emerald-700" size={28} />
            <h2 className="font-bold text-slate-900">No courses yet</h2>
            <p className="mt-2 text-sm">Join a course with the code provided by your teacher.</p>
            <Link
              className="mt-4 inline-flex rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white hover:bg-emerald-800"
              to="/student/join-course"
            >
              Join a Course
            </Link>
          </div>
        )}
        {!loading && !error && courses.length > 0 && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const total = course.lesson_count || 0;
              const completed = course.completed_lesson_count || 0;
              const progress = total ? Math.round((completed / total) * 100) : 0;
              return (
                <article className="ph-interactive-card ph-course-card" key={course.id}>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">{course.course_code}</p>
                  <div className="mt-2">
                    <StatusBadge value={course.status} />
                  </div>
                  <h2 className="mt-2 text-xl font-black text-slate-950">{course.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">Instructor: {course.teacher_name}</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex-1"><ProgressBar value={progress} /></div>
                    <span className="text-sm font-black text-emerald-800">{progress}%</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{completed} / {total} published lessons completed</p>
                  <Link
                    className="ph-action mt-auto inline-flex self-start items-center gap-2 rounded-xl border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
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
    </div>
  );
}
