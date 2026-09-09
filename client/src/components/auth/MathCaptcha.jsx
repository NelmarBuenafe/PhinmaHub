import { RefreshCw } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import api from "../../services/api.js";
import { getFriendlyAuthError } from "../../utils/auth.js";

const MathCaptcha = forwardRef(function MathCaptcha({ disabled = false }, ref) {
  const [challenge, setChallenge] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadChallenge = useCallback(async () => {
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const response = await api.get("/auth/captcha");
      setChallenge(response.data);
    } catch {
      setChallenge(null);
      setError("Security verification is unavailable. Try again shortly.");
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
          setError("Security verification is unavailable. Try again shortly.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      async verify() {
        if (!challenge || answer === "") {
          setError("Enter the answer to continue.");
          throw new Error("CAPTCHA answer is required.");
        }
        try {
          await api.post("/auth/captcha/verify", {
            token: challenge.token,
            answer,
          });
          setError("");
          return true;
        } catch (requestError) {
          const message = getFriendlyAuthError(
            requestError,
            "Security verification failed.",
          );
          await loadChallenge();
          setError(message);
          throw requestError;
        }
      },
    }),
    [answer, challenge, loadChallenge],
  );

  return (
    <fieldset
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
      disabled={disabled}
    >
      <legend className="px-1 text-sm font-black text-slate-800">
        Security Verification
      </legend>
      <div className="mt-1 flex items-center gap-3">
        <div className="shrink-0 rounded-xl bg-white px-4 py-3 text-xl font-black tracking-wide text-slate-950 shadow-sm">
          {loading ? "Loading…" : challenge?.question || "Unavailable"}
        </div>
        <input
          aria-label="Security verification answer"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          disabled={loading || !challenge}
          min="0"
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Enter the answer"
          required
          type="number"
          value={answer}
        />
      </div>
      <button
        className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-900"
        disabled={loading}
        onClick={loadChallenge}
        type="button"
      >
        <RefreshCw aria-hidden="true" size={14} /> Generate New Numbers
      </button>
      {error && (
        <p className="mt-2 text-xs font-semibold text-red-700" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
});

export default MathCaptcha;
