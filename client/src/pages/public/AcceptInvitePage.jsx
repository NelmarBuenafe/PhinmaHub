import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AuthShell from "../../components/common/AuthShell.jsx";
import Loading from "../../components/common/Loading.jsx";
import PasswordInput from "../../components/auth/PasswordInput.jsx";
import { useAuth } from "../../contexts/authContext.js";
import api from "../../services/api.js";
import { supabase } from "../../services/supabase.js";
import { getFriendlyAuthError } from "../../utils/auth.js";

function AcceptInvitePage() {
  const { loading, session, validateSession } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loading label="Opening your invitation..." />
      </div>
    );
  }

  if (!session) return <Navigate to="/choose-role" replace />;

  async function acceptInvitation(event) {
    event.preventDefault();
    setError("");

    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password)
    ) {
      setError(
        "Use at least 8 characters with uppercase, lowercase and a number.",
      );
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error: passwordError } = await supabase.auth.updateUser({
        password,
      });
      if (passwordError) throw passwordError;

      const activation = await api.post("/auth/registration/activate");
      await validateSession();
      navigate(activation.data.destination, { replace: true });
    } catch (requestError) {
      setError(
        getFriendlyAuthError(
          requestError,
          requestError.message || "The invitation could not be completed.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell
      eyebrow="ADMIN INVITATION"
      title="Create your password"
      description="Your school email has been verified. Create a password to activate your PhinmaHub account."
    >
      <form className="space-y-4" onSubmit={acceptInvitation}>
        <PasswordInput
          label="Password"
          minLength="8"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          value={password}
        />
        <PasswordInput
          label="Confirm password"
          minLength="8"
          name="confirmation"
          onChange={(event) => setConfirmation(event.target.value)}
          required
          value={confirmation}
        />
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Activating account..." : "Activate account"}
        </button>
      </form>
    </AuthShell>
  );
}

export default AcceptInvitePage;
