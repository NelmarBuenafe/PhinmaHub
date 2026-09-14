export function isWorkspaceRoute(pathname = "") {
  if (/^\/student(?:\/|$)/.test(pathname)) return true;
  if (/^\/teacher(?:\/|$)/.test(pathname)) return true;
  return /^\/admin(?:\/|$)/.test(pathname) && pathname !== "/admin/login";
}

export function resolveVisualTheme(preferences, pathname, prefersDark = false) {
  if (!isWorkspaceRoute(pathname)) return "light";
  if (preferences?.theme === "dark") return "dark";
  if (preferences?.theme === "system") return prefersDark ? "dark" : "light";
  return "light";
}
