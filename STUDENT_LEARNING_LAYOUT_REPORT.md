# Student learning layout spacing report

This update changes frontend layout geometry and spacing. Existing lesson selection, completion, progress, assignments, signed document access, video URLs, authentication, and notification/account handlers are preserved.

1. **Previous authenticated max-width:** 1320px, with 16px horizontal padding below 768px and 24px above it.
2. **New authenticated max-width:** 1440px. The same shared `.ph-app-container` retains its responsive padding and automatic outer margins. Existing narrower inner forms remain unchanged.
3. **Previous Course Learning grid:** 288px sidebar, flexible main column, 20px gap from 1024px. Inside the viewer, a centered 72ch wrapper constrained the header, text, materials, and navigation together.
4. **New grid columns:** `280px minmax(0, 1fr)` from 1280px; `240px minmax(0, 1fr)` from 1024px; one column below 1024px. The lesson loading skeleton uses the same columns and gaps.
5. **Sidebar width:** 280px on large desktops; 240px on smaller desktops/tablets. Both columns start at the same grid row. Desktop sticky positioning now uses the existing header height (44px controls + 24px padding + 1px border = 69px), plus 24px clearance. Its scrollable maximum height leaves 24px clearance below as well.
6. **Column gap:** 28px from 1280px; 24px at 1024–1279px. Stacked layouts have a 24px vertical gap.
7. **Extra centering removed:** Removed the outer `.ph-reading` wrapper from LessonViewer and its `mx-auto` styling. Header, materials, and lesson navigation now fill the viewer interior. Only objectives and lesson text use the reading cap.
8. **Lesson reading max-width:** 960px, left aligned, with wrapping preserved. Viewer padding remains 32px from 640px and 20px below it.
9. **Document/material width:** Documents, external resources, and forms use the full viewer interior, with two equal columns from 640px and a 16px gap; one column below 640px. Material URL and access handlers are unchanged.
10. **Video width:** Video cards fill the viewer interior. The existing iframe fills its card interior, retaining its responsive 16:9 aspect ratio, rounded corners, lazy loading, and existing embed URL generation.
11. **Desktop margins:** At 1600px, the 1440px container leaves 80px outer margins; its 24px padding puts visible content edges 104px from either viewport edge. At 1440px, there are no extra outer margins and content begins 24px from either edge.
12. **Tablet:** At 1024px, the sidebar is 240px and main viewer is 712px. At 768px, the workspace stacks and retains the existing initially collapsed Course Content control, leaving the full content width for the viewer.
13. **Mobile:** At 375px, shared padding is 16px, giving a 343px viewer card. Course Content remains collapsible above the viewer. Documents stack into one column; no desktop sticky behavior applies.
14. **Navbar alignment:** RoleNav already uses `.ph-app-container`, so its logo and trailing controls inherit the same 1440px outer grid as the learning workspace and other authenticated pages. Header structure, routes, account dropdown, and notifications were not edited in this update.
15. **Files changed in this update:**
    - `client/src/index.css`
    - `client/src/pages/student/StudentCoursePage.jsx`
    - `client/src/components/student/CourseContentSidebar.jsx`
    - `client/src/components/student/LessonViewer.jsx`
    - `client/src/components/student/LessonMaterials.jsx`
    - `client/src/components/common/Loading.jsx`
    - This report.
16. **Lint:** `npm.cmd run lint` in `client` passed with exit code 0.
17. **Build:** `npm.cmd run build` in `client` passed with exit code 0; 2042 modules transformed. Main bundle: 517.69kB (153.23kB gzip); CSS: 63.99kB (11.66kB gzip).

## Breakpoint verification

The following values are calculated from the implemented CSS at the requested viewport widths, using a standard 16px root font size. Viewer interior subtracts its border and horizontal padding. In stacked layouts, sidebar width is shown as a dash because Course Content occupies its own full-width row.

| Viewport | Container | Outer margin per side | Page padding per side | Sidebar | Horizontal gap | Viewer card | Viewer interior | Reading cap used | Document columns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1600px | 1440px | 80px | 24px | 280px | 28px | 1084px | 1018px | 960px | 2 |
| 1440px | 1440px | 0px | 24px | 280px | 28px | 1084px | 1018px | 960px | 2 |
| 1024px | 1024px | 0px | 24px | 240px | 24px | 712px | 646px | 646px | 2 |
| 768px | 768px | 0px | 24px | — | — | 720px | 654px | 654px | 2 |
| 375px | 375px | 0px | 16px | — | — | 343px | 301px | 301px | 1 |

Vite server rendering checks passed for reading section placement, material grids, video attributes and embed URL, completed/read-only lesson rendering, the initially collapsed mobile outline, and the icon-only Student header with the shared container. `git diff --check` passed. Flexible columns and viewer/material cards retain `min-width: 0`; sidebar title wrappers now allow wrapping in their narrower columns.

No browser surface is available in this session. These checks verify source, rendered markup, and calculated geometry; actual viewport screenshots, sticky scrolling, and runtime horizontal overflow inspection remain unverified.
