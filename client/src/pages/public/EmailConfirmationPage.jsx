import { CheckCircle2, CircleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../../components/common/AuthShell.jsx";
import Loading from "../../components/common/Loading.jsx";
import { useAuth } from "../../contexts/authContext.js";
import { supabase } from "../../services/supabase.js";
import {
  getConfirmationCallback,
  getConfirmationLoginPath,
  getConfirmationSessionAction,
  getConfirmedLoginRole,
} from "../../utils/confirmationFlow.js";
import api from "../../services/api.js";

const roleLabel = (role) => `${role.charAt(0).toUpperCase()}${role.slice(1)}`;

function logConfirmation(event, details = {}) {
  if (import.meta.env.DEV) console.info("[EmailConfirm]", event, details);
}

function logConfirmationError(stage, error) {
  if (!import.meta.env.DEV) return;
  console.warn("[EmailConfirm] error", {
    stage,
    name: error?.name,
    message: error?.message,
    status: error?.status || error?.response?.status,
    code: error?.code || error?.response?.data?.code,
  });
}

function confirmationError(stage) {
  if (stage === "exchange" || stage === "verification") {
    return {
      title: "Verification link invalid or expired",
      message: "Verification link invalid or expired.",
    };
  }

  if (stage === "activation" || stage === "profile") {
    return {
      title: "Email verified, but account setup is incomplete",
      message:
        "Your email was verified, but we couldn't finish setting up your PhinmaHub account.",
    };
  }

  return {
    title: "We couldn't finish verifying your account",
    message: "We couldn't finish verifying your account. Please try again.",
  };
}

function removeConfirmationCode() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("code")) return;
  url.searchParams.delete("code");
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

export default function EmailConfirmationPage() {
  const navigate = useNavigate();
  const { terminateSession } = useAuth();
  const [state, setState] = useState({ status: "verifying", role: null });
  const confirmationRef = useRef({ promise: null, exchangeAttempted: false });

  useEffect(() => {
    let active = true;

    async function confirmEmail() {
      let stage = "verification";
      try {
        const callback = getConfirmationCallback(window.location.search);
        const hasCode = Boolean(callback.code);
        logConfirmation("start", {
          pathname: window.location.pathname,
          hasCode,
        });
        if (callback.error) {
          const error = new Error("CONFIRMATION_CALLBACK_ERROR");
          error.code = callback.errorCode || callback.error;
          throw error;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        logConfirmation("session", {
          existingSession: Boolean(session),
          error: Boolean(sessionError),
        });
        if (sessionError) throw sessionError;

        const sessionAction = getConfirmationSessionAction({
          code: callback.code,
          exchangeAttempted: confirmationRef.current.exchangeAttempted,
          session,
        });
        if (sessionAction === "missing-code") {
            const error = new Error("CONFIRMATION_CODE_MISSING");
            error.code = "CONFIRMATION_CODE_MISSING";
            throw error;
        }
        if (sessionAction === "already-exchanged") {
          const error = new Error("CONFIRMATION_EXCHANGE_ALREADY_ATTEMPTED");
          error.code = "CONFIRMATION_EXCHANGE_ALREADY_ATTEMPTED";
          throw error;
        }
        if (sessionAction === "exchange") {
          stage = "exchange";
          // PKCE codes can only be redeemed once. The shared promise below and
          // this flag cover both React StrictMode effect replay and rerenders.
          confirmationRef.current.exchangeAttempted = true;
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(callback.code);
          logConfirmation("exchange", {
            attempted: true,
            success: Boolean(data?.session) && !exchangeError,
          });
          if (exchangeError || !data?.session) {
            throw exchangeError || new Error("CONFIRMATION_SESSION_MISSING");
          }
        } else if (sessionAction === "existing-session") {
          // detectSessionInUrl may have already exchanged this code before the
          // page renders. A visible code is not proof that exchange failed.
          logConfirmation("exchange", {
            attempted: false,
            success: true,
            reason: "existing_session",
          });
        }

        removeConfirmationCode();

        stage = "user";
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        logConfirmation("user", {
          available: Boolean(user),
          emailConfirmed: Boolean(user?.email_confirmed_at || user?.confirmed_at),
        });
        if (userError || !user) throw userError || new Error("CONFIRMATION_USER_MISSING");
        if (!user.email_confirmed_at && !user.confirmed_at) {
          stage = "verification";
          const error = new Error("EMAIL_NOT_CONFIRMED");
          error.code = "EMAIL_NOT_CONFIRMED";
          throw error;
        }

        stage = "activation";
        const activation = await api.post("/auth/registration/activate");
        logConfirmation("activation", { status: activation.status });

        stage = "profile";
        const role = getConfirmedLoginRole(activation.data.profile);
        if (!role) throw new Error("CONFIRMATION_PROFILE_UNAVAILABLE");
        logConfirmation("role", { resolvedRole: role });

        stage = "sign-out";
        await terminateSession();
        return {
          status: "success",
          role,
          alreadyVerified: activation.data.message === "Registration is already active.",
        };
      } catch (error) {
        logConfirmationError(stage, error);
        return { status: "error", role: null, ...confirmationError(stage) };
      }
    }

    // In development StrictMode React replays effects. Both effect instances
    // subscribe to one operation, so the live instance always receives its
    // terminal success/error state and the PKCE code is never exchanged twice.
    if (!confirmationRef.current.promise) {
      confirmationRef.current.promise = confirmEmail();
    }
    confirmationRef.current.promise.then((nextState) => {
      if (active) setState(nextState);
    });

    return () => {
      active = false;
    };
  }, [terminateSession]);

  if (state.status === "verifying") {
    return <AuthShell title="Verifying your email" description="Please wait while we confirm your PHINMA account."><Loading label="Verifying your email..." /></AuthShell>;
  }

  if (state.status === "error") {
    return <AuthShell title={state.title} description={state.message}><div className="rounded-xl bg-red-50 p-4 text-sm text-red-700"><CircleAlert aria-hidden="true" className="mb-2" size={22} />{state.message}</div><button className="mt-5 w-full rounded-xl border border-emerald-700 px-4 py-3 font-bold text-emerald-800 hover:bg-emerald-50" onClick={() => navigate("/choose-role", { replace: true })} type="button">Return to sign in</button></AuthShell>;
  }

  const label = roleLabel(state.role);
  const description = state.alreadyVerified
    ? "Your email is already verified."
    : "Your PHINMA email has been verified successfully.";
  const loginPath = getConfirmationLoginPath(state.role);
  return <AuthShell title="Email verified" description={description}><div className="rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><CheckCircle2 aria-hidden="true" className="mb-2 text-emerald-700" size={22} />Your PHINMA email has been successfully verified. You can now sign in to your {label} account.</div><button className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800" onClick={() => navigate(loginPath, { replace: true, state: { emailVerified: true } })} type="button">Continue to {label} Sign In</button></AuthShell>;
}
