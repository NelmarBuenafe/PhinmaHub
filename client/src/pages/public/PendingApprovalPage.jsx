import AuthShell from "../../components/common/AuthShell.jsx";
import { useAuth } from "../../contexts/authContext.js";
import { useLocation, useNavigate } from "react-router-dom";

function PendingApprovalPage() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const email = profile?.email || location.state?.email;
  const requestedRole =
    profile?.requested_role || location.state?.requestedRole;

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <AuthShell
      eyebrow="VERIFY YOUR SCHOOL EMAIL"
      title="Check your inbox"
      description={
        location.state?.verificationRequired
          ? "Open the verification link sent to your assigned school email. Your account activates after verification."
          : "Your school email still needs to be verified before your account can activate."
      }
    >
      {email && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {location.state?.verificationRequired
            ? "Email awaiting verification"
            : "Verified email"}
          : <strong>{email}</strong>
        </div>
      )}
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
        Requested role:{" "}
        <strong className="capitalize">
          {requestedRole || "Not submitted yet"}
        </strong>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        You do not need administrator approval. If the message does not arrive,
        check your spam folder or contact your school administrator.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => navigate("/")}
          type="button"
        >
          Return to Home
        </button>
        <button
          className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800"
          onClick={handleSignOut}
          type="button"
        >
          Sign Out
        </button>
      </div>
    </AuthShell>
  );
}

export default PendingApprovalPage;
