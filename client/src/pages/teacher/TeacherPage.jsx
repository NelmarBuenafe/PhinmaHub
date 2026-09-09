import { BookOpen, FileText, PlusCircle, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import TeacherNav from "../../components/teacher/TeacherNav.jsx";
import { useAuth } from "../../contexts/authContext.js";
import api from "../../services/api.js";
import { CourseCards } from "./TeacherCourses.jsx";

const cards = [
  { key: "totalCourses", label: "Total Courses", Icon: BookOpen },
  { key: "publishedCourses", label: "Published Courses", Icon: FileText },
  { key: "draftCourses", label: "Draft Courses", Icon: FileText },
  { key: "totalStudents", label: "Total Students", Icon: Users },
];

async function fetchTeacherDashboard() {
  const response = await api.get("/teacher/dashboard");
  return response.data;
}

export default function TeacherPage() {
  const { profile } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      const data = await fetchTeacherDashboard();
      setError("");
      setDashboard(data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Your dashboard could not be loaded.",
      );
    }
  }

  useEffect(() => {
    let active = true;
    fetchTeacherDashboard()
      .then((data) => {
        if (!active) return;
        setError("");
        setDashboard(data);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(
          requestError.response?.data?.message ||
            "Your dashboard could not be loaded.",
        );
      });
    return () => {
      active = false;
    };
  }, []);

  const name =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Teacher";

  return (
    <main className="min-h-screen bg-slate-50">
      <TeacherNav />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">
              Teacher Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Welcome back, {name}
            </h1>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800"
            to="/teacher/courses/create"
          >
            <PlusCircle size={18} /> Create Course
          </Link>
        </div>
        {!dashboard && !error && (
          <div className="mt-8 rounded-2xl border bg-white p-8">
            <Loading label="Loading your dashboard..." />
          </div>
        )}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
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
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(({ key, label, Icon }) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  key={key}
                >
                  <Icon className="text-emerald-700" size={22} />
                  <p className="mt-5 text-3xl font-black text-slate-950">
                    {dashboard.summary[key]}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {label}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-10 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-slate-950">My Courses</h2>
              <Link
                className="text-sm font-bold text-emerald-800 hover:underline"
                to="/teacher/courses"
              >
                View all courses
              </Link>
            </div>
            <div className="mt-5">
              <CourseCards courses={dashboard.data} emptyAction />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
