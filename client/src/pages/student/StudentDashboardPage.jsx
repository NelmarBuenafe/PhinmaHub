import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Megaphone,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StudentNav from "../../components/student/StudentNav.jsx";
import api from "../../services/api.js";
import { useDeferredLoad } from "../../utils/useDeferredLoad.js";

const summaryCards = [
  { key: "enrolledCourses", label: "Enrolled Courses", Icon: BookOpen },
  { key: "completedLessons", label: "Completed Lessons", Icon: CheckCircle2 },
  { key: "pendingAssignments", label: "Pending Assignments", Icon: ClipboardList },
  { key: "overallProgress", label: "Overall Progress", Icon: GraduationCap, suffix: "%" },
];

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
      <div
        className="ph-progress-fill h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function formatDate(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status) {
  return status === "pending" ? "Not started" : status;
}

export default function StudentDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const response = await api.get("/student/dashboard");
      setDashboard(response.data.data);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.status >= 500
          ? "We couldn't load your dashboard."
          : requestError.response?.data?.message ||
              "We couldn't load your dashboard.",
      );
    }
  }, []);

  useDeferredLoad(loadDashboard);

  return (
    <main className="min-h-screen bg-slate-50">
      <StudentNav />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {!dashboard && !error && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <Loading label="Loading your dashboard..." />
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p>{error}</p>
            <button
              className="mt-3 font-bold underline"
              onClick={loadDashboard}
              type="button"
            >
              Retry
            </button>
          </div>
        )}
        {dashboard && (
          <>
            <PageHeader
              action={
                <div className="flex flex-wrap gap-3">
                  <Link
                    className="ph-action inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white shadow-sm hover:bg-emerald-800"
                    to="/student/courses"
                  >
                    View my courses <ArrowRight aria-hidden="true" size={17} />
                  </Link>
                  <Link
                    className="ph-action inline-flex items-center rounded-xl border border-emerald-700 px-4 py-3 font-bold text-emerald-800 hover:bg-emerald-50"
                    to="/student/join-course"
                  >
                    Join a course
                  </Link>
                </div>
              }
              description="Continue learning and keep track of your progress."
              eyebrow="Student workspace"
              title={`Welcome back, ${dashboard.student.firstName}`}
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map(({ key, label, Icon, suffix }, index) => (
                <article
                  className="ph-card-enter ph-surface rounded-2xl p-5"
                  key={key}
                  style={{ "--ph-delay": `${80 + index * 45}ms` }}
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon aria-hidden="true" size={21} />
                  </span>
                  <p className="mt-4 text-3xl font-black text-slate-950">
                    {dashboard.summary[key]}
                    {suffix}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {label}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <section className="ph-surface-soft ph-card-enter rounded-2xl p-6 [--ph-delay:220ms]">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-black text-slate-950">
                    Continue Learning
                  </h2>
                  <BookOpen className="text-emerald-700" size={22} />
                </div>
                {dashboard.continueLearning ? (
                  <div className="mt-6">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                      {dashboard.continueLearning.course_code}
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                      {dashboard.continueLearning.title}
                    </h3>
                    <p className="mt-2 text-slate-600">
                      {dashboard.continueLearning.completed_lessons} of {" "}
                      {dashboard.continueLearning.total_lessons} lessons completed
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex-1">
                        <ProgressBar value={dashboard.continueLearning.progress} />
                      </div>
                      <span className="text-sm font-black text-emerald-800">
                        {dashboard.continueLearning.progress}%
                      </span>
                    </div>
                    <Link
                      className="ph-action mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-700 px-4 py-2.5 font-bold text-emerald-800 hover:bg-emerald-50"
                      to={`/student/courses/${dashboard.continueLearning.id}`}
                    >
                      Continue learning <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <p className="mt-6 text-slate-600">
                    You are not enrolled in any courses yet.
                  </p>
                )}
              </section>

              <section className="ph-surface ph-card-enter rounded-2xl p-6 [--ph-delay:260ms]">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-black text-slate-950">
                    Upcoming Assignments
                  </h2>
                  <ClipboardList className="text-emerald-700" size={22} />
                </div>
                {dashboard.upcomingAssignments.length ? (
                  <div className="mt-4 divide-y divide-slate-100">
                    {dashboard.upcomingAssignments.map((assignment) => (
                      <Link
                        className="ph-action -mx-2 block rounded-xl px-2 py-4 first:pt-0 last:pb-0 hover:bg-slate-50"
                        key={assignment.id}
                        to={`/student/courses/${assignment.course_id}?tab=Assignments#assignment-${assignment.id}`}
                      >
                        <p className="font-bold text-slate-950">{assignment.title}</p>
                        <p className="mt-1 text-xs font-semibold text-emerald-700">
                          {assignment.course_code}
                        </p>
                        <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500">
                          <span>Due {formatDate(assignment.due_at)}</span>
                          <span className="capitalize">{statusLabel(assignment.submission_status)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-slate-600">No upcoming assignments.</p>
                )}
                <Link
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:underline"
                  to="/student/assignments"
                >
                  View all assignments <ArrowRight size={15} />
                </Link>
              </section>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <section>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-black text-slate-950">My Courses</h2>
                  <Link className="text-sm font-bold text-emerald-800 hover:underline" to="/student/courses">
                    View all courses
                  </Link>
                </div>
                {dashboard.courses.length ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {dashboard.courses.slice(0, 4).map((course) => (
                      <article className="ph-interactive-card rounded-2xl p-5" key={course.id}>
                        <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">{course.course_code}</p>
                        <h3 className="mt-2 text-lg font-black text-slate-950">{course.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">Instructor: {course.teacher_name}</p>
                        <div className="mt-5 flex items-center gap-3">
                          <div className="flex-1"><ProgressBar value={course.progress} /></div>
                          <span className="text-sm font-black text-emerald-800">{course.progress}%</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{course.completed_lessons} / {course.total_lessons} lessons</p>
                        <Link
                          className="mt-4 inline-block text-sm font-bold text-emerald-800 hover:underline"
                          to={`/student/courses/${course.id}`}
                        >
                          Open course
                        </Link>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">You are not enrolled in any courses yet.</p>
                )}
              </section>

              <section className="ph-surface rounded-2xl p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-black text-slate-950">Recent Announcements</h2>
                  <Megaphone className="text-emerald-700" size={22} />
                </div>
                {dashboard.recentAnnouncements.length ? (
                  <div className="mt-4 divide-y divide-slate-100">
                    {dashboard.recentAnnouncements.map((announcement) => (
                      <article className="py-4 first:pt-0 last:pb-0" key={announcement.id}>
                        <p className="font-bold text-slate-950">{announcement.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{announcement.body}</p>
                        <p className="mt-2 text-xs font-semibold text-emerald-700">{announcement.course_code || "PhinmaHub"}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-slate-600">No recent announcements.</p>
                )}
                <Link className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:underline" to="/student/announcements">
                  View announcements <ArrowRight size={15} />
                </Link>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
