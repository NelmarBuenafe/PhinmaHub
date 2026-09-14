import { ClipboardList, ExternalLink, FileText, FileVideo2, FolderOpen, Plus, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { DOCUMENT_ACCEPT, MAX_LESSON_MATERIAL_BYTES } from "../../config/lessonMaterials.js";
import api from "../../services/api.js";
import { supabase } from "../../services/supabase.js";
import { useApiQuery } from "../../utils/useApiQuery.js";
import { ConfirmationDialog } from "../admin/AdminUI.jsx";
import Dialog from "../common/Dialog.jsx";
import Loading from "../common/Loading.jsx";
import { useToast } from "../../contexts/toastStore.js";
import { actionErrorMessage } from "../../utils/actionFeedback.js";

const initialForm = { materialType: "document", title: "", description: "", externalUrl: "" };

const materialMeta = {
  document: { label: "Document", Icon: FileText, className: "border-sky-200 bg-sky-50 text-sky-800" },
  video: { label: "Video", Icon: FileVideo2, className: "border-rose-200 bg-rose-50 text-rose-800" },
  external_link: { label: "External Resource", Icon: ExternalLink, className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  google_form: { label: "Google Form", Icon: ClipboardList, className: "border-violet-200 bg-violet-50 text-violet-800" },
};

function fieldLabel(type) {
  if (type === "video") return "YouTube URL";
  if (type === "google_form") return "Google Form URL";
  return "Resource URL";
}

export default function LessonMaterialsManager({ lessonId, lessonTitle }) {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInput = useRef(null);
  const toast = useToast();
  const { data, loading, error: loadError, reload: loadMaterials } = useApiQuery(`/teacher/lessons/${lessonId}/materials`, { errorMessage: "Unable to load lesson materials." });
  const materials = data?.data || [];
  const error = actionError || loadError;

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectFile(selected) {
    if (!selected) return;
    if (selected.size > MAX_LESSON_MATERIAL_BYTES) {
      setFile(null);
      setError("This file is too large to upload. The maximum is 10 MB.");
      toast.error("File exceeds the allowed size.");
      return;
    }
    setFile(selected);
    setForm((current) => ({ ...current, title: current.title || selected.name }));
    setError("");
  }

  async function discardUpload(storagePath) {
    if (!storagePath) return;
    try {
      await api.delete(`/teacher/lessons/${lessonId}/materials/upload`, { data: { storagePath } });
    } catch {
      // The record creation error is more useful to the teacher. The server
      // remains responsible for confirming the path belongs to this lesson.
    }
  }

  async function addMaterial(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    let uploadedPath = null;
    try {
      let payload = { materialType: form.materialType, title: form.title, description: form.description };
      if (form.materialType === "document") {
        if (!file) throw new Error("Choose a document to upload.");
        const uploadResponse = await api.post(`/teacher/lessons/${lessonId}/materials/upload-url`, { fileName: file.name, mimeType: file.type || "application/octet-stream", fileSize: file.size });
        const { storagePath, token } = uploadResponse.data.data;
        uploadedPath = storagePath;
        const { error: uploadError } = await supabase.storage.from("lesson-materials").uploadToSignedUrl(storagePath, token, file, { contentType: file.type || "application/octet-stream" });
        if (uploadError) throw uploadError;
        payload = { ...payload, storagePath, fileName: file.name, mimeType: file.type || "application/octet-stream", fileSize: file.size };
      } else {
        payload = { ...payload, externalUrl: form.externalUrl };
      }
      await api.post(`/teacher/lessons/${lessonId}/materials`, payload);
      setForm(initialForm);
      setFile(null);
      setAdding(false);
      toast.success("Learning material added successfully.");
      await loadMaterials();
    } catch (requestError) {
      await discardUpload(uploadedPath);
      const message = actionErrorMessage(requestError, "Unable to add learning material.");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(material) {
    setEditing({ id: material.id, materialType: material.material_type, title: material.title, description: material.description || "", externalUrl: material.external_url || "" });
    setError("");
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const payload = { title: editing.title, description: editing.description };
      if (editing.materialType !== "document") payload.externalUrl = editing.externalUrl;
      await api.patch(`/teacher/materials/${editing.id}`, payload);
      setEditing(null);
      toast.success("Learning material updated successfully.");
      await loadMaterials();
    } catch (requestError) {
      const message = actionErrorMessage(requestError, "Unable to update learning material.");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function removeMaterial() {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await api.delete(`/teacher/materials/${deleteTarget.id}`);
      setDeleteTarget(null);
      toast.success("Learning material removed successfully.");
      await loadMaterials();
    } catch (requestError) {
      const message = actionErrorMessage(requestError, "Unable to remove learning material.");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function closeAdd() {
    if (saving) return;
    setAdding(false);
    setForm(initialForm);
    setFile(null);
    setError("");
  }

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-lg font-bold text-slate-950">Learning Materials</h2><p className="mt-1 text-sm text-slate-600">Add documents, videos, external resources, and Google Form activities.</p></div>
        <button className="ph-action inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" onClick={() => setAdding(true)} type="button"><Plus aria-hidden="true" size={18} /> Add Material</button>
      </div>
      {error && !adding && !editing && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {loading && <div className="mt-8"><Loading variant="courses" label="Loading materials..." /></div>}
      {loadError && <button className="mt-4 font-bold text-emerald-800 underline" onClick={loadMaterials} type="button">Retry materials</button>}
      {!loading && !loadError && materials.length === 0 && <div className="mt-8 grid min-h-64 place-items-center rounded-xl border border-slate-200 bg-slate-50/60 p-8 text-center"><div className="max-w-sm"><FolderOpen aria-hidden="true" className="mx-auto text-slate-400" size={30} /><h3 className="mt-4 text-lg font-bold text-slate-950">No learning materials yet</h3><p className="mt-2 text-sm leading-6 text-slate-600">Add documents, videos, links, or activities to support this lesson.</p><button className="ph-action mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" onClick={() => setAdding(true)} type="button"><Plus aria-hidden="true" size={18} /> Add Material</button></div></div>}
      {!loading && !loadError && materials.length > 0 && <ul className="mt-6 grid gap-4 lg:grid-cols-2">{materials.map((material) => <MaterialCard key={material.id} material={material} onEdit={() => beginEdit(material)} onRemove={() => setDeleteTarget(material)} />)}</ul>}

      <MaterialDialog error={error} file={file} fileInput={fileInput} form={form} lessonTitle={lessonTitle} onChange={updateForm} onClose={closeAdd} onFile={(selected) => selectFile(selected)} onSubmit={addMaterial} open={adding} saving={saving} title="Add Learning Material" />
      <MaterialDialog editing error={error} form={editing || initialForm} lessonTitle={lessonTitle} onChange={(key, value) => setEditing((current) => ({ ...current, [key]: value }))} onClose={() => !saving && setEditing(null)} onSubmit={saveEdit} open={Boolean(editing)} saving={saving} title="Edit Learning Material" />
      <ConfirmationDialog confirmLabel="Remove" destructive onClose={() => setDeleteTarget(null)} onConfirm={removeMaterial} open={Boolean(deleteTarget)} processing={saving} title="Remove learning material?">This resource will no longer be available to Students.</ConfirmationDialog>
    </section>
  );
}

function MaterialCard({ material, onEdit, onRemove }) {
  const meta = materialMeta[material.material_type] || materialMeta.document;
  const Icon = meta.Icon;
  const secondary = material.file_name || (material.external_url ? new URL(material.external_url).hostname : "");
  return <li className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-lg border ${meta.className}`}><Icon aria-hidden="true" size={20} /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{meta.label}</p><h3 className="mt-1 break-words font-bold text-slate-950">{material.title}</h3>{secondary && <p className="mt-1 truncate text-sm text-slate-600">{secondary}</p>}{material.description && <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{material.description}</p>}</div></div><div className="mt-4 flex justify-end gap-4 text-sm font-semibold"><button className="text-emerald-800 hover:underline" onClick={onEdit} type="button">Edit</button><button className="text-red-700 hover:underline" onClick={onRemove} type="button">Remove</button></div></li>;
}

function MaterialDialog({ editing = false, error, file, fileInput, form, lessonTitle, onChange, onClose, onFile, onSubmit, open, saving, title }) {
  const isDocument = form?.materialType === "document";
  return <Dialog description={`Add a resource to ${lessonTitle}.`} footer={<><button className="ph-action rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100" disabled={saving} onClick={onClose} type="button">Cancel</button><button className="ph-action rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" disabled={saving} form={editing ? "edit-material" : "add-material"} type="submit">{saving ? (editing ? "Saving…" : "Adding…") : (editing ? "Save Changes" : "Add Material")}</button></>} onClose={onClose} open={open} processing={saving} title={title}>
    <form className="grid gap-4" id={editing ? "edit-material" : "add-material"} onSubmit={onSubmit}>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {editing ? <p className="text-sm text-slate-600">Material type: <strong className="capitalize text-slate-800">{materialMeta[form.materialType]?.label}</strong></p> : <label className="text-sm font-semibold text-slate-800">Material Type<select className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" onChange={(event) => onChange("materialType", event.target.value)} value={form.materialType}><option value="document">Document</option><option value="video">Video</option><option value="external_link">External Link</option><option value="google_form">Google Form</option></select></label>}
      <label className="text-sm font-semibold text-slate-800">Title<input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" onChange={(event) => onChange("title", event.target.value)} required value={form?.title || ""} /></label>
      <label className="text-sm font-semibold text-slate-800">Description / Instructions <span className="font-normal text-slate-500">(optional)</span><textarea className="mt-1 min-h-24 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5" onChange={(event) => onChange("description", event.target.value)} rows="3" value={form?.description || ""} /></label>
      {!editing && isDocument && <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center"><Upload aria-hidden="true" className="mx-auto text-emerald-700" size={26} /><p className="mt-3 font-semibold text-slate-900">Upload Document</p><p className="mt-1 text-sm text-slate-600">Drag a file here or browse your device</p><p className="mt-2 text-xs text-slate-500">PDF, DOC, DOCX, PPT, PPTX · Max 10 MB</p><input accept={DOCUMENT_ACCEPT} className="sr-only" onChange={(event) => onFile(event.target.files?.[0])} ref={fileInput} type="file" /><button className="ph-action mt-4 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50" onClick={() => fileInput.current?.click()} type="button">Browse Files</button>{file && <p className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-700"><FileText aria-hidden="true" size={16} /> {file.name}</p>}</div>}
      {(!isDocument || editing) && form?.materialType !== "document" && <label className="text-sm font-semibold text-slate-800">{fieldLabel(form.materialType)}<input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" onChange={(event) => onChange("externalUrl", event.target.value)} placeholder="https://" required type="url" value={form?.externalUrl || ""} /></label>}
    </form>
  </Dialog>;
}
