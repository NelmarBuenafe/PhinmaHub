import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import StudentNav from "../../components/student/StudentNav.jsx";
import api from "../../services/api.js";

const filters = ["all", "pending", "submitted", "graded"];

function formatDate(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function displayStatus(status) {
  return status === "pending" ? "Not started" : status;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAssignments() {
    setLoading(true);
    try {
      const response = await api.get("/student/assignments");
      setAssignments(response.data.data);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.status >= 500
          ? "We couldn't load your assignments."
          : requestError.response?.data?.message ||
              "We couldn't load your assignments.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  const visibleAssignments = useMemo(
    () =>
      filter === "all"
        ? assignments
        : assignments.filter((assignment) =>
            filter === "pending"
              ? assignment.submission_status === "pending" ||
                assignment.submission_status === "draft"
              : filter === "submitted"
                ? ["submitted", "late"].includes(
                    assignment.submission_status,
                  )
                : assignment.submission_status === "graded",
          ),
    [assignments, filter],
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <StudentNav />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">
              Student workspace
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Assignments
            </h1>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Assignment filters">
            {filters.map((item) => (
              <button
                className={`rounded-lg px-3 py-2 text-sm font-bold capitalize ${
                  filter === item
                    ? "bg-emerald-700 text-white"
                    : "border border-slate-300 bg-white text-slate-600"
                }`}
                key={item}
                onClick={() => setFilter(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        {loading && <div className="mt-8 rounded-2xl border bg-white p-8"><Loading label="Loading assignments..." /></div>}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p>{error}</p>
            <button className="mt-3 font-bold underline" onClick={loadAssignments} type="button">
              Retry
            </button>
          </div>
        )}
        {!loading && !error && !visibleAssignments.length && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            {filter === "pending" ? "You're all caught up." : "No assignments in this section."}
          </div>
        )}
        {!loading && !error && visibleAssignments.length > 0 && (
          <div className="mt-8 grid gap-4">
            {visibleAssignments.map((assignment) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={assignment.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">{assignment.course_code}</p>
                    <h2 className="mt-2 text-xl font-black text-slate-950">{assignment.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{assignment.course_title}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                    {displayStatus(assignment.submission_status)}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
                  <span>Due {formatDate(assignment.due_at)}</span>
                  <span>{assignment.total_points} points</span>
                  {assignment.submission_status === "graded" && (
                    <span className="font-bold text-emerald-800">
                      Score: {assignment.submission?.score} / {assignment.total_points}
                    </span>
                  )}
                </div>
                {assignment.submission_status === "graded" && assignment.submission?.feedback && (
                  <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                    Teacher feedback: {assignment.submission.feedback}
                  </p>
                )}
                <Link
                  className="mt-5 inline-flex rounded-xl border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                  to={`/student/courses/${assignment.course_id}?tab=Assignments#assignment-${assignment.id}`}
                >
                  Open assignment
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
