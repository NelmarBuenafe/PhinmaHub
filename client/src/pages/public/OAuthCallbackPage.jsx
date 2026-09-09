import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../../components/common/AuthShell.jsx";
import Loading from "../../components/common/Loading.jsx";
import { useAuth } from "../../contexts/authContext.js";
import { getAuthFlow } from "../../utils/authFlow.js";
import { getFriendlyAuthError } from "../../utils/auth.js";
import api from "../../services/api.js";

function OAuthCallbackPage() {
  const { signOut, validateIdentity, validateSession } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function completeSignIn() {
      if (!getAuthFlow()) {
        await signOut();
        if (active) navigate("/choose-role", { replace: true });
        return;
      }

      const flow = getAuthFlow();
      if (flow.provider === "email") {
        for (let attempt = 0; attempt < 12; attempt += 1) {
          try {
            const activation = await api.post("/auth/registration/activate");
            await validateSession();
            if (active) {
              navigate(activation.data.destination, { replace: true });
            }
            return;
          } catch (requestError) {
            const code = requestError.response?.data?.code || requestError.code;
            if (code === "AUTH_REQUIRED" && attempt < 11) {
              await new Promise((resolve) => window.setTimeout(resolve, 250));
              continue;
            }
            if (code === "INVALID_DOMAIN") {
              navigate("/school-email-required", { replace: true });
              return;
            }
            if (code === "REGISTRATION_DETAILS_REQUIRED") {
              navigate(`/auth/${flow.role}`, {
                replace: true,
                state: { emailVerified: true },
              });
              return;
            }
            setError(
              getFriendlyAuthError(
                requestError,
                "Your verified registration could not be activated.",
              ),
            );
            return;
          }
        }
      }

      for (let attempt = 0; attempt < 12; attempt += 1) {
        try {
          await validateIdentity();
          if (!active) return;
          const result = await validateSession({
            googleResult: true,
            flow: flow.mode,
            selectedRole: flow.role,
          });
          const roleNotice =
            result.roleMismatch && result.approvedRole
              ? `Your account is registered as a ${result.approvedRole}.`
              : null;
          navigate(result.destination, {
            replace: true,
            state: { roleNotice },
          });
          return;
        } catch (requestError) {
          if (!active) return;
          const code = requestError.response?.data?.code || requestError.code;
          if (code === "AUTH_REQUIRED" && attempt < 11) {
            await new Promise((resolve) => window.setTimeout(resolve, 250));
            continue;
          }
          if (
            ["INVALID_DOMAIN", "INVALID_PROVIDER", "PROFILE_MISSING"].includes(
              code,
            )
          ) {
            navigate(
              code === "INVALID_DOMAIN"
                ? "/school-email-required"
                : "/unauthorized",
              { replace: true },
            );
            return;
          }
          setError(
            getFriendlyAuthError(
              requestError,
              "Sign-in could not be completed. Please return to login and try again.",
            ),
          );
          return;
        }
      }
    }

    completeSignIn();
    return () => {
      active = false;
    };
  }, [navigate, signOut, validateIdentity, validateSession]);

  return (
    <AuthShell
      title="Completing sign-in"
      description="Please wait while we securely verify your account."
    >
      {error ? (
        <p
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : (
        <Loading label="Verifying your Google account..." />
      )}
      {error && (
        <button
          className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white"
          onClick={() => navigate("/login", { replace: true })}
          type="button"
        >
          Return to login
        </button>
      )}
    </AuthShell>
  );
}

export default OAuthCallbackPage;
