import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useApiQuery } from "../../utils/useApiQuery.js";

const filters = ["all", "pending", "submitted", "graded"];
const emptyAssignments = [];

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
  const [filter, setFilter] = useState("all");
  const { data: response, error, loading, reload: loadAssignments } = useApiQuery("/student/assignments", { errorMessage: "We couldn't load your assignments." });
  const assignments = response?.data || emptyAssignments;

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
    <div className="min-w-0">

      <section className="ph-role-page">
        <PageHeader
          description="Review pending work, submissions, grades, and feedback."
          eyebrow="Student workspace"
          title="Assignments"
        />
        <div className="mt-6 flex justify-end">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Assignment filters">
            {filters.map((item) => (
              <button
                className={`ph-action rounded-lg px-3 py-2 text-sm font-bold capitalize ${
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
        {loading && <div className="mt-6 rounded-2xl border bg-white p-8"><Loading variant="assignments" label="Loading assignments..." /></div>}
        {error && (
          <div className="mt-6 ph-error p-6">
            <p>{error}</p>
            <button className="mt-3 font-bold underline" onClick={loadAssignments} type="button">
              Retry
            </button>
          </div>
        )}
        {!loading && !error && !visibleAssignments.length && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            {filter === "pending" ? "You're all caught up." : "No assignments in this section."}
          </div>
        )}
        {!loading && !error && visibleAssignments.length > 0 && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {visibleAssignments.map((assignment) => (
              <article className="ph-interactive-card rounded-2xl p-6" key={assignment.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">{assignment.course_code}</p>
                    <h2 className="mt-2 text-xl font-black text-slate-950">{assignment.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{assignment.course_title}</p>
                  </div>
                  <StatusBadge
                    label={displayStatus(assignment.submission_status)}
                    value={assignment.submission_status}
                  />
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
                  className="ph-action mt-5 inline-flex rounded-xl border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                  to={`/student/courses/${assignment.course_id}?tab=Assignments#assignment-${assignment.id}`}
                >
                  Open assignment
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
