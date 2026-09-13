import { useState } from "react";
import { ConfirmationDialog } from "../admin/AdminUI.jsx";
import Loading from "../common/Loading.jsx";
import StatusBadge from "../common/StatusBadge.jsx";
import api from "../../services/api.js";
import { useApiQuery } from "../../utils/useApiQuery.js";

const initialForm = { title: "", body: "", isPublished: false };

function formatDate(value) {
  return value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
}

function formValues(announcement) {
  return {
    title: announcement.title || "",
    body: announcement.body || "",
    isPublished: Boolean(announcement.published_at),
  };
}

export default function TeacherAnnouncementsPanel({ courseId }) {
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, loading, error: loadError, reload: loadAnnouncements } = useApiQuery(`/teacher/courses/${courseId}/announcements`, { errorMessage: "We couldn't load announcements." });
  const announcements = data?.data || [];
  const error = actionError || loadError;

  function changeForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (editing) {
        await api.put(`/teacher/announcements/${editing.id}`, form);
        setNotice("Announcement updated.");
      } else {
        await api.post(`/teacher/courses/${courseId}/announcements`, form);
        setNotice("Announcement created.");
      }
      setForm(initialForm);
      setEditing(null);
      await loadAnnouncements();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          (editing ? "We couldn't update this announcement." : "We couldn't create this announcement."),
      );
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(announcement) {
    setEditing(announcement);
    setForm(formValues(announcement));
    setNotice("");
    setError("");
  }

  async function remove() {
    if (!deleteTarget) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      await api.delete(`/teacher/announcements/${deleteTarget.id}`);
      setNotice("Announcement deleted.");
      setDeleteTarget(null);
      await loadAnnouncements();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't delete this announcement.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 space-y-5">
      <form className="ph-surface rounded-2xl p-6" onSubmit={submit}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">
            {editing ? "Edit announcement" : "Create announcement"}
          </h2>
          {editing && (
            <button
              className="text-sm font-bold text-slate-600 hover:underline"
              onClick={() => {
                setEditing(null);
                setForm(initialForm);
              }}
              type="button"
            >
              Cancel edit
            </button>
          )}
        </div>
        <label className="mt-4 block text-sm font-bold">
          Title
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            onChange={(event) => changeForm("title", event.target.value)}
            required
            value={form.title}
          />
        </label>
        <label className="mt-4 block text-sm font-bold">
          Content
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            onChange={(event) => changeForm("body", event.target.value)}
            required
            rows="5"
            value={form.body}
          />
        </label>
        <label className="mt-4 flex gap-2 text-sm font-bold">
          <input
            checked={form.isPublished}
            onChange={(event) =>
              changeForm("isPublished", event.target.checked)
            }
            type="checkbox"
          />
          Publish for enrolled Students
        </label>
        <button
          className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving
            ? "Saving..."
            : editing
              ? "Save announcement"
              : "Create announcement"}
        </button>
      </form>

      {error && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          role="status"
        >
          {notice}
        </p>
      )}
      {loading && (
        <div className="ph-surface rounded-2xl p-6">
          <Loading variant="announcements" label="Loading announcements..." />
        </div>
      )}
      {loadError && <button className="font-bold underline" onClick={loadAnnouncements} type="button">Retry announcements</button>}
      {!loading && !loadError && announcements.length === 0 && (
        <div className="ph-surface rounded-2xl p-6 text-slate-600">
          No announcements yet.
        </div>
      )}
      {!loading &&
        announcements.length > 0 &&
        announcements.map((announcement) => (
          <article
            className="ph-surface rounded-2xl p-5"
            key={announcement.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  {announcement.title}
                </h3>
                <p className="mt-2 max-w-[72ch] whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {announcement.body}
                </p>
              </div>
              <StatusBadge
                value={announcement.published_at ? "published" : "draft"}
              />
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Created {formatDate(announcement.created_at)}
              {announcement.updated_at &&
              announcement.updated_at !== announcement.created_at
                ? ` · Updated ${formatDate(announcement.updated_at)}`
                : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
                onClick={() => beginEdit(announcement)}
                type="button"
              >
                Edit
              </button>
              <button
                className="rounded-lg border border-emerald-700 px-3 py-2 text-emerald-800 hover:bg-emerald-50"
                onClick={() => {
                  setEditing(announcement);
                  setForm({
                    ...formValues(announcement),
                    isPublished: !announcement.published_at,
                  });
                }}
                type="button"
              >
                {announcement.published_at ? "Unpublish" : "Publish"}
              </button>
              <button
                className="rounded-lg border border-red-300 px-3 py-2 text-red-800 hover:bg-red-50"
                onClick={() => setDeleteTarget(announcement)}
                type="button"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      <ConfirmationDialog
        confirmLabel="Delete announcement"
        destructive
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        open={Boolean(deleteTarget)}
        processing={saving}
        title="Delete announcement?"
      >
        This announcement will no longer be visible to Students. This action
        cannot be undone.
      </ConfirmationDialog>
    </div>
  );
}
