import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Presentation,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  StatusBadge,
} from "../../components/admin/AdminUI.jsx";
import { useAuth } from "../../contexts/authContext.js";
import { adminApi } from "../../services/adminApi.js";
import { formatDate, fullName, relativeTime } from "../../utils/admin.js";

function greeting() {
  const hour = new Date().getHours();
  return hour < 12
    ? "Good morning"
    : hour < 18
      ? "Good afternoon"
      : "Good evening";
}
function StatCard({ accent = false, icon: Icon, label, title, value }) {
  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm ${accent ? "border-yellow-300" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`grid size-11 place-items-center rounded-xl ${accent ? "bg-yellow-100 text-yellow-800" : "bg-emerald-50 text-emerald-700"}`}
        >
          <Icon size={21} />
        </span>
        {accent && <StatusBadge value="pending" />}
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </article>
  );
}

function AdminPage() {
  const { profile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData((await adminApi.dashboard()).data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  if (error) return <ErrorState onRetry={load} />;
  const name = profile?.first_name || "Administrator";
  return (
    <div>
      <PageHeader
        action={
          <Link
            className="rounded-xl bg-emerald-700 px-5 py-3 font-black text-white hover:bg-emerald-800"
            to="/admin/users"
          >
            Invite Student or Teacher
          </Link>
        }
        description="Here's what needs your attention today."
        title={`${greeting()}, ${name}`}
      />
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={GraduationCap}
              label="Active accounts"
              title="Active Students"
              value={data.summary.activeStudents}
            />
            <StatCard
              icon={Presentation}
              label="Active accounts"
              title="Active Teachers"
              value={data.summary.activeTeachers}
            />
            <StatCard
              icon={BookOpen}
              label="Currently visible courses"
              title="Published Courses"
              value={data.summary.publishedCourses}
            />
            <StatCard
              accent
              icon={ClipboardCheck}
              label="Waiting for email confirmation"
              title="Unverified Accounts"
              value={data.summary.pendingApprovals}
            />
          </section>
          <div className="mt-7 grid gap-7 xl:grid-cols-[1.35fr_.65fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black">Recent registrations</h2>
                <Link
                  className="text-sm font-bold text-emerald-700"
                  to="/admin/users"
                >
                  View All Users
                </Link>
              </div>
              {data.applications.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="border-b text-xs uppercase text-slate-500">
                      <tr>
                        <th className="py-3">Applicant</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>ID / Campus</th>
                        <th>Submitted</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.applications.map((application) => (
                        <tr
                          className="border-b border-slate-100"
                          key={application.id}
                        >
                          <td className="py-4 font-bold">
                            {fullName(application)}
                          </td>
                          <td>{application.email}</td>
                          <td>
                            <StatusBadge value={application.requested_role} />
                          </td>
                          <td>
                            {application.role_details?.student_id ||
                              application.role_details?.employee_id ||
                              "—"}{" "}
                            · {application.role_details?.campus || "—"}
                          </td>
                          <td>{formatDate(application.created_at)}</td>
                          <td>
                            <StatusBadge value="pending" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState message="No accounts are awaiting email verification." />
                </div>
              )}
            </section>
            <aside className="space-y-7">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black">Course overview</h2>
                {Object.entries(data.courseStatus).map(([status, count]) => (
                  <div className="mt-4" key={status}>
                    <div className="flex justify-between text-sm">
                      <StatusBadge value={status} />
                      <strong>{count}</strong>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{
                          width: `${Math.min(100, count ? Math.max(8, (count / (data.summary.publishedCourses + data.courseStatus.draft + data.courseStatus.archived || 1)) * 100) : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black">Quick actions</h2>
                <div className="mt-4 grid gap-2">
                  {[
                    ["Invite Student or Teacher", "/admin/users"],
                    ["Manage users", "/admin/users"],
                    ["Review courses", "/admin/courses"],
                    ["Create announcement", "/admin/announcements"],
                  ].map(([label, path]) => (
                    <Link
                      className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-bold hover:border-emerald-500 hover:bg-emerald-50"
                      key={path}
                      to={path}
                    >
                      <Users size={17} />
                      {label}
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          </div>
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">Latest courses</h2>
              <Link
                className="text-sm font-bold text-emerald-700"
                to="/admin/courses"
              >
                View courses
              </Link>
            </div>
            {data.courses.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="border-b text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-3">Code</th>
                      <th>Course</th>
                      <th>Teacher</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.courses.map((course) => (
                      <tr className="border-b border-slate-100" key={course.id}>
                        <td className="py-4 font-bold">{course.course_code}</td>
                        <td>{course.title}</td>
                        <td>{course.teacher_name || "Unknown teacher"}</td>
                        <td>
                          <StatusBadge value={course.status} />
                        </td>
                        <td>{formatDate(course.created_at)}</td>
                        <td>
                          <Link
                            className="font-bold text-emerald-700"
                            to="/admin/courses"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState message="No courses have been created yet." />
              </div>
            )}
          </section>
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Recent activity</h2>
            {data.activity.length ? (
              <ul className="mt-4 divide-y divide-slate-100">
                {data.activity.map((item) => (
                  <li
                    className="flex items-start justify-between gap-4 py-3 text-sm"
                    key={item.id}
                  >
                    <div>
                      <p className="font-bold capitalize">
                        {item.action.replaceAll("_", " ")}
                      </p>
                      <p className="text-slate-500">
                        {item.actor_name || item.actor_id || "System"} ·{" "}
                        {item.entity_type} · {item.entity_id || "system"}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-slate-500">
                      {relativeTime(item.created_at)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4">
                <EmptyState message="No important activity has been recorded yet." />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
export default AdminPage;
