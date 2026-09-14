# PHINMAHUB STITCH DESIGN IMPLEMENTATION REPORT

## 1. Why the previous implementation differed from Stitch

The previous pass placed the shared utility header above a course page that still behaved like a stacked page, retained course-level tabs, and rendered YouTube as a full responsive iframe. The Stitch reference uses a persistent course-navigation rail beside a lesson workspace and compact horizontal media resources.

## 2. Horizontal Course Content tabs removed

The large Course Content / Assignments tab group was removed. Course assignments remain reachable through the small contextual View course assignments action and the existing `?tab=Assignments` course view; assignment data and submission handlers are unchanged.

## 3. Three-column desktop layout

Student Course Learning now renders global navigation, a dedicated course-content column, and a flexible lesson workspace side by side. The course column remains visible while the lesson is read.

## 4. Global sidebar width

The existing collapsible global sidebar remains in use. It is 240px expanded and 68px collapsed. The default expansion threshold for authenticated workspaces is now 1440px, matching the requested wide-desktop behavior.

## 5. Course Content panel width

The dedicated course panel is 280px on desktop, white, vertically persistent, and separated by a subtle right border. It contains real course code/title, progress, and outline data.

## 6. Lesson Workspace behavior

The workspace fills all remaining horizontal space with a cool gray background, a sticky lesson-column utility header, a breadcrumb, and a clear reading surface. No nested narrow centered wrapper is used for the overall workspace.

## 7. Course progress redesign

Course progress is calculated from the published lessons and student completion state already returned by PhinmaHub. The panel shows completed count, percentage, and a semantic progressbar.

## 8. Module/Lesson navigation redesign

Modules are collapsible sections. Real lessons show completed check icons, neutral not-started circles, completion text, selected emerald background, and a green selected-lesson border.

## 9. Breadcrumb redesign

The single lesson-column utility header shows My Courses, course code, module, and lesson using real available data. Notifications and account/profile actions continue to use the existing components.

## 10. Lesson header

The lesson header is compact, uses the real lesson title with its derived published-order label, and places Completed / Mark as Complete at the right while preserving the existing completion endpoint.

## 11. Learning Objectives

Existing `learning_objectives` content is displayed in a soft emerald Stitch-style panel. Line-separated and simple bullet-separated objectives become a readable list. Empty objectives are omitted.

## 12. Document card size

Documents use compact two-column cards with real title, file name, description, and existing signed access behavior.

## 13. PDF card size

PDFs use the same compact card geometry with a restrained red semantic accent and the existing View PDF signed access action.

## 14. Video card size

YouTube no longer renders a giant iframe by default. It is now a compact horizontal card with a 200px thumbnail when a YouTube ID is available, a play affordance, real title/description, and Watch Video. The existing safe external YouTube URL behavior is preserved.

## 15. External/Google Form layout

External resources and Google Forms use compact two-column cards where space allows, with restrained emerald/violet accents, real descriptions, valid URL hostnames where available, and existing open actions.

## 16. Bottom lesson navigation

Previous/Next uses the real flattened published lesson order. The first lesson shows Course Start, the current position is shown as Lesson N of N, and the last lesson shows Course Complete.

## 17. Vertical spacing reductions

Lesson/objective/content/material/footer spacing was reduced to the requested 24–32px rhythm. Material grids use 16px gaps, and video no longer dominates the page height.

## 18. Responsive behavior

At 1440–1600px the expanded global sidebar is allowed with the 280px course panel. At 1024–1366px the global sidebar defaults to the icon rail while the course panel remains visible. Below 1024px the course panel stacks and its outline becomes collapsible. At mobile widths the existing global drawer remains available and the lesson workspace is full width.

## 19. Files changed

- `client/src/components/common/AuthenticatedShell.jsx`
- `client/src/components/student/CourseContentSidebar.jsx`
- `client/src/components/student/LessonMaterials.jsx`
- `client/src/components/student/LessonViewer.jsx`
- `client/src/pages/student/StudentCoursePage.jsx`
- `client/src/index.css`
- `PHINMAHUB_STITCH_DESIGN_IMPLEMENTATION_REPORT.md`

## 20. Backend changes

None.

## 21. Migration

None.

## 22. Lint

`client`: `npm.cmd run lint` passed with exit code 0.

## 23. Build

`client`: `npm.cmd run build` passed with exit code 0.

## 24. Backend tests

`server`: `npm.cmd test` passed: 41 tests, 41 passed, 0 failed.

## 25. Remaining differences from Stitch

The reference includes semester, author, file-size, estimated-time, video-quality, and other metadata that PhinmaHub does not expose to this page; those remain intentionally omitted. The reference also shows a thumbnail-based video row, now matched without inventing metadata. Authenticated browser comparison at 1600px, 1440px, 1366px, 1024px, 768px, and 375px is still required.
