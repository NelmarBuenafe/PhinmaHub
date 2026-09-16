import { CheckCircle2, ChevronLeft, ChevronRight, Target } from "lucide-react";
import { useEffect, useRef } from "react";
import { readingCheckpointCount, readingCheckpointPercent } from "../../utils/readingCheckpoints.js";
import LessonMaterials from "./LessonMaterials.jsx";

function Objectives({ value }) {
  const items = value.split(/\r?\n/).map((item) => item.replace(/^\s*(?:[-*â€¢]|\d+[.)])\s*/, "").trim()).filter(Boolean);

  return <section className="mt-7 max-w-[960px] rounded-xl border border-emerald-200 bg-emerald-50/80 p-5" aria-labelledby="learning-objectives-heading">
    <div className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-800"><Target aria-hidden="true" size={17} /></span>
      <div className="min-w-0">
        <h3 className="font-black text-emerald-950" id="learning-objectives-heading">Learning Objectives</h3>
        {items.length > 1 ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-emerald-950/80">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-950/80">{value}</p>}
      </div>
    </div>
  </section>;
}

function LessonBody({ content }) {
  if (!content) return <p className="mt-3 rounded-lg bg-slate-50 p-4 text-slate-600">This lesson does not have content yet.</p>;

  return <div className="mt-4 space-y-4 text-base leading-8 text-slate-700">
    {content.split(/\n\s*\n/).map((paragraph, index) => {
      const lines = paragraph.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const listItems = lines.filter((line) => /^[-*â€¢]\s+/.test(line));
      if (listItems.length === lines.length && listItems.length > 0) {
        return <ul className="list-disc space-y-1 pl-6" data-reading-block={index} key={`${paragraph}-${index}`}>{listItems.map((item) => <li key={item}>{item.replace(/^[-*â€¢]\s+/, "")}</li>)}</ul>;
      }
      return <p className="whitespace-pre-wrap" data-reading-block={index} key={`${paragraph}-${index}`}>{paragraph}</p>;
    })}
  </div>;
}

function ProgressBar({ value }) {
  return <div aria-label={`${value}% lesson progress`} className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemax="100" aria-valuemin="0" aria-valuenow={value}><div className="ph-progress-fill h-full rounded-full bg-emerald-600" style={{ width: `${value}%` }} /></div>;
}

function useReadingCheckpoints({ contentRef, onCheckpoint, readOnly, sectionId, startingProgress }) {
  const callbackRef = useRef(onCheckpoint);
  useEffect(() => { callbackRef.current = onCheckpoint; }, [onCheckpoint]);

  useEffect(() => {
    if (readOnly || !contentRef.current) return undefined;
    const blocks = [...contentRef.current.querySelectorAll("[data-reading-block]")];
    if (!blocks.length) return undefined;
    const checkpointTotal = readingCheckpointCount(blocks.length);
    const checkpointBlocks = [...new Set(Array.from({ length: checkpointTotal }, (_, index) => (
      Math.round((index * (blocks.length - 1)) / Math.max(1, checkpointTotal - 1))
    )))];
    const checkpointPercents = checkpointBlocks.map((_, index) => readingCheckpointPercent(index, checkpointBlocks.length));
    let nextCheckpoint = checkpointPercents.findIndex((value) => value > startingProgress);
    if (nextCheckpoint < 0) return undefined;
    const duration = blocks.length <= 2 ? 4000 : 5000;
    let timer = null;
    const observer = new IntersectionObserver((entries) => {
      const expectedBlock = checkpointBlocks[nextCheckpoint];
      const expected = entries.find((entry) => Number(entry.target.dataset.readingBlock) === expectedBlock);
      if (!expected) return;
      if (expected.isIntersecting && expected.intersectionRatio >= 0.6 && !timer) {
        timer = window.setTimeout(() => {
          timer = null;
          const checkpointPercent = checkpointPercents[nextCheckpoint];
          nextCheckpoint += 1;
          callbackRef.current(sectionId, checkpointPercent);
        }, duration);
      } else if ((!expected.isIntersecting || expected.intersectionRatio < 0.6) && timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    }, { threshold: [0.6] });
    blocks.forEach((block) => observer.observe(block));
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [contentRef, readOnly, sectionId, startingProgress]);
}

export default function LessonViewer(props) {
  if (!props.lesson) return <section className="ph-lesson-surface p-8 text-slate-600">No lessons are available in this course yet.</section>;
  return <LessonViewerContent {...props} key={props.lesson.id} />;
}

function LessonViewerContent({ lesson, lessonPosition, lessonTotal, onNext, onPrevious, onReadingCheckpoint, onSelectSection, onVideoCompleted, selectedSectionId, hasNext, hasPrevious, nextLesson, previousLesson, onMaterialError, readOnly = false }) {
  const contentRef = useRef(null);
  const completed = lesson.completion?.isCompleted === true;
  const sections = lesson.sections?.length ? lesson.sections : [{ id: lesson.id, title: "Lesson Content", content: lesson.content, is_required: true, completion: lesson.completion }];
  const selectedSectionIndex = Math.max(0, sections.findIndex((section) => section.id === selectedSectionId));
  const selectedSection = sections[selectedSectionIndex] || sections[0];
  const progress = lesson.completion?.progressPercent || 0;
  const lessonDisplayTitle = /^lesson\s+\d+/i.test(lesson.title) ? lesson.title : `Lesson ${lessonPosition}: ${lesson.title}`;
  const sectionMaterials = selectedSection.materials || [];
  const requiredMaterials = sectionMaterials.filter((material) => material.is_required !== false);
  const optionalMaterials = sectionMaterials.filter((material) => material.is_required === false);
  useReadingCheckpoints({ contentRef, onCheckpoint: onReadingCheckpoint, readOnly, sectionId: selectedSection.id, startingProgress: selectedSection.completion?.readingProgressPercent || 0 });

  return <article className="ph-lesson-surface min-w-0 px-5 py-6 sm:px-8 sm:py-8">
    <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Lesson {lessonPosition}</p>
        <h1 className="mt-2 break-words text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">{lessonDisplayTitle}</h1>
        <div className="mt-4 max-w-xs"><div className="flex items-center justify-between gap-3 text-xs font-bold"><span className="text-slate-600">{completed ? "Lesson completed" : "Progress"}</span><span className="text-emerald-800">{completed ? "100%" : `${progress}%`}</span></div><ProgressBar value={completed ? 100 : progress} /></div>
      </div>
      {completed ? <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 aria-hidden="true" size={17} /> Lesson completed</span> : readOnly ? <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">Read-only</span> : null}
    </header>

    {lesson.learning_objectives && <Objectives value={lesson.learning_objectives} />}
    <section className="mt-8 border-t border-slate-200 pt-7" aria-labelledby="lesson-content-heading"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Section {selectedSectionIndex + 1} of {sections.length}</p><h2 className="mt-1 text-xl font-black text-slate-950" id="lesson-content-heading">{selectedSection.title}</h2></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${selectedSection.completion?.isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{selectedSection.completion?.isCompleted ? "Completed" : selectedSection.completion?.progressPercent ? "In progress" : "Not started"}</span></div><div className="ph-reading" ref={contentRef}><LessonBody content={selectedSection.content} /></div>{selectedSection.completion?.isInformational && <p className="mt-4 text-sm text-slate-500">Informational section — it does not affect lesson completion.</p>}</section>
    {requiredMaterials.length > 0 && <LessonMaterials heading="Required Materials" materials={requiredMaterials} onError={onMaterialError} onVideoCompleted={onVideoCompleted} />}
    {optionalMaterials.length > 0 && <LessonMaterials heading="Optional Resources" materials={optionalMaterials} onError={onMaterialError} onVideoCompleted={onVideoCompleted} />}
    {sections.length > 1 && <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5"><button className="ph-action rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-emerald-50 disabled:opacity-45" disabled={selectedSectionIndex === 0} onClick={() => onSelectSection(lesson.id, sections[selectedSectionIndex - 1].id)} type="button">Previous section</button><button className="ph-action rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-emerald-50 disabled:opacity-45" disabled={selectedSectionIndex === sections.length - 1} onClick={() => onSelectSection(lesson.id, sections[selectedSectionIndex + 1].id)} type="button">Next section</button></div>}

    <footer className="mt-8 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <button className="ph-action inline-flex min-w-0 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-left text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45" disabled={!hasPrevious} onClick={onPrevious} type="button"><ChevronLeft aria-hidden="true" className="shrink-0" size={18} /><span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Previous</span><span className="block truncate text-sm font-bold">{previousLesson?.title || "Course Start"}</span></span></button>
      <div className="text-center"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Module Progress</p><p className="mt-1 text-sm font-black text-slate-900">Lesson {lessonPosition} of {lessonTotal}</p></div>
      {hasNext ? <button className="ph-action inline-flex min-w-0 items-center justify-end gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-right text-slate-700 hover:border-emerald-400 hover:bg-emerald-50" onClick={onNext} type="button"><span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Next</span><span className="block truncate text-sm font-bold">{nextLesson.title}</span></span><ChevronRight aria-hidden="true" className="shrink-0" size={18} /></button> : <span className="justify-self-end text-right text-sm font-bold text-emerald-800">Course Complete</span>}
    </footer>
  </article>;
}
