# PHINMAHUB STUDENT ASSIGNMENT WORKSPACE REPORT

## 1. Previous incorrect workflow

Assignments were rendered through the course-learning page, which left lessons in the contextual sidebar and used a course query/tab as the assignment destination.

## 2. Global Assignments route

The global Student Assignments link remains a direct `/student/assignments` destination. Dashboard assignment links now also open `/student/assignments?assignment=<id>`.

## 3. Course Assignment tab removed

The course-learning page no longer has Course Content / Assignments tabs.

## 4. View Course Assignments button removed

The contextual course assignment shortcut was removed from the course-content sidebar.

## 5. Course Learning cleanup

Course Learning now contains only course progress, modules, lessons, lesson content, objectives, materials, and previous/next lesson navigation.

## 6. New Assignment contextual sidebar

`AssignmentListSidebar` provides the second column for the assignment workspace. It never renders modules, lessons, or lesson progress.

## 7. Assignment list design

Each real assignment shows title, course code, due date, and an accessible status badge. Selected items use the existing soft emerald/left-accent visual language.

## 8. Assignment filters

Compact All, Pending, Submitted, and Graded pills are backed by authoritative API submission statuses. Pending includes pending/draft; Submitted includes submitted/late.

## 9. Assignment selection behavior

Selecting a list item updates only the main detail viewer; the assignment list sidebar stays in place.

## 10. Assignment URL/deep-link behavior

Selection is stored in `?assignment=<assignmentId>`. Refreshing a selected assignment URL reopens that assignment. A direct `/student/assignments` visit selects the first prioritized assignment on desktop and initially shows the list on mobile.

## 11. Pending state

Pending assignments show instructions, due date, total points, an answer textarea, Save Draft, and Submit Assignment.

## 12. Draft state

Draft assignments reopen with the existing answer and retain Save Draft and Submit Assignment controls.

## 13. Submitted state

Submitted/late assignments show submitted date and existing answer. Editing/resubmission remains available because the existing server lifecycle permits it until grading.

## 14. Graded state

Graded assignments show Graded, score, teacher feedback, and student answer in read-only sections. Save/submit controls are not rendered.

## 15. Course relationship preserved

Assignments continue to belong to their backend courses. The workspace aggregates only the authorized assignments returned by `/student/assignments`.

## 16. Global sidebar active states

The existing route-aware `RoleSidebar` marks My Courses active on course pages and Assignments active on `/student/assignments`.

## 17. Desktop layout

The assignment workspace uses the global sidebar, a 280px assignment list sidebar, and a flexible detail workspace.

## 18. Tablet behavior

At 1024px and below the global sidebar can be collapsed and the assignment list/detail areas stack when the viewport needs more room.

## 19. Mobile behavior

At mobile widths the global nav remains the existing drawer. The assignment list is shown first; selecting an assignment switches to full-width detail with Back to Assignments.

## 20. Files changed

- `client/src/components/common/AuthenticatedShell.jsx`
- `client/src/components/student/StudentWorkspaceHeader.jsx`
- `client/src/components/student/AssignmentListSidebar.jsx`
- `client/src/components/student/AssignmentDetail.jsx`
- `client/src/pages/student/StudentAssignmentsPage.jsx`
- `client/src/pages/student/StudentCoursePage.jsx`
- `client/src/pages/student/StudentDashboardPage.jsx`
- `client/src/components/student/CourseContentSidebar.jsx`
- `client/src/index.css`
- `PHINMAHUB_STUDENT_ASSIGNMENT_WORKSPACE_REPORT.md`

## 21. Backend changes

None.

## 22. Database changes

None. No migration or Supabase schema change was made.

## 23. Frontend lint

`client`: `npm.cmd run lint` passed with exit code 0 after the assignment workspace changes.

## 24. Frontend build

`client`: `npm.cmd run build` passed with exit code 0 after the assignment workspace changes.

## 25. Backend tests

`server`: `npm.cmd test` passed: 41 tests, 41 passed, 0 failed.
