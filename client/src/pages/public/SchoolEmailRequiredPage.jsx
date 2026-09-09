import { MailWarning } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../../components/common/AuthShell.jsx";
import { useAuth } from "../../contexts/authContext.js";

function SchoolEmailRequiredPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function returnToRoleSelection() {
    await signOut();
    navigate("/choose-role", { replace: true });
  }

  return (
    <AuthShell
      eyebrow="SCHOOL EMAIL REQUIRED"
      title="Use your assigned school email"
      description="PhinmaHub only accepts authorized PHINMA institutional accounts. Personal Google accounts cannot be used."
    >
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-950">
        <MailWarning aria-hidden="true" size={28} />
        <p className="mt-3 font-bold">
          Sign in again using the school email address assigned to you by
          PHINMA.
        </p>
        <p className="mt-2 text-sm leading-6">
          If your assigned school email is not accepted, contact your school
          administrator for assistance.
        </p>
      </div>
      <button
        className="mt-6 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800"
        onClick={returnToRoleSelection}
        type="button"
      >
        Try another account
      </button>
    </AuthShell>
  );
}

export default SchoolEmailRequiredPage;
