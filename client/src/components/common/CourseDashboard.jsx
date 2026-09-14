import { BookOpen, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/authContext.js";
import { useCourseList } from "../../utils/useCourseList.js";
import Loading from "./Loading.jsx";
import AccountMenu from "./AccountMenu.jsx";

function CourseDashboard({ role }) {
  const normalizedRole = role.toLowerCase();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const { courses, error, loading } = useCourseList(
    `/${normalizedRole}/courses`,
  );
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "PhinmaHub user";
  const emptyMessage =
    normalizedRole === "student"
      ? "You are not enrolled in any courses yet."
      : "You do not have any courses yet.";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white py-4">
        <div className="ph-app-container flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-emerald-700">PhinmaHub</p>
            <p className="text-sm text-slate-500">{role} workspace</p>
          </div>
          <AccountMenu
            profile={profile}
            profileRoute={normalizedRole === "admin" ? "/admin/profile" : `/${normalizedRole}/profile`}
            role={role}
            onSignOut={signOut}
            settingsRoute={`/${normalizedRole}/settings`}
          />
        </div>
      </header>
      <section className="ph-app-container py-12">
        {location.state?.roleNotice && (
          <p
            className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-900"
            role="status"
          >
            {location.state.roleNotice}
          </p>
        )}
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
          {role} dashboard
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">
          Welcome, {displayName}
        </h1>
        <h2 className="mt-10 text-2xl font-black text-slate-900">
          {normalizedRole === "student" ? "My courses" : "Courses I teach"}
        </h2>

        {loading && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">
            <Loading label="Loading courses..." />
          </div>
        )}
        {error && (
          <p
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}
        {!loading && !error && courses.length === 0 && (
          <p className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            {emptyMessage}
          </p>
        )}
        {!loading && !error && courses.length > 0 && (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const lessonCount = course.lesson_count || 0;
              const completedCount = course.completed_lesson_count || 0;
              const progress = lessonCount
                ? Math.round((completedCount / lessonCount) * 100)
                : 0;

              return (
                <article
                  className="ph-interactive-card rounded-2xl p-6"
                  key={course.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                        {course.course_code}
                      </p>
                      <h3 className="mt-2 text-xl font-black text-slate-950">
                        {course.title}
                      </h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">
                      {course.status}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                    {course.description || "No course description yet."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
                    <span className="flex items-center gap-2">
                      <BookOpen aria-hidden="true" size={17} /> {lessonCount}{" "}
                      published lessons
                    </span>
                    {normalizedRole === "student" && (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 aria-hidden="true" size={17} /> {progress}%
                        complete
                      </span>
                    )}
                  </div>
                  {normalizedRole === "student" && (
                    <Link
                      className="mt-5 inline-block text-sm font-bold text-emerald-800 hover:underline"
                      to={`/student/courses/${course.id}`}
                    >
                      Open course
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default CourseDashboard;
