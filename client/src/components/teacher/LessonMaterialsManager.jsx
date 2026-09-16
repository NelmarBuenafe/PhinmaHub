import { ClipboardList, ExternalLink, FileText, FileVideo2, FolderOpen, Plus, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { DOCUMENT_ACCEPT, VIDEO_ACCEPT, validateLessonMaterialFile, validateLessonVideoFile } from "../../config/lessonMaterials.js";
import api from "../../services/api.js";
import { supabase } from "../../services/supabase.js";
import { ConfirmationDialog } from "../admin/AdminUI.jsx";
import Dialog from "../common/Dialog.jsx";
import FileDropZone from "../common/FileDropZone.jsx";
import Loading from "../common/Loading.jsx";
import { useToast } from "../../contexts/toastStore.js";
import { actionErrorMessage } from "../../utils/actionFeedback.js";

const initialForm = { materialType: "document", videoSource: "upload", title: "", description: "", externalUrl: "", sectionId: "", isRequired: true };

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

export default function LessonMaterialsManager({ lessonId, lessonTitle, materials = [], materialsLoading = false, onReloadMaterials, section }) {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInput = useRef(null);
  const toast = useToast();
  const sectionMaterials = materials.filter((material) => material.section_id === section.id);
  const error = actionError;

  function updateForm(key, value) {
    if (key === "materialType" || key === "videoSource") setFile(null);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectFile(selected) {
    if (!selected) return;
    const validationError = form.materialType === "video" ? validateLessonVideoFile(selected) : validateLessonMaterialFile(selected);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
    setFile(selected);
    setForm((current) => ({ ...current, title: current.title || selected.name }));
    setError("");
  }

  function removeSelectedFile() {
    setFile(null);
    setError("");
    if (fileInput.current) fileInput.current.value = "";
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
      let payload = { materialType: form.materialType, title: form.title, description: form.description, sectionId: section.id, isRequired: form.isRequired };
      const isUpload = form.materialType === "document" || (form.materialType === "video" && form.videoSource === "upload");
      if (isUpload) {
        if (!file) throw new Error(`Choose a ${form.materialType === "video" ? "video" : "document"} to upload.`);
        const mimeType = file.type || (form.materialType === "video" ? (file.name.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4") : "application/octet-stream");
        const uploadResponse = await api.post(`/teacher/lessons/${lessonId}/materials/upload-url`, { materialType: form.materialType, sectionId: section.id, fileName: file.name, mimeType, fileSize: file.size });
        const { storagePath, token } = uploadResponse.data.data;
        uploadedPath = storagePath;
        const { error: uploadError } = await supabase.storage.from("lesson-materials").uploadToSignedUrl(storagePath, token, file, { contentType: mimeType });
        if (uploadError) {
          const message = uploadError.message || "The file upload was rejected by storage.";
          throw Object.assign(new Error(message), { response: { status: uploadError.statusCode || 400, data: { message } } });
        }
        payload = { ...payload, storagePath, fileName: file.name, mimeType, fileSize: file.size };
      } else {
        payload = { ...payload, externalUrl: form.externalUrl };
      }
      await api.post(`/teacher/lessons/${lessonId}/materials`, payload);
      setForm({ ...initialForm, sectionId: section.id });
      setFile(null);
      setAdding(false);
      toast.success("Learning material added successfully.");
      await onReloadMaterials?.();
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
    setEditing({ id: material.id, materialType: material.material_type, videoSource: material.storage_path ? "upload" : "youtube", title: material.title, description: material.description || "", externalUrl: material.external_url || "", isRequired: material.is_required !== false });
    setError("");
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const payload = { title: editing.title, description: editing.description, isRequired: editing.isRequired };
      if (editing.materialType !== "document" && !(editing.materialType === "video" && editing.videoSource === "upload")) payload.externalUrl = editing.externalUrl;
      await api.patch(`/teacher/materials/${editing.id}`, payload);
      setEditing(null);
      toast.success("Learning material updated successfully.");
      await onReloadMaterials?.();
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
      await onReloadMaterials?.();
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
    setForm({ ...initialForm, sectionId: section.id });
    setFile(null);
    setError("");
  }

  return (
    <section className="mt-5 border-t border-slate-200 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-base font-bold text-slate-950">Materials</h2><p className="mt-1 text-sm text-slate-600">Materials in this section only.</p></div>
        <button className="ph-action inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" onClick={() => { setForm({ ...initialForm, sectionId: section.id }); setAdding(true); }} type="button"><Plus aria-hidden="true" size={18} /> Add Material</button>
      </div>
      {error && !adding && !editing && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {materialsLoading && <div className="mt-5"><Loading variant="courses" label="Loading materials..." /></div>}
      {!materialsLoading && sectionMaterials.length === 0 && <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-600"><FolderOpen aria-hidden="true" className="mr-2 inline text-slate-400" size={18} />No materials added yet.{section.is_required && <p className="mt-2 text-xs">Informational section — it does not affect lesson completion until it has a required material.</p>}</div>}
      {!materialsLoading && sectionMaterials.length > 0 && <ul className="mt-4 grid gap-3">{sectionMaterials.map((material) => <li key={material.id}><MaterialCard material={material} onEdit={() => beginEdit(material)} onRemove={() => setDeleteTarget(material)} />{material.material_type === "video" && <UploadedVideoPreview material={material} />}</li>)}</ul>}

      <MaterialDialog error={error} file={file} fileInput={fileInput} form={form} lessonTitle={lessonTitle} section={section} onChange={updateForm} onClose={closeAdd} onFile={selectFile} onRemoveFile={removeSelectedFile} onSubmit={addMaterial} open={adding} saving={saving} title="Add Learning Material" />
      <MaterialDialog editing error={error} form={editing || initialForm} lessonTitle={lessonTitle} section={section} onChange={(key, value) => setEditing((current) => ({ ...current, [key]: value }))} onClose={() => !saving && setEditing(null)} onSubmit={saveEdit} open={Boolean(editing)} saving={saving} title="Edit Learning Material" />
      <ConfirmationDialog confirmLabel="Remove" destructive onClose={() => setDeleteTarget(null)} onConfirm={removeMaterial} open={Boolean(deleteTarget)} processing={saving} title="Remove learning material?">This resource will no longer be available to Students.</ConfirmationDialog>
    </section>
  );
}

function UploadedVideoPreview({ material }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  async function preview() {
    try {
      const response = await api.get(`/teacher/materials/${material.id}/access`);
      setUrl(response.data.data.url);
    } catch (cause) {
      setError(cause.response?.data?.message || "Unable to preview this video.");
    }
  }
  if (!material.storage_path) return null;
  return <div className="mt-3"><button className="text-sm font-semibold text-emerald-800 hover:underline" onClick={preview} type="button">Preview uploaded video</button>{url && <video className="mt-3 aspect-video w-full rounded-lg bg-slate-950" controls controlsList="nodownload" src={url} />}{error && <p className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}

function MaterialCard({ material, onEdit, onRemove }) {
  const meta = materialMeta[material.material_type] || materialMeta.document;
  const Icon = meta.Icon;
  const secondary = material.file_name || (material.material_type === "video" && material.storage_path ? "Uploaded video" : material.external_url ? new URL(material.external_url).hostname : "");
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-lg border ${meta.className}`}><Icon aria-hidden="true" size={20} /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{meta.label}{material.is_required !== false ? " · Required" : " · Optional"}</p><h3 className="mt-1 break-words font-bold text-slate-950">{material.title}</h3>{secondary && <p className="mt-1 truncate text-sm text-slate-600">{secondary}</p>}{material.description && <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{material.description}</p>}</div></div><div className="mt-4 flex justify-end gap-4 text-sm font-semibold"><button className="text-emerald-800 hover:underline" onClick={onEdit} type="button">Edit</button><button className="text-red-700 hover:underline" onClick={onRemove} type="button">Remove</button></div></div>;
}

function MaterialDialog(props) {
  if (!props.open) return null;
  return <OpenMaterialDialog {...props} />;
}

function OpenMaterialDialog({ editing = false, error, file, fileInput, form, lessonTitle, onChange, onClose, onFile, onRemoveFile, onSubmit, open, saving, section, title }) {
  const isDocument = form?.materialType === "document";
  const isVideoUpload = form?.materialType === "video" && form?.videoSource === "upload";
  const fileUploadEnabled = !editing && (isDocument || isVideoUpload) && !saving;
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragDepth = useRef(0);

  function handleSelectedFile(selected) {
    if (selected) onFile(selected);
  }

  function isSupportedFileDrag(event) {
    const selected = event.dataTransfer.files?.[0];
    if (selected) return !(isVideoUpload ? validateLessonVideoFile(selected) : validateLessonMaterialFile(selected));
    return Array.from(event.dataTransfer.types || []).includes("Files");
  }

  function handleDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!fileUploadEnabled) return;
    dragDepth.current += 1;
    setIsDraggingFile(isSupportedFileDrag(event));
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!fileUploadEnabled) return;
    setIsDraggingFile(isSupportedFileDrag(event));
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!fileUploadEnabled) return;
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDraggingFile(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setIsDraggingFile(false);
    if (!fileUploadEnabled) return;

    const selected = event.dataTransfer.files?.[0];
    if (!selected) return;
    handleSelectedFile(selected);
  }

  const overlayActive = isDraggingFile;
  const modalOverlay = fileUploadEnabled && <div aria-hidden={!overlayActive} aria-live="polite" className={`pointer-events-none absolute inset-0 z-10 grid place-items-center bg-emerald-50/75 p-4 backdrop-blur-[2px] transition-opacity duration-200 motion-reduce:backdrop-blur-none motion-reduce:transition-none ${overlayActive ? "opacity-100" : "opacity-0"}`}>
    <div className={`w-full max-w-sm rounded-2xl border-2 border-dashed border-emerald-600 bg-white/80 px-6 py-8 text-center shadow-[0_18px_42px_-24px_rgb(5_150_105_/_0.75)] transition-[opacity,transform] duration-200 ease-[var(--ph-ease)] motion-reduce:transition-none ${overlayActive ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"}`}>
      <span className={`mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700 transition-transform duration-200 ease-[var(--ph-ease)] motion-reduce:transition-none ${isDraggingFile ? "-translate-y-1" : "translate-y-0"}`}>
        <Upload aria-hidden="true" size={29} />
      </span>
      <p className="mt-5 text-lg font-bold text-emerald-950">Drop file here</p>
      <p className="mt-2 text-sm text-emerald-900/80">Release to attach this {isVideoUpload ? "video" : "document"}</p>
    </div>
  </div>;

  return <Dialog contentOverlay={modalOverlay} description={`${lessonTitle} · ${section.title}`} footer={<><button className="ph-action rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100" disabled={saving} onClick={onClose} type="button">Cancel</button><button className="ph-action rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" disabled={saving} form={editing ? "edit-material" : "add-material"} type="submit">{saving ? (editing ? "Saving…" : "Adding…") : (editing ? "Save Changes" : "Add Material")}</button></>} onClose={onClose} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} open={open} processing={saving} title={title}>
    <form className="grid gap-4" id={editing ? "edit-material" : "add-material"} onSubmit={onSubmit}>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><span className="block">Lesson: <strong className="text-slate-800">{lessonTitle}</strong></span><span className="mt-1 block">Section: <strong className="text-slate-800">{section.title}</strong></span></p>
      {editing ? <p className="text-sm text-slate-600">Material type: <strong className="capitalize text-slate-800">{materialMeta[form.materialType]?.label}</strong></p> : <label className="text-sm font-semibold text-slate-800">Material Type<select className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" onChange={(event) => onChange("materialType", event.target.value)} value={form.materialType}><option value="document">Document</option><option value="video">Video</option><option value="external_link">External Link</option><option value="google_form">Google Form</option></select></label>}
      {!editing && form?.materialType === "video" && <fieldset><legend className="text-sm font-semibold text-slate-800">Video source</legend><div className="mt-2 flex gap-4 text-sm"><label><input checked={form.videoSource === "upload"} className="mr-2" name="video-source" onChange={() => onChange("videoSource", "upload")} type="radio" />Upload video</label><label><input checked={form.videoSource === "youtube"} className="mr-2" name="video-source" onChange={() => onChange("videoSource", "youtube")} type="radio" />YouTube URL</label></div></fieldset>}
      <label className="text-sm font-semibold text-slate-800">Title<input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" onChange={(event) => onChange("title", event.target.value)} required value={form?.title || ""} /></label>
      <label className="text-sm font-semibold text-slate-800">Description / Instructions <span className="font-normal text-slate-500">(optional)</span><textarea className="mt-1 min-h-24 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5" onChange={(event) => onChange("description", event.target.value)} rows="3" value={form?.description || ""} /></label>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-800"><input checked={form?.isRequired !== false} onChange={(event) => onChange("isRequired", event.target.checked)} type="checkbox" /> Required material</label>
      {!editing && fileUploadEnabled && <FileDropZone accept={isVideoUpload ? VIDEO_ACCEPT : DOCUMENT_ACCEPT} disabled={saving} file={file} inputRef={fileInput} label={isVideoUpload ? "Video" : "Document"} onFile={handleSelectedFile} onRemove={onRemoveFile} supportedText={isVideoUpload ? "MP4, WebM · Max 100 MB" : undefined} />}
      {((!isDocument && !isVideoUpload) || (editing && form?.materialType !== "document" && form?.videoSource !== "upload")) && <label className="text-sm font-semibold text-slate-800">{fieldLabel(form.materialType)}<input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" onChange={(event) => onChange("externalUrl", event.target.value)} placeholder="https://" required type="url" value={form?.externalUrl || ""} /></label>}
    </form>
  </Dialog>;
}
