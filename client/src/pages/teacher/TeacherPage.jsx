import { BookOpen, Eye, FileText, PlusCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import { useAuth } from "../../contexts/authContext.js";
import { useApiQuery } from "../../utils/useApiQuery.js";
import { CourseCards } from "./TeacherCourses.jsx";

const cards = [
  { key: "totalCourses", label: "Total Courses", Icon: BookOpen },
  { key: "publishedCourses", label: "Published", Icon: Eye },
  { key: "draftCourses", label: "Draft", Icon: FileText },
  { key: "totalStudents", label: "Total Students", Icon: Users },
];

export default function TeacherPage() {
  const { profile } = useAuth();
  const { data: dashboard, error, reload: loadDashboard } = useApiQuery("/teacher/dashboard", { errorMessage: "Your dashboard could not be loaded." });

  const name =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Teacher";

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
          description="Manage your courses and review student activity."
          eyebrow="Teacher workspace"
          title={`Welcome back, ${name}`}
        />
        {!dashboard && !error && (
          <div className="mt-6 rounded-2xl border bg-white p-8">
            <Loading variant="teacher-dashboard" label="Loading your dashboard..." />
          </div>
        )}
        {error && (
          <div className="mt-6 ph-error p-6">
            <p>{error}</p>
            <button
              className="mt-3 font-bold underline"
              onClick={loadDashboard}
              type="button"
            >
              Try again
            </button>
          </div>
        )}
        {dashboard && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
              {cards.map(({ key, label, Icon }, index) => (
                <article
                  className="ph-card-enter ph-surface ph-metric"
                  key={key}
                  style={{ "--ph-delay": `${80 + index * 45}ms` }}
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon aria-hidden="true" size={21} />
                  </span>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{dashboard.summary[key]}</p>
                  <p className="text-sm font-medium text-slate-600">{label}</p>
                </article>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-950">My Courses</h2>
              <Link
                className="text-sm font-bold text-emerald-800 hover:underline"
                to="/teacher/courses"
              >
                View all courses →
              </Link>
            </div>
            <div className="mt-5">
              <CourseCards courses={dashboard.data} emptyAction />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
