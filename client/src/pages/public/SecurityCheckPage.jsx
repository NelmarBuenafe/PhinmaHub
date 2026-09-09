import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AuthShell from "../../components/common/AuthShell.jsx";
import { useAuth } from "../../contexts/authContext.js";
import api from "../../services/api.js";
import { getAuthFlow } from "../../utils/authFlow.js";
import { getFriendlyAuthError } from "../../utils/auth.js";

function SecurityCheckPage() {
  const flow = getAuthFlow();
  const navigate = useNavigate();
  const { validateSession } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadChallenge = useCallback(async () => {
    setLoading(true);
    setAnswer("");
    setError("");
    try {
      const response = await api.get("/auth/captcha");
      setChallenge(response.data);
    } catch {
      setError("Unable to load the security question. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    api
      .get("/auth/captcha")
      .then((response) => {
        if (active) setChallenge(response.data);
      })
      .catch(() => {
        if (active)
          setError("Unable to load the security question. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!flow) return <Navigate to="/choose-role" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!challenge || answer === "") return;
    setSubmitting(true);
    setError("");

    try {
      await api.post("/auth/captcha/verify", {
        token: challenge.token,
        answer,
      });
      const result = await validateSession({
        requireCaptcha: true,
        flow: flow.mode,
        selectedRole: flow.role,
      });
      const roleNotice =
        result.roleMismatch && result.approvedRole
          ? `Your account is registered as a ${result.approvedRole.charAt(0).toUpperCase()}${result.approvedRole.slice(1)}.`
          : null;
      navigate(result.destination, { replace: true, state: { roleNotice } });
    } catch (requestError) {
      const message = getFriendlyAuthError(
        requestError,
        "The security check could not be completed.",
      );
      await loadChallenge();
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Security check"
      description="Complete this quick addition question to continue securely."
    >
      <form onSubmit={handleSubmit}>
        <label
          className="block font-semibold text-slate-800"
          htmlFor="security-answer"
        >
          Solve the addition
        </label>
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-3xl font-bold tracking-wide text-slate-950">
            {loading ? "Loading..." : challenge?.question}
          </p>
        </div>
        <input
          className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950"
          disabled={loading || submitting}
          id="security-answer"
          min="0"
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Enter your answer"
          required
          type="number"
          value={answer}
        />
        {error && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-300"
          disabled={loading || submitting || answer === ""}
          type="submit"
        >
          {submitting ? "Verifying..." : "Verify and continue"}
        </button>
      </form>
    </AuthShell>
  );
}

export default SecurityCheckPage;
