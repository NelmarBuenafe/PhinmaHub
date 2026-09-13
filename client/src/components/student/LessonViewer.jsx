import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import LessonMaterials from "./LessonMaterials.jsx";

export default function LessonViewer({
  lesson,
  onComplete,
  onNext,
  onPrevious,
  completing,
  hasNext,
  hasPrevious,
  nextLesson,
  previousLesson,
  onMaterialError,
  readOnly = false,
}) {
  if (!lesson) {
    return (
      <section className="ph-surface rounded-2xl p-8 text-slate-600">
        No lessons are available in this course yet.
      </section>
    );
  }

  const completed = lesson.completion?.isCompleted === true;

  return (
    <section className="ph-surface min-w-0 rounded-2xl p-5 sm:p-6">
      <p className="text-sm font-extrabold uppercase tracking-wider text-emerald-700">
        Lesson
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <h2 className="min-w-0 flex-1 break-words text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">{lesson.title}</h2>
        {completed ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-800">
            <CheckCircle2 aria-hidden="true" size={17} /> Completed
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600">
            Not Started
          </span>
        )}
      </div>

      {lesson.learning_objectives && (
        <section className="ph-reading mt-7 rounded-xl border-l-2 border-emerald-600 bg-emerald-50/50 p-5">
          <h3 className="font-bold text-slate-900">Learning objectives</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {lesson.learning_objectives}
          </p>
        </section>
      )}

      <section className="ph-reading mt-8">
        <h3 className="text-lg font-black text-slate-950">Lesson Content</h3>
        {lesson.content ? (
          <p className="mt-4 whitespace-pre-wrap">
            {lesson.content}
          </p>
        ) : (
          <p className="mt-3 rounded-xl bg-slate-50 p-4 text-slate-600">
            This lesson does not have content yet.
          </p>
        )}
      </section>

      <LessonMaterials
        materials={lesson.materials || []}
        onError={onMaterialError}
      />

      <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <button
          className="ph-action inline-flex items-center justify-center gap-1 rounded-xl border
            border-slate-300 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-50
            disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasPrevious}
          onClick={onPrevious}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="shrink-0" size={18} />
          <span className="min-w-0 text-left">
            <span className="block text-sm">Previous lesson</span>
            {previousLesson && <span className="mt-1 block max-w-48 truncate text-xs font-normal">{previousLesson.title}</span>}
          </span>
        </button>

        {!completed && !readOnly && (
          <button
            className="ph-action rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={completing}
            onClick={onComplete}
            type="button"
          >
            {completing ? "Completing..." : "Mark as Complete"}
          </button>
        )}
        {readOnly && !completed && (
          <span className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600">
            Archived course is read-only
          </span>
        )}

        <button
          className="ph-action inline-flex items-center justify-center gap-1 rounded-xl border
            border-slate-300 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-50
            disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasNext}
          onClick={onNext}
          type="button"
        >
          <span className="min-w-0 text-right">
            <span className="block text-sm">Next lesson</span>
            {nextLesson && <span className="mt-1 block max-w-48 truncate text-xs font-normal">{nextLesson.title}</span>}
          </span>
          <ChevronRight aria-hidden="true" className="shrink-0" size={18} />
        </button>
      </div>
    </section>
  );
}
