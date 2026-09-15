const PUBLIC_ROLES = new Set(["student", "teacher"]);

export function getConfirmationCallback(search = "") {
  const params = new URLSearchParams(search);
  return {
    code: params.get("code"),
    error: params.get("error"),
    errorCode: params.get("error_code"),
  };
}

export function getConfirmationSessionAction({
  code,
  exchangeAttempted,
  session,
}) {
  if (session) return "existing-session";
  if (!code) return "missing-code";
  if (exchangeAttempted) return "already-exchanged";
  return "exchange";
}

export function getConfirmationLoginPath(role) {
  return PUBLIC_ROLES.has(role) ? `/auth/${role}` : null;
}

export function getConfirmedLoginRole(profile) {
  if (
    profile?.account_status !== "active" ||
    !PUBLIC_ROLES.has(profile.approved_role)
  ) {
    return null;
  }
  return profile.approved_role;
}
