# PhinmaHub

PhinmaHub is a role-based school learning platform built with React, Express and Supabase. Its authentication workflow supports email/password and Google OAuth, a math CAPTCHA, verified institutional-email activation, administrator invitations, role-protected routes, database tables and Row Level Security. Public, Student and Teacher course lists load from the database.

## Technology stack

- React 19, Vite 8, Tailwind CSS 4 and React Router
- Node.js and Express 5
- Supabase Auth and PostgreSQL with Row Level Security
- JavaScript

## Install

From the repository root:

```powershell
cd client
npm.cmd install
cd ../server
npm.cmd install
```

## Environment setup

Copy the templates if private environment files do not exist:

```powershell
Copy-Item client/.env.example client/.env
Copy-Item server/.env.example server/.env
```

`client/.env` requires:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_URL=http://localhost:5000/api
```

`server/.env` requires:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
PHINMA_ALLOWED_EMAIL_DOMAINS=
CAPTCHA_SECRET=
```

Set `PHINMA_ALLOWED_EMAIL_DOMAINS` to a comma-separated allowlist of exact domains after `@`, for example `students.school.example,staff.school.example`. Domain comparison is exact and case-insensitive. The legacy `ALLOWED_GOOGLE_DOMAIN` name is accepted as a temporary fallback. Use a securely generated random value of at least 32 characters for `CAPTCHA_SECRET`.

Never put `SUPABASE_SECRET_KEY`, `CAPTCHA_SECRET`, or a Google Client Secret in the frontend, screenshots, commits, SQL files or logs. The Google Client Secret belongs only in the Supabase provider configuration.

## Database setup

For a fresh project, run `supabase/schema.sql` in Supabase SQL Editor.

If Phase 2 was already applied before the authentication phase, run `supabase/phase3-auth.sql` once. It makes `requested_role` nullable for new users and updates the registration trigger. It does not modify existing approved roles or account statuses.

After that, run `supabase/phase3-registration.sql` once. It adds the student ID and campus fields needed by the new Student and Teacher registration forms. Fresh databases created with the current `schema.sql` already contain these fields.

See `supabase/README.md` for schema verification and first-admin instructions.

Before using the Admin Dashboard Categories page, run `supabase/phase4-admin.sql` once. It safely adds the missing normalized course-categories table and keeps RLS enabled.

## Configure Google Cloud OAuth

1. Open Google Cloud Console and select or create a project.
2. Configure the Google Auth Platform branding, audience and data access.
3. Include the `openid`, email and profile scopes required by Supabase.
4. Create an OAuth client with application type **Web application**.
5. Add this Authorized JavaScript origin:

```text
http://localhost:5173
```

6. In Supabase Dashboard, open **Authentication > Providers > Google** and copy the callback URL shown there.
7. Add that Supabase callback URL to Google Cloud under **Authorized redirect URIs**. For a hosted Supabase project it normally resembles:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

8. Save the Google Client ID and Client Secret in the Supabase Google provider screen. Do not add the Google Client Secret to this repository.

## Configure Supabase Auth URLs

In **Supabase Dashboard > Authentication > URL Configuration**, set:

```text
Site URL: http://localhost:5173
Redirect URL: http://localhost:5173/auth/callback
Redirect URL: http://localhost:5173/auth/accept-invite
```

Use exact production URLs when deploying. Avoid broad production wildcards.

## Run locally

Frontend terminal:

```powershell
cd client
npm.cmd run dev
```

Backend terminal:

```powershell
cd server
npm.cmd run dev
```

Open `http://localhost:5173`. The health endpoint is available at `http://localhost:5000/api/health`.

## Tests

```powershell
cd server
npm.cmd test

cd ../client
npm.cmd run lint
npm.cmd run build
```

## Manual authentication checklist

- `/` stays public and its **Login or Register** button opens `/choose-role`.
- `/choose-role` offers only Student and Teacher. Administrators use the direct `/admin` or `/admin/login` URL.
- `/auth/student` and `/auth/teacher` provide Login and Register tabs for Supabase email/password authentication, with Google shown as an optional alternative.
- Google redirects back to `http://localhost:5173/auth/callback`.
- The signed addition CAPTCHA appears after the normal form fields and before the primary Login or Register button.
- An incorrect answer is rejected and an expired challenge requires a new question.
- A Google account matching `PHINMA_ALLOWED_EMAIL_DOMAINS` is activated for its selected Student or Teacher role.
- A Google or email/password account outside the institutional allowlist is rejected and redirected to the school-email-required page.
- Email/password registration uses Supabase Auth for password storage and requires Supabase email confirmation.
- A verified self-registration activates automatically; no administrator approval is required.
- Registration identity comes from the verified Supabase access token. Metadata is treated as untrusted input and validated again by the server.
- Admins invite Students and Teachers from User Management. Invited users create their own password through `/auth/accept-invite`.
- An unverified registration remains pending only until the school email is confirmed.
- Pending, suspended and rejected accounts cannot open dashboards.
- Active admins, teachers and students are routed using `approved_role` from the database, not the temporary role choice.
- A mismatched Google Student/Teacher choice is rejected and never changes the existing role.
- Signing out removes the local Supabase session.

Google OAuth must be configured in both Google Cloud and Supabase and tested manually before it can be considered operational.
