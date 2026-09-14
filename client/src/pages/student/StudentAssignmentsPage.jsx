import { useMemo, useState } from "react";
import { ArrowUpDown, CalendarClock, ClipboardList, FileCheck2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AssignmentDetail from "../../components/student/AssignmentDetail.jsx";
import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import StudentWorkspaceHeader from "../../components/student/StudentWorkspaceHeader.jsx";
import api from "../../services/api.js";
import { supabase } from "../../services/supabase.js";
import { useApiQuery } from "../../utils/useApiQuery.js";
import { useToast } from "../../contexts/toastStore.js";
import { actionErrorMessage } from "../../utils/actionFeedback.js";

const statusOrder = { pending: 0, draft: 0, submitted: 1, late: 1, graded: 2 };
const emptyAssignments = [];

function assignmentStatus(assignment) {
  return assignment.submission_status || "pending";
}

function matchesAssignmentFilter(assignment, filter) {
  if (filter === "all") return true;
  const status = assignmentStatus(assignment);
  if (filter === "pending") return ["pending", "draft"].includes(status);
  if (filter === "submitted") return ["submitted", "late"].includes(status);
  return status === "graded";
}

function dueTime(assignment) {
  return assignment.due_at ? new Date(assignment.due_at).getTime() : Number.POSITIVE_INFINITY;
}

function formatDueDate(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function statusLabel(status) {
  return status === "pending" ? "Pending" : `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function instructionPreview(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > 155 ? `${text.slice(0, 152)}…` : text;
}

export default function StudentAssignmentsPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [sort, setSort] = useState("due");
  const [saving, setSaving] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const toast = useToast();
  const assignmentsQuery = useApiQuery("/student/assignments", { errorMessage: "We couldn't load your assignments." });
  const assignments = assignmentsQuery.data?.data || emptyAssignments;

  const selectedAssignment = assignments.find((assignment) => assignment.id === assignmentId) || null;
  const detailId = assignmentId || "";
  const detailQuery = useApiQuery(detailId ? `/student/assignments/${detailId}/detail` : "", { enabled: Boolean(detailId), errorMessage: "We couldn't load this assignment." });
  const detailedAssignment = detailQuery.data?.data;
  const assignmentForDetail = detailedAssignment?.assignment
    ? { ...selectedAssignment, ...detailedAssignment.assignment, submission: detailedAssignment.submission, submission_status: detailedAssignment.submission?.status || selectedAssignment?.submission_status || "pending" }
    : selectedAssignment;

  const orderedAssignments = useMemo(() => assignments
    .filter((assignment) => matchesAssignmentFilter(assignment, filter) && (courseFilter === "all" || assignment.course_id === courseFilter))
    .map((assignment, index) => ({ assignment, index }))
    .sort((left, right) => {
      if (sort === "newest") return new Date(right.assignment.created_at || 0) - new Date(left.assignment.created_at || 0) || left.index - right.index;
      if (sort === "oldest") return new Date(left.assignment.created_at || 0) - new Date(right.assignment.created_at || 0) || left.index - right.index;
      const statusDifference = (statusOrder[assignmentStatus(left.assignment)] ?? 3) - (statusOrder[assignmentStatus(right.assignment)] ?? 3);
      return statusDifference || dueTime(left.assignment) - dueTime(right.assignment) || left.index - right.index;
    })
    .map(({ assignment }) => assignment), [assignments, courseFilter, filter, sort]);

  const courses = useMemo(() => [...new Map(assignments.map((assignment) => [assignment.course_id, { id: assignment.course_id, label: `${assignment.course_code} · ${assignment.course_title}` }])).values()], [assignments]);
  const summary = useMemo(() => ({
    pending: assignments.filter((assignment) => ["pending", "draft"].includes(assignmentStatus(assignment))).length,
    submitted: assignments.filter((assignment) => ["submitted", "late"].includes(assignmentStatus(assignment))).length,
    graded: assignments.filter((assignment) => assignmentStatus(assignment) === "graded").length,
  }), [assignments]);

  async function saveSubmission(event, assignment) {
    event.preventDefault();
    const writtenAnswer = new FormData(event.currentTarget).get("answer");
    const submit = event.nativeEvent.submitter?.value === "submit";
    setSaving(true);
    try {
      const response = await api.put(`/student/assignments/${assignment.id}/submission`, { writtenAnswer, submit });
      const submission = response.data.data;
      updateSubmission(assignment.id, (current) => ({ ...current, ...submission, attachments: current?.attachments || [] }));
      toast.success(submit ? (submission.status === "late" ? "Assignment submitted successfully and marked as late." : "Assignment submitted successfully.") : "Draft saved successfully.");
    } catch (requestError) {
      toast.error(actionErrorMessage(requestError, submit ? "Unable to submit assignment. Please try again." : "Unable to save draft."));
    } finally {
      setSaving(false);
    }
  }

  function updateSubmission(id, updater) {
    assignmentsQuery.update((current) => current?.data ? {
      ...current,
      data: current.data.map((item) => {
        if (item.id !== id) return item;
        const submission = updater(item.submission || null);
        return { ...item, submission, submission_status: submission?.status || "pending" };
      }),
    } : current);
    detailQuery.update((current) => current?.data ? {
      ...current,
      data: { ...current.data, submission: updater(current.data.submission || null) },
    } : current);
  }

  async function uploadFile(file, onProgress) {
    const assignment = assignmentForDetail;
    if (!assignment) throw new Error("Choose an assignment first.");
    let upload = null;
    setAttachmentBusy(true);
    try {
      const uploadResponse = await api.post(`/student/assignments/${assignment.id}/submission/upload-url`, { fileName: file.name, mimeType: file.type, fileSize: file.size });
      upload = uploadResponse.data.data;
      onProgress?.(45);
      const { error } = await supabase.storage.from("assignment-submissions").uploadToSignedUrl(upload.storagePath, upload.token, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      onProgress?.(80);
      const attachmentResponse = await api.post(`/student/assignments/${assignment.id}/submission/attachments`, { submissionId: upload.submissionId, storagePath: upload.storagePath, fileName: file.name, mimeType: file.type, fileSize: file.size });
      updateSubmission(assignment.id, (current) => ({ ...current, ...attachmentResponse.data.data.submission, attachments: [...(current?.attachments || []), attachmentResponse.data.data.attachment] }));
      onProgress?.(100);
      toast.success("File uploaded successfully.");
    } catch (error) {
      if (upload?.storagePath) {
        await api.delete(`/student/assignments/${assignment.id}/submission/upload`, { data: { submissionId: upload.submissionId, storagePath: upload.storagePath } }).catch(() => undefined);
      }
      const message = actionErrorMessage(error, "File upload failed.");
      toast.error(message);
      throw new Error(message);
    } finally {
      setAttachmentBusy(false);
    }
  }

  async function addLink(url) {
    const assignment = assignmentForDetail;
    if (!assignment) return;
    setAttachmentBusy(true);
    try {
      let submissionId = assignment.submission?.id || detailedAssignment?.submission?.id;
      if (!submissionId) {
        const draftResponse = await api.put(`/student/assignments/${assignment.id}/submission`, { writtenAnswer: "", submit: false });
        submissionId = draftResponse.data.data.id;
        updateSubmission(assignment.id, (current) => ({ ...current, ...draftResponse.data.data, attachments: current?.attachments || [] }));
      }
      const response = await api.post(`/student/assignments/${assignment.id}/submission/links`, { submissionId, url });
      updateSubmission(assignment.id, (current) => ({ ...current, ...response.data.data.submission, attachments: [...(current?.attachments || []), response.data.data.attachment] }));
      toast.success("Link added successfully.");
    } catch (error) {
      const message = actionErrorMessage(error, "Unable to add link.");
      toast.error(message);
      throw new Error(message);
    } finally {
      setAttachmentBusy(false);
    }
  }

  async function removeAttachment(attachment) {
    const assignment = assignmentForDetail;
    if (!assignment) return;
    setAttachmentBusy(true);
    try {
      await api.delete(`/student/assignments/${assignment.id}/submission/attachments/${attachment.id}`);
      updateSubmission(assignment.id, (current) => ({ ...current, attachments: (current?.attachments || []).filter((item) => item.id !== attachment.id) }));
      toast.success("Attachment removed successfully.");
    } catch (error) {
      toast.error(actionErrorMessage(error, "Unable to remove attachment."));
    } finally {
      setAttachmentBusy(false);
    }
  }

  async function openAttachment(attachment) {
    const assignment = assignmentForDetail;
    if (!assignment) return;
    const popup = attachment.type === "link" ? null : window.open("about:blank", "_blank", "noopener,noreferrer");
    try {
      const response = attachment.type === "link"
        ? { data: { data: { url: attachment.external_url } } }
        : await api.get(`/student/assignments/${assignment.id}/submission/attachments/${attachment.id}/access`);
      if (popup) popup.location.href = response.data.data.url;
      else window.open(response.data.data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      popup?.close();
      toast.error(actionErrorMessage(error, "Unable to open attachment."));
    }
  }

  if (!assignmentsQuery.data && !assignmentsQuery.error) return <div className="ph-assignment-empty-page"><PageHeader eyebrow="Student workspace" title="Assignments & Coursework" /><div className="mt-6"><Loading variant="assignments" label="Loading assignments..." /></div></div>;
  if (assignmentsQuery.error && !assignmentsQuery.data) return <div className="ph-assignment-empty-page"><PageHeader eyebrow="Student workspace" title="Assignments & Coursework" /><p className="mt-6 rounded-xl bg-red-50 p-4 text-red-800" role="alert">{assignmentsQuery.error}</p><button className="mt-3 font-bold text-emerald-800 underline" onClick={assignmentsQuery.reload} type="button">Retry</button></div>;

  if (assignmentId) return <div className="ph-assignment-page min-w-0"><StudentWorkspaceHeader><Link className="shrink-0 text-emerald-800 hover:underline" to="/student/assignments">Assignments</Link><span aria-hidden="true">/</span><span className="truncate text-slate-900">{assignmentForDetail?.title || "Assignment"}</span></StudentWorkspaceHeader><main className="ph-assignment-main"><div className="ph-assignment-main-inner">{!detailQuery.data && !detailQuery.error ? <Loading variant="assignments" label="Loading assignment..." /> : detailQuery.error ? <section className="ph-assignment-empty-state"><h1 className="text-xl font-black text-slate-950">Assignment unavailable</h1><p className="mt-2 text-slate-600">{detailQuery.error}</p><Link className="mt-4 inline-block font-bold text-emerald-800 hover:underline" to="/student/assignments">Back to Assignments</Link></section> : <AssignmentDetail assignment={assignmentForDetail} attachmentBusy={attachmentBusy} onAddLink={addLink} onBackToList={() => navigate("/student/assignments")} onOpenAttachment={openAttachment} onRemoveAttachment={removeAttachment} onSaveSubmission={saveSubmission} onUploadFile={uploadFile} saving={saving} />}</div></main></div>;

  return <div className="ph-assignment-page min-w-0"><StudentWorkspaceHeader><span className="font-bold text-slate-900">Assignments & Coursework</span></StudentWorkspaceHeader><main className="ph-assignment-main"><div className="ph-assignment-main-inner ph-assignment-overview"><PageHeader description="Review your coursework, track submission status, and open assignments from your enrolled courses." eyebrow="Student workspace" title="Assignments & Coursework" /><section aria-label="Assignment summary" className="mt-6 grid gap-3 sm:grid-cols-3"><SummaryCard icon={ClipboardList} label="Pending" value={summary.pending} /><SummaryCard icon={FileCheck2} label="Submitted" value={summary.submitted} /><SummaryCard icon={CalendarClock} label="Graded" value={summary.graded} /></section><section className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div aria-label="Assignment status filters" className="flex gap-1 overflow-x-auto" role="group">{["all", "pending", "submitted", "graded"].map((value) => <button aria-pressed={filter === value} className={`ph-action shrink-0 rounded-lg px-3 py-2 text-sm font-bold capitalize ${filter === value ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`} key={value} onClick={() => setFilter(value)} type="button">{value}</button>)}</div><div className="grid gap-2 sm:grid-cols-2"><label className="sr-only" htmlFor="assignment-course-filter">Course</label><select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700" id="assignment-course-filter" onChange={(event) => setCourseFilter(event.target.value)} value={courseFilter}><option value="all">All Courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.label}</option>)}</select><label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><ArrowUpDown aria-hidden="true" size={15} /><span className="sr-only">Sort assignments</span><select className="min-w-0 bg-transparent outline-none" onChange={(event) => setSort(event.target.value)} value={sort}><option value="due">Due Date</option><option value="newest">Newest</option><option value="oldest">Oldest</option></select></label></div></div></section><section aria-label="Assignments" className="mt-5 grid gap-4">{orderedAssignments.length ? orderedAssignments.map((assignment) => <AssignmentCard assignment={assignment} key={assignment.id} />) : <section className="ph-assignment-empty-state rounded-2xl"><h2 className="text-lg font-black text-slate-950">No assignments found.</h2><p className="mt-2 text-slate-600">Try another status or course filter.</p></section>}</section></div></main></div>;
}

function SummaryCard({ icon: Icon, label, value }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon aria-hidden="true" size={20} /></span><span className="text-2xl font-black text-slate-950">{value}</span></div><p className="mt-3 text-sm font-bold text-slate-700">{label}</p></article>;
}

function AssignmentCard({ assignment }) {
  const status = assignmentStatus(assignment);
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.13em] text-emerald-700">{assignment.course_code}</p><p className="mt-1 text-sm font-semibold text-slate-600">{assignment.course_title}</p><h2 className="mt-3 text-lg font-black text-slate-950">{assignment.title}</h2>{instructionPreview(assignment.instructions) && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{instructionPreview(assignment.instructions)}</p>}<div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600"><span>Due {formatDueDate(assignment.due_at)}</span><span>{assignment.total_points} points</span><StatusBadge label={statusLabel(status)} value={status} /></div></div><Link className="ph-action inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" to={`/student/assignments/${assignment.id}`}>Open Assignment</Link></div></article>;
}
