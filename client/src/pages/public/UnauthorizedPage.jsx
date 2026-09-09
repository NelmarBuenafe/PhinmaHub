import { useNavigate } from "react-router-dom";
import AuthShell from "../../components/common/AuthShell.jsx";
import { useAuth } from "../../contexts/authContext.js";

function UnauthorizedPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function returnToLogin() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <AuthShell
      eyebrow="ACCESS DENIED"
      title="This account cannot continue"
      description="Use an authorized PHINMA account, or contact an administrator if your account was suspended, rejected or is missing a profile."
    >
      <button
        className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800"
        onClick={returnToLogin}
        type="button"
      >
        Return to login
      </button>
    </AuthShell>
  );
}

export default UnauthorizedPage;
