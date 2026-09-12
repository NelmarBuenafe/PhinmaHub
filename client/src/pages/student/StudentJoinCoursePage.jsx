import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StudentNav from "../../components/student/StudentNav.jsx";
import api from "../../services/api.js";

export default function StudentJoinCoursePage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const normalizedCode = joinCode.trim();
    if (!normalizedCode) {
      setError("Please enter a course join code.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await api.post("/student/courses/join", { joinCode: normalizedCode });
      navigate("/student/courses", {
        replace: true,
        state: { success: "Course joined successfully." },
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't join that course. Check the code and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <StudentNav />
      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:underline"
          to="/student/courses"
        >
          <ArrowLeft aria-hidden="true" size={16} /> Back to My Courses
        </Link>
        <div className="ph-page-enter ph-surface-soft relative mt-8 overflow-hidden rounded-3xl p-6 sm:p-8">
          <div aria-hidden="true" className="absolute -right-10 -top-12 size-36 rounded-full border-[22px] border-emerald-100/70" />
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 text-emerald-700" size={24} />
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                Student workspace
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">
                Join a Course
              </h1>
              <p className="mt-2 text-slate-600">
                Enter the join code provided by your Teacher.
              </p>
            </div>
          </div>

          <form className="mt-8" onSubmit={submit}>
            <label className="block text-sm font-bold text-slate-900" htmlFor="join-code">
              Course join code
            </label>
            <input
              aria-describedby={error ? "join-code-error" : undefined}
              aria-invalid={Boolean(error)}
              autoComplete="off"
              className="relative mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3
                uppercase tracking-wider outline-none focus:border-emerald-600
                focus:ring-2 focus:ring-emerald-100"
              id="join-code"
              maxLength={32}
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder="Example: IT101ABC"
              required
              value={joinCode}
            />
            {error && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" id="join-code-error" role="alert">
                {error}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="ph-action rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
                type="submit"
              >
                {busy ? "Joining..." : "Join Course"}
              </button>
              <Link
                className="ph-action rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
                to="/student/courses"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
