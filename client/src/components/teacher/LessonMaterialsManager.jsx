import { useEffect, useState } from "react";
import {
  DOCUMENT_ACCEPT,
  MAX_LESSON_MATERIAL_BYTES,
} from "../../config/lessonMaterials.js";
import api from "../../services/api.js";
import { supabase } from "../../services/supabase.js";

const initialForm = {
  materialType: "document",
  title: "",
  description: "",
  externalUrl: "",
};

function fieldLabel(type) {
  if (type === "video") return "YouTube URL";
  if (type === "google_form") return "Google Form URL";
  return "Resource URL";
}

function readableType(type) {
  return type.replace("_", " ");
}

export default function LessonMaterialsManager({ lessonId }) {
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadMaterials() {
    setLoading(true);
    try {
      const response = await api.get(`/teacher/lessons/${lessonId}/materials`);
      setMaterials(response.data.data || []);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load lesson materials.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setEditing(null);
    setForm(initialForm);
    setFile(null);
    loadMaterials();
  }, [lessonId]);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseFile(event) {
    const selected = event.target.files?.[0] || null;
    if (!selected) return;

    if (selected.size > MAX_LESSON_MATERIAL_BYTES) {
      setFile(null);
      setError("This file is too large to upload. The maximum is 10 MB.");
      return;
    }

    setFile(selected);
    if (!form.title) updateForm("title", selected.name);
    setError("");
  }

  async function discardUpload(storagePath) {
    if (!storagePath) return;
    try {
      await api.delete(`/teacher/lessons/${lessonId}/materials/upload`, {
        data: { storagePath },
      });
    } catch {
      // The record creation error is more useful to the teacher. The server
      // only accepts paths scoped to this teacher's lesson.
    }
  }

  async function addMaterial(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    let uploadedPath = null;

    try {
      let payload = {
        materialType: form.materialType,
        title: form.title,
        description: form.description,
      };
      if (form.materialType === "document") {
        if (!file) throw new Error("Choose a document to upload.");

        const uploadResponse = await api.post(
          `/teacher/lessons/${lessonId}/materials/upload-url`,
          {
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            fileSize: file.size,
          },
        );
        const { storagePath, token } = uploadResponse.data.data;
        uploadedPath = storagePath;

        const { error: uploadError } = await supabase.storage
          .from("lesson-materials")
          .uploadToSignedUrl(storagePath, token, file, {
            contentType: file.type || "application/octet-stream",
          });
        if (uploadError) throw uploadError;

        payload = {
          ...payload,
          storagePath,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
        };
      } else {
        payload = {
          ...payload,
          externalUrl: form.externalUrl,
        };
      }

      await api.post(`/teacher/lessons/${lessonId}/materials`, payload);
      setForm(initialForm);
      setFile(null);
      setNotice("Learning material added.");
      await loadMaterials();
    } catch (requestError) {
      await discardUpload(uploadedPath);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to add learning material.",
      );
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(material) {
    setEditing({
      id: material.id,
      materialType: material.material_type,
      title: material.title,
      description: material.description || "",
      externalUrl: material.external_url || "",
    });
    setNotice("");
    setError("");
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editing) return;

    setSaving(true);
    setError("");
    try {
      const payload = {
        title: editing.title,
        description: editing.description,
      };
      if (editing.materialType !== "document") {
        payload.externalUrl = editing.externalUrl;
      }

      await api.patch(`/teacher/materials/${editing.id}`, payload);
      setEditing(null);
      setNotice("Learning material updated.");
      await loadMaterials();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to update learning material.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeMaterial(materialId) {
    if (!window.confirm("Remove this learning material?")) return;

    setError("");
    setNotice("");
    try {
      await api.delete(`/teacher/materials/${materialId}`);
      if (editing?.id === materialId) setEditing(null);
      setNotice("Learning material removed.");
      await loadMaterials();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to remove learning material.",
      );
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-dashed border-slate-300 p-4">
      <h3 className="font-black text-slate-950">Learning Materials</h3>
      <p className="mt-1 text-sm text-slate-600">
        Add documents, YouTube videos, external resources, or Google Form
        activities.
      </p>
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      {loading && <p className="mt-4 text-sm text-slate-500">Loading materials…</p>}
      {!loading && materials.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">No learning materials yet.</p>
      )}
      {!loading && materials.length > 0 && (
        <ul className="mt-4 space-y-2">
          {materials.map((material) => (
            <li
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
              key={material.id}
            >
              <span>
                <strong>{material.title}</strong>
                <span className="ml-2 text-xs capitalize text-slate-500">
                  {readableType(material.material_type)}
                </span>
              </span>
              <span className="flex gap-3">
                <button
                  className="text-sm font-bold text-emerald-800 hover:underline"
                  onClick={() => beginEdit(material)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="text-sm font-bold text-red-700 hover:underline"
                  onClick={() => removeMaterial(material.id)}
                  type="button"
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <form
          className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4"
          onSubmit={saveEdit}
        >
          <h4 className="font-bold text-slate-950">Edit material</h4>
          <label className="text-sm font-bold">
            Title
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) =>
                setEditing((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
              value={editing.title}
            />
          </label>
          <label className="text-sm font-bold">
            Description / instructions (optional)
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) =>
                setEditing((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows="2"
              value={editing.description}
            />
          </label>
          {editing.materialType !== "document" && (
            <label className="text-sm font-bold">
              {fieldLabel(editing.materialType)}
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                onChange={(event) =>
                  setEditing((current) => ({
                    ...current,
                    externalUrl: event.target.value,
                  }))
                }
                required
                type="url"
                value={editing.externalUrl}
              />
            </label>
          )}
          <div className="flex gap-3">
            <button
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              Save changes
            </button>
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold"
              onClick={() => setEditing(null)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <form className="mt-4 grid gap-3" onSubmit={addMaterial}>
        <label className="text-sm font-bold">
          Material type
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            onChange={(event) => {
              updateForm("materialType", event.target.value);
              setFile(null);
            }}
            value={form.materialType}
          >
            <option value="document">Document</option>
            <option value="video">YouTube video</option>
            <option value="external_link">External link</option>
            <option value="google_form">Google Form</option>
          </select>
        </label>
        <label className="text-sm font-bold">
          Title
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            onChange={(event) => updateForm("title", event.target.value)}
            required
            value={form.title}
          />
        </label>
        <label className="text-sm font-bold">
          Description / instructions (optional)
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            onChange={(event) => updateForm("description", event.target.value)}
            rows="2"
            value={form.description}
          />
        </label>
        {form.materialType === "document" ? (
          <label className="text-sm font-bold">
            Document (PDF, Word, PowerPoint; maximum 10 MB)
            <input
              accept={DOCUMENT_ACCEPT}
              className="mt-1 block w-full text-sm"
              onChange={chooseFile}
              required
              type="file"
            />
          </label>
        ) : (
          <label className="text-sm font-bold">
            {fieldLabel(form.materialType)}
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => updateForm("externalUrl", event.target.value)}
              placeholder="https://"
              required
              type="url"
              value={form.externalUrl}
            />
          </label>
        )}
        <button
          className="justify-self-start rounded-lg border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800 disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving…" : "Add Material"}
        </button>
      </form>
    </section>
  );
}
