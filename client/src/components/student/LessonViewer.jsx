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
    <section className="ph-page-enter ph-surface rounded-2xl p-6 sm:p-8">
      <p className="text-sm font-extrabold uppercase tracking-wider text-emerald-700">
        Lesson
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-2xl font-black text-slate-950">{lesson.title}</h2>
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
        <section className="mt-6 rounded-xl border-l-4 border-emerald-500 bg-emerald-50/60 p-4">
          <h3 className="font-bold text-slate-900">Learning objectives</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {lesson.learning_objectives}
          </p>
        </section>
      )}

      <section className="mt-7 max-w-3xl">
        <h3 className="text-lg font-black text-slate-950">Lesson Content</h3>
        {lesson.content ? (
          <p className="mt-3 whitespace-pre-wrap text-[1.02rem] leading-8 text-slate-700">
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

      <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="ph-action inline-flex items-center justify-center gap-1 rounded-xl border
            border-slate-300 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-50
            disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasPrevious}
          onClick={onPrevious}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={18} /> Previous Lesson
        </button>

        {!completed && !readOnly && (
          <button
            className="ph-action rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={completing}
            onClick={onComplete}
            type="button"
          >
            {completing ? "Marking complete..." : "Mark as Complete"}
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
          Next Lesson <ChevronRight aria-hidden="true" size={18} />
        </button>
      </div>
    </section>
  );
}
