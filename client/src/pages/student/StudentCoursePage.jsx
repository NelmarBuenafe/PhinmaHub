import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import StudentNav from "../../components/student/StudentNav.jsx";
import api from "../../services/api.js";

const tabs = ["Lessons", "Assignments"];

export default function StudentCoursePage() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const [learning, setLearning] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [tab, setTab] = useState(
    searchParams.get("tab") === "Assignments" ? "Assignments" : "Lessons",
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [learningResponse, assignmentResponse] = await Promise.all([
        api.get(`/student/courses/${courseId}/learning`),
        api.get(`/student/courses/${courseId}/assignments`),
      ]);
      setLearning(learningResponse.data.data);
      setAssignments(assignmentResponse.data.data);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.status >= 500
          ? "Course content could not be loaded."
          : requestError.response?.data?.message ||
              "Course content could not be loaded.",
      );
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!learning && !error) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <Loading label="Loading course..." />
      </main>
    );
  }

  if (!learning) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <p className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>
        <Link className="mt-4 inline-block font-bold text-emerald-800" to="/student/courses">
          Back to My Courses
        </Link>
      </main>
    );
  }

  async function complete(lessonId) {
    try {
      await api.post(`/student/lessons/${lessonId}/complete`);
      setNotice("Lesson marked complete.");
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.status >= 500
          ? "Unable to update lesson progress."
          : requestError.response?.data?.message ||
              "Unable to update lesson progress.",
      );
    }
  }

  async function saveSubmission(event, assignment) {
    event.preventDefault();
    const writtenAnswer = new FormData(event.currentTarget).get("answer");
    const submit = event.nativeEvent.submitter?.value === "submit";
    try {
      await api.put(`/student/assignments/${assignment.id}/submission`, {
        writtenAnswer,
        submit,
      });
      setNotice(submit ? "Assignment submitted." : "Draft saved.");
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.status >= 500
          ? "Unable to save submission."
          : requestError.response?.data?.message ||
              "Unable to save submission.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <StudentNav />
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto max-w-5xl">
          <Link className="text-sm font-bold text-emerald-800" to="/student/courses">
            ← My Courses
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">
          {learning.course.course_code}
        </p>
        <h1 className="mt-2 text-3xl font-black">{learning.course.title}</h1>
        <p className="mt-3 text-slate-600">{learning.course.description}</p>
        <div className="mt-7 flex gap-2 border-b">
          {tabs.map((item) => (
            <button
              className={`px-4 py-3 font-bold ${
                tab === item
                  ? "border-b-2 border-emerald-700 text-emerald-800"
                  : "text-slate-600"
              }`}
              key={item}
              onClick={() => setTab(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        {notice && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-emerald-800">{notice}</p>}
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}

        {tab === "Lessons" && (
          <div className="mt-6 space-y-5">
            {learning.modules.length === 0 ? (
              <p className="rounded-2xl border bg-white p-6 text-slate-600">
                Your teacher has not published lessons yet.
              </p>
            ) : (
              learning.modules.map((module) => (
                <article className="rounded-2xl border bg-white p-6" key={module.id}>
                  <h2 className="text-xl font-black">{module.title}</h2>
                  <p className="mt-2 text-slate-600">{module.description}</p>
                  {module.lessons.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">
                      No published lessons in this module.
                    </p>
                  ) : (
                    module.lessons.map((lesson) => (
                      <div className="mt-5 border-t pt-5" key={lesson.id}>
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-black">{lesson.title}</h3>
                          {lesson.progress.is_completed ? (
                            <span className="text-sm font-bold text-emerald-700">
                              Complete
                            </span>
                          ) : (
                            <button
                              className="text-sm font-bold text-emerald-800"
                              onClick={() => complete(lesson.id)}
                              type="button"
                            >
                              Mark complete
                            </button>
                          )}
                        </div>
                        <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
                          {lesson.content || "No lesson content yet."}
                        </p>
                        {lesson.learning_objectives && (
                          <p className="mt-3 text-sm text-slate-600">
                            <strong>Learning objectives:</strong>{" "}
                            {lesson.learning_objectives}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </article>
              ))
            )}
          </div>
        )}

        {tab === "Assignments" && (
          <div className="mt-6 space-y-5">
            {assignments.length === 0 ? (
              <p className="rounded-2xl border bg-white p-6 text-slate-600">
                No published assignments yet.
              </p>
            ) : (
              assignments.map((assignment) => (
                <article
                  className="rounded-2xl border bg-white p-6"
                  id={`assignment-${assignment.id}`}
                  key={assignment.id}
                >
                  <h2 className="text-xl font-black">{assignment.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-slate-700">
                    {assignment.instructions}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    {assignment.total_points} points
                    {assignment.due_at &&
                      ` · Due ${new Date(assignment.due_at).toLocaleString()}`}
                  </p>
                  {assignment.submission?.status === "graded" && (
                    <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                      Graded: {assignment.submission.score} — {assignment.submission.feedback || "No feedback."}
                    </p>
                  )}
                  <form className="mt-5" onSubmit={(event) => saveSubmission(event, assignment)}>
                    <textarea
                      className="w-full rounded-xl border border-slate-300 p-3"
                      defaultValue={assignment.submission?.written_answer || ""}
                      name="answer"
                      placeholder="Write your answer here"
                      rows="6"
                    />
                    <div className="mt-3 flex gap-3">
                      <button className="rounded-xl border border-emerald-700 px-4 py-2 font-bold text-emerald-800" type="submit" value="draft">
                        Save draft
                      </button>
                      <button className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white" type="submit" value="submit">
                        Submit
                      </button>
                    </div>
                  </form>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}
