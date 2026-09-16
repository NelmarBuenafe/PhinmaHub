import { FileText, Upload } from "lucide-react";

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDropZone({ accept, disabled = false, file, inputRef, label = "Document", onFile, onRemove, supportedText = "PDF, DOC, DOCX, PPT, PPTX · Max 10 MB" }) {
  function openFilePicker() {
    if (!disabled) inputRef.current?.click();
  }

  function handleKeyDown(event) {
    if (event.currentTarget !== event.target || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openFilePicker();
  }

  if (file) {
    return <div className="animate-[ph-fade-up_200ms_var(--ph-ease)_both] flex min-w-0 flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 motion-reduce:animate-none sm:flex-row sm:items-center sm:justify-between" key="selected-file">
      <div className="flex min-w-0 items-center gap-3 text-left">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-emerald-700"><FileText aria-hidden="true" size={21} /></span>
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-slate-900">{file.name}</p>
          <p className="mt-0.5 text-xs text-slate-600">{formatFileSize(file.size)}</p>
        </div>
      </div>
      <button className="ph-action shrink-0 self-start rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 sm:self-auto" disabled={disabled} onClick={onRemove} type="button">Remove</button>
    </div>;
  }

  return <div
    aria-label={`Browse for a ${label.toLowerCase()} to upload`}
    className="animate-[ph-fade-up_200ms_var(--ph-ease)_both] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:animate-none motion-reduce:transition-none"
    onClick={openFilePicker}
    onKeyDown={handleKeyDown}
    role="button"
    tabIndex={disabled ? -1 : 0}
    key="empty-drop-zone"
  >
    <Upload aria-hidden="true" className="mx-auto text-emerald-700" size={26} />
    <p className="mt-3 font-semibold text-slate-900">Upload {label}</p>
    <p className="mt-1 text-sm text-slate-600">Drag a file anywhere in this modal or browse your device</p>
    <p className="mt-2 text-xs text-slate-500">{supportedText}</p>
    <input accept={accept} className="sr-only" disabled={disabled} onChange={(event) => { onFile(event.target.files?.[0]); event.target.value = ""; }} onClick={(event) => event.stopPropagation()} ref={inputRef} type="file" />
    <span className="ph-action mt-4 inline-flex min-h-10 items-center rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800">Browse Files</span>
  </div>;
}
