import { useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import MathCaptcha from "../../components/auth/MathCaptcha.jsx";
import StudentRegistrationForm from "../../components/auth/StudentRegistrationForm.jsx";
import TeacherRegistrationForm from "../../components/auth/TeacherRegistrationForm.jsx";
import { useAuth } from "../../contexts/authContext.js";
import api from "../../services/api.js";
import { getFriendlyAuthError } from "../../utils/auth.js";
import { clearRegistrationDraft, getAuthFlow } from "../../utils/authFlow.js";
import { useToast } from "../../contexts/toastStore.js";

function nameParts(identity, session) {
  const metadata = session?.user?.user_metadata || {};
  const fullName =
    identity?.fullName || metadata.full_name || metadata.name || "";
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: metadata.given_name || parts[0] || "",
    middleName: "",
    lastName:
      metadata.family_name || parts.slice(1).join(" ") || parts[0] || "",
  };
}

function RegistrationPage() {
  const { role } = useParams();
  const navigate = useNavigate();
  const captchaRef = useRef(null);
  const { identity, session, validateSession } = useAuth();
  const flow = getAuthFlow();
  const googleNames = useMemo(
    () => nameParts(identity, session),
    [identity, session],
  );
  const [values, setValues] = useState(() => ({
    ...nameParts(identity, session),
    email: identity?.email || session?.user?.email || "",
    studentId: "",
    employeeId: "",
    campus: "",
    program: "",
    yearLevel: "",
    section: "",
    department: "",
    position: "",
    terms: false,
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  if (
    !["student", "teacher"].includes(role) ||
    flow?.mode !== "register" ||
    flow.role !== role ||
    flow.provider === "email"
  )
    return <Navigate to="/choose-role" replace />;

  const avatarUrl =
    identity?.avatarUrl ||
    session?.user?.user_metadata?.avatar_url ||
    session?.user?.user_metadata?.picture;
  const roleLabel = role === "student" ? "Student" : "Teacher";

  function updateValue(event) {
    const { checked, name, type, value } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function details() {
    return role === "student"
      ? {
          studentId: values.studentId,
          campus: values.campus,
          program: values.program,
          yearLevel: values.yearLevel,
          section: values.section,
        }
      : {
          employeeId: values.employeeId,
          campus: values.campus,
          department: values.department,
          position: values.position,
        };
  }

  function validate() {
    const next = {};
    const required =
      role === "student"
        ? ["studentId", "campus", "program", "yearLevel", "section"]
        : ["employeeId", "campus", "department"];
    for (const field of required)
      if (!values[field]?.trim()) next[field] = "This field is required.";
    if (!values.terms)
      next.terms = "You must accept the Terms and Privacy Policy.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submitRegistration(event) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError("");
    try {
      await captchaRef.current.verify();
      const response = await api.post(`/auth/register/${role}`, details());
      clearRegistrationDraft();
      await validateSession();
      toast.success("Account created successfully.");
      navigate(response.data.destination, { replace: true });
    } catch (requestError) {
      const message = getFriendlyAuthError(requestError, requestError.message || "Registration could not be saved.");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthLayout role={role}>
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
          {roleLabel}
        </span>
        <Link
          className="text-sm font-bold text-slate-500 hover:text-emerald-700"
          to="/choose-role"
        >
          Change role
        </Link>
      </div>
      <h2 className="mt-4 text-3xl font-black text-slate-950">
        Complete your {roleLabel} registration
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Google verified your identity. Complete the remaining school information
        below.
      </p>
      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        {avatarUrl ? (
          <img
            alt={`${googleNames.firstName}'s Google profile`}
            className="size-14 rounded-full object-cover"
            referrerPolicy="no-referrer"
            src={avatarUrl}
          />
        ) : (
          <span className="grid size-14 place-items-center rounded-full bg-emerald-200 font-black text-emerald-800">
            {googleNames.firstName.charAt(0)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-black text-slate-900">
            {[googleNames.firstName, googleNames.lastName]
              .filter(Boolean)
              .join(" ")}
          </p>
          <p className="truncate text-sm text-slate-600">{values.email}</p>
          <p className="mt-1 text-xs font-bold text-emerald-700">
            Verified by Google
          </p>
        </div>
      </div>
      <form className="mt-6 space-y-4" onSubmit={submitRegistration}>
        {role === "student" ? (
          <StudentRegistrationForm
            errors={errors}
            googleLocked
            onChange={updateValue}
            values={values}
          />
        ) : (
          <TeacherRegistrationForm
            errors={errors}
            googleLocked
            onChange={updateValue}
            values={values}
          />
        )}
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
          <input
            checked={values.terms}
            className="mt-1"
            name="terms"
            onChange={updateValue}
            type="checkbox"
          />
          <span>I agree to the Terms of Use and Privacy Policy.</span>
        </label>
        {errors.terms && (
          <p className="text-xs font-semibold text-red-700">{errors.terms}</p>
        )}
        <MathCaptcha disabled={saving} ref={captchaRef} />
        <button
          className="w-full rounded-xl bg-emerald-700 px-4 py-3.5 font-black text-white hover:bg-emerald-800 disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Submitting registration…" : `Create ${roleLabel} Account`}
        </button>
      </form>
      {error && (
        <p
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}
    </AuthLayout>
  );
}

export default RegistrationPage;
