import { useCallback, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import CourseContentSidebar from "../../components/student/CourseContentSidebar.jsx";
import CourseLearningHeader from "../../components/student/CourseLearningHeader.jsx";
import LessonViewer from "../../components/student/LessonViewer.jsx";
import StudentNav from "../../components/student/StudentNav.jsx";
import Loading from "../../components/common/Loading.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import api from "../../services/api.js";
import { useDeferredLoad } from "../../utils/useDeferredLoad.js";

const tabs = ["Course Content", "Assignments"];

function AssignmentPanel({ assignments, onSaveSubmission, readOnly }) {
  if (!assignments.length) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
        No published assignments yet.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {assignments.map((assignment) => (
        <article
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          id={`assignment-${assignment.id}`}
          key={assignment.id}
        >
          <h2 className="text-xl font-black text-slate-950">{assignment.title}</h2>
          <div className="mt-2">
            <StatusBadge
              label={assignment.submission?.status || "Not started"}
              value={assignment.submission?.status || "pending"}
            />
          </div>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
            {assignment.instructions || "No instructions have been added yet."}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            {assignment.total_points} points
            {assignment.due_at &&
              ` · Due ${new Date(assignment.due_at).toLocaleString()}`}
          </p>
          {assignment.submission?.status === "graded" && (
            <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              ✓ Graded · Score: {assignment.submission.score} / {assignment.total_points}
              <br />
              Teacher Feedback: {assignment.submission.feedback || "No feedback."}
            </p>
          )}
          {readOnly && assignment.submission?.status !== "graded" && (
            <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
              This archived course is read-only. Submission changes are disabled.
            </p>
          )}
          <form
            className="mt-5"
            onSubmit={(event) => onSaveSubmission(event, assignment)}
          >
            <label className="block text-sm font-bold text-slate-800" htmlFor={`answer-${assignment.id}`}>
              Your answer
            </label>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-300 p-3 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              defaultValue={assignment.submission?.written_answer || ""}
              disabled={readOnly || assignment.submission?.status === "graded"}
              id={`answer-${assignment.id}`}
              name="answer"
              placeholder="Write your answer here"
              rows="6"
            />
            {!readOnly && assignment.submission?.status !== "graded" && (
              <div className="mt-3 flex flex-wrap gap-3">
              <button
                className="rounded-xl border border-emerald-700 px-4 py-2 font-bold text-emerald-800 hover:bg-emerald-50"
                type="submit"
                value="draft"
              >
                Save Draft
              </button>
              <button
                className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800"
                type="submit"
                value="submit"
              >
                Submit Assignment
              </button>
              </div>
            )}
          </form>
        </article>
      ))}
    </div>
  );
}

export default function StudentCoursePage() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const [learning, setLearning] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "Assignments" ? "Assignments" : "Course Content",
  );
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [completingLessonIds, setCompletingLessonIds] = useState(() => new Set());
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

  useDeferredLoad(load);

  const lessons = useMemo(
    () => learning?.modules.flatMap((module) => module.lessons) || [],
    [learning],
  );
  const selectedLesson =
    lessons.find((lesson) => lesson.id === selectedLessonId) ||
    lessons.find((lesson) => !lesson.completion?.isCompleted) ||
    lessons[0] ||
    null;
  const selectedIndex = lessons.findIndex((lesson) => lesson.id === selectedLesson?.id);
  const completedCount = lessons.filter(
    (lesson) => lesson.completion?.isCompleted,
  ).length;

  async function completeLesson(lessonId) {
    if (learning?.course.status === "archived") return;
    if (completingLessonIds.has(lessonId)) return;

    setCompletingLessonIds((current) => new Set(current).add(lessonId));
    try {
      const response = await api.post(`/student/lessons/${lessonId}/complete`);
      const completion = response.data.data;
      setLearning((current) => ({
        ...current,
        modules: current.modules.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) =>
            lesson.id === lessonId
              ? {
                  ...lesson,
                  completion: {
                    isCompleted: completion.is_completed === true,
                    completedAt: completion.completed_at || null,
                  },
                }
              : lesson,
          ),
        })),
      }));
      setNotice("Lesson marked complete.");
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.status >= 500
          ? "Unable to update lesson progress."
          : requestError.response?.data?.message ||
              "Unable to update lesson progress.",
      );
    } finally {
      setCompletingLessonIds((current) => {
        const next = new Set(current);
        next.delete(lessonId);
        return next;
      });
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
          : requestError.response?.data?.message || "Unable to save submission.",
      );
    }
  }

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

  return (
    <main className="min-h-screen bg-slate-50">
      <StudentNav />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link className="text-sm font-bold text-emerald-800 hover:underline" to="/student/courses">
          ← My Courses
        </Link>
        <div className="mt-5">
          <CourseLearningHeader
            completedCount={completedCount}
            course={learning.course}
            lessonCount={lessons.length}
          />
        </div>
        {learning.course.status === "archived" && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            This course is archived. Historical lessons, submissions, grades, and feedback remain available in read-only mode.
          </p>
        )}

        <div
          aria-label="Course sections"
          className="mt-7 flex gap-2 overflow-x-auto border-b border-slate-200"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              className={`rounded-t-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                activeTab === tab
                  ? "bg-emerald-700 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        {notice && (
          <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-800" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-800" role="alert">
            {error}
          </p>
        )}

        {activeTab === "Course Content" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <CourseContentSidebar
              modules={learning.modules}
              onSelectLesson={setSelectedLessonId}
              selectedLessonId={selectedLesson?.id}
            />
            <LessonViewer
              completing={selectedLesson ? completingLessonIds.has(selectedLesson.id) : false}
              hasNext={selectedIndex >= 0 && selectedIndex < lessons.length - 1}
              hasPrevious={selectedIndex > 0}
              lesson={selectedLesson}
              onComplete={() => completeLesson(selectedLesson.id)}
              onNext={() => setSelectedLessonId(lessons[selectedIndex + 1].id)}
              onMaterialError={setError}
              onPrevious={() => setSelectedLessonId(lessons[selectedIndex - 1].id)}
              readOnly={learning.course.status === "archived"}
            />
          </div>
        ) : (
          <div className="mt-6">
            <AssignmentPanel
              assignments={assignments}
              onSaveSubmission={saveSubmission}
              readOnly={learning.course.status === "archived"}
            />
          </div>
        )}
      </section>
    </main>
  );
}
