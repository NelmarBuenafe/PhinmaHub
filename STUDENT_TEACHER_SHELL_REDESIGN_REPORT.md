# PHINMAHUB STUDENT & TEACHER APPLICATION SHELL REDESIGN REPORT

Student and Teacher now share a compact sidebar application shell. General
pages fill the remaining workspace with modest padding; course learning starts
with an icon rail so the lesson receives most of the screen. Repeated horizontal
navigation and centered outer page gutters have been removed from these roles.
Admin retains its existing layout.

## Required report

| # | Item | Implementation/result |
| --- | --- | --- |
| 1 | Shared application shell | `AuthenticatedShell` owns persistent role navigation, utility header, mobile drawer and the routed content outlet. All 13 existing Student/Teacher URLs retain the same existing role guard, now around their shared parent layout. No authentication or authorization implementation changed. |
| 2 | Student sidebar | Dashboard, My Courses, Assignments, using existing Lucide icons. Emerald branding and compact role label. Announcements, Profile and Sign out remain outside primary navigation. |
| 3 | Teacher sidebar | Dashboard, My Courses, Create Course. Course detail pages keep My Courses active; Create Course has its own active item. |
| 4 | Expanded width | 232px. Expanded by default from 1200px unless the user has toggled the current role's navigation. |
| 5 | Collapsed width | 68px. Icons remain available with accessible names and visible hover/focus tooltips. |
| 6 | Sidebar toggle | Compact existing-library open/close icons, 44px button, Collapse navigation/Expand navigation labels and expanded state. Learning pages also allow manual expansion. |
| 7 | Active navigation | Soft emerald background, emerald text/icon, rounded item and restrained left accent; correct `aria-current`. Items are 44px high with 4px gaps. |
| 8 | Utility header | Sticky 60px white header with subtle lower border. Current page context on desktop; mobile menu and PhinmaHub branding. No repeated primary navigation. Header padding aligns with workspace padding. |
| 9 | Notification placement | Icon-only bell at the header right. Existing Student announcements endpoint and role-specific destinations preserved. Student previews show source, title, short body and timestamp, sorted newest first. No fabricated unread counts. Teacher retains the existing My Courses announcement destination because there is no global Teacher announcements route/API. |
| 10 | Profile placement | Existing icon-only account control at far right; identity, role, email and Sign out stay in dropdown. Existing `/student/profile` and `/teacher/profile` destinations and logout callback retained. |
| 11 | Mobile drawer | Below 768px, fixed navigation is hidden. Menu opens a compact 272px drawer constrained to the viewport. Close button, overlay click, Escape and navigation close it. Background becomes inert, body scrolling locks, focus enters and returns, and Tab/Shift+Tab cycle inside. |
| 12 | Tablet behavior | At 768–1199px, default 68px icon rail leaves space for content. User can expand it. Crossing from mobile to tablet closes an open drawer. |
| 13 | Sidebar persistence | No localStorage persistence added. Toggle preference is retained in memory while navigating within the role shell. Learning-page expansion is kept separately, so its automatic collapsed default does not overwrite the normal-page preference. Reload uses responsive defaults. |
| 14 | Student Dashboard spacing | Welcome → stats reduced from 32px to 24px; subsequent dashboard section gaps from 40px to 32px. Two-column mobile stats and four-column wide-desktop stats. Natural-height right panels prevent empty assignment/announcement previews stretching to the larger left card. Existing 60/40 content layout preserved. |
| 15 | Teacher Dashboard spacing | Same compact stats/section rhythm; mobile stats form a two-by-two grid. Existing Welcome, Create Course and My Courses data/content retained. |
| 16 | Course cards | Shell-scoped 20px padding, existing 16–20px grid gaps and responsive two/three-column grids. Removed Teacher description's extra minimum height; title flex container can shrink for wrapping. Status, student count, visibility and manage action retained. |
| 17 | Assignments page | Existing two-column desktop card layout and 16px gaps retained. Header/content gap becomes 24px; outer duplicate padding removed. Submission/filter/action logic unchanged. |
| 18 | Profile page | Existing profile hero/sections retained in a left-aligned 1100px cap; content gap reduced to 24px. Shared workspace handles outer padding. |
| 19 | Student learning special layout | Global icon rail + course outline + flexible viewer. Existing course tabs, lesson controls, progress, assignments and lifecycle states retained. Loading/error states now keep the shell visible. |
| 20 | Global learning sidebar | Initially collapsed to 68px on a course learning route, including desktop. User may expand it; leaving restores the normal-page preference. |
| 21 | Course Content width | 272px from 1280px; 240px at 1024–1279px. Below 1024px it remains the existing full-width collapsible control. Sticky desktop top becomes 84px through the shell's 60px header variable plus 24px clearance. |
| 22 | Lesson Viewer | Flexible `minmax(0, 1fr)` column with `min-width: 0`. Left-aligned text remains capped at 960px; no second centered wrapper. Padding is 24px from 640px and 20px below it. Header/status and lesson actions use the viewer interior width. |
| 23 | Materials layout | Documents use two columns from 640px, one on mobile, with 16px gaps. Materials fill the viewer interior; video retains full card width, rounded corners and 16:9 ratio. Browser fixture checks verified document columns and video ratio in Chrome/Edge. URLs, signed access and material handlers unchanged. |
| 24 | Horizontal spacing | Shell occupies screen width directly. No 1440px centered application wrapper inside Student/Teacher pages. Workspace/header padding: 16px mobile, 24px tablet, 28px from 1200px. Course outline/viewer gap is 24px rather than 28px. |
| 25 | Vertical spacing | Workspace top/bottom padding 24px, or 28px on large desktops. Page content gaps generally 24px, dashboard section gaps 32px. Stat cards have a 96px minimum and 16px padding; inspected mobile cards were compact without filler. Create Course keeps its left-aligned 900px form; announcements use a 960px left-aligned page cap. |
| 26 | Accessibility | Named navigation landmarks, active-route state, icon labels/tooltips, expanded/controls attributes, 44px controls, skip-to-content link and visible focus. Mobile dialog has modal semantics, inert background, scroll lock, Escape, focus return and Tab containment. Existing account menu behavior preserved. |
| 27 | Reduced motion | Sidebar width/color/tooltip transitions and drawer entrance are disabled under reduced motion; existing global accessibility override reduces transition duration to 0.01ms. Local Chrome/Edge checks confirmed effectively disabled sidebar transition. No animation dependency added. |
| 28 | Shared components | Created `AuthenticatedShell`, `RoleSidebar`, `TopUtilityHeader`, `MobileNavigationDrawer`. Reused AccountMenu and NotificationMenu. Updated notification preview presentation, dropdown header offset, lesson skeleton, ProfileDetails spacing and LessonViewer padding. Nested Suspense preserves shell navigation while page chunks load. |
| 29 | Files changed | 24 frontend source files plus this report, listed below. Temporary browser QA helper removed; generated screenshot/JSON evidence remains in ignored `client/dist/shell-qa-artifacts`. |
| 30 | Backend changes | None. API, enrollment, grading, progress, announcements and course lifecycle logic unchanged. |
| 31 | Migration | None. No schema, policy, Storage or database changes. |
| 32 | Frontend lint | Final `npm.cmd run lint`: PASS, exit 0, zero reported errors/warnings. The initial synchronous-effect state warning was resolved by closing drawer state with route changes during rendering. |
| 33 | Frontend build | Final `npm.cmd run build`: PASS, exit 0, 2044 modules. Main JS 529.32kB / 156.96kB gzip; CSS 66.64kB / 12.24kB gzip. No reported build warnings. No dependency changes. |
| 34 | Backend regression | `npm.cmd test`: 41 passed, 0 failed. Route integrity separately verified all 13 existing Student/Teacher paths retain role protection, and Admin remains under AdminLayout. |
| 35 | Remaining manual checks | Live Student/Teacher data, course management, assignments/grading, join flow, signed document viewing, video playback and announcement audiences still require real-account QA. Full keyboard/screen-reader review, Firefox/mobile-device testing, and long-title/URL/error/dialog states remain manual. Headless fixture tests do not verify real authentication or backend workflows. |

## Browser verification

Isolated headless Chrome and Edge each rendered Student Dashboard, Teacher
Dashboard and Course Learning at **375, 768, 1024, 1366, 1440 and 1600px**:
36 viewport/route checks passed, with no page-level horizontal overflow for
those fixtures. Another 12 mobile/desktop checks confirmed document columns,
video aspect ratio and drawer focus containment.

Interactions passed in both browsers: collapse/expand, preference retained
through navigation, learning auto-collapse/manual expansion, drawer focus
entry and Tab/Shift+Tab wrapping, Escape and navigation closure, account initial
focus/Escape focus return, bell timestamp/navigation, and reduced-motion duration.
No runtime exceptions were captured during the successful runs.

The browser fixture used the actual route tree, role guard, shell and page
components with local sample rendering data. External requests were blocked;
no actual account/session credentials or academic data were created or changed.
Initial fixture setup failures were corrected in the temporary test helper;
they were not treated as application defects.

| Viewport | General-page sidebar | Learning sidebar | Header | Workspace padding | Course Content | Lesson text width measured |
| --- | --- | --- | --- | --- | --- | --- |
| 375px | Hidden; drawer | Hidden; drawer | 60px | 16px | 328px, stacked/collapsible | 286px |
| 768px | 68px | 68px | 60px | 24px | 637px, stacked/collapsible | 587px |
| 1024px | 68px | 68px | 60px | 24px | 240px | 579px |
| 1366px | 232px | 68px | 60px | 28px | 272px | 881px |
| 1440px | 232px | 68px | 60px | 28px | 272px | 955px |
| 1600px | 232px | 68px | 60px | 28px | 272px | 960px |

These are measured browser-fixture values, including the browser's 15px
vertical scrollbar where present. Header/workspace padding align, and normal
pages can use the remaining width without another outer centering layer.

Representative inspected screenshots:

- [Desktop Student dashboard](client/dist/shell-qa-artifacts/chrome-1440-student.png)
- [Desktop Course Learning](client/dist/shell-qa-artifacts/chrome-1440-learning.png)
- [Mobile Teacher dashboard](client/dist/shell-qa-artifacts/chrome-375-teacher.png)

All 36 screenshots and four result JSON files are local QA artifacts, ignored
by Git. A subsequent frontend build clears them with `dist`.

## Source files changed in this task

New shared components:

- `client/src/components/common/AuthenticatedShell.jsx`
- `client/src/components/common/RoleSidebar.jsx`
- `client/src/components/common/TopUtilityHeader.jsx`
- `client/src/components/common/MobileNavigationDrawer.jsx`

Shared integration/presentation:

- `client/src/routes/AppRoutes.jsx`
- `client/src/index.css`
- `client/src/components/common/HeaderDropdown.jsx`
- `client/src/components/common/NotificationMenu.jsx`
- `client/src/components/common/Loading.jsx`
- `client/src/components/common/ProfileDetails.jsx`
- `client/src/components/student/LessonViewer.jsx`

Student pages:

- `client/src/pages/student/StudentDashboardPage.jsx`
- `client/src/pages/student/StudentCoursesPage.jsx`
- `client/src/pages/student/StudentJoinCoursePage.jsx`
- `client/src/pages/student/StudentAssignmentsPage.jsx`
- `client/src/pages/student/StudentAnnouncementsPage.jsx`
- `client/src/pages/student/StudentProfilePage.jsx`
- `client/src/pages/student/StudentCoursePage.jsx`

Teacher pages:

- `client/src/pages/teacher/TeacherPage.jsx`
- `client/src/pages/teacher/TeacherCourses.jsx`
- `client/src/pages/teacher/CreateCoursePage.jsx`
- `client/src/pages/teacher/TeacherProfilePage.jsx`
- `client/src/pages/teacher/TeacherCourseOverviewPage.jsx`
- `client/src/pages/teacher/TeacherLessonMaterialsPage.jsx`

The old StudentNav/TeacherNav modules are unused by these routes. RoleNav
continues to serve Admin. Earlier reports describe earlier snapshots; this
report records the final Student/Teacher shell implementation.
