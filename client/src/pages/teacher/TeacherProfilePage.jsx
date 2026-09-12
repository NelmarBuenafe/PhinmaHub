import { useCallback, useState } from "react";
import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ProfileDetails from "../../components/common/ProfileDetails.jsx";
import TeacherNav from "../../components/teacher/TeacherNav.jsx";
import api from "../../services/api.js";
import { useDeferredLoad } from "../../utils/useDeferredLoad.js";

const sections = [
  {
    title: "Personal Information",
    fields: [
      ["Name", (profile) => [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(" ")],
      ["PHINMA Email", (profile) => profile.email],
    ],
  },
  {
    title: "Faculty Information",
    fields: [
      ["Employee ID", (_profile, details) => details?.employee_id],
      ["Campus", (_profile, details) => details?.campus],
      ["Department", (_profile, details) => details?.department],
      ["Position", (_profile, details) => details?.position],
    ],
  },
];

export default function TeacherProfilePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const response = await api.get("/teacher/profile");
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
  }, []);

  useDeferredLoad(loadProfile);

  return (
    <main className="min-h-screen bg-slate-50">
      <TeacherNav />
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <PageHeader
          description="Review the personal and faculty information associated with your account."
          eyebrow="Teacher workspace"
          title="My Profile"
        />
        {!data && !error && (
          <div className="mt-8 rounded-2xl border bg-white p-8">
            <Loading label="Loading your profile..." />
          </div>
        )}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p>{error}</p>
            <button className="mt-3 font-bold underline" onClick={loadProfile} type="button">
              Retry
            </button>
          </div>
        )}
        {data && (
          <ProfileDetails
            details={data.teacherProfile}
            profile={data.profile}
            sections={sections}
          />
        )}
      </section>
    </main>
  );
}
