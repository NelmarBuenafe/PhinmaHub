import { Camera, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Dialog from "./Dialog.jsx";
import { useAuth } from "../../contexts/authContext.js";
import { useToast } from "../../contexts/toastStore.js";
import api from "../../services/api.js";
import { supabase } from "../../services/supabase.js";

const MAX_PROFILE_AVATAR_BYTES = 2 * 1024 * 1024;
const acceptedImageTypes = new Map([
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
]);

function fullName(profile = {}) {
  return [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ");
}

function initialsFor(profile = {}) {
  const initials = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .map((part) => part.trim().charAt(0))
    .join("")
    .toUpperCase();

  return initials || "PH";
}

function displayValue(value) {
  return typeof value === "string" ? value.trim() : value;
}

function validateImage(file) {
  const extension = file?.name?.split(".").pop()?.toLowerCase();
  if (!file || acceptedImageTypes.get(extension) !== file.type) {
    return "Please upload a JPEG, PNG, or WEBP image.";
  }
  if (file.size > MAX_PROFILE_AVATAR_BYTES) {
    return "Profile photo must be smaller than 2 MB.";
  }
  return "";
}

function Avatar({ avatarUrl, displayName, initials }) {
  if (avatarUrl) {
    return <img alt={`${displayName} profile photo`} className="size-full rounded-full object-cover" src={avatarUrl} />;
  }
  return <span aria-hidden="true" className="grid size-full place-items-center rounded-full bg-emerald-600 text-3xl font-black tracking-tight text-white">{initials}</span>;
}

export default function ProfileDetails({ details, profile = {}, role = "Member", sections = [] }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const { updateProfile } = useAuth();
  const toast = useToast();
  const name = fullName(profile);
  const displayName = name || "Name not provided";
  const initials = initialsFor(profile);
  const displayAvatar = imageFailed ? "" : avatarUrl;

  const selectedPreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  useEffect(() => () => {
    if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
  }, [selectedPreviewUrl]);

  function closePhotoDialog() {
    if (processing) return;
    setPhotoDialogOpen(false);
    setFile(null);
    setError("");
  }

  function chooseFile(candidate) {
    if (processing) return;
    const validationError = validateImage(candidate);
    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }
    setError("");
    setFile(candidate);
  }

  async function uploadPhoto() {
    if (!file) {
      setError("Choose an image before uploading.");
      return;
    }
    setProcessing(true);
    setError("");
    let storagePath = "";
    try {
      const prepared = await api.post("/auth/avatar/upload-url", {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });
      storagePath = prepared.data.data.storagePath;
      const { error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .uploadToSignedUrl(storagePath, prepared.data.data.token, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const saved = await api.post("/auth/avatar", { storagePath });
      const updatedProfile = saved.data.data.profile;
      setAvatarUrl(updatedProfile.avatar_url || "");
      setImageFailed(false);
      updateProfile(updatedProfile);
      setPhotoDialogOpen(false);
      setFile(null);
      toast.success("Profile photo updated successfully.");
    } catch (cause) {
      if (storagePath) api.delete("/auth/avatar/upload", { data: { storagePath } }).catch(() => undefined);
      setError(cause.response?.data?.message || "Unable to update profile photo. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  async function removePhoto() {
    setProcessing(true);
    try {
      const response = await api.delete("/auth/avatar");
      const updatedProfile = response.data.data.profile;
      setAvatarUrl("");
      setImageFailed(false);
      updateProfile(updatedProfile);
      setRemoveDialogOpen(false);
      toast.success("Profile photo removed.");
    } catch {
      toast.error("Unable to remove profile photo. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <div className="mx-auto mt-6 w-full max-w-[880px]">
        <section className="ph-card-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-950 px-5 pb-12 pt-10 text-center sm:px-8">
            <button
              aria-label="Change profile photo"
              className="ph-action group relative mx-auto block size-28 rounded-full border-4 border-emerald-400 shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:size-30"
              onClick={() => setPhotoDialogOpen(true)}
              type="button"
            >
              {displayAvatar ? <img alt={`${displayName} profile photo`} className="size-full rounded-full object-cover" onError={() => setImageFailed(true)} src={displayAvatar} /> : <Avatar displayName={displayName} initials={initials} />}
              <span aria-hidden="true" className="absolute inset-0 grid place-items-center rounded-full bg-slate-950/60 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><Camera size={24} /></span>
            </button>
            <h2 className="mt-5 break-words text-2xl font-black tracking-tight text-white sm:text-3xl">{displayName}</h2>
            <p className="mt-2 break-all text-sm text-sky-200">{displayValue(profile.email) || "Email not provided"}</p>
            <span className="mt-4 inline-flex rounded-full bg-emerald-600 px-3 py-1 text-sm font-bold text-white">{role}</span>
          </div>

          <div className="relative z-10 -mt-6 px-4 pb-5 sm:px-7 sm:pb-7">
            <div className="space-y-4 rounded-2xl bg-white p-5 shadow-md ring-1 ring-slate-200 sm:p-6">
              {sections.map((section, index) => (
                <section className="ph-card-enter" key={section.title} style={{ "--ph-delay": `${120 + index * 60}ms` }}>
                  <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-700">{section.title}</h3>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {section.fields.map(([label, getValue]) => {
                      const value = displayValue(getValue(profile, details));
                      return <div className="min-w-0 rounded-xl bg-slate-50 px-4 py-3" key={label}><dt className="text-sm font-semibold text-slate-600">{label}</dt><dd className="mt-1 break-words font-semibold text-slate-950">{value || "Not provided"}</dd></div>;
                    })}
                  </dl>
                </section>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Dialog
        description={`Upload a new photo for ${displayName}.`}
        footer={<><button className="ph-action rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={processing} onClick={closePhotoDialog} type="button">Cancel</button><button className="ph-action inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={processing || !file} onClick={uploadPhoto} type="button">{processing && <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />}{processing ? "Uploading..." : "Upload Photo"}</button></>}
        onClose={closePhotoDialog}
        open={photoDialogOpen}
        processing={processing}
        title="Change Profile Photo"
        wide={false}
      >
        <div className="flex justify-center"><div className="size-24 overflow-hidden rounded-full border border-slate-200 bg-slate-100">{selectedPreviewUrl ? <img alt="Selected profile photo preview" className="size-full object-cover" src={selectedPreviewUrl} /> : <Avatar avatarUrl={displayAvatar} displayName={displayName} initials={initials} />}</div></div>
        <div className="mt-5"><label className="block text-sm font-bold text-slate-950" htmlFor="profile-photo-input">Profile photo</label><div className="mt-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files?.[0]); }}><UploadCloud aria-hidden="true" className="mx-auto text-emerald-700" size={25} /><p className="mt-2 text-sm font-bold text-slate-900">Drag an image here or browse your device</p><p className="mt-1 text-xs text-slate-500">JPEG, PNG, or WEBP · Maximum 2 MB</p><label className="ph-action mt-4 inline-flex cursor-pointer rounded-lg border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50">Browse Files<input accept=".jpg,.jpeg,.png,.webp" className="sr-only" disabled={processing} id="profile-photo-input" onChange={(event) => { chooseFile(event.target.files?.[0]); event.target.value = ""; }} type="file" /></label></div>{file && <p className="mt-2 break-all text-sm font-semibold text-slate-700">Selected: {file.name}</p>}{error && <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}</div>
        {avatarUrl && <button className="ph-action mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800" disabled={processing} onClick={() => { setPhotoDialogOpen(false); setRemoveDialogOpen(true); }} type="button"><Trash2 aria-hidden="true" size={16} /> Remove Photo</button>}
      </Dialog>

      <Dialog
        description="Your profile will return to its initials avatar."
        footer={<><button className="ph-action rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={processing} onClick={() => setRemoveDialogOpen(false)} type="button">Cancel</button><button className="ph-action inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={processing} onClick={removePhoto} type="button">{processing && <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />}{processing ? "Removing..." : "Remove Photo"}</button></>}
        onClose={() => !processing && setRemoveDialogOpen(false)}
        open={removeDialogOpen}
        processing={processing}
        title="Remove profile photo?"
        wide={false}
      >
        <p className="text-sm leading-6 text-slate-600">This removes your current profile photo from PhinmaHub.</p>
      </Dialog>
    </>
  );
}
