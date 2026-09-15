import { CircleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import AuthTabs from "../../components/auth/AuthTabs.jsx";
import Dialog from "../../components/common/Dialog.jsx";
import FormField from "../../components/auth/FormField.jsx";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton.jsx";
import MathCaptcha from "../../components/auth/MathCaptcha.jsx";
import PasswordInput from "../../components/auth/PasswordInput.jsx";
import StudentRegistrationForm from "../../components/auth/StudentRegistrationForm.jsx";
import TeacherRegistrationForm from "../../components/auth/TeacherRegistrationForm.jsx";
import { useAuth } from "../../contexts/authContext.js";
import api from "../../services/api.js";
import { supabase } from "../../services/supabase.js";
import { getFriendlyAuthError } from "../../utils/auth.js";
import { getConfirmedLoginRole } from "../../utils/confirmationFlow.js";
import { getRoleMismatchDetails } from "../../utils/roleMismatch.js";
import { useToast } from "../../contexts/toastStore.js";
import {
  clearRegistrationDraft,
  clearAuthFlow,
  getRegistrationDraft,
  saveAuthFlow,
  saveRegistrationDraft,
} from "../../utils/authFlow.js";

const publicRoles = new Set(["student", "teacher"]);

function RoleAuthPage() {
  const toast = useToast();
  const { role } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const captchaRef = useRef(null);
  const { beginGoogleSignIn, terminateSession, validateSession } = useAuth();
  const isAdmin = role === "admin";
  const validRole = isAdmin || publicRoles.has(role);
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    location.state?.emailVerified
      ? "Email verified. Sign in to complete your registration."
      : "",
  );
  const [errors, setErrors] = useState({});
  const mismatchRoleFromNavigation = location.state?.roleMismatchRole;
  const roleMismatch =
    mismatchRoleFromNavigation === role
      ? null
      : getRoleMismatchDetails(mismatchRoleFromNavigation, role);
  const [values, setValues] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    studentId: "",
    employeeId: "",
    campus: "",
    program: "",
    yearLevel: "",
    section: "",
    department: "",
    position: "",
    password: "",
    confirmPassword: "",
    terms: false,
    remember: false,
  });

  useEffect(() => {
    if (publicRoles.has(role)) saveAuthFlow(role, "login", "email");
  }, [role]);

  if (!validRole) return <Navigate to="/choose-role" replace />;

  function dismissRoleMismatch() {
    clearLoginForm();
    navigate(`${location.pathname}${location.search}`, { replace: true });
  }

  const roleLabel = `${role.charAt(0).toUpperCase()}${role.slice(1)}`;

  function updateValue(event) {
    const { checked, name, type, value } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function clearLoginForm() {
    setValues((current) => ({
      ...current,
      confirmPassword: "",
      email: "",
      password: "",
      remember: false,
    }));
    setErrors({});
    setError("");
    setSuccess("");
  }

  async function handleRoleMismatch(actualRole) {
    const details = getRoleMismatchDetails(actualRole, role);
    if (!details) return false;
    try {
      await terminateSession();
    } catch {
      const message = "We couldn't securely sign out this account. Please try again.";
      setError(message);
      toast.error(message);
      return false;
    }
    clearLoginForm();
    navigate(`/auth/${role}`, {
      replace: true,
      state: { roleMismatchRole: actualRole },
    });
    return true;
  }

  function validateRegistration() {
    const nextErrors = {};
    for (const field of ["firstName", "lastName", "email", "campus"])
      if (!values[field].trim()) nextErrors[field] = "This field is required.";
    if (role === "student")
      for (const field of ["studentId", "program", "yearLevel", "section"])
        if (!values[field].trim())
          nextErrors[field] = "This field is required.";
    if (role === "teacher")
      for (const field of ["employeeId", "department"])
        if (!values[field].trim())
          nextErrors[field] = "This field is required.";
    if (!/^\S+@\S+\.\S+$/.test(values.email))
      nextErrors.email = "Enter a valid PHINMA email.";
    if (
      values.password.length < 8 ||
      !/[a-z]/.test(values.password) ||
      !/[A-Z]/.test(values.password) ||
      !/\d/.test(values.password)
    )
      nextErrors.password =
        "Use at least 8 characters with uppercase, lowercase and a number.";
    if (values.password !== values.confirmPassword)
      nextErrors.confirmPassword = "Passwords do not match.";
    if (!values.terms)
      nextErrors.terms = "You must accept the Terms and Privacy Policy.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function finishLogin() {
    const draft = getRegistrationDraft(values.email);
    if (draft) {
      const registration = await api.post(
        `/auth/register/${draft.role}`,
        draft.details,
      );
      clearRegistrationDraft();
      await validateSession();
      clearAuthFlow();
      navigate(registration.data.destination, { replace: true });
      return;
    }
    let result = await validateSession({
      requireCaptcha: true,
      flow: "login",
      selectedRole: role,
    });
    if (result.destination === "/pending") {
      const activation = await api.post("/auth/registration/activate");
      await validateSession();
      result = {
        ...result,
        destination: activation.data.destination,
        approvedRole: activation.data.profile?.approved_role,
      };
    }
    clearAuthFlow();
    navigate(result.destination, { replace: true });
  }

  async function submitLogin(event) {
    event.preventDefault();
    setLoading(true);
    setCheckingAccount(false);
    setError("");
    setSuccess("");
    try {
      await captchaRef.current.verify();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });
      if (signInError) throw signInError;
      setCheckingAccount(true);
      await finishLogin();
    } catch (requestError) {
      if (requestError.response?.data?.code === "ROLE_MISMATCH") {
        if (await handleRoleMismatch(requestError.response.data.approvedRole)) return;
      }
      if (requestError.response?.data?.code === "INVALID_DOMAIN") {
        navigate("/school-email-required", { replace: true });
        return;
      }
      const message = getFriendlyAuthError(requestError, "Login could not be completed. Please try again.");
      setError(message);
      toast.error(message);
    } finally {
      setCheckingAccount(false);
      setLoading(false);
    }
  }

  function registrationDetails() {
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

  async function submitRegistration(event) {
    event.preventDefault();
    if (!validateRegistration()) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await captchaRef.current.verify();
      await api.post("/auth/email/check", { email: values.email.trim() });
      const details = registrationDetails();
      saveRegistrationDraft(role, values.email, details);
      saveAuthFlow(role, "register", "email");
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            first_name: values.firstName.trim(),
            middle_name: values.middleName.trim() || null,
            last_name: values.lastName.trim(),
            requested_role: role,
            registration_details: details,
            registration_source: "self_registration",
          },
        },
      });
      if (signUpError) throw signUpError;
      if (data.user && data.user.identities?.length === 0) {
        const duplicateError = new Error(
          "This school email is already registered. Please sign in instead.",
        );
        duplicateError.code = "EMAIL_ALREADY_REGISTERED";
        throw duplicateError;
      }
      if (data.session) {
        const activation = await api.post("/auth/registration/activate");
        clearRegistrationDraft();
        const confirmedRole = getConfirmedLoginRole(activation.data.profile);
        if (!confirmedRole) throw new Error("Unable to determine the verified account role.");
        await terminateSession();
        navigate(`/auth/${confirmedRole}`, {
          replace: true,
          state: { emailVerified: true },
        });
      } else {
        toast.success("Account created. Please check your email to verify your account.");
        navigate("/pending", {
          replace: true,
          state: {
            email: values.email.trim(),
            requestedRole: role,
            verificationRequired: true,
          },
        });
      }
    } catch (requestError) {
      if (requestError.response?.data?.code === "INVALID_DOMAIN") {
        navigate("/school-email-required", { replace: true });
        return;
      }
      const message = getFriendlyAuthError(requestError, requestError.code === "EMAIL_ALREADY_REGISTERED" ? requestError.message : "Registration could not be completed. Please try again.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function continueWithGoogle() {
    setLoading(true);
    setError("");
    try {
      await beginGoogleSignIn({ role, mode: isAdmin ? "login" : mode });
    } catch {
      const message = "Google authentication could not be started. Please try again.";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout role={role}>
      <div className="flex items-center justify-between gap-3">
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
        {isAdmin
          ? "Administrator sign in"
          : `${roleLabel} ${mode === "login" ? "Login" : "Registration"}`}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Use your account email and password, or continue with Google.
      </p>

      {error && (
        <p
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
          {success}
        </p>
      )}

      {!isAdmin && (
        <div className="mt-6">
          <AuthTabs
            activeTab={mode}
            onChange={(tab) => {
              setMode(tab);
              setError("");
              setErrors({});
            }}
            role={roleLabel}
          />
        </div>
      )}

      {mode === "login" && (
        <form className="mt-6 space-y-4" onSubmit={submitLogin}>
          <FormField
            label="Email"
            name="email"
            onChange={updateValue}
            placeholder="Enter your email"
            required
            type="email"
            value={values.email}
          />
          <PasswordInput
            name="password"
            onChange={updateValue}
            placeholder="Enter your password"
            required
            value={values.password}
          />
          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input
                checked={values.remember}
                name="remember"
                onChange={updateValue}
                type="checkbox"
              />{" "}
              Remember me
            </label>
            <span className="font-bold text-slate-500" title="Password recovery will be available in a future release">
              Forgot password? (Coming soon)
            </span>
          </div>
          <MathCaptcha disabled={loading} ref={captchaRef} />
          <button
            className="w-full rounded-xl bg-emerald-700 px-4 py-3.5 font-black text-white hover:bg-emerald-800 disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? checkingAccount ? "Checking account..." : "Signing in..." : `Login as ${roleLabel}`}
          </button>
        </form>
      )}

      {!isAdmin && mode === "register" && (
        <form className="mt-6 space-y-4" onSubmit={submitRegistration}>
          {role === "student" ? (
            <StudentRegistrationForm
              errors={errors}
              googleLocked={false}
              onChange={updateValue}
              values={values}
            />
          ) : (
            <TeacherRegistrationForm
              errors={errors}
              googleLocked={false}
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
            <span>
              I agree to the{" "}
              <Link className="font-bold text-emerald-800 underline" to="/terms-of-use">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link className="font-bold text-emerald-800 underline" to="/privacy-policy">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && (
            <p className="text-xs font-semibold text-red-700">{errors.terms}</p>
          )}
          <MathCaptcha disabled={loading} ref={captchaRef} />
          <button
            className="w-full rounded-xl bg-emerald-700 px-4 py-3.5 font-black text-white hover:bg-emerald-800 disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Creating account…" : `Create ${roleLabel} Account`}
          </button>
        </form>
      )}

      {!isAdmin && (
        <div className="my-6 flex items-center gap-3 text-xs font-bold text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          OR
          <span className="h-px flex-1 bg-slate-200" />
        </div>
      )}
      <GoogleAuthButton disabled={loading} onClick={continueWithGoogle}>
        {mode === "register" && !isAdmin
          ? "Register with Google"
          : "Continue with Google"}
      </GoogleAuthButton>
      <p className="mt-3 text-center text-xs text-slate-500">
        Use only the PHINMA school email address assigned to you. Personal
        Google accounts are not accepted.
      </p>
      {!isAdmin && (
        <button
          className="mt-6 w-full text-center text-sm text-slate-600"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          type="button"
        >
          {mode === "login"
            ? `Don’t have an account? Register as a ${roleLabel}`
            : `Already have an account? Login as a ${roleLabel}`}
        </button>
      )}
      <Dialog
        description={roleMismatch?.message}
        footer={<><button className="ph-action rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={dismissRoleMismatch} type="button">Try another account</button><button className="ph-action rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800" onClick={() => { clearLoginForm(); navigate(roleMismatch.destination, { replace: true }); }} type="button">Go to {roleMismatch?.label} Login</button></>}
        onClose={dismissRoleMismatch}
        open={Boolean(roleMismatch)}
        size="compact"
        title={<span className="flex items-center gap-3"><span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-red-50 text-red-700"><CircleAlert size={21} /></span>Wrong account type</span>}
        wide={false}
      />
    </AuthLayout>
  );
}

export default RoleAuthPage;
