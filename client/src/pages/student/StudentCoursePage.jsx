import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import CourseContentSidebar from "../../components/student/CourseContentSidebar.jsx";
import LessonViewer from "../../components/student/LessonViewer.jsx";
import StudentWorkspaceHeader from "../../components/student/StudentWorkspaceHeader.jsx";
import api from "../../services/api.js";
import { useApiQuery } from "../../utils/useApiQuery.js";
import { useToast } from "../../contexts/toastStore.js";
import { actionErrorMessage } from "../../utils/actionFeedback.js";

export default function StudentCoursePage() {
  const { courseId } = useParams();
  const learningQuery = useApiQuery(`/student/courses/${courseId}/learning`, { errorMessage: "Course content could not be loaded." });
  const learning = learningQuery.data?.data;
  const setLearning = (updater) => learningQuery.update((current) => ({ ...current, data: updater(current.data) }));
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [completingLessonIds, setCompletingLessonIds] = useState(() => new Set());
  const [actionError, setError] = useState("");
  const error = actionError || learningQuery.error;
  const toast = useToast();

  const lessons = useMemo(() => learning?.modules.flatMap((module) => module.lessons) || [], [learning]);
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) || lessons.find((lesson) => !lesson.completion?.isCompleted) || lessons[0] || null;
  const selectedIndex = lessons.findIndex((lesson) => lesson.id === selectedLesson?.id);
  const completedCount = lessons.filter((lesson) => lesson.completion?.isCompleted).length;
  const selectedModule = learning?.modules.find((module) => module.lessons.some((lesson) => lesson.id === selectedLesson?.id));

  async function completeLesson(lessonId) {
    if (learning?.course.status === "archived" || completingLessonIds.has(lessonId)) return;
    setCompletingLessonIds((current) => new Set(current).add(lessonId));
    try {
      const response = await api.post(`/student/lessons/${lessonId}/complete`);
      const completion = response.data.data;
      setLearning((current) => ({ ...current, modules: current.modules.map((module) => ({ ...module, lessons: module.lessons.map((lesson) => lesson.id === lessonId ? { ...lesson, completion: { isCompleted: completion.is_completed === true, completedAt: completion.completed_at || null } } : lesson) })) }));
      toast.success("Lesson marked as complete.");
    } catch (requestError) {
      const message = actionErrorMessage(requestError, "Unable to update lesson progress.");
      setError(message);
      toast.error(message);
    } finally {
      setCompletingLessonIds((current) => { const next = new Set(current); next.delete(lessonId); return next; });
    }
  }

  if (!learning && !error) return <div className="ph-learning-empty"><PageHeader eyebrow="Student workspace" title="Course Learning" /><div className="mt-6"><Loading variant="lesson" label="Loading course..." /></div></div>;
  if (!learning) return <div className="ph-learning-empty"><PageHeader eyebrow="Student workspace" title="Course Learning" /><p className="mt-6 rounded-xl bg-red-50 p-4 text-red-800" role="alert">{error}</p><button className="mt-3 font-bold text-emerald-800 underline" onClick={learningQuery.reload} type="button">Retry</button><Link className="mt-4 inline-block font-bold text-emerald-800" to="/student/courses">Back to My Courses</Link></div>;

  return <div className="ph-learning-page min-w-0">
    <div className="ph-learning-grid">
      <CourseContentSidebar course={learning.course} completedCount={completedCount} lessonCount={lessons.length} modules={learning.modules} onSelectLesson={setSelectedLessonId} selectedLessonId={selectedLesson?.id} />
      <div className="ph-learning-main min-w-0">
        <StudentWorkspaceHeader>
          <Link className="shrink-0 text-emerald-800 hover:underline" to="/student/courses">My Courses</Link><span aria-hidden="true">/</span><span className="shrink-0">{learning.course.course_code}</span><span aria-hidden="true">/</span><span className="shrink-0">{selectedModule?.title || "Course content"}</span><span aria-hidden="true">/</span><span className="truncate text-slate-900">{selectedLesson?.title || "Lesson"}</span>
        </StudentWorkspaceHeader>
        <div className="ph-learning-main-inner">
          {learning.course.status === "archived" && <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">This course is archived. Historical lessons, submissions, grades, and feedback remain available in read-only mode.</p>}
          {error && <p className="mb-5 rounded-lg bg-red-50 p-4 text-red-800" role="alert">{error}</p>}
          <LessonViewer completing={selectedLesson ? completingLessonIds.has(selectedLesson.id) : false} hasNext={selectedIndex >= 0 && selectedIndex < lessons.length - 1} hasPrevious={selectedIndex > 0} lesson={selectedLesson} lessonPosition={selectedIndex + 1} lessonTotal={lessons.length} nextLesson={lessons[selectedIndex + 1]} previousLesson={lessons[selectedIndex - 1]} onComplete={() => completeLesson(selectedLesson.id)} onNext={() => setSelectedLessonId(lessons[selectedIndex + 1].id)} onMaterialError={setError} onPrevious={() => setSelectedLessonId(lessons[selectedIndex - 1].id)} readOnly={learning.course.status === "archived"} />
        </div>
      </div>
    </div>
  </div>;
}
