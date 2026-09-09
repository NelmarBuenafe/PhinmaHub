const FLOW_STORAGE_KEY = "phinmahub_auth_flow";
const VALID_ROLES = new Set(["admin", "student", "teacher"]);
const VALID_MODES = new Set(["login", "register"]);
const VALID_PROVIDERS = new Set(["google", "email"]);
const REGISTRATION_DRAFT_KEY = "phinmahub_registration_draft";

export function saveAuthFlow(role, mode, provider = "google") {
  if (
    !VALID_ROLES.has(role) ||
    !VALID_MODES.has(mode) ||
    !VALID_PROVIDERS.has(provider)
  )
    return false;
  if (role === "admin" && mode !== "login") return false;
  window.sessionStorage.setItem(
    FLOW_STORAGE_KEY,
    JSON.stringify({ role, mode, provider }),
  );
  return true;
}

export function getAuthFlow() {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(FLOW_STORAGE_KEY));
    if (!VALID_ROLES.has(value?.role) || !VALID_MODES.has(value?.mode))
      return null;
    if (value.provider && !VALID_PROVIDERS.has(value.provider)) return null;
    if (value.role === "admin" && value.mode !== "login") return null;
    return value;
  } catch {
    return null;
  }
}

export function saveRegistrationDraft(role, email, details) {
  if (!["student", "teacher"].includes(role)) return;
  window.sessionStorage.setItem(
    REGISTRATION_DRAFT_KEY,
    JSON.stringify({ role, email: email.toLowerCase(), details }),
  );
}

export function getRegistrationDraft(email) {
  try {
    const draft = JSON.parse(
      window.sessionStorage.getItem(REGISTRATION_DRAFT_KEY),
    );
    return draft?.email === email?.toLowerCase() ? draft : null;
  } catch {
    return null;
  }
}

export function clearRegistrationDraft() {
  window.sessionStorage.removeItem(REGISTRATION_DRAFT_KEY);
}

export function clearAuthFlow() {
  window.sessionStorage.removeItem(FLOW_STORAGE_KEY);
}
