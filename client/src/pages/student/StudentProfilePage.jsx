import { useEffect, useState } from "react";
import Loading from "../../components/common/Loading.jsx";
import StudentNav from "../../components/student/StudentNav.jsx";
import api from "../../services/api.js";

const fields = [
  ["Student Name", (profile) => [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(" ")],
  ["PHINMA Email", (profile) => profile.email],
  ["Student ID", (_profile, details) => details?.student_id],
  ["Campus", (_profile, details) => details?.campus],
  ["Program", (_profile, details) => details?.program],
  ["Year Level", (_profile, details) => details?.year_level],
  ["Section", (_profile, details) => details?.section],
];

export default function StudentProfilePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function loadProfile() {
    try {
      const response = await api.get("/student/profile");
      setData(response.data.data);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.status >= 500
          ? "We couldn't load your profile."
          : requestError.response?.data?.message ||
              "We couldn't load your profile.",
      );
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <StudentNav />
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Student workspace</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">My Profile</h1>
        {!data && !error && <div className="mt-8 rounded-2xl border bg-white p-8"><Loading label="Loading your profile..." /></div>}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p>{error}</p>
            <button className="mt-3 font-bold underline" onClick={loadProfile} type="button">
              Retry
            </button>
          </div>
        )}
        {data && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {fields.map(([label, getValue]) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                key={label}
              >
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 font-bold text-slate-950">
                  {getValue(data.profile, data.studentProfile) || "Not provided"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
