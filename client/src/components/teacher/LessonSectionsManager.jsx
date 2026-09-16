import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import api from "../../services/api.js";
import { useApiQuery } from "../../utils/useApiQuery.js";
import { actionErrorMessage } from "../../utils/actionFeedback.js";
import { useToast } from "../../contexts/toastStore.js";
import Dialog from "../common/Dialog.jsx";
import LessonMaterialsManager from "./LessonMaterialsManager.jsx";

const emptySection = { title: "", content: "", isRequired: true, isPublished: true };

export default function LessonSectionsManager({ lessonId, lessonTitle }) {
  const { data, loading, error, reload } = useApiQuery(`/teacher/lessons/${lessonId}/sections`, { errorMessage: "Unable to load lesson sections." });
  const materialsQuery = useApiQuery(`/teacher/lessons/${lessonId}/materials`, { errorMessage: "Unable to load lesson materials. Run the lesson-sections migration, then restart the API server." });
  const sections = data?.data || [];
  const materials = materialsQuery.data?.data || [];
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function save(event) {
    event.preventDefault();
    if (!editor) return;
    setBusy(true);
    try {
      if (editor.id) await api.put(`/teacher/sections/${editor.id}`, editor.values);
      else await api.post(`/teacher/lessons/${lessonId}/sections`, editor.values);
      toast.success(editor.id ? "Lesson section updated." : "Lesson section added.");
      setEditor(null);
      await reload();
    } catch (requestError) {
      toast.error(actionErrorMessage(requestError, "Unable to save lesson section."));
    } finally { setBusy(false); }
  }

  async function remove(section) {
    if (!window.confirm(`Remove “${section.title}”? Its attached materials will also be removed.`)) return;
    setBusy(true);
    try {
      await api.delete(`/teacher/sections/${section.id}`);
      toast.success("Lesson section removed.");
      await reload();
    } catch (requestError) {
      toast.error(actionErrorMessage(requestError, "Unable to remove lesson section."));
    } finally { setBusy(false); }
  }

  async function move(index, direction) {
    const reordered = [...sections];
    const next = index + direction;
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setBusy(true);
    try {
      await api.put(`/teacher/lessons/${lessonId}/sections/order`, { sectionIds: reordered.map((section) => section.id) });
      await reload();
    } catch (requestError) {
      toast.error(actionErrorMessage(requestError, "Unable to reorder lesson sections."));
    } finally { setBusy(false); }
  }

  return <section className="mt-6 border-t border-slate-200 pt-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-950">Lesson Sections</h2><p className="mt-1 text-sm text-slate-600">Structure lesson content into ordered sections. Materials can be assigned to each section below.</p></div><button className="ph-action inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" onClick={() => setEditor({ values: emptySection })} type="button"><Plus aria-hidden="true" size={18} /> Add Section</button></div>
    {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {materialsQuery.error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{materialsQuery.error} <button className="font-bold underline" onClick={materialsQuery.reload} type="button">Retry</button></p>}
    {loading && <p className="mt-4 text-sm text-slate-600">Loading sections…</p>}
    {!loading && <ol className="mt-5 space-y-3">{sections.map((section, index) => <li className="rounded-xl border border-slate-200 bg-slate-50/60 p-4" key={section.id}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Section {index + 1} · {section.is_required ? "Required" : "Optional"} · {section.is_published ? "Published" : "Draft"}</p><h3 className="mt-1 break-words font-bold text-slate-950">{section.title}</h3>{section.content && <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{section.content}</p>}</div><div className="flex items-center gap-2"><button aria-label={`Move ${section.title} up`} className="ph-action rounded-md p-2 text-slate-600 hover:bg-white disabled:opacity-40" disabled={busy || index === 0} onClick={() => move(index, -1)} type="button"><ChevronUp size={17} /></button><button aria-label={`Move ${section.title} down`} className="ph-action rounded-md p-2 text-slate-600 hover:bg-white disabled:opacity-40" disabled={busy || index === sections.length - 1} onClick={() => move(index, 1)} type="button"><ChevronDown size={17} /></button><button aria-label={`Edit ${section.title}`} className="ph-action rounded-md p-2 text-emerald-800 hover:bg-white" onClick={() => setEditor({ id: section.id, values: { title: section.title, content: section.content || "", isRequired: section.is_required, isPublished: section.is_published } })} type="button"><Pencil size={17} /></button><button aria-label={`Remove ${section.title}`} className="ph-action rounded-md p-2 text-red-700 hover:bg-white" disabled={busy} onClick={() => remove(section)} type="button"><Trash2 size={17} /></button></div></div><LessonMaterialsManager lessonId={lessonId} lessonTitle={lessonTitle} materials={materials} materialsLoading={materialsQuery.loading} onReloadMaterials={materialsQuery.reload} section={section} /></li>)}</ol>}
    <Dialog footer={<><button className="ph-action rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700" disabled={busy} onClick={() => setEditor(null)} type="button">Cancel</button><button className="ph-action rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white" disabled={busy} form="section-editor" type="submit">{busy ? "Saving…" : editor?.id ? "Save Section" : "Add Section"}</button></>} onClose={() => !busy && setEditor(null)} open={Boolean(editor)} processing={busy} title={editor?.id ? "Edit Lesson Section" : "Add Lesson Section"}><form className="grid gap-4" id="section-editor" onSubmit={save}><label className="text-sm font-semibold text-slate-800">Section Title<input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" onChange={(event) => setEditor((current) => ({ ...current, values: { ...current.values, title: event.target.value } }))} required value={editor?.values.title || ""} /></label><label className="text-sm font-semibold text-slate-800">Section Content<textarea className="mt-1 min-h-40 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5" onChange={(event) => setEditor((current) => ({ ...current, values: { ...current.values, content: event.target.value } }))} value={editor?.values.content || ""} /></label><label className="flex items-center gap-2 text-sm font-semibold text-slate-800"><input checked={editor?.values.isRequired || false} onChange={(event) => setEditor((current) => ({ ...current, values: { ...current.values, isRequired: event.target.checked } }))} type="checkbox" /> Required for lesson completion</label><label className="flex items-center gap-2 text-sm font-semibold text-slate-800"><input checked={editor?.values.isPublished || false} onChange={(event) => setEditor((current) => ({ ...current, values: { ...current.values, isPublished: event.target.checked } }))} type="checkbox" /> Publish section</label></form></Dialog>
  </section>;
}
