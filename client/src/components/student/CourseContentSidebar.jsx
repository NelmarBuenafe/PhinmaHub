import { Check, CheckCircle2, ChevronDown, ChevronRight, Circle, CircleDashed } from "lucide-react";
import { useId, useState } from "react";

function ProgressBar({ value }) {
  return <div aria-label={`${value}% complete`} className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemax="100" aria-valuemin="0" aria-valuenow={value}><div className="ph-progress-fill h-full rounded-full bg-emerald-600" style={{ width: `${value}%` }} /></div>;
}

function SectionStatus({ section }) {
  const completed = section.completion?.isCompleted === true;
  const progress = section.completion?.progressPercent || 0;
  if (completed) return <><CheckCircle2 aria-hidden="true" className="shrink-0 text-emerald-700" size={15} /><span className="text-[11px] font-semibold text-emerald-700">Completed</span></>;
  if (progress > 0) return <><CircleDashed aria-hidden="true" className="shrink-0 text-emerald-700" size={15} /><span className="text-[11px] font-semibold text-emerald-700">In progress</span></>;
  return <><Circle aria-hidden="true" className="shrink-0 text-slate-400" size={15} /><span className="sr-only">Not started</span></>;
}

function getLessonSummary(lesson) {
  const required = (lesson.sections || []).filter((section) => section.is_required !== false);
  const completedSections = required.filter((section) => section.completion?.isCompleted).length;
  const completed = lesson.completion?.isCompleted === true;
  const progress = lesson.completion?.progressPercent || 0;
  if (completed) return { Icon: CheckCircle2, label: "Completed", tone: "text-emerald-700" };
  if (progress > 0) return { Icon: CircleDashed, label: required.length ? `${completedSections} of ${required.length} sections completed` : "In progress", tone: "text-emerald-700" };
  return { Icon: Circle, label: "Not started", tone: "text-slate-500" };
}

function LessonAccordion({ expanded, lesson, onSelectSection, onToggle, selectedLessonId, selectedSectionId }) {
  const panelId = useId();
  const summary = getLessonSummary(lesson);
  const sections = lesson.sections || [];
  const selected = lesson.id === selectedLessonId;
  const Icon = summary.Icon;

  return <div className="border-l-2 border-transparent"><button aria-controls={panelId} aria-current={selected ? "page" : undefined} aria-expanded={expanded} className={`ph-action flex w-full items-start gap-2 px-2 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 ${selected ? "bg-emerald-50 text-emerald-950" : "text-slate-700 hover:bg-slate-50"}`} onClick={() => onToggle(lesson)} type="button">{expanded ? <ChevronDown aria-hidden="true" className="mt-0.5 shrink-0" size={16} /> : <ChevronRight aria-hidden="true" className="mt-0.5 shrink-0" size={16} />}<Icon aria-hidden="true" className={`mt-0.5 shrink-0 ${summary.tone}`} size={16} /><span className="min-w-0"><span className="block break-words font-semibold leading-5">{lesson.title}</span><span className={`mt-0.5 block text-[11px] ${summary.tone}`}>{summary.label}</span></span></button>{expanded && <div className="ml-5 border-l border-slate-200 py-1 pl-2" id={panelId}>{sections.length ? sections.map((section, index) => {
    const sectionSelected = selected && section.id === selectedSectionId;
    return <button aria-current={sectionSelected ? "step" : undefined} className={`ph-action flex w-full items-start gap-2 border-l-2 px-2 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 ${sectionSelected ? "border-emerald-700 bg-emerald-50 text-emerald-950" : "border-transparent text-slate-700 hover:bg-slate-50"}`} key={section.id} onClick={() => onSelectSection(lesson.id, section.id)} type="button"><SectionStatus section={section} /><span className="min-w-0 flex-1"><span className="block break-words leading-5">{index + 1}. {section.title}</span>{section.is_required === false && <span className="mt-0.5 block text-[11px] font-medium text-slate-500">Optional</span>}</span></button>;
  }) : <p className="px-2 py-2 text-xs leading-5 text-slate-500">Open this lesson to view its content.</p>}</div>}</div>;
}

function ModuleSection({ expandedLessonId, module, onSelectSection, onToggleLesson, selectedLessonId, selectedSectionId }) {
  const [expanded, setExpanded] = useState(true);
  const panelId = useId();
  const completedCount = module.lessons.filter((lesson) => lesson.completion?.isCompleted).length;

  return <section className="border-b border-slate-100 py-3 last:border-b-0"><button aria-controls={panelId} aria-expanded={expanded} className="ph-action flex w-full items-start gap-2 px-2 py-1.5 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600" onClick={() => setExpanded((value) => !value)} type="button">{expanded ? <ChevronDown aria-hidden="true" size={16} /> : <ChevronRight aria-hidden="true" size={16} />}<span className="min-w-0 flex-1 break-words"><span className="flex items-start justify-between gap-2"><span className="font-bold leading-5 text-slate-950">{module.title}</span><span className="shrink-0 text-xs font-bold text-slate-500">{completedCount}/{module.lessons.length}</span></span>{module.description && <span className="mt-1 block line-clamp-2 text-xs leading-4 text-slate-500">{module.description}</span>}</span></button>{expanded && <div className="ph-page-enter ml-2 mt-1 border-l border-slate-200 pl-2" id={panelId}>{module.lessons.length ? module.lessons.map((lesson) => <LessonAccordion expanded={lesson.id === expandedLessonId} key={lesson.id} lesson={lesson} onSelectSection={onSelectSection} onToggle={onToggleLesson} selectedLessonId={selectedLessonId} selectedSectionId={selectedSectionId} />) : <p className="px-3 py-2 text-sm text-slate-500">No published lessons in this module yet.</p>}</div>}</section>;
}

export default function CourseContentSidebar({ completedCount, course, courseProgress, lessonCount, modules, onSelectLesson, onSelectSection, selectedLessonId, selectedSectionId }) {
  const [outlineExpanded, setOutlineExpanded] = useState(false);
  const [collapsedLessonId, setCollapsedLessonId] = useState(null);
  const outlineId = useId();
  const progress = courseProgress || 0;

  const expandedLessonId = collapsedLessonId === selectedLessonId ? null : selectedLessonId;

  function toggleLesson(lesson) {
    if (expandedLessonId === lesson.id) {
      setCollapsedLessonId(lesson.id);
      return;
    }
    setCollapsedLessonId(null);
    onSelectLesson(lesson.id);
  }

  return <aside className="ph-course-content-panel min-w-0 bg-white"><header className="border-b border-slate-200 px-5 pb-5 pt-6"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Course</p><p className="mt-2 text-lg font-black tracking-tight text-slate-950">{course.course_code}</p><h1 className="mt-1 break-words text-sm font-semibold leading-5 text-slate-600">{course.title}</h1><div className="mt-5 flex items-baseline justify-between gap-3"><p className="text-xs font-bold text-slate-600">{completedCount} of {lessonCount} lessons completed</p><p className="text-sm font-black text-emerald-800">{progress}%</p></div><ProgressBar value={progress} /></header><button aria-controls={outlineId} aria-expanded={outlineExpanded} className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-slate-200 px-5 text-left text-sm font-bold text-slate-950 lg:hidden" onClick={() => setOutlineExpanded((value) => !value)} type="button"><span className="inline-flex items-center gap-2"><Check aria-hidden="true" className="text-emerald-700" size={15} /> Sections</span><ChevronDown aria-hidden="true" className={`transition-transform ${outlineExpanded ? "rotate-180" : ""}`} size={18} /></button><div className={`${outlineExpanded ? "block" : "hidden"} lg:block px-3 pb-6`} id={outlineId}>{modules.length ? <div className="mt-2">{modules.map((module) => <ModuleSection expandedLessonId={expandedLessonId} key={module.id} module={module} onSelectSection={onSelectSection} onToggleLesson={toggleLesson} selectedLessonId={selectedLessonId} selectedSectionId={selectedSectionId} />)}</div> : <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Course content has not been added yet.</p>}</div></aside>;
}
