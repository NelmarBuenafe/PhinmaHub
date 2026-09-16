import { useCallback, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import CourseContentSidebar from "../../components/student/CourseContentSidebar.jsx";
import LessonViewer from "../../components/student/LessonViewer.jsx";
import StudentWorkspaceHeader from "../../components/student/StudentWorkspaceHeader.jsx";
import api from "../../services/api.js";
import { useApiQuery } from "../../utils/useApiQuery.js";

function preferredSectionId(lesson) {
  const sections = lesson?.sections || [];
  return sections.find((section) => !section.completion?.isCompleted && (section.completion?.progressPercent || 0) > 0)?.id || sections[0]?.id || null;
}

export default function StudentCoursePage() {
  const { courseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: learningResponse, error: learningError, reload, update: updateLearning } = useApiQuery(`/student/courses/${courseId}/learning`, { errorMessage: "Course content could not be loaded." });
  const learning = learningResponse?.data;
  const [selectedLessonId, setSelectedLessonId] = useState(() => searchParams.get("lesson"));
  const [selectedSectionId, setSelectedSectionId] = useState(() => searchParams.get("section"));
  const [actionError, setError] = useState("");
  const error = actionError || learningError;

  const lessons = useMemo(() => learning?.modules.flatMap((module) => module.lessons) || [], [learning]);
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) || lessons.find((lesson) => !lesson.completion?.isCompleted) || lessons[0] || null;
  const selectedSection = selectedLesson?.sections?.find((section) => section.id === selectedSectionId) || selectedLesson?.sections?.find((section) => section.id === preferredSectionId(selectedLesson)) || null;
  const selectedIndex = lessons.findIndex((lesson) => lesson.id === selectedLesson?.id);
  const completedCount = lessons.filter((lesson) => lesson.completion?.isCompleted).length;
  const courseProgress = lessons.length ? Math.round(lessons.reduce((total, lesson) => total + (lesson.completion?.progressPercent || 0), 0) / lessons.length) : 0;
  const selectedModule = learning?.modules.find((module) => module.lessons.some((lesson) => lesson.id === selectedLesson?.id));

  const updateSelection = useCallback((lessonId, sectionId, replace = false) => {
    setSelectedLessonId(lessonId);
    setSelectedSectionId(sectionId || null);
    const next = new URLSearchParams(searchParams);
    if (lessonId) next.set("lesson", lessonId); else next.delete("lesson");
    if (sectionId) next.set("section", sectionId); else next.delete("section");
    setSearchParams(next, { replace });
  }, [searchParams, setSearchParams]);

  const selectLesson = useCallback((lessonId) => {
    const lesson = lessons.find((item) => item.id === lessonId);
    updateSelection(lessonId, preferredSectionId(lesson));
  }, [lessons, updateSelection]);

  const selectSection = useCallback((lessonId, sectionId) => {
    updateSelection(lessonId, sectionId);
  }, [updateSelection]);

  const saveReadingCheckpoint = useCallback(async (sectionId, checkpointPercent) => {
    if (learning?.course.status === "archived") return;
    try {
      const response = await api.patch(`/student/sections/${sectionId}/reading-progress`, { checkpointPercent });
      const { section, lesson } = response.data.data;
      updateLearning((current) => ({
        ...current,
        data: {
          ...current.data,
          modules: current.data.modules.map((module) => ({
            ...module,
            lessons: module.lessons.map((item) => item.id !== selectedLesson?.id ? item : {
              ...item,
              completion: lesson,
              sections: item.sections.map((candidate) => candidate.id === sectionId ? { ...candidate, completion: section } : candidate),
            }),
          })),
        },
      }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save reading progress.");
    }
  }, [learning?.course.status, selectedLesson?.id, updateLearning]);

  if (!learning && !error) return <div className="ph-learning-empty"><PageHeader eyebrow="Student workspace" title="Course Learning" /><div className="mt-6"><Loading variant="lesson" label="Loading course..." /></div></div>;
  if (!learning) return <div className="ph-learning-empty"><PageHeader eyebrow="Student workspace" title="Course Learning" /><p className="mt-6 rounded-xl bg-red-50 p-4 text-red-800" role="alert">{error}</p><button className="mt-3 font-bold text-emerald-800 underline" onClick={reload} type="button">Retry</button><Link className="mt-4 inline-block font-bold text-emerald-800" to="/student/courses">Back to My Courses</Link></div>;

  return <div className="ph-learning-page min-w-0">
    <div className="ph-learning-grid">
      <CourseContentSidebar course={learning.course} completedCount={completedCount} courseProgress={courseProgress} lessonCount={lessons.length} modules={learning.modules} onSelectLesson={selectLesson} onSelectSection={selectSection} selectedLessonId={selectedLesson?.id} selectedSectionId={selectedSection?.id} />
      <div className="ph-learning-main min-w-0">
        <StudentWorkspaceHeader><Link className="shrink-0 text-emerald-800 hover:underline" to="/student/courses">My Courses</Link><span aria-hidden="true">/</span><span className="shrink-0">{learning.course.course_code}</span><span aria-hidden="true">/</span><span className="hidden shrink-0 sm:inline">{selectedModule?.title || "Course content"}</span><span aria-hidden="true" className="hidden sm:inline">/</span><span className="hidden shrink-0 md:inline">{selectedLesson?.title || "Lesson"}</span>{selectedSection && <><span aria-hidden="true">/</span><span className="truncate text-slate-900">{selectedSection.title}</span></>}</StudentWorkspaceHeader>
        <div className="ph-learning-main-inner">
          {learning.course.status === "archived" && <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">This course is archived. Historical lessons, submissions, grades, and feedback remain available in read-only mode.</p>}
          {error && <p className="mb-5 rounded-lg bg-red-50 p-4 text-red-800" role="alert">{error}</p>}
          <LessonViewer hasNext={selectedIndex >= 0 && selectedIndex < lessons.length - 1} hasPrevious={selectedIndex > 0} lesson={selectedLesson} lessonPosition={selectedIndex + 1} lessonTotal={lessons.length} nextLesson={lessons[selectedIndex + 1]} onMaterialError={setError} onNext={() => selectLesson(lessons[selectedIndex + 1].id)} onPrevious={() => selectLesson(lessons[selectedIndex - 1].id)} onReadingCheckpoint={saveReadingCheckpoint} onSelectSection={selectSection} onVideoCompleted={reload} previousLesson={lessons[selectedIndex - 1]} readOnly={learning.course.status === "archived"} selectedSectionId={selectedSection?.id} />
        </div>
      </div>
    </div>
  </div>;
}
