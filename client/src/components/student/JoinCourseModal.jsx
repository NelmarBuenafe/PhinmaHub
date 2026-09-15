import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import Dialog from "../common/Dialog.jsx";
import api from "../../services/api.js";
import { actionErrorMessage } from "../../utils/actionFeedback.js";

function joinErrorMessage(error) {
  const code = error?.response?.data?.code;
  if (code === "INVALID_JOIN_CODE") {
    return "Course code not found. Check the code and try again.";
  }
  if (code === "ALREADY_ENROLLED") {
    return "You're already enrolled in this course.";
  }
  if (code === "COURSE_NOT_OPEN") {
    return "This course is not currently available for enrollment.";
  }
  return actionErrorMessage(
    error,
    "We couldn't join that course. Check the code and try again.",
  );
}

export default function JoinCourseModal({ onClose, onJoined, open }) {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const normalizedCode = joinCode.trim().toUpperCase();

  function resetForm() {
    setJoinCode("");
    setError("");
    setBusy(false);
  }

  function closeModal() {
    if (busy) return;
    resetForm();
    onClose();
  }

  async function submit(event) {
    event.preventDefault();
    if (!normalizedCode || busy) return;

    setBusy(true);
    setError("");
    try {
      await api.post("/student/courses/join", { joinCode: normalizedCode });
      resetForm();
      onClose();
      onJoined();
    } catch (requestError) {
      setError(joinErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      description="Enter the course code provided by your teacher."
      footer={
        <>
          <button
            className="ph-action rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            onClick={closeModal}
            type="button"
          >
            Cancel
          </button>
          <button
            className="ph-action inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!normalizedCode || busy}
            form="join-course-form"
            type="submit"
          >
            {busy && <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />}
            {busy ? "Joining..." : "Join Course"}
          </button>
        </>
      }
      onClose={closeModal}
      open={open}
      processing={busy}
      size="compact"
      title="Join a Course"
    >
      <form id="join-course-form" noValidate onSubmit={submit}>
        <label className="block text-sm font-bold text-slate-900" htmlFor="join-course-code">
          Course Code
        </label>
        <input
          aria-describedby={error ? "join-course-code-error" : "join-course-code-help"}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 font-mono text-base uppercase tracking-[0.12em] outline-none transition focus:ring-2 ${error ? "border-red-500 focus:border-red-600 focus:ring-red-100" : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-100"}`}
          data-dialog-autofocus
          disabled={busy}
          id="join-course-code"
          maxLength={32}
          onChange={(event) => {
            setJoinCode(event.target.value.toUpperCase());
            if (error) setError("");
          }}
          placeholder="Enter course code"
          value={joinCode}
        />
        <p className="mt-2 text-xs leading-5 text-slate-500" id="join-course-code-help">
          Course codes are provided by your teacher.
        </p>
        {error && (
          <p className="mt-3 text-sm font-medium text-red-700" id="join-course-code-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}
