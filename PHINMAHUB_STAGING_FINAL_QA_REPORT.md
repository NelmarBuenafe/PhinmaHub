# PHINMAHUB STAGING DEPLOYMENT & FINAL QA REPORT

Review date: 2026-09-13. Result: **MANUAL DEPLOYMENT STEP REQUIRED** and
**NOT READY FOR PRODUCTION**. No staging or production deployment occurred.
Automated checks pass; hosted/manual QA remains pending.

Use [STAGING_DEPLOYMENT.md](STAGING_DEPLOYMENT.md) for the exact deployment
sequence and [STAGING_MANUAL_QA_CHECKLIST.md](STAGING_MANUAL_QA_CHECKLIST.md)
for the account matrix, isolated course, test steps, expected outcomes, evidence
records and release gate. Pending tests are not application failures or passes.

## Required 44-point report

| # | Item | Result and evidence |
| --- | --- | --- |
| 1 | Staging deployment status | **MANUAL DEPLOYMENT STEP REQUIRED**. No selected host configuration, linked host project, host CLI, or configured deployment target for this repository was found. A generic website connector does not establish an authorized staging target for this existing Express/Supabase application. |
| 2 | Staging frontend URL | Unavailable. No actual URL invented or hardcoded. |
| 3 | Staging backend URL | Unavailable. No actual URL invented or hardcoded. |
| 4 | Deployment topology | `client/`: React 19 + Vite 8 SPA served by an HTTPS static host. `server/`: Express 5 on a separate persistent Node HTTPS service. Supabase provides PostgreSQL, Auth and private Storage. API starts with `node src/server.js` via `npm start`, uses `process.env.PORT`, and does not need nodemon. Installed dependencies require a Node version satisfying Vite `^20.19.0 || >=22.12.0` and Supabase SDK `>=22.0.0`; local checks used Node 24.5.0. |
| 5 | Deployment files added/changed | Updated `.gitignore` and the existing `STAGING_DEPLOYMENT.md`; added `STAGING_MANUAL_QA_CHECKLIST.md` and this report. No provider-specific config added because the provider is unknown. No runtime code, dependencies, migrations, or private environment files changed in this phase. Earlier UI changes remain in the working tree. |
| 6 | Frontend environment checklist | Required names: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Local values exist; API targets localhost without HTTPS and is unsuitable for staging. Supabase key classified as publishable; no frontend secret/service-role key or forbidden secret variable name found in audited local frontend env. Configure actual HTTPS backend plus `/api` at the host, then rebuild. |
| 7 | Backend environment checklist | Runtime names: `NODE_ENV`, `PORT`, `CLIENT_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `PHINMA_ALLOWED_EMAIL_DOMAINS`, `CAPTCHA_SECRET`. Set production mode for HTTPS staging; `PORT` may be supplied by host. Local runtime inputs exist except explicit production mode; frontend origin is local. CAPTCHA length meets the production minimum. `SUPABASE_PUBLISHABLE_KEY` exists locally but is used by diagnostic tooling, not the API server client. Legacy domain fallback is `ALLOWED_GOOGLE_DOMAIN`. `VERIFY_*` and QA credentials are not runtime deployment requirements. |
| 8 | Supabase configuration status | Local frontend/backend project URLs match, without exposing them. Designation of that project as staging is unconfirmed. Live read-only table/bucket verification passed for the currently configured project. Site URL, redirect allowlist, provider settings and intended staging project still need Dashboard verification. |
| 9 | Google OAuth configuration | Source uses Supabase `signInWithOAuth`, current-origin `/auth/callback`, PKCE session URL detection, and server identity/role validation. Google Cloud and Supabase provider dashboards were not accessed. Staging JS origin, exact dashboard-supplied provider callback, audience/test-user eligibility and actual Student/Teacher OAuth are pending. |
| 10 | Email verification | Source supplies `/auth/callback` for registration and `CLIENT_URL` plus `/auth/accept-invite` for invitations. Email delivery/templates, confirmation, activation and role routing were not tested. Callback requires a saved tab-scoped auth flow; new-tab/profile links are explicitly included in QA. |
| 11 | SPA routing/direct refresh | Source defines required routes, including Student/Teacher/Admin and both Auth callbacks/policy pages. Hosting fallback cannot be verified without a host. Runbook requires one selected-host SPA fallback to `index.html`; direct-open/refresh tests remain pending. |
| 12 | CORS | Source uses exact configured `CLIENT_URL` with credentials. Local HTTP smoke checks passed for configured-origin credentialed preflight and no access grant to an unconfigured origin. Hosted HTTPS CORS is not verified. Production cookie unit test passes; actual cross-site storage/transmission and reverse-proxy rate limits need browser/host checks. |
| 13 | Storage | Live read-only verification: `lesson-materials` exists, is private, and has 10485760-byte limit. Source authorizes Student access and creates five-minute signed document URLs server-side; uploads use server-issued signed tokens. Actual staging upload/view/expiry tests pending. |
| 14 | RLS/trigger review | Source contains RLS/policies and profile, submission-grading, progress-normalization and auth-profile protection triggers. Live policy/trigger metadata was not verified. Runbook provides read-only Dashboard queries for all 16 tables, policies, enabled triggers and private bucket. Schema read success using the server key does not prove role isolation. |
| 15 | Secret/Git audit | No private `.env` or generated `node_modules`/`dist` files tracked. No likely real-key/private-key/JWT secret markers found in scanned tracked source. Local frontend env contains public key only; built client was also checked against server Supabase secret, CAPTCHA secret and diagnostic Admin password without printing values. Fixed missing `.env.*` ignore coverage; `.env.example` remains trackable. Audit is a targeted scan, not a guarantee about repository history or external host secrets. |
| 16 | Dependency audit | Requested npm audits completed against the public npm registry: client **critical 0, high 0, moderate 0, low 0**; server **critical 0, high 0, moderate 0, low 0**. No upgrades needed. Initial sandbox attempts failed; network-enabled reruns succeeded. Client approval review first rejected metadata transmission; registry/package checks established public dependency metadata and the explicitly requested audit was subsequently approved. |
| 17 | Frontend lint | PASS, exit 0, zero reported errors/warnings. Final `npm.cmd run lint` completed. |
| 18 | Frontend build | PASS compilation, exit 0, 2042 modules transformed, no reported build warnings. This used local environment inputs because no real staging URLs/config were available; it is not a validated production-like staging artifact. Existing runtime intentionally rejects its localhost API setting. Rebuild on selected host with actual staging variables before publishing. |
| 19 | Bundle size | Main JS 517.69kB / 153.23kB gzip, versus supplied baseline 520.17kB / 154.31kB gzip: lower by 2.48kB / 1.08kB. CSS 63.99kB / 11.66kB gzip. No application-code change in this phase. |
| 20 | Backend tests | PASS: **41 passed, 0 failed**, including final regression run. Unit tests do not substitute for hosted end-to-end/manual QA. |
| 21 | Schema verification | PASS, exit 0: selected expected columns available in all 16 tables; private 10 MB materials bucket passes. Initial network-restricted attempt showed EACCES and was stopped; network-enabled `npm.cmd run verify:schema` passed. No schema mismatch or migration introduced. Verification is for current local project configuration, not a confirmed separate staging project. |
| 22 | Admin QA | Not performed. ADM-01–06 and AUTH-13 cover dashboard, users/invites, filters, courses, categories, announcements, study tools, messages, audit logs and settings. Dedicated QA Admin required. |
| 23 | Teacher QA | Not performed. TCH-01–07 specify complete isolated-course authoring, material upload, publishing and copied join code. Dedicated QA Teacher required. |
| 24 | Student QA | Not performed. STU-01–08 cover role pages, joined-course learning, controls, progress and menus. Two dedicated Students required for full isolation sign-off. |
| 25 | Join Course QA | Unit tests pass for normalization, published-only joins and authenticated enrollment ownership. Hosted valid/duplicate/invalid joins and roster refresh remain pending. |
| 26 | Lesson/material QA | Relevant completion/material validation unit tests pass; server signed-access source reviewed. Hosted document, YouTube, external link, Google Form, navigation, completion and progress remain pending. |
| 27 | Assignment/grading QA | Grade bounds and graded-edit protection unit tests pass. Draft → edit → submit → Teacher grade/feedback → Student locked graded view and blocked resubmission remain pending. |
| 28 | Announcement QA | Draft/schema unit tests pass. Draft hidden → published visible → unpublished hidden remains pending in Student feeds/previews. |
| 29 | Course lifecycle QA | Published-only join and archived mutation unit tests pass. Hosted draft/published joins, Admin archive, new-join rejection, historical reading and mutation rejection remain pending. |
| 30 | Student isolation QA | No live role-token isolation test performed. **MANUAL API TEST REQUIRED** unless private API tooling is supplied; ISO-01–05 use existing scoped endpoints and two Students. No foreign-submission route invented. |
| 31 | Teacher ownership QA | No second QA Teacher verified and no live ownership test performed. **MANUAL TEST REQUIRED**; OWN-01–03 specify known foreign-owned resources and expected 403/no mutation. |
| 32 | Responsive QA | 375×812: pending. 768×1024: pending. 1440×900: pending. Earlier layout geometry/render checks are not staging browser tests. |
| 33 | Browser QA | Chrome: pending. Edge: pending. Firefox: pending. Browser surface inventory returned no available browsers/apps. Mobile Chrome/Safari optional when available. |
| 34 | Keyboard accessibility QA | Not performed. KEY-01–03 and DLG-01–02 cover focus/order, menus, forms, tabs, lesson/assignment controls and dialog trapping/return. |
| 35 | Screen reader QA | **MANUAL SCREEN READER TEST REQUIRED**. No NVDA command found; this does not prove it is absent from the machine. SR-01 lists pages and required announcements. |
| 36 | Reduced-motion QA | Not performed. MOT-03 specifies OS/browser setting and entrance, stagger, decoration, shimmer/progress checks. |
| 37 | Premium motion QA | Not performed. MOT-01–02 cover the existing motion and state feedback without requesting a redesign. |
| 38 | Browser console findings | No browser console inspected; no clean-console claim. DEV-01 specifies recording actual app errors/warnings. Local health smoke requests succeeded. |
| 39 | Network/API findings | Local health and CORS smoke PASS. First schema attempt was network denied; rerun passed. Local frontend API targets localhost; wrong for any staging publish. Hosted auth/API/storage requests, cookies, unexpected 401/403/500 and mixed-content checks pending. |
| 40 | Bugs fixed during staging preparation | Confirmed Git ignore gap fixed: private `.env.production`, `.env.staging` and other `.env.*` variants now ignored while `.env.example` is exempt. No hosted app bug was observed; no auth/backend/UI/database behavior changed. |
| 41 | Remaining issues by severity | **BLOCKER release prerequisites:** no configured staging target/origins, unconfirmed intended staging project, and missing critical hosted auth/core-flow/isolation/routing evidence. These are readiness gaps, not reproduced app defects. **HIGH:** none confirmed; core workflow verification pending. **MEDIUM:** none observed; responsive/accessibility checks pending. **LOW:** none open from this review; ignore gap resolved. |
| 42 | Manual checks still required | Select/configure hosts and real origins; confirm staging project and Dashboard settings/RLS/triggers; provide dedicated QA accounts; rebuild/deploy staging; run all pending checklist rows including three browsers, three sizes, keyboard, dialogs, screen reader, motion, console/network and performance. Record evidence/retest any failures. No QA seed/reset/mutation tooling was run. |
| 43 | Final result | **NOT READY FOR PRODUCTION**. Staging is prepared/documented, not deployed or manually verified. |
| 44 | Exact reasons | Production gate lacks verified Google OAuth/email delivery and callbacks, hosted CORS/cookies/direct refresh, all-role login and end-to-end joins/materials/grading/lifecycle/isolation/ownership, responsive and keyboard evidence. Current local build embeds an unsuitable localhost API target. No actual staging URLs or configured target are available. Production remains prohibited until staging sign-off and a later explicit production instruction. |

## Verified commands and scope

Frontend: `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd audit --json`.
Backend: `npm.cmd test`, `npm.cmd run verify:schema`, and `npm.cmd audit --json`.
Additional checks: local HTTP health/CORS smoke, sanitized env/key classification,
tracked-file/secret-marker scan, built-client server-secret comparison, ignore
coverage, host-link/tool inventory, and `git diff --check`.

The schema and audit reruns required network permission; output was limited to
safe table/bucket results and vulnerability counts. Environment values were
not printed or written to reports. No database changes, resets, QA fixture
creation, RLS/Storage security changes, deployment, or production bypass occurred.

For external setup, the runbook references the current official
[Vite static deployment guide](https://vite.dev/guide/static-deploy),
[Supabase redirect URL guide](https://supabase.com/docs/guides/auth/redirect-urls),
and [Supabase Google provider guide](https://supabase.com/docs/guides/auth/social-login/auth-google).
