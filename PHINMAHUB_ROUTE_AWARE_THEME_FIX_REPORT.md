# PHINMAHUB ROUTE-AWARE THEME FIX

1. Root cause confirmed: the before-paint script and React preferences provider applied saved theme globally.
2. Added `client/src/utils/themeRoutes.js` with one shared workspace-route helper and visual-theme resolver.
3. Updated `client/index.html` to apply saved theme before paint only for Student, Teacher, and non-login Admin workspace routes.
4. Updated `UserPreferencesContext` to use the current React Router pathname, including client-side navigation and system-theme changes.
5. Public, authentication, legal, pending, security, and unknown routes now force the active visual theme to light without changing stored preferences.
6. Removed the public dark CSS workaround and `ph-public-light` class usage.
7. Teacher, Student, and Admin workspace routes retain saved Light/Dark/System behavior.
8. No backend, Supabase, database, authentication, role, or redesign changes were made.

Validation: frontend lint passed, frontend production build passed, and all 50 backend tests passed. Browser back/forward and authenticated route transitions should be manually checked with a saved dark preference.
