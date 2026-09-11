import { CheckCircle2, ChevronDown, ChevronRight, Circle } from "lucide-react";
import { useState } from "react";

function ModuleProgress({ completedCount, lessonCount }) {
  const progress = lessonCount
    ? Math.round((completedCount / lessonCount) * 100)
    : 0;

  return (
    <p className="mt-1 text-xs font-semibold text-slate-500">
      {completedCount} of {lessonCount} lessons completed · {progress}%
    </p>
  );
}

function LessonItem({ lesson, selected, onSelect }) {
  const completed = lesson.completion?.isCompleted === true;

  return (
    <button
      aria-current={selected ? "page" : undefined}
      className={`mt-1 flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
        selected
          ? "bg-emerald-100 text-emerald-950"
          : "text-slate-700 hover:bg-slate-100"
      }`}
      onClick={() => onSelect(lesson.id)}
      type="button"
    >
      {completed ? (
        <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700" size={17} />
      ) : (
        <Circle aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400" size={17} />
      )}
      <span>
        <span className="block font-bold">{lesson.title}</span>
        <span className="mt-0.5 block text-xs text-slate-500">
          {completed ? "Completed" : "Not Started"}
        </span>
      </span>
    </button>
  );
}

function ModuleSection({ module, selectedLessonId, onSelectLesson }) {
  const [expanded, setExpanded] = useState(true);
  const completedCount = module.lessons.filter(
    (lesson) => lesson.completion?.isCompleted,
  ).length;

  return (
    <section className="border-b border-slate-200 py-3 last:border-b-0">
      <button
        aria-expanded={expanded}
        className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left focus:outline-none focus:ring-2 focus:ring-emerald-600"
        onClick={() => setExpanded((value) => !value)}
        type="button"
      >
        {expanded ? <ChevronDown aria-hidden="true" size={19} /> : <ChevronRight aria-hidden="true" size={19} />}
        <span>
          <span className="block font-bold text-slate-950">{module.title}</span>
          {module.description && (
            <span className="mt-1 block text-sm text-slate-600">{module.description}</span>
          )}
          <ModuleProgress completedCount={completedCount} lessonCount={module.lessons.length} />
        </span>
      </button>
      {expanded && (
        <div className="ml-4 mt-1 border-l border-slate-200 pl-2">
          {module.lessons.length ? (
            module.lessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                onSelect={onSelectLesson}
                selected={lesson.id === selectedLessonId}
              />
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-slate-500">
              No published lessons in this module yet.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default function CourseContentSidebar({ modules, selectedLessonId, onSelectLesson }) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-5 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <h2 className="px-2 text-lg font-black text-slate-950">Course Content</h2>
      {modules.length ? (
        <div className="mt-3">
          {modules.map((module) => (
            <ModuleSection
              key={module.id}
              module={module}
              onSelectLesson={onSelectLesson}
              selectedLessonId={selectedLessonId}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          Course content has not been added yet.
        </p>
      )}
    </aside>
  );
}
