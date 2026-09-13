import { ExternalLink, FileQuestion, FileText, Film } from "lucide-react";
import api from "../../services/api.js";

function youtubeEmbedUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const videoId =
      host === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v");
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

function openExternal(url) {
  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (openedWindow) openedWindow.opener = null;
}

function MaterialCard({ children }) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
      {children}
    </article>
  );
}

function MaterialHeading({ Icon, title, type }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon aria-hidden="true" size={19} />
      </span>
      <div className="min-w-0 break-words">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {type}
        </p>
        <h4 className="mt-0.5 font-bold text-slate-950">{title}</h4>
      </div>
    </div>
  );
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
    <div className="mt-10 space-y-7 border-t border-slate-100 pt-7">
      {documents.length > 0 && (
        <section aria-labelledby="document-materials-heading">
          <h3 className="text-lg font-black text-slate-950" id="document-materials-heading">
            Documents
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {documents.map((material) => {
              const isPdf = material.mime_type === "application/pdf";
              return (
                <MaterialCard key={material.id}>
                  <MaterialHeading
                    Icon={FileText}
                    title={material.title}
                    type={isPdf ? "PDF document" : "Document"}
                  />
                  <p className="mt-3 break-words text-sm text-slate-600">
                    {material.file_name}
                  </p>
                  {material.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {material.description}
                    </p>
                  )}
                  <button
                    className="ph-action mt-4 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                    onClick={() => openDocument(material)}
                    type="button"
                  >
                    {isPdf ? "View PDF" : "Open document"}
                  </button>
                </MaterialCard>
              );
            })}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section aria-labelledby="video-materials-heading">
          <h3 className="text-lg font-black text-slate-950" id="video-materials-heading">
            Videos
          </h3>
          <div className="mt-3 space-y-4">
            {videos.map((material) => {
              const embedUrl = youtubeEmbedUrl(material.external_url);
              return (
                <MaterialCard key={material.id}>
                  <MaterialHeading Icon={Film} title={material.title} type="Video" />
                  {material.description && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {material.description}
                    </p>
                  )}
                  {embedUrl && (
                    <iframe
                      allowFullScreen
                      className="mt-4 aspect-video w-full rounded-lg"
                      loading="lazy"
                      src={embedUrl}
                      title={material.title}
                    />
                  )}
                  <button
                    className="ph-action mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                    onClick={() => openExternal(material.external_url)}
                    type="button"
                  >
                    Watch video <ExternalLink aria-hidden="true" size={15} />
                  </button>
                </MaterialCard>
              );
            })}
          </div>
        </section>
      )}

      {links.length > 0 && (
        <section aria-labelledby="external-materials-heading">
          <h3 className="text-lg font-black text-slate-950" id="external-materials-heading">
            External Resources
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {links.map((material) => (
              <MaterialCard key={material.id}>
                <MaterialHeading
                  Icon={ExternalLink}
                  title={material.title}
                  type="External resource"
                />
                {material.description && (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {material.description}
                  </p>
                )}
                <button
                  className="ph-action mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                  onClick={() => openExternal(material.external_url)}
                  type="button"
                >
                  Open resource <ExternalLink aria-hidden="true" size={15} />
                </button>
              </MaterialCard>
            ))}
          </div>
        </section>
      )}

      {forms.length > 0 && (
        <section aria-labelledby="activity-materials-heading">
          <h3 className="text-lg font-black text-slate-950" id="activity-materials-heading">
            Lesson Activity
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {forms.map((material) => (
              <MaterialCard key={material.id}>
                <MaterialHeading
                  Icon={FileQuestion}
                  title={material.title}
                  type="Google Form"
                />
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {material.description ||
                    "Complete this activity after studying the lesson."}
                </p>
                <button
                  className="ph-action mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                  onClick={() => openExternal(material.external_url)}
                  type="button"
                >
                  Open Google Form <ExternalLink aria-hidden="true" size={15} />
                </button>
              </MaterialCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
