import { CheckCircle2, ChevronLeft, ChevronRight, Target } from "lucide-react";
import LessonMaterials from "./LessonMaterials.jsx";

function Objectives({ value }) {
  const items = value.split(/\r?\n/).map((item) => item.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean);

  return (
    <section className="mt-7 max-w-[960px] rounded-xl border border-emerald-200 bg-emerald-50/80 p-5" aria-labelledby="learning-objectives-heading">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-800"><Target aria-hidden="true" size={17} /></span>
        <div className="min-w-0">
          <h3 className="font-black text-emerald-950" id="learning-objectives-heading">Learning Objectives</h3>
          {items.length > 1 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-emerald-950/80">
              {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
            </ul>
          ) : <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-950/80">{value}</p>}
        </div>
      </div>
    </section>
  );
}

function LessonBody({ content }) {
  if (!content) return <p className="mt-3 rounded-lg bg-slate-50 p-4 text-slate-600">This lesson does not have content yet.</p>;

  return (
    <div className="mt-4 space-y-4 text-base leading-8 text-slate-700">
      {content.split(/\n\s*\n/).map((paragraph, index) => {
        const lines = paragraph.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        const listItems = lines.filter((line) => /^[-*•]\s+/.test(line));
        if (listItems.length === lines.length && listItems.length > 0) {
          return <ul className="list-disc space-y-1 pl-6" key={`${paragraph}-${index}`}>{listItems.map((item) => <li key={item}>{item.replace(/^[-*•]\s+/, "")}</li>)}</ul>;
        }
        return <p className="whitespace-pre-wrap" key={`${paragraph}-${index}`}>{paragraph}</p>;
      })}
    </div>
  );
}

export default function LessonViewer({ lesson, lessonPosition, lessonTotal, onComplete, onNext, onPrevious, completing, hasNext, hasPrevious, nextLesson, previousLesson, onMaterialError, readOnly = false }) {
  if (!lesson) return <section className="ph-lesson-surface p-8 text-slate-600">No lessons are available in this course yet.</section>;

  const completed = lesson.completion?.isCompleted === true;
  const lessonDisplayTitle = /^lesson\s+\d+/i.test(lesson.title)
    ? lesson.title
    : `Lesson ${lessonPosition}: ${lesson.title}`;

  return (
    <article className="ph-lesson-surface min-w-0 px-5 py-6 sm:px-8 sm:py-8">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Lesson {lessonPosition}</p>
          <h1 className="mt-2 break-words text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">{lessonDisplayTitle}</h1>
        </div>
        {completed ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 aria-hidden="true" size={17} /> Completed</span>
        ) : !readOnly ? (
          <button className="ph-action inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" disabled={completing} onClick={onComplete} type="button">
            {completing ? "Completing..." : "Mark as Complete"}
          </button>
        ) : <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">Read-only</span>}
      </header>

      {lesson.learning_objectives && <Objectives value={lesson.learning_objectives} />}

      <section className="ph-reading mt-8" aria-labelledby="lesson-content-heading">
        <h2 className="text-lg font-black text-slate-950" id="lesson-content-heading">Lesson Content</h2>
        <LessonBody content={lesson.content} />
      </section>

      <LessonMaterials materials={lesson.materials || []} onError={onMaterialError} />

      <footer className="mt-8 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <button className="ph-action inline-flex min-w-0 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-left text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45" disabled={!hasPrevious} onClick={onPrevious} type="button">
          <ChevronLeft aria-hidden="true" className="shrink-0" size={18} />
          <span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Previous</span><span className="block truncate text-sm font-bold">{previousLesson?.title || "Course Start"}</span></span>
        </button>
        <div className="text-center"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Module Progress</p><p className="mt-1 text-sm font-black text-slate-900">Lesson {lessonPosition} of {lessonTotal}</p></div>
        {hasNext ? <button className="ph-action inline-flex min-w-0 items-center justify-end gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-right text-slate-700 hover:border-emerald-400 hover:bg-emerald-50" onClick={onNext} type="button"><span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Next</span><span className="block truncate text-sm font-bold">{nextLesson.title}</span></span><ChevronRight aria-hidden="true" className="shrink-0" size={18} /></button> : <span className="justify-self-end text-right text-sm font-bold text-emerald-800">Course Complete</span>}
      </footer>
    </article>
  );
}
