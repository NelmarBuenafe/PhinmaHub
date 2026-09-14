import { LoaderCircle, Megaphone, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import Dialog from "../common/Dialog.jsx";
import Loading from "../common/Loading.jsx";
import StatusBadge from "../common/StatusBadge.jsx";
import api from "../../services/api.js";
import { useApiQuery } from "../../utils/useApiQuery.js";
import { useToast } from "../../contexts/toastStore.js";
import { actionErrorMessage } from "../../utils/actionFeedback.js";
import { fieldClass } from "./teacherCourseOverviewConstants.js";

const initialForm = { title: "", body: "", isPublished: false };

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
}

function formValues(announcement) {
  return { title: announcement.title || "", body: announcement.body || "", isPublished: Boolean(announcement.published_at) };
}

function validationErrors(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = "Announcement title is required.";
  if (!values.body.trim()) errors.body = "Announcement content is required.";
  return errors;
}

function AnnouncementFormFields({ errors, onChange, values }) {
  return (
    <>
      <div>
        <label className="block text-sm font-semibold text-slate-800" htmlFor="announcement-title">Title</label>
        <input aria-invalid={Boolean(errors.title)} className={`${fieldClass} ${errors.title ? "border-red-500 focus:border-red-600 focus:ring-red-100" : ""}`} id="announcement-title" onChange={(event) => onChange("title", event.target.value)} required value={values.title} />
        {errors.title && <p className="mt-1 text-sm font-medium text-red-700" role="alert">{errors.title}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-800" htmlFor="announcement-content">Content</label>
        <textarea aria-invalid={Boolean(errors.body)} className={`${fieldClass} min-h-36 resize-y ${errors.body ? "border-red-500 focus:border-red-600 focus:ring-red-100" : ""}`} id="announcement-content" onChange={(event) => onChange("body", event.target.value)} required rows="6" value={values.body} />
        {errors.body && <p className="mt-1 text-sm font-medium text-red-700" role="alert">{errors.body}</p>}
      </div>
      <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700">
        <input checked={values.isPublished} className="mt-0.5" onChange={(event) => onChange("isPublished", event.target.checked)} type="checkbox" />
        <span><span className="block font-semibold text-slate-900">Publish now</span><span className="mt-0.5 block text-slate-600">Published announcements are visible to enrolled Students.</span></span>
      </label>
    </>
  );
}

export default function TeacherAnnouncementsPanel({ courseId }) {
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const { data, loading, error: loadError, reload: loadAnnouncements } = useApiQuery(`/teacher/courses/${courseId}/announcements`, { errorMessage: "We couldn't load announcements." });
  const announcements = data?.data || [];

  function changeForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: "" }));
  }

  function closeEditor(force = false) {
    if (saving && !force) return;
    setCreating(false);
    setEditing(null);
    setForm(initialForm);
    setFormErrors({});
  }

  function openCreate() {
    setForm(initialForm);
    setFormErrors({});
    setEditing(null);
    setCreating(true);
  }

  function openEdit(announcement) {
    setCreating(false);
    setForm(formValues(announcement));
    setFormErrors({});
    setEditing(announcement);
  }

  async function submit(event) {
    event.preventDefault();
    const errors = validationErrors(form);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/teacher/announcements/${editing.id}`, form);
        toast.success("Announcement updated successfully.");
      } else {
        await api.post(`/teacher/courses/${courseId}/announcements`, form);
        toast.success(form.isPublished ? "Announcement published successfully." : "Announcement saved as draft.");
      }
      closeEditor(true);
      await loadAnnouncements();
    } catch (requestError) {
      toast.error(actionErrorMessage(requestError, editing ? "Unable to update announcement. Please try again." : "Unable to create announcement. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  async function togglePublication(announcement) {
    const publishing = !announcement.published_at;
    setActionId(announcement.id);
    try {
      await api.put(`/teacher/announcements/${announcement.id}`, { ...formValues(announcement), isPublished: publishing });
      toast.success(publishing ? "Announcement published successfully." : "Announcement unpublished.");
      await loadAnnouncements();
    } catch (requestError) {
      toast.error(actionErrorMessage(requestError, publishing ? "Unable to publish announcement." : "Unable to unpublish announcement."));
    } finally {
      setActionId("");
    }
  }

  async function removeAnnouncement() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/teacher/announcements/${deleteTarget.id}`);
      toast.success("Announcement deleted successfully.");
      setDeleteTarget(null);
      await loadAnnouncements();
    } catch (requestError) {
      toast.error(actionErrorMessage(requestError, "Unable to delete announcement."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-lg font-bold text-slate-950">Announcements</h2><p className="mt-0.5 text-sm text-slate-600">Create and publish course updates for enrolled Students.</p></div>
        <button className="ph-action inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" onClick={openCreate} type="button"><Megaphone aria-hidden="true" size={17} /> New Announcement</button>
      </div>

      {loading && <div className="rounded-xl border border-slate-200 bg-white p-6"><Loading variant="announcements" label="Loading announcements..." /></div>}
      {loadError && <button className="ph-action font-bold text-emerald-800 underline" onClick={loadAnnouncements} type="button">Retry announcements</button>}
      {!loading && !loadError && announcements.length === 0 && <div className="grid min-h-[310px] place-items-center rounded-xl border border-slate-200 bg-white px-5 py-10 text-center"><div className="max-w-sm"><span className="mx-auto grid size-14 place-items-center rounded-full bg-slate-100 text-slate-400"><Megaphone aria-hidden="true" size={24} /></span><h3 className="mt-4 text-lg font-bold text-slate-950">No announcements yet</h3><p className="mt-1.5 text-sm leading-6 text-slate-600">Create your first course announcement to keep Students informed.</p><button className="ph-action mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" onClick={openCreate} type="button"><Megaphone aria-hidden="true" size={17} /> New Announcement</button></div></div>}
      {!loading && !loadError && announcements.length > 0 && <div className="space-y-3">{announcements.map((announcement) => {
        const isPublishing = actionId === announcement.id;
        const isPublished = Boolean(announcement.published_at);
        return <article className="rounded-xl border border-slate-200 bg-white p-5" key={announcement.id}><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2.5"><h3 className="text-base font-bold text-slate-950">{announcement.title}</h3><StatusBadge value={isPublished ? "published" : "draft"} /></div><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{announcement.body}</p><p className="mt-3 text-xs font-medium text-slate-500">{formatDate(announcement.created_at)}</p></div><div className="flex flex-wrap items-center gap-2 lg:justify-end"><button className="ph-action rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60" disabled={Boolean(actionId)} onClick={() => togglePublication(announcement)} type="button">{isPublishing ? <><LoaderCircle aria-hidden="true" className="inline animate-spin" size={15} /> {isPublished ? "Unpublishing…" : "Publishing…"}</> : isPublished ? "Unpublish" : "Publish"}</button><button aria-label={`Edit ${announcement.title}`} className="ph-action rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50" onClick={() => openEdit(announcement)} type="button"><Pencil aria-hidden="true" size={17} /></button><button aria-label={`Delete ${announcement.title}`} className="ph-action rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteTarget(announcement)} type="button"><Trash2 aria-hidden="true" size={18} /></button></div></div></article>;
      })}</div>}

      <Dialog description={editing ? "Update this course announcement." : "Create an update for Students enrolled in this course."} footer={<><button className="ph-action rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100" disabled={saving} onClick={closeEditor} type="button">Cancel</button><button className="ph-action rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} form="announcement-editor" type="submit">{saving ? (editing ? "Saving…" : "Creating…") : (editing ? "Save Changes" : "Create Announcement")}</button></>} onClose={closeEditor} open={creating || Boolean(editing)} processing={saving} title={editing ? "Edit Announcement" : "New Announcement"} wide={false}>
        <form className="grid gap-4" id="announcement-editor" onSubmit={submit}><AnnouncementFormFields errors={formErrors} onChange={changeForm} values={form} /></form>
      </Dialog>
      <Dialog description="This announcement will be removed from the course." footer={<><button className="ph-action rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100" disabled={deleting} onClick={() => setDeleteTarget(null)} type="button">Cancel</button><button className="ph-action rounded-lg bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={deleting} onClick={removeAnnouncement} type="button">{deleting ? "Deleting…" : "Delete Announcement"}</button></>} onClose={() => { if (!deleting) setDeleteTarget(null); }} open={Boolean(deleteTarget)} processing={deleting} title="Delete announcement?">
        <p className="text-sm leading-6 text-slate-700">This announcement will be removed from the course.</p>
      </Dialog>
    </div>
  );
}
