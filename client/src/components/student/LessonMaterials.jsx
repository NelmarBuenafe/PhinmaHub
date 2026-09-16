import { ExternalLink, FileQuestion, FileText, Film, Play } from "lucide-react";
import { useState } from "react";
import api from "../../services/api.js";
import { extractYouTubeVideoId } from "../../utils/youtube.js";
import YouTubeMaterialPlayer from "./YouTubeMaterialPlayer.jsx";
import UploadedVideoMaterialPlayer from "./UploadedVideoMaterialPlayer.jsx";

function openExternal(url) {
  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (openedWindow) openedWindow.opener = null;
}

function MaterialCard({ children, tone = "document" }) {
  return <article className={`ph-material-card ph-material-${tone} min-w-0 rounded-xl border bg-white p-4`}>{children}</article>;
}

function MaterialHeading({ Icon, title, type, completion }) {
  return (
    <div className="flex items-start gap-3">
      <span className="ph-material-icon grid size-9 shrink-0 place-items-center rounded-lg"><Icon aria-hidden="true" size={19} /></span>
      <div className="min-w-0 break-words">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{completion?.isCompleted ? "✓ Completed · " : "○ Not completed · "}{type}</p>
        <h4 className="mt-1 font-bold leading-5 text-slate-950">{title}</h4>
      </div>
    </div>
  );
}

function ResourceDomain({ url }) {
  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch {
    return null;
  }
  return <p className="mt-3 break-all text-xs font-semibold text-slate-500">{domain}</p>;
}

function VideoMaterial({ material, onCompleted, onError }) {
  const [expanded, setExpanded] = useState(false);
  const [completed, setCompleted] = useState(material.completion?.isCompleted === true);
  const isUploaded = material.source_type === "upload";
  const videoId = extractYouTubeVideoId(material.external_url);
  const completion = { ...material.completion, isCompleted: completed };
  if (!isUploaded && !videoId) return <MaterialCard tone="video"><MaterialHeading Icon={Film} title={material.title} type="Video" completion={completion} /><p className="mt-3 text-sm text-red-700">This video has an unsupported YouTube URL. Please contact your teacher.</p></MaterialCard>;
  return <MaterialCard tone="video"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><button aria-expanded={expanded} aria-label={`${expanded ? "Collapse" : "Play"} ${material.title}`} className="ph-video-thumbnail group relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:w-[200px]" onClick={() => setExpanded((value) => !value)} type="button">{isUploaded ? <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-slate-900"><span className="grid size-11 place-items-center rounded-full bg-emerald-700 text-white shadow-md"><Play fill="currentColor" size={18} /></span></span> : <><img alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" loading="lazy" src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} /><span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-slate-950/10"><span className="grid size-11 place-items-center rounded-full bg-red-600 text-white shadow-md"><Play fill="currentColor" size={18} /></span></span></>}</button><div className="min-w-0 flex-1"><MaterialHeading Icon={Film} title={material.title} type={isUploaded ? "Uploaded video" : "Video"} completion={completion} />{material.file_name && <p className="mt-2 text-sm text-slate-600">{material.file_name}</p>}{material.description && <p className="mt-3 text-sm leading-6 text-slate-600">{material.description}</p>}</div><button className="ph-action inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-800" onClick={() => setExpanded((value) => !value)} type="button">{expanded ? "Collapse Video" : "Play Video"}</button></div>{expanded && (isUploaded ? <UploadedVideoMaterialPlayer material={{ ...material, completion }} onCompleted={() => { setCompleted(true); onCompleted?.(); }} onError={onError} /> : <YouTubeMaterialPlayer material={{ ...material, completion, videoId }} onCompleted={() => { setCompleted(true); onCompleted?.(); }} onError={onError} />)}</MaterialCard>;
}

export default function LessonMaterials({ heading = "Supplementary Learning Materials", materials, onError, onVideoCompleted }) {
  const documents = materials.filter((item) => item.material_type === "document");
  const videos = materials.filter((item) => item.material_type === "video");
  const links = materials.filter((item) => item.material_type === "external_link");
  const forms = materials.filter((item) => item.material_type === "google_form");

  async function openDocument(material) {
    try {
      const response = await api.get(`/student/materials/${material.id}/access`);
      openExternal(response.data.data.url);
    } catch (requestError) {
      onError(requestError.response?.data?.message || "This document could not be opened right now.");
    }
  }

  if (!materials.length) return <p className="mt-8 rounded-lg bg-slate-50 p-4 text-slate-600">This lesson does not have learning materials yet.</p>;

  return (
    <section className="mt-10 border-t border-slate-200 pt-7" aria-labelledby="supplementary-materials-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-950" id="supplementary-materials-heading">{heading}</h2>
          <p className="mt-1 text-sm text-slate-500">{materials.length} {materials.length === 1 ? "attachment" : "attachments"}</p>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {documents.map((material) => {
            const isPdf = material.mime_type === "application/pdf";
            return <MaterialCard key={material.id} tone={isPdf ? "pdf" : "document"}>
              <MaterialHeading Icon={FileText} title={material.title} type={isPdf ? "PDF document" : "Document"} completion={material.completion} />
              {material.file_name && <p className="mt-3 break-words text-sm text-slate-600">{material.file_name}</p>}
              {material.description && <p className="mt-2 text-sm leading-6 text-slate-600">{material.description}</p>}
              <button className="ph-action mt-4 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50" onClick={() => openDocument(material)} type="button">{isPdf ? "View PDF" : "Open document"}</button>
            </MaterialCard>;
          })}
        </div>
      )}

      {videos.length > 0 && <div className="mt-5 space-y-4">
        {videos.map((material) => <VideoMaterial key={material.id} material={material} onCompleted={onVideoCompleted} onError={onError} />)}
      </div>}

      {links.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {links.map((material) => <MaterialCard key={material.id} tone="external">
          <MaterialHeading Icon={ExternalLink} title={material.title} type="External resource" completion={material.completion} />
          {material.description && <p className="mt-3 text-sm leading-6 text-slate-600">{material.description}</p>}
          <ResourceDomain url={material.external_url} />
          <button className="ph-action mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50" onClick={() => openExternal(material.external_url)} type="button">Open resource <ExternalLink aria-hidden="true" size={15} /></button>
        </MaterialCard>)}
      </div>}

      {forms.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {forms.map((material) => <MaterialCard key={material.id} tone="form">
          <MaterialHeading Icon={FileQuestion} title={material.title} type="Google Form" completion={material.completion} />
          {material.description && <p className="mt-3 text-sm leading-6 text-slate-600">{material.description}</p>}
          <button className="ph-action mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50" onClick={() => openExternal(material.external_url)} type="button">Open Form <ExternalLink aria-hidden="true" size={15} /></button>
        </MaterialCard>)}
      </div>}
    </section>
  );
}
