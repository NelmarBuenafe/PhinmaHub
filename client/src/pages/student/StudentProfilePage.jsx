import Loading from "../../components/common/Loading.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ProfileDetails from "../../components/common/ProfileDetails.jsx";
import { useApiQuery } from "../../utils/useApiQuery.js";

const sections = [
  {
    title: "Personal Information",
    fields: [
      ["Student Name", (profile) => [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(" ")],
      ["PHINMA Email", (profile) => profile.email],
    ],
  },
  {
    title: "Academic Information",
    fields: [
      ["Student ID", (_profile, details) => details?.student_id],
      ["Campus", (_profile, details) => details?.campus],
      ["Program", (_profile, details) => details?.program],
      ["Year Level", (_profile, details) => details?.year_level],
      ["Section", (_profile, details) => details?.section],
    ],
  },
];

export default function StudentProfilePage() {
  const { data: response, error, reload: loadProfile } = useApiQuery("/student/profile", { errorMessage: "We couldn't load your profile." });
  const data = response?.data;

  return (
    <div className="min-w-0">

      <section className="ph-role-page max-w-[1100px]">
        <PageHeader
          description="Review the personal and academic information associated with your account."
          eyebrow="Student workspace"
          title="My Profile"
        />
        {!data && !error && <div className="mt-6 rounded-2xl border bg-white p-8"><Loading variant="profile" label="Loading your profile..." /></div>}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p>{error}</p>
            <button className="mt-3 font-bold underline" onClick={loadProfile} type="button">
              Retry
            </button>
          </div>
        )}
        {data && (
          <ProfileDetails
            details={data.studentProfile}
            profile={data.profile}
            sections={sections}
          />
        )}
      </section>
    </div>
  );
}
