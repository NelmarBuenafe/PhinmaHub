import { ExternalLink, FileText, Film, FileQuestion } from "lucide-react";
import api from "../../services/api.js";

function youtubeEmbedUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const videoId = host === "youtu.be"
      ? url.pathname.slice(1)
      : url.searchParams.get("v");
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

function openExternal(url) {
  const tab = window.open(url, "_blank", "noopener,noreferrer");
  if (tab) tab.opener = null;
}

export default function LessonMaterials({ materials, onError }) {
  const documents = materials.filter((item) => item.material_type === "document");
  const videos = materials.filter((item) => item.material_type === "video");
  const links = materials.filter((item) => item.material_type === "external_link");
  const forms = materials.filter((item) => item.material_type === "google_form");

  async function openDocument(material) {
    try {
      const response = await api.get(`/student/materials/${material.id}/access`);
      openExternal(response.data.data.url);
    } catch (requestError) {
      onError(
        requestError.response?.data?.message ||
          "This document could not be opened right now.",
      );
    }
  }

  if (!materials.length) {
    return (
      <p className="mt-7 rounded-xl bg-slate-50 p-4 text-slate-600">
        This lesson does not have learning materials yet.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {documents.length > 0 && (
        <section>
          <h3 className="text-lg font-black text-slate-950">Learning Materials</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {documents.map((material) => (
              <article className="rounded-xl border border-slate-200 p-4" key={material.id}>
                <FileText aria-hidden="true" className="text-emerald-700" size={23} />
                <h4 className="mt-3 font-bold text-slate-950">{material.title}</h4>
                <p className="mt-1 text-sm text-slate-600">
                  {material.file_name} · {material.mime_type === "application/pdf" ? "PDF Document" : "Document"}
                </p>
                {material.description && <p className="mt-2 text-sm text-slate-600">{material.description}</p>}
                <button className="mt-4 text-sm font-bold text-emerald-800 hover:underline" onClick={() => openDocument(material)} type="button">
                  {material.mime_type === "application/pdf" ? "View PDF" : "Open / Download"}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section>
          <h3 className="text-lg font-black text-slate-950">Videos</h3>
          <div className="mt-3 space-y-4">
            {videos.map((material) => {
              const embedUrl = youtubeEmbedUrl(material.external_url);
              return (
                <article className="rounded-xl border border-slate-200 p-4" key={material.id}>
                  <div className="flex items-center gap-2"><Film aria-hidden="true" className="text-emerald-700" size={21} /><h4 className="font-bold text-slate-950">{material.title}</h4></div>
                  {material.description && <p className="mt-2 text-sm text-slate-600">{material.description}</p>}
                  {embedUrl && <iframe allowFullScreen className="mt-4 aspect-video w-full rounded-lg" src={embedUrl} title={material.title} />}
                  <button className="mt-4 text-sm font-bold text-emerald-800 hover:underline" onClick={() => openExternal(material.external_url)} type="button">Watch Video</button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {links.length > 0 && (
        <section>
          <h3 className="text-lg font-black text-slate-950">External Resources</h3>
          <div className="mt-3 space-y-3">
            {links.map((material) => <article className="rounded-xl border border-slate-200 p-4" key={material.id}><h4 className="font-bold text-slate-950">{material.title}</h4>{material.description && <p className="mt-2 text-sm text-slate-600">{material.description}</p>}<button className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-emerald-800 hover:underline" onClick={() => openExternal(material.external_url)} type="button">Open Resource <ExternalLink aria-hidden="true" size={15} /></button></article>)}
          </div>
        </section>
      )}

      {forms.length > 0 && (
        <section>
          <h3 className="text-lg font-black text-slate-950">Lesson Activity</h3>
          <div className="mt-3 space-y-3">
            {forms.map((material) => <article className="rounded-xl border border-slate-200 p-4" key={material.id}><div className="flex items-center gap-2"><FileQuestion aria-hidden="true" className="text-emerald-700" size={21} /><h4 className="font-bold text-slate-950">{material.title}</h4></div><p className="mt-2 text-sm text-slate-600">{material.description || "Complete this activity after studying the lesson."}</p><button className="mt-3 text-sm font-bold text-emerald-800 hover:underline" onClick={() => openExternal(material.external_url)} type="button">Open Google Form</button></article>)}
          </div>
        </section>
      )}
    </div>
  );
}
