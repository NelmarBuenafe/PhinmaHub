import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loading from "../../components/common/Loading.jsx";
import LessonMaterialsManager from "../../components/teacher/LessonMaterialsManager.jsx";
import TeacherNav from "../../components/teacher/TeacherNav.jsx";
import api from "../../services/api.js";

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
  const [modules, setModules] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadLessons() {
    setLoading(true);
    try {
      const response = await api.get(`/teacher/courses/${courseId}/modules`);
      const nextModules = response.data.data || [];
      setModules(nextModules);

      const currentId = selectedLesson?.id;
      const availableLessons = nextModules.flatMap((module) => module.lessons);
      const nextLesson = availableLessons.find((lesson) => lesson.id === currentId)
        || availableLessons[0]
        || null;
      setSelectedLesson(nextLesson);
      setDraft(nextLesson ? lessonDraft(nextLesson) : null);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load this course's lessons.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLessons();
  }, [courseId]);

  function selectLesson(lesson) {
    setSelectedLesson(lesson);
    setDraft(lessonDraft(lesson));
    setNotice("");
    setError("");
  }

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveLesson(event) {
    event.preventDefault();
    if (!selectedLesson || !draft) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.put(
        `/teacher/lessons/${selectedLesson.id}`,
        draft,
      );
      const updated = response.data.data;
      setModules((currentModules) =>
        currentModules.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) =>
            lesson.id === updated.id ? updated : lesson,
          ),
        })),
      );
      setSelectedLesson(updated);
      setDraft(lessonDraft(updated));
      setNotice("Lesson details saved.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to save lesson details.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <TeacherNav />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link
          className="text-sm font-bold text-emerald-800 hover:underline"
          to={`/teacher/courses/${courseId}`}
        >
          ← Back to Manage Course
        </Link>
        <div className="mt-4">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">
            Teacher workspace
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Lesson Materials
          </h1>
          <p className="mt-2 text-slate-600">
            Select a lesson, update its learning content, then attach resources
            for enrolled students.
          </p>
        </div>

        {loading && (
          <div className="mt-8 rounded-2xl border bg-white p-8">
            <Loading label="Loading lessons..." />
          </div>
        )}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p>{error}</p>
            <button
              className="mt-3 font-bold underline"
              onClick={loadLessons}
              type="button"
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !error && modules.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">
            Create a module and lesson from Manage Course before adding learning
            materials.
          </div>
        )}

        {!loading && !error && modules.length > 0 && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.5fr)]">
            <aside className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="font-black text-slate-950">Course lessons</h2>
              <div className="mt-4 space-y-4">
                {modules.map((module) => (
                  <section key={module.id}>
                    <h3 className="text-sm font-bold text-slate-700">
                      {module.title}
                    </h3>
                    <div className="mt-2 grid gap-1">
                      {module.lessons.map((lesson) => (
                        <button
                          className={`rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                            selectedLesson?.id === lesson.id
                              ? "bg-emerald-700 text-white"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                          key={lesson.id}
                          onClick={() => selectLesson(lesson)}
                          type="button"
                        >
                          {lesson.title}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </aside>

            {selectedLesson && draft && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-xl font-black text-slate-950">
                  {selectedLesson.title}
                </h2>
                {notice && (
                  <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                    {notice}
                  </p>
                )}
                <form className="mt-5 grid gap-4" onSubmit={saveLesson}>
                  <label className="text-sm font-bold">
                    Lesson title
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      onChange={(event) => updateDraft("title", event.target.value)}
                      required
                      value={draft.title}
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Lesson description / learning objectives
                    <textarea
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      onChange={(event) =>
                        updateDraft("learningObjectives", event.target.value)
                      }
                      placeholder="Tell students what they will learn."
                      rows="3"
                      value={draft.learningObjectives}
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Lesson content
                    <textarea
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      onChange={(event) => updateDraft("content", event.target.value)}
                      placeholder="Write the lesson explanation or instructions."
                      rows="8"
                      value={draft.content}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input
                      checked={draft.isPublished}
                      onChange={(event) =>
                        updateDraft("isPublished", event.target.checked)
                      }
                      type="checkbox"
                    />
                    Make this lesson available to enrolled students
                  </label>
                  <button
                    className="justify-self-start rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                    disabled={saving}
                    type="submit"
                  >
                    {saving ? "Saving..." : "Save lesson details"}
                  </button>
                </form>
                <LessonMaterialsManager lessonId={selectedLesson.id} />
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
