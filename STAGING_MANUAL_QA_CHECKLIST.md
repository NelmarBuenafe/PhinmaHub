# PhinmaHub final staging manual QA checklist

Status: **MANUAL QA ENVIRONMENT REQUIRED**. No hosted/browser test below has
been performed in this review. Mark each item PASS, FAIL, or BLOCKED only after
running it. A checklist entry describes an expected result, not an observed one.

Use [STAGING_DEPLOYMENT.md](STAGING_DEPLOYMENT.md) to deploy first. Test only the
confirmed staging site and project. Keep passwords, tokens, cookies, signed
Storage links, OAuth codes, and personal account information out of evidence.

## Test record and account matrix

Record privately: actual staging frontend/backend origins, Supabase staging
project, deployed revision, test date, tester, browser/version, viewport, test
ID, result, and sanitized evidence. Store credentials separately in a secure
store; this document contains no real email addresses or credentials.

| Account | Purpose | Provisioning/status |
| --- | --- | --- |
| QA Admin | Invitations, administration, archive operation | Active dedicated staging Admin required; not provisioned here |
| QA Teacher A | Owns isolated QA course; grades assignments | Dedicated institutional staging account required |
| QA Student A | Joins, learns, submits, views grading | Dedicated institutional staging account required |
| QA Student B | Invalid-code, second-student and isolation checks | Separate account required for isolation sign-off |
| QA Teacher B | Cross-teacher ownership checks | Second Teacher required for ownership sign-off |
| Personal Google account | Institutional-domain rejection only | Tester-controlled account; must not become an active school account |

Use separate browser profiles for concurrent roles. No accounts or academic
records were created in this review. The existing fixture tooling requires
`QA_ALLOW_PRODUCTION=true` even to seed QA data; do not bypass or enable that
guard. Prefer creating the isolated data through confirmed staging accounts.

## Environment and hosted smoke checks

| ID | Action | Expected result | Result |
| --- | --- | --- | --- |
| ENV-01 | Verify selected host sites/service, branch and Supabase project designation | All targets explicitly staging; no production data changes | PENDING |
| ENV-02 | Check frontend build settings and variable names | `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` set; HTTPS API ending `/api`; public key only | PENDING |
| ENV-03 | Check backend runtime settings | `NODE_ENV`, `PORT`, `CLIENT_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `PHINMA_ALLOWED_EMAIL_DOMAINS`, `CAPTCHA_SECRET` configured; production mode and exact HTTPS frontend origin | PENDING |
| ENV-04 | Compare frontend/backend Supabase project privately | Both point to intended staging project | PENDING |
| ENV-05 | Open backend `/api/health` | HTTP 200; `{success:true,message:"PhinmaHub API is running"}`; no internal details | PENDING |
| ENV-06 | From staging frontend, inspect API preflight and response | Allow-origin equals configured frontend; credentials allowed; authorization/content-type preflight works | PENDING |
| ENV-07 | Send a request with an unconfigured Origin using API tooling | Origin is not granted browser access; bearer/role authorization remains enforced | PENDING |
| ENV-08 | Complete CAPTCHA in Chrome, Edge and Firefox; inspect cookie attributes without sharing values | HttpOnly, Secure, SameSite=None, `/api/auth`; cookie stored/sent for subsequent auth request, cleared with matching attributes | PENDING |
| ENV-09 | Inspect proxy/rate-limit logs during ordinary auth use | No unexpected forwarding-header validation errors or shared-IP lockouts; no blanket trust change | PENDING |
| ENV-10 | Run read-only SQL queries from runbook in staging Dashboard | All 16 tables have intended RLS; enabled protection/auth triggers; policies match source; private 10 MB bucket | PENDING |
| ENV-11 | Check Supabase Site URL, redirects, confirmation and email templates | Exact staging origin; `/auth/callback` and `/auth/accept-invite` allowed; delivered links target staging | PENDING |
| ENV-12 | Check Supabase Google provider and Google Cloud OAuth client | Staging JS origin, dashboard-provided Supabase provider callback, eligible audience/test users; secret only in provider dashboard | PENDING |

## Authentication

Begin email/OAuth flows in the browser tab that will complete the callback.
The source stores the selected auth flow in tab-scoped `sessionStorage` and
uses PKCE. Test new-tab/new-profile links separately; do not assume they retain
the flow or verifier. No email or OAuth delivery was verified here.

| ID | Action | Expected result | Result |
| --- | --- | --- | --- |
| AUTH-01 | Open `/choose-role` while signed out | Student and Teacher only; no public Admin registration | PENDING |
| AUTH-02 | Student: register institutional email with required details and correct CAPTCHA | Verification email sent; account cannot access dashboard before confirmation | PENDING |
| AUTH-03 | Student: complete verification through `/auth/callback` | Activation succeeds; Student dashboard; no localhost redirect or loop | PENDING |
| AUTH-04 | Teacher: register, CAPTCHA, verify and activate | Teacher dashboard; required registration identity retained | PENDING |
| AUTH-05 | Try incorrect and expired CAPTCHA; fetch a fresh challenge | Safe, understandable error; invalid/expired proof does not authorize auth | PENDING |
| AUTH-06 | Try invalid credentials, duplicate registration and non-institutional email | Safe errors; no unintended active account or role change | PENDING |
| AUTH-07 | Choose Student; Google sign in/register with eligible institutional account | Supabase OAuth callback returns to staging and validated Student role | PENDING |
| AUTH-08 | Choose Teacher; Google sign in/register with eligible institutional account | Validated Teacher role and dashboard | PENDING |
| AUTH-09 | Choose a role and use personal Google account | Institutional-domain rejection; no active school access | PENDING |
| AUTH-10 | Existing Student chooses Teacher, and existing Teacher chooses Student | Mismatched-role access rejected; approved role unchanged | PENDING |
| AUTH-11 | Cancel Google login; open an expired/invalid verification or invitation link | Recoverable safe outcome; no crash, role bypass or redirect loop | PENDING |
| AUTH-12 | Open email verification in a new tab and then a different browser profile | Record actual result; flow/verifier loss must be understandable and recoverable; investigate any inability to activate | PENDING |
| AUTH-13 | Login with dedicated Admin using `/admin/login` | Existing Admin-only login works; correct dashboard | PENDING |
| AUTH-14 | Each role opens another role's route; try pending/suspended/rejected QA account if available | Protected access denied, no private data exposure | PENDING |
| AUTH-15 | Each role refreshes a protected page, then signs out from account dropdown | Session persists appropriately; sign-out closes dropdown and clears local auth; protected pages denied afterward | PENDING |

## Administration

Perform write operations only on isolated QA entities. For messages, use an
existing dedicated staging message if the deployed UI has no submission flow.

| ID | Action | Expected result | Result |
| --- | --- | --- | --- |
| ADM-01 | Open Dashboard, Users, Student filter, Teacher filter and Courses | Correct data/filters; loading, empty and safe error states; no unexplained API failure | PENDING |
| ADM-02 | Invite dedicated QA Student and QA Teacher | Email targets `/auth/accept-invite`; set password; activate and reach approved role | PENDING |
| ADM-03 | Open Categories; create/edit isolated category using available controls | Validated save; list updates; dialogs remain usable | PENDING |
| ADM-04 | Open Announcements and Study Tools; use existing QA create/edit controls | Available actions save correctly; intended audience/active states respected | PENDING |
| ADM-05 | Open Messages, Audit Logs and Settings; change only QA message status if available | Correct page data; log entries for tested writes; existing account/settings actions only | PENDING |
| ADM-06 | Test user/course search and narrow viewport navigation including More | Results scoped to active page; no clipped navigation; bell/account/mobile menus work | PENDING |

## Teacher course setup

Use `[QA] PhinmaHub Test Course`, two modules, three published lessons, one
document, one YouTube video, one external resource, one Google Form, one
assignment, and one course announcement. Keep a private record of generated
IDs and join code for API checks. Do not add file-submission functionality.

| ID | Action | Expected result | Result |
| --- | --- | --- | --- |
| TCH-01 | Login; open Dashboard, My Courses, Create Course and Profile | Existing role routes, data and form validation work | PENDING |
| TCH-02 | Create isolated QA course and open Course Overview | Owned draft course created; content sections accessible | PENDING |
| TCH-03 | Create two modules and three lessons; add objectives and multiline content; publish lessons | Ordering, editing, navigation and published state persist after refresh | PENDING |
| TCH-04 | Upload supported QA document within 10 MB; try unsupported/oversized QA file | Signed upload works; valid document persists; invalid uploads rejected safely | PENDING |
| TCH-05 | Add YouTube, HTTPS external resource and Google Form | Types/URLs validated; saved materials render correctly | PENDING |
| TCH-06 | Create published assignment with instructions, total points, future due time and draft announcement | Saved values persist; draft announcement remains hidden from Students | PENDING |
| TCH-07 | Publish course; copy join code; inspect roster and grading views | Course ready for joins; clipboard works over HTTPS with visible feedback; initial empty states usable | PENDING |

## Student joins, learning and materials

| ID | Action | Expected result | Result |
| --- | --- | --- | --- |
| STU-01 | Student A: My Courses → Join Course → valid QA code | Success; course immediately appears; Teacher roster contains Student A once | PENDING |
| STU-02 | Student A: enter same code again | Already-enrolled outcome; no duplicate enrollment | PENDING |
| STU-03 | Student B: submit invalid code, then valid QA code | Safe invalid-code error; valid join succeeds | PENDING |
| STU-04 | Open course; select modules and lessons; use Previous/Next at boundaries | Correct lesson/title/objectives/content; boundaries disabled safely | PENDING |
| STU-05 | Mark one lesson complete; navigate and refresh | Completion persists for Student A only; module/course/dashboard progress updates correctly | PENDING |
| STU-06 | Open document/PDF as enrolled Student; request a new link after expiry | Server-issued five-minute signed access; file opens; fresh access works; private storage path absent from learning payload | PENDING |
| STU-07 | Play YouTube and use external resource/Google Form buttons | Responsive embed; external links open expected destinations safely | PENDING |
| STU-08 | Open Dashboard, Assignments, Profile and bell preview/View all announcements | Existing data and navigation work; no invented unread count; identity/sign-out remain inside account menu | PENDING |

## Assignment and announcement workflows

| ID | Action | Expected result | Result |
| --- | --- | --- | --- |
| ASN-01 | Student A saves written-answer draft, refreshes, edits and saves | Own draft persists and remains editable | PENDING |
| ASN-02 | Submit assignment; Teacher opens its submissions | Submitted state and correct Student answer visible to owning Teacher | PENDING |
| ASN-03 | Teacher tries score below zero and above total points, then valid score with feedback | Invalid score rejected; valid grade and feedback persist | PENDING |
| ASN-04 | Student refreshes assignment/list | Graded state, score and feedback displayed; answer editing locked | PENDING |
| ASN-05 | Attempt graded resubmission using UI or the real submission API | Mutation blocked; prior graded answer/grade unchanged | PENDING |
| ANN-01 | Student checks Teacher's draft announcement | Draft absent from course/global Student feeds and preview | PENDING |
| ANN-02 | Teacher publishes announcement; Student refreshes | Published announcement visible to intended enrolled audience | PENDING |
| ANN-03 | Teacher unpublishes announcement; Student refreshes | Announcement disappears from all applicable Student views | PENDING |

## Lifecycle, isolation and ownership

Archive only after other mutable workflows have passed. Teacher settings
support draft/published; use the existing Admin course-status control to archive.
All API calls use actual QA IDs and the current role's token privately in API
tooling. No service-role key may substitute for a role user's bearer token.

| ID | Action | Expected result | Result |
| --- | --- | --- | --- |
| LIFE-01 | On a separate isolated draft course, attempt a Student join | Draft join blocked; no enrollment | PENDING |
| LIFE-02 | Publish that QA course and join | Join succeeds | PENDING |
| LIFE-03 | Admin archives QA course; attempt new join with an unenrolled QA account | Archived join blocked | PENDING |
| LIFE-04 | Already enrolled Student reads archived course and prior grades/materials | Historical content remains readable | PENDING |
| LIFE-05 | Student attempts completion of an incomplete archived lesson and draft/submission mutation | UI read-only; API mutation blocked; state unchanged | PENDING |
| ISO-01 | Student B saves a distinct draft and completes a different lesson; compare A/B learning, assignments and profile | Each sees only own submission, grade, progress and private profile fields | PENDING |
| ISO-02 | A token: GET `/api/student/courses/{courseId}/assignments`, GET `/api/student/courses/{courseId}/learning`, GET `/api/student/profile` | Only A's academic/private state returned, even when B shares the course | PENDING |
| ISO-03 | A token: PUT `/api/student/assignments/{assignmentId}/submission` adding a foreign `studentId` field to the normal writtenAnswer/submit body | HTTP 400 from strict validation; no B record changed | PENDING |
| ISO-04 | A token: GET `/api/teacher/assignments/{assignmentId}/submissions`; PUT `/api/teacher/submissions/{submissionId}/grade` with valid QA payload | HTTP 403; no access to B's answer/grade and no mutation | PENDING |
| ISO-05 | On a separate B-only QA enrollment, A requests its learning, assignments and document access via existing Student endpoints | HTTP 403; no academic/material disclosure | PENDING |
| OWN-01 | Teacher B: GET `/api/teacher/courses/{teacherACourseId}`; GET its modules, materials, announcements and submissions through existing routes | HTTP 403 for known Teacher A-owned resources | PENDING |
| OWN-02 | Teacher B: PATCH course settings; PUT module, lesson, assignment, announcement and submission grade; PATCH material using valid QA payloads | HTTP 403 for each resource type; Teacher A state unchanged | PENDING |
| OWN-03 | Teacher B: POST `/api/teacher/courses/{courseId}/modules`, `/assignments`, `/announcements`, `/students`; POST `/api/teacher/modules/{moduleId}/lessons`; POST `/api/teacher/lessons/{lessonId}/materials` and `/materials/upload-url`; DELETE `/api/teacher/courses/{courseId}/students/{enrollmentId}`, using A's QA resource IDs and valid bodies | HTTP 403; no additions/removals; shorthand suffixes belong to their preceding course/lesson route | PENDING |

If role-token API tooling is unavailable, record **MANUAL API TEST REQUIRED**
for ISO/OWN checks. If Teacher B is unavailable, record **MANUAL TEST REQUIRED**;
ownership is not signed off. Do not invent a Student submission-by-ID route:
the current API scopes the submission to the authenticated Student's assignment.

## Responsive, browser, keyboard and assistive technology

Run each visual/navigation check in Chrome, Edge and Firefox at 375×812,
768×1024 and 1440×900. Record results per browser and size, rather than one
aggregate tick. Mobile Chrome/Safari are optional additional checks.

| ID | Action | Expected result | Result |
| --- | --- | --- | --- |
| VIS-01 | Inspect Landing, role selector, Login/Register and policy pages at all sizes | Readable type; no clipped cards, controls or long titles/URLs; no page-level overflow | PENDING |
| VIS-02 | Inspect Admin, Teacher and Student dashboards, lists, forms and learning | Aligned header/content; intentional table scrolling; reachable buttons; readable lessons | PENDING |
| VIS-03 | Inspect 375px/768px learning outline and desktop learning grid | Collapsible outline below 1024px; full-width viewer; desktop sidebar/lesson connected; video/docs fit | PENDING |
| VIS-04 | Inspect account, bell and navigation menus; click outside, toggle twice, Escape, select action | Clean anchored menus; predictable close behavior; Profile routes/sign-out work; no persistent account identity in header | PENDING |
| KEY-01 | Keyboard-only public/role/Admin/Teacher/Student navigation and Login/Register | Tab/Shift+Tab order logical; Enter/Space works; visible focus; no trap | PENDING |
| KEY-02 | Keyboard-only forms, tabs, lesson controls and assignment actions | Controls reachable/operable; errors understandable; state remains clear | PENDING |
| KEY-03 | Open account/bell/mobile menus, navigate available items, press Escape | Visible focus; Escape closes; Account trigger regains focus; actions close menus | PENDING |
| DLG-01 | Open Delete Lesson, Delete Module, Delete Material, Delete Announcement and Remove Student separately on disposable QA entities | Focus enters; Tab/Shift+Tab trapped; Escape closes; focus returns to trigger; fits mobile | PENDING |
| DLG-02 | Cancel each dialog; confirm a deletion only on disposable extra QA entities | Cancel preserves data; confirmed existing action works; no academic production data touched | PENDING |
| SR-01 | NVDA: Landing, Login, Student Dashboard, Course Learning, Assignment and one dialog | Page/title/headings, labels, errors, statuses, progress, dialog title and buttons announced meaningfully | PENDING |

If NVDA is unavailable, record **MANUAL SCREEN READER TEST REQUIRED**. NVDA was
not available on the command path during this review; that is not evidence of a
screen-reader pass or proof that it is absent from the machine.

## Motion, console, network, direct routes and performance

| ID | Action | Expected result | Result |
| --- | --- | --- | --- |
| MOT-01 | Inspect page entrance, dashboard stagger, cards, button hover/press, navigation active state and progress | Subtle, fast, smooth existing motion; no distracting delay or jank | PENDING |
| MOT-02 | Inspect dialog/toast entrance, copied-code feedback and loading skeletons | Clear feedback; restrained motion; no blocked interaction | PENDING |
| MOT-03 | Enable OS/browser Reduce Motion and repeat motion checks | Translation/stagger/decorative motion and shimmer removed/reduced; progress motion minimized; state feedback remains clear | PENDING |
| DEV-01 | Inspect console throughout all core flows | No unexplained app warnings/errors; exclude only identified unrelated extension errors | PENDING |
| DEV-02 | Inspect Network throughout auth, joins, uploads, learning, submissions and grading | Correct HTTPS API; no localhost, mixed-content, CORS, unexplained 401/403/500, or failed signed-file requests | PENDING |
| DEV-03 | Directly open and refresh `/student`, `/student/courses`, `/student/announcements`, `/teacher`, `/teacher/courses`, `/admin`, `/auth/callback`, `/auth/accept-invite`, `/privacy-policy`, `/terms-of-use` | Host serves SPA without provider 404; protected/callback routes apply normal app auth handling | PENDING |
| DEV-04 | Follow real OAuth, confirmation and invitation callbacks | Staging origin; correct activation/role destination; no localhost, redirect loop or leaked auth code in evidence | PENDING |
| DEV-05 | Run DevTools/Lighthouse spot check on Landing and a role dashboard/lesson | No severe layout shift, blocking motion, giant assets, accessibility errors or unusably slow first load; record metrics without chasing perfect score | PENDING |

## Findings and release gate

Record failures with test ID, revision, browser/viewport, reproduction steps,
expected/actual result, severity, sanitized evidence, and fix/retest status.

| Severity | Classification |
| --- | --- |
| BLOCKER | Login/backend/CORS/OAuth/direct-routing failure, role bypass, data-isolation failure, or core-workflow 500 |
| HIGH | Broken join, material access, assignment submission or grading |
| MEDIUM | Observed mobile overflow, dialog/usability/accessibility issue |
| LOW | Minor observed cosmetic alignment or motion timing issue |

Fix only reproduced problems. After application fixes, run frontend lint/build,
backend tests and read-only schema verification; redeploy staging and retest.
Stop on schema mismatch without applying destructive fixes.

Staging sign-off requires no unresolved BLOCKER/HIGH, passing automated checks,
verified email and Google OAuth, CORS/cookies/direct refresh, all three role
logins, joins, materials, assignment grading, lifecycle/isolation/ownership,
responsive testing, and keyboard checks. Preserve individual pending statuses
for screen reader, reduced motion and browser tests until performed.

Current sign-off: **NOT READY FOR PRODUCTION**. This phase may end at
**STAGING VERIFIED** only after the required evidence exists. Production
deployment requires a separate explicit instruction after QA approval.
