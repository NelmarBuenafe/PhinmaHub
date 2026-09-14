import { useState } from "react";
import { ArrowLeft, CheckCircle2, FileText, FileVideo2, Image as ImageIcon, Info, Link2, LoaderCircle, Paperclip, RotateCcw, Trash2, UploadCloud } from "lucide-react";
import StatusBadge from "../common/StatusBadge.jsx";

function formatDate(value, withTime = false) {
  if (!value) return "No due date";
  return new Date(value).toLocaleString(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

function formatBytes(value) {
  if (!value) return "";
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(status) {
  if (!status || status === "pending") return "Pending";
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function DetailItem({ label, value }) {
  return <div><dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd></div>;
}

function attachmentIcon(type) {
  if (type === "image") return ImageIcon;
  if (type === "video") return FileVideo2;
  if (type === "link") return Link2;
  return FileText;
}

function AttachmentList({ attachments, onOpenAttachment, onRemoveAttachment, readOnly = false }) {
  if (!attachments?.length) return <p className="mt-3 text-sm text-slate-500">No attachments or links added.</p>;
  return <div className="mt-3 grid gap-2">
    {attachments.map((attachment) => {
      const Icon = attachmentIcon(attachment.type);
      const label = attachment.type === "link" ? attachment.external_url : attachment.file_name;
      return <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5" key={attachment.id}>
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700"><Icon aria-hidden="true" size={16} /></span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{label}</span><span className="block text-xs text-slate-500">{attachment.type === "link" ? "External link" : `${attachment.mime_type || attachment.type} · ${formatBytes(attachment.file_size)}`}</span></span>
        <button className="ph-action shrink-0 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-200" onClick={() => onOpenAttachment(attachment)} type="button">{attachment.type === "link" ? "Open" : "Preview"}</button>
        {!readOnly && <button aria-label={`Remove ${label}`} className="ph-action shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => onRemoveAttachment(attachment)} type="button"><Trash2 aria-hidden="true" size={15} /></button>}
      </div>;
    })}
  </div>;
}

function SubmissionAttachments({ assignment, onUploadFile, onAddLink, onRemoveAttachment, onOpenAttachment, busy }) {
  const [queued, setQueued] = useState([]);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const currentAttachments = assignment.submission?.attachments || [];
  const fileCount = currentAttachments.filter((item) => item.type !== "link").length + queued.length;
  const linkCount = currentAttachments.filter((item) => item.type === "link").length;

  function addFiles(fileList) {
    const available = Math.max(0, 5 - fileCount);
    const selected = Array.from(fileList || []).slice(0, available).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      status: "queued",
      progress: 0,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    }));
    setQueued((current) => [...current, ...selected]);
  }

  function removeQueued(id) {
    setQueued((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return current.filter((entry) => entry.id !== id);
    });
  }

  async function upload(item) {
    setQueued((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "uploading", progress: 35, error: "" } : entry));
    try {
      await onUploadFile(item.file, (progress) => setQueued((current) => current.map((entry) => entry.id === item.id ? { ...entry, progress } : entry)));
      removeQueued(item.id);
    } catch (error) {
      setQueued((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "failed", progress: 0, error: error.message || "Upload failed." } : entry));
    }
  }

  async function addLink(event) {
    event.preventDefault();
    if (!link.trim()) return;
    setLinkError("");
    try {
      await onAddLink(link.trim());
      setLink("");
    } catch (error) {
      setLinkError(error.message || "Unable to add this link.");
    }
  }

  return <section className="mt-8" aria-labelledby="assignment-attachments-heading">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Paperclip aria-hidden="true" className="text-emerald-700" size={18} /><h2 className="text-lg font-black text-slate-950" id="assignment-attachments-heading">Files and links</h2></div><p className="mt-1 text-sm text-slate-600">Up to 5 files and 5 links. Images and documents are limited to 10 MB; videos to 50 MB.</p></div><span className="text-xs font-bold text-slate-500">{fileCount}/5 files · {linkCount}/5 links</span></div>
    <div className={`mt-4 rounded-xl border-2 border-dashed p-5 text-center transition-colors ${dragActive ? "border-emerald-600 bg-emerald-50" : "border-slate-300 bg-slate-50"}`} onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragActive(false)} onDrop={(event) => { event.preventDefault(); setDragActive(false); addFiles(event.dataTransfer.files); }}>
      <UploadCloud aria-hidden="true" className="mx-auto text-emerald-700" size={25} /><p className="mt-2 text-sm font-bold text-slate-900">Drag files here or choose from your device</p><p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP, DOC, DOCX, PDF, MP4, or WEBM</p><label className="ph-action mt-3 inline-flex cursor-pointer rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">Choose files<input accept=".jpg,.jpeg,.png,.webp,.doc,.docx,.pdf,.mp4,.webm" className="sr-only" disabled={busy || fileCount >= 5} multiple onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} type="file" /></label>
    </div>
    {queued.length > 0 && <div className="mt-3 grid gap-2">{queued.map((item) => <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3" key={item.id}>{item.preview ? <img alt="" className="size-11 rounded-md object-cover" src={item.preview} /> : <span className="grid size-11 place-items-center rounded-md bg-slate-100 text-slate-600"><FileText aria-hidden="true" size={19} /></span>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{item.file.name}</p><p className="text-xs text-slate-500">{formatBytes(item.file.size)} · {item.status === "uploading" ? `Uploading ${item.progress}%` : item.status === "failed" ? item.error : "Ready to upload"}</p>{item.status === "uploading" && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${item.progress}%` }} /></div>}</div>{item.status === "uploading" ? <LoaderCircle aria-label="Uploading" className="animate-spin text-emerald-700" size={18} /> : <button className="ph-action rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800" disabled={busy} onClick={() => upload(item)} type="button">{item.status === "failed" ? <><RotateCcw aria-hidden="true" className="mr-1 inline" size={13} />Retry</> : "Upload"}</button>}<button aria-label={`Remove ${item.file.name}`} className="ph-action rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => removeQueued(item.id)} type="button"><Trash2 aria-hidden="true" size={15} /></button></div>)}</div>}
    <div className="mt-5"><h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Add a link</h3><form className="mt-2 flex flex-col gap-2 sm:flex-row" onSubmit={addLink}><input className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200" disabled={busy || linkCount >= 5} onChange={(event) => setLink(event.target.value)} placeholder="https://..." type="url" value={link} /><button className="ph-action rounded-lg border border-emerald-700 px-4 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50" disabled={busy || linkCount >= 5 || !link.trim()} type="submit">Add link</button></form>{linkError && <p className="mt-2 text-xs font-semibold text-red-700" role="alert">{linkError}</p>}</div>
    <div className="mt-5"><h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Attached to this submission</h3><AttachmentList attachments={currentAttachments} onOpenAttachment={onOpenAttachment} onRemoveAttachment={onRemoveAttachment} /></div>
  </section>;
}

export default function AssignmentDetail({ assignment, onBackToList, onSaveSubmission, onUploadFile, onAddLink, onRemoveAttachment, onOpenAttachment, saving, attachmentBusy }) {
  if (!assignment) return <section className="ph-assignment-detail-empty"><ClipboardEmpty /></section>;
  const status = assignment.submission_status || assignment.submission?.status || "pending";
  const submission = assignment.submission;
  const graded = status === "graded";
  const submitted = ["submitted", "late"].includes(status);

  return <article className="min-w-0">
    <button className="ph-action mb-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:underline" onClick={onBackToList} type="button"><ArrowLeft aria-hidden="true" size={16} /> Back to Assignments</button>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <main className="ph-assignment-detail min-w-0">
        <header className="border-b border-slate-200 pb-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2 text-emerald-700"><span className="grid size-9 place-items-center rounded-lg bg-emerald-50"><FileText aria-hidden="true" size={18} /></span><p className="text-xs font-bold uppercase tracking-[0.16em]">Assignment</p></div><p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">{assignment.course_code}</p><p className="mt-1 text-sm font-semibold text-slate-500">{assignment.course_title}</p><h1 className="mt-3 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{assignment.title}</h1></div><StatusBadge label={statusLabel(status)} value={status} /></div></header>
        <dl className="grid gap-5 border-b border-slate-200 py-6 sm:grid-cols-3"><DetailItem label="Due date" value={formatDate(assignment.due_at)} /><DetailItem label="Total points" value={`${assignment.total_points} points`} /><DetailItem label="Submission status" value={statusLabel(status)} /></dl>
        {status === "late" && <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">This submission was received after the due date.</p>}
        <section className="mt-7" aria-labelledby="assignment-instructions-heading"><div className="flex items-center gap-2"><Info aria-hidden="true" className="text-emerald-700" size={18} /><h2 className="text-lg font-black text-slate-950" id="assignment-instructions-heading">Instructions</h2></div><p className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-700">{assignment.instructions || "No instructions have been added."}</p></section>
        {graded ? <section className="mt-8 space-y-6" aria-labelledby="graded-assignment-heading"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="text-emerald-700" size={20} /><h2 className="font-black text-emerald-950" id="graded-assignment-heading">Graded</h2></div><p className="mt-3 text-3xl font-black text-emerald-950">{submission?.score} <span className="text-base font-semibold text-emerald-800">/ {assignment.total_points} points</span></p><h3 className="mt-5 text-sm font-bold text-emerald-950">Teacher Feedback</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-emerald-950/80">{submission?.feedback || "No feedback provided."}</p></div><AnswerReadOnly value={submission?.written_answer} /></section> : <section className="mt-8" aria-labelledby="assignment-answer-heading"><div className="flex items-center gap-2"><FileText aria-hidden="true" className="text-emerald-700" size={18} /><h2 className="text-lg font-black text-slate-950" id="assignment-answer-heading">Your Answer</h2></div>{submitted && <p className="mt-2 text-sm text-slate-600">Submitted {formatDate(submission?.submitted_at, true)}. You may edit or resubmit while this assignment remains editable.</p>}<form className="mt-4" id="assignment-answer-form" onSubmit={(event) => onSaveSubmission(event, assignment)}><textarea className="min-h-44 w-full rounded-xl border border-slate-300 p-4 leading-7 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200" defaultValue={submission?.written_answer || ""} key={`${assignment.id}-${submission?.status || "pending"}-${submission?.submitted_at || ""}`} id={`assignment-answer-${assignment.id}`} name="answer" placeholder="Write your answer here" rows="8" /></form></section>}
      </main>
      <aside className="ph-assignment-work-panel rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-950">Your Work</h2><div className="mt-4 flex items-center justify-between gap-3"><span className="text-sm font-semibold text-slate-600">Status</span><StatusBadge label={statusLabel(status)} value={status} /></div>{submission?.submitted_at && <p className="mt-3 text-sm text-slate-600">Submitted {formatDate(submission.submitted_at, true)}</p>}{graded ? <section className="mt-5 border-t border-slate-200 pt-5"><h3 className="text-sm font-black text-slate-950">Submitted files and links</h3><AttachmentList attachments={submission?.attachments} onOpenAttachment={onOpenAttachment} onRemoveAttachment={() => {}} readOnly /></section> : <><SubmissionAttachments assignment={assignment} busy={attachmentBusy} onAddLink={onAddLink} onOpenAttachment={onOpenAttachment} onRemoveAttachment={onRemoveAttachment} onUploadFile={onUploadFile} /><div className="mt-6 grid gap-2 border-t border-slate-200 pt-5"><button className="ph-action rounded-lg border border-emerald-700 px-4 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50" disabled={saving || attachmentBusy} form="assignment-answer-form" type="submit" value="draft">Save Draft</button><button className="ph-action rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" disabled={saving || attachmentBusy} form="assignment-answer-form" type="submit" value="submit">Submit Assignment</button></div></>}</aside>
    </div>
  </article>;
}

function AnswerReadOnly({ value }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="student-answer-heading"><h2 className="text-sm font-black text-slate-950" id="student-answer-heading">Student Answer</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{value || "No answer submitted."}</p></section>;
}

function ClipboardEmpty() {
  return <div className="grid min-h-80 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><p className="font-bold text-slate-900">No assignment selected</p><p className="mt-1 text-sm text-slate-500">Choose an assignment from the list.</p></div></div>;
}
