const VALID_ROLES = new Set(["admin", "teacher", "student"]);

export function normalizeDomain(domain) {
  return String(domain || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

export function hasExactEmailDomain(email, allowedDomain) {
  if (typeof email !== "string") return false;

  const normalizedAllowedDomain = normalizeDomain(allowedDomain);
  const normalizedEmail = email.trim().toLowerCase();
  const atIndex = normalizedEmail.lastIndexOf("@");

  if (
    !normalizedAllowedDomain ||
    atIndex <= 0 ||
    normalizedEmail.indexOf("@") !== atIndex
  )
    return false;
  return normalizedEmail.slice(atIndex + 1) === normalizedAllowedDomain;
}

export function getAllowedEmailDomains(environment = process.env) {
  const configuredDomains =
    environment.PHINMA_ALLOWED_EMAIL_DOMAINS ||
    environment.ALLOWED_GOOGLE_DOMAIN ||
    "";

  return [
    ...new Set(
      configuredDomains
        .split(",")
        .map(normalizeDomain)
        .filter(Boolean),
    ),
  ];
}

export function isInstitutionalEmail(email, environment = process.env) {
  return getAllowedEmailDomains(environment).some((domain) =>
    hasExactEmailDomain(email, domain),
  );
}

export function isGoogleUser(user) {
  if (!user) return false;

  const primaryProvider = user.app_metadata?.provider;
  const listedProviders = user.app_metadata?.providers;
  const identityProviders =
    user.identities?.map((identity) => identity.provider) || [];

  return (
    primaryProvider === "google" ||
    listedProviders?.includes("google") ||
    identityProviders.includes("google")
  );
}

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

export function getAuthenticationResult(profile, { flow, selectedRole }) {
  if (!profile || ["suspended", "rejected"].includes(profile.account_status)) {
    return { destination: "/unauthorized", roleMismatch: false };
  }

  if (profile.account_status === "pending") {
    return {
      destination:
        flow === "register" ? `/register/${selectedRole}` : "/pending",
      roleMismatch: false,
    };
  }

  if (
    profile.account_status !== "active" ||
    !VALID_ROLES.has(profile.approved_role)
  ) {
    return { destination: "/unauthorized", roleMismatch: false };
  }

  if (selectedRole !== profile.approved_role) {
    return { destination: null, roleMismatch: true };
  }

  return { destination: `/${profile.approved_role}`, roleMismatch: false };
}

export function canAccessRole(profile, requiredRole) {
  return getProfileDestination(profile) === `/${requiredRole}`;
}

export function getRegistrationActivationError(
  profile,
  role,
  emailConfirmed,
) {
  if (!emailConfirmed) return "EMAIL_NOT_VERIFIED";
  if (!["student", "teacher"].includes(role)) return "INVALID_ROLE";
  if (["rejected", "suspended"].includes(profile?.account_status)) {
    return "ACCOUNT_BLOCKED";
  }
  if (
    (profile?.approved_role && profile.approved_role !== role) ||
    (profile?.requested_role && profile.requested_role !== role)
  ) {
    return "ROLE_CONFLICT";
  }
  return null;
}
