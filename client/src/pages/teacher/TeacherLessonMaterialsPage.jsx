import { ArrowLeft, BookOpen, Pencil } from "lucide-react";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import LessonSectionsManager from "../../components/teacher/LessonSectionsManager.jsx";
import { LessonEditorDialog } from "../../components/teacher/TeacherCourseOverviewTabs.jsx";
import api from "../../services/api.js";
import { useApiQuery } from "../../utils/useApiQuery.js";
import { useToast } from "../../contexts/toastStore.js";
import { actionErrorMessage } from "../../utils/actionFeedback.js";

function lessonDraft(lesson) {
  return {
    title: lesson.title || "",
    learningObjectives: lesson.learning_objectives || "",
    content: lesson.content || "",
    isPublished: lesson.is_published === true,
  };
}

export default function TeacherLessonMaterialsPage() {
  const { courseId } = useParams();
  return <TeacherLessonMaterialsContent courseId={courseId} key={courseId} />;
}

function TeacherLessonMaterialsContent({ courseId }) {
  const [searchParams] = useSearchParams();
  const moduleQuery = useApiQuery(`/teacher/courses/${courseId}/modules`, { errorMessage: "Unable to load this course's lessons." });
  const modules = moduleQuery.data?.data || [];
  const availableLessons = modules.flatMap((module) => module.lessons || []);
  const [selectedId, setSelectedId] = useState(() => searchParams.get("lesson"));
  const [editingLesson, setEditingLesson] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setError] = useState("");
  const toast = useToast();
  const selectedLesson = availableLessons.find((lesson) => lesson.id === selectedId) || availableLessons[0] || null;
  const selectedModule = modules.find((module) => module.lessons?.some((lesson) => lesson.id === selectedLesson?.id)) || null;
  const error = actionError || moduleQuery.error;
  const setModules = (updater) => moduleQuery.update((current) => ({ ...current, data: updater(current.data) }));

  async function saveLesson(event) {
    event.preventDefault();
    if (!editingLesson?.values || !selectedLesson) return;
    setSaving(true);
    setError("");
    try {
      const response = await api.put(`/teacher/lessons/${selectedLesson.id}`, editingLesson.values);
      const updated = response.data.data;
      setModules((currentModules) => currentModules.map((module) => ({
        ...module,
        lessons: (module.lessons || []).map((lesson) => lesson.id === updated.id ? updated : lesson),
      })));
      setEditingLesson(null);
      toast.success("Lesson updated successfully.");
    } catch (requestError) {
      const message = actionErrorMessage(requestError, "Unable to update lesson.");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0">
      <section className="ph-role-page">
        <Link className="ph-action inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:-translate-x-0.5" to={`/teacher/courses/${courseId}`}><ArrowLeft aria-hidden="true" size={16} /> Back to Course</Link>
        {moduleQuery.loading && <div className="mt-6 rounded-2xl border bg-white p-8"><Loading variant="lesson" label="Loading lessons..." /></div>}
        {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"><p>{error}</p><button className="mt-3 font-bold underline" onClick={moduleQuery.reload} type="button">Try again</button></div>}
        {!moduleQuery.loading && !error && availableLessons.length === 0 && <div className="mt-6 grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white p-8 text-center"><div className="max-w-sm"><BookOpen aria-hidden="true" className="mx-auto text-slate-400" size={30} /><h1 className="mt-4 text-xl font-bold text-slate-950">No lessons available</h1><p className="mt-2 text-sm leading-6 text-slate-600">Create a module and lesson from Manage Course before adding learning materials.</p></div></div>}
        {!moduleQuery.loading && !error && selectedLesson && (
          <div className="mt-5 grid min-h-[calc(100dvh-10rem)] gap-5 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
            <aside className="min-w-0 overflow-x-hidden rounded-xl border border-slate-200 bg-white p-4 xl:sticky xl:top-22 xl:max-h-[calc(100dvh-8rem)] xl:overflow-y-auto">
              <h1 className="text-base font-bold text-slate-950">Course Lessons</h1>
              <div className="mt-5 space-y-5">
                {modules.map((module, moduleIndex) => (
                  <section key={module.id}>
                    <h2 className="break-words text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Module {module.position ?? module.order ?? moduleIndex + 1}: {module.title}</h2>
                    <div className="mt-2 grid gap-1.5">
                      {(module.lessons || []).map((lesson, lessonIndex) => <button aria-current={selectedLesson.id === lesson.id ? "true" : undefined} className={`ph-action w-full min-w-0 overflow-hidden rounded-lg border-l-2 px-3 py-2.5 text-left text-sm ${selectedLesson.id === lesson.id ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-950" : "border-transparent text-slate-700 hover:bg-slate-50"}`} key={lesson.id} onClick={() => { setSelectedId(lesson.id); setError(""); }} type="button"><span className="block text-xs text-slate-500">Lesson {lessonIndex + 1}</span><span className="mt-0.5 block min-w-0 truncate">{lesson.title}</span></button>)}
                    </div>
                  </section>
                ))}
              </div>
            </aside>
            <main className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Lesson Materials</p>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="min-w-0"><h1 className="break-words text-2xl font-bold tracking-tight text-slate-950">{selectedLesson.title}</h1><div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600"><span>{selectedModule?.title}</span><StatusBadge value={selectedLesson.is_published ? "published" : "draft"} /></div></div>
                <button className="ph-action inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800" onClick={() => setEditingLesson({ mode: "edit", values: lessonDraft(selectedLesson) })} type="button"><Pencil aria-hidden="true" size={16} /> Edit Lesson</button>
              </div>
              <LessonSectionsManager lessonId={selectedLesson.id} lessonTitle={selectedLesson.title} />
            </main>
          </div>
        )}
        <LessonEditorDialog busy={saving} moduleTitle={selectedModule?.title || "this module"} onChange={(values) => setEditingLesson((current) => ({ ...current, values }))} onClose={() => setEditingLesson(null)} onSubmit={saveLesson} state={editingLesson} />
      </section>
    </div>
  );
}
