# PhinmaHub staging deployment and QA runbook

This runbook stops at a verified staging release. It does not authorize a
production deployment, production data changes, or `QA_ALLOW_PRODUCTION`.

## Deployment topology

- `client/`: React/Vite single-page application deployed to an HTTPS static
  host with an SPA fallback to `index.html`.
- `server/`: Node.js/Express API deployed as a separate persistent HTTPS web
  service. Build with `npm ci` and start with `npm start` from `server/`.
- Supabase: Auth, PostgreSQL, and the private `lesson-materials` Storage bucket.
  Confirm that the configured project is the intended staging project before
  running any QA fixture command.

Choose one frontend host and one persistent Node host before adding any
provider-specific configuration. Do not add configurations for multiple hosts.

## Required URL relationships

Record the two real HTTPS origins supplied by the selected hosts:

- `STAGING_FRONTEND_ORIGIN=https://<real-frontend-host>`
- `STAGING_BACKEND_ORIGIN=https://<real-backend-host>`

Then configure these relationships without trailing slashes:

- Frontend `VITE_API_URL=${STAGING_BACKEND_ORIGIN}/api`
- Backend `CLIENT_URL=${STAGING_FRONTEND_ORIGIN}`
- Supabase Site URL: `${STAGING_FRONTEND_ORIGIN}`
- Supabase redirect allowlist:
  - `${STAGING_FRONTEND_ORIGIN}/auth/callback`
  - `${STAGING_FRONTEND_ORIGIN}/auth/accept-invite`

Do not use localhost, HTTP, wildcard production redirects, or invented URLs.

## Frontend host environment

Set these variable names in the selected frontend host. The Vite values are
embedded at build time, so rebuild after changing them.

- `VITE_API_URL` — exact HTTPS backend origin followed by `/api`
- `VITE_SUPABASE_URL` — URL of the intended Supabase staging project
- `VITE_SUPABASE_PUBLISHABLE_KEY` — public/publishable key only

Never place `SUPABASE_SECRET_KEY`, `CAPTCHA_SECRET`, a Google client secret, QA
access tokens, or administrator credentials in frontend variables.

## Backend host environment

Set these runtime variable names in the persistent Node service:

- `NODE_ENV=production`
- `PORT` — normally supplied by the host
- `CLIENT_URL` — exact staging frontend HTTPS origin
- `SUPABASE_URL` — intended Supabase staging project
- `SUPABASE_SECRET_KEY` — server-only secret
- `PHINMA_ALLOWED_EMAIL_DOMAINS` — comma-separated exact institutional domains
- `CAPTCHA_SECRET` — securely generated random value with at least 32 characters

`VERIFY_API_URL`, `VERIFY_ADMIN_EMAIL`, and `VERIFY_ADMIN_PASSWORD` are local
diagnostic inputs and are not required by the API runtime. QA variables belong
only in an ignored local `server/.env.qa`; do not set
`QA_ALLOW_PRODUCTION=true` automatically.

## Host configuration

### Backend

1. Configure the service root as `server/`.
2. Install with `npm ci`.
3. Start with `npm start`.
4. Confirm `GET ${STAGING_BACKEND_ORIGIN}/api/health` returns HTTP 200 and a
   safe PhinmaHub API success message.
5. Confirm browser responses allow only `CLIENT_URL` with credentials.

The start command uses `node src/server.js`, reads `process.env.PORT`, and does
not require `nodemon`.

### Frontend

1. Configure the project root as `client/`.
2. Install with `npm ci`.
3. Build with `npm run build`.
4. Publish `client/dist` (or `dist` when the host root is `client/`).
5. Configure the selected host's single SPA fallback so unmatched application
   paths serve `/index.html` with HTTP 200.
6. Directly open and refresh `/student`, `/student/courses`, `/teacher`,
   `/admin`, `/auth/callback`, `/privacy-policy`, and `/terms-of-use`.

Add the smallest provider-specific rewrite only after selecting the host.

## Supabase and Google dashboard checklist

- [ ] Confirm the project is the intended staging project.
- [ ] Set the Supabase Site URL and two exact redirect URLs listed above.
- [ ] Confirm email confirmation is enabled and email templates return users to
      `/auth/callback` or the supplied invite redirect.
- [ ] Confirm the Google provider is enabled in Supabase.
- [ ] In Google Cloud, add the staging frontend origin as an Authorized
      JavaScript origin.
- [ ] Add the exact Supabase callback shown by the provider screen as the Google
      Authorized redirect URI. Hosted projects normally use
      `https://<project-ref>.supabase.co/auth/v1/callback`.
- [ ] Keep the Google client secret only in Supabase provider configuration.
- [ ] Confirm all application tables have their intended RLS policies enabled.
- [ ] Confirm `protect_profile_security_fields`,
      `protect_submission_grading_fields`, and the auth/profile trigger exist.
- [ ] Confirm `lesson-materials` is private with a 10 MB limit.
- [ ] Confirm document reads use short-lived server-generated signed URLs and
      document uploads use server-issued signed upload tokens.

## Isolated QA data

Preferred accounts are one QA Admin, one QA Teacher, QA Student A, and QA
Student B. Do not create them in a production project. If dedicated staging
accounts are unavailable, stop and mark manual QA environment required.

Use one isolated course named `[QA] PhinmaHub Test Course` containing two
modules, three published lessons, one document, one YouTube material, one
external resource, one Google Form, one assignment, and one announcement.
Create it through staging accounts or the guarded QA tooling only.

## Final manual QA checklist

### Authentication and authorization

- [ ] Student and Teacher institutional-email registration, CAPTCHA, email
      confirmation, callback, activation, and correct dashboard routing work.
- [ ] Student and Teacher Google OAuth work; personal accounts and role
      mismatches are rejected.
- [ ] Admin remains absent from public role selection.
- [ ] Admin login and Admin Dashboard, Users, invitations, Courses, Categories,
      Announcements, Study Tools, Messages, Audit Logs, and Settings work.
- [ ] Student, Teacher, and Admin cannot open another role's protected UI.

### Teacher and Student LMS flows

- [ ] Teacher creates the isolated course, modules, lessons, all four material
      types, assignment, and announcement; publishes and copies the join code.
- [ ] Student A joins with the valid code; a duplicate join is rejected.
- [ ] Student B receives a safe error for an invalid code.
- [ ] Course header, module/lesson navigation, objectives, content, materials,
      Previous/Next, completion, and progress updates work.
- [ ] Student saves and edits an assignment draft, submits it, and cannot edit
      after grading; Teacher grades within total points and adds feedback.
- [ ] Draft announcements are hidden, published announcements appear, and
      unpublished announcements disappear.
- [ ] Draft courses reject joins, published courses accept joins, and archived
      courses reject new joins and Student mutations while preserving readable
      historical content.
- [ ] Student A cannot access Student B's submission, grade, progress, profile,
      or private academic state.
- [ ] If a second Teacher exists, Teacher B receives HTTP 403 when modifying
      Teacher A's course-owned resources.

### Browser, responsive, accessibility, and motion

- [ ] Test Chrome, Edge, and Firefox at 375x812, 768x1024, and 1440x900.
- [ ] No page-level overflow, clipping, unreachable controls, or unreadable
      lesson content; desktop tables scroll intentionally when needed.
- [ ] Keyboard-only Tab, Shift+Tab, Enter, Space, and Escape work throughout.
- [ ] Dialog focus enters, remains trapped, closes with Escape, and returns to
      its trigger for delete/remove actions.
- [ ] With reduced motion enabled, entrance translation, stagger, decoration,
      shimmer, and progress motion are removed or minimized while state remains
      clear.
- [ ] Page entrance, card hover, buttons, navigation, progress, dialogs, toasts,
      copy feedback, and skeleton motion feel fast and professional.
- [ ] Run the screen-reader checklist with NVDA for Landing, Login, Student
      Dashboard, Course Learning, Assignment, and one dialog.

### Console, network, routing, and performance

- [ ] DevTools shows no unexplained application errors or warnings.
- [ ] Network requests contain no localhost calls, CORS failures, unexpected
      401/403/500 responses, or failed signed Storage URLs.
- [ ] Direct refresh works on protected and public SPA routes.
- [ ] OAuth and email callbacks have no localhost redirect, loop, or wrong-role
      route.
- [ ] Lighthouse/DevTools reveals no major layout shift, blocking animation,
      huge image, severe accessibility error, or unusably slow first load.

Production remains blocked until this checklist passes with no unresolved
BLOCKER or HIGH issue.
