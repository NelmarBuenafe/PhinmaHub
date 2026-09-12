const VALID_ROLES = new Set(["admin", "teacher", "student"]);

export function getProfileDestination(profile) {
  if (!profile) return "/unauthorized";
  // Admin accounts are created by an administrator and never have a
  // requested_role (the database explicitly disallows it for admins).
  if (
    profile.account_status === "active" &&
    profile.approved_role === "admin"
  )
    return "/admin";
  if (!profile.requested_role) return "/select-role";
  if (profile.account_status === "pending") return "/pending";
  if (profile.account_status !== "active") return "/unauthorized";
  if (!VALID_ROLES.has(profile.approved_role)) return "/unauthorized";
  return `/${profile.approved_role}`;
}

export function getFriendlyAuthError(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) return serverMessage;

  const message = String(error?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (message.includes("email not confirmed")) {
    return "Please verify your PHINMA email before signing in.";
  }
  if (message.includes("banned") || message.includes("suspended")) {
    return "This account is suspended. Contact your campus support office.";
  }
  if (message.includes("domain") || message.includes("institutional")) {
    return "Please use your PHINMA institutional account.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return fallback;
}
