# PHINMAHUB GOOGLE-CLASSROOM-INSPIRED ASSIGNMENT UX REPORT

1. **Assignment secondary sidebar removed:** The former assignment-list component and its layout styles are removed. Assignment pages use only the global Student sidebar.
2. **Assignment Overview implemented:** `/student/assignments` is a dedicated coursework page using real enrolled-course assignments.
3. **Assignment Detail implemented:** `/student/assignments/:assignmentId` is a dedicated detail and submission page.
4. **Open Assignment routing:** Every overview card has exactly one primary action: **Open Assignment**.
5. **Back to Assignments:** Detail pages provide **Back to Assignments**, returning to `/student/assignments`.
6. **Main information:** Course, title, due date, points, and real submission status are shown.
7. **Instructions:** Teacher instructions are rendered as readable preserved text; an empty value states that no instructions were added.
8. **Your Work panel:** A 320px sticky desktop panel contains status, uploaded work, upload/link controls, and submission actions.
9. **Text submission:** The answer field remains in the main content column.
10. **Image upload:** JPG/JPEG, PNG, and WEBP files are supported with local thumbnail previews.
11. **Drag/drop:** The attachment area supports dropping files or selecting them through the file picker.
12. **DOC/DOCX:** Both formats are supported as compact attachment cards.
13. **PDF:** PDF upload and signed preview access are supported.
14. **Video:** MP4 and WebM files are shown as compact attachments; the Student form has no large video player.
15. **Links:** Up to five validated HTTP/HTTPS links can be added.
16. **Limits:** Server-enforced limits are five files, five links, 10 MB per image/document/PDF, and 50 MB per video.
17. **Private Storage:** The application is configured to use the private `assignment-submissions` bucket; the remote verifier confirmed that this bucket still needs to be created by the Phase 7 migration.
18. **Attachment schema:** `submission_attachments` stores normalized metadata only; files are never stored as database binary or base64.
19. **Migration:** **MIGRATION REQUIRED: YES** for deployed projects missing the Phase 7 table/bucket. Apply `supabase/phase7-submission-attachments.sql` incrementally.
20. **Signed URLs:** Student and eligible Teacher reads use server-issued five-minute signed URLs.
21. **Student security:** Ownership, enrollment, assignment publication, path ownership, lifecycle, type, size, and count are validated server-side.
22. **Teacher security:** Attachment access checks that the Teacher owns the assignment's course.
23. **Draft behavior:** Students can save text or attachments as a draft.
24. **Submitted behavior:** Submitted/late work remains visible and editable only while the existing lifecycle permits it.
25. **Graded behavior:** Graded submissions show score, feedback, answer, attachments, and links read-only.
26. **Teacher viewing:** The existing Teacher submission screen lists student files/links and opens private files through authorized signed URLs.
27. **Desktop:** Content and the 320px sticky work panel use a two-column layout; no assignment sidebar exists.
28. **Tablet:** The work panel stays in flow rather than squeezing the content.
29. **Mobile:** The detail grid becomes one column with the work panel after the answer.
30. **Intentionally omitted:** Google branding/integrations, rubrics, comments, calendar, export, quick submit, GPA, ranking, and fabricated metrics.
31. **Key files changed:** `StudentAssignmentsPage.jsx`, `AssignmentDetail.jsx`, `AppRoutes.jsx`, `AuthenticatedShell.jsx`, `TopUtilityHeader.jsx`, `index.css`, the attachment controller/routes/tests, and `phase7-submission-attachments.sql`.
32. **Lint:** `npm.cmd run lint` passes.
33. **Build:** `npm.cmd run build` passes.
34. **Backend tests:** `npm.cmd test` passes: 46 tests.
35. **Schema verification:** The remote check confirmed all required tables, including `submission_attachments`. It reported that `assignment-submissions` is not yet available, so live attachment uploads remain blocked until the Phase 7 migration is applied.

The required workflow is now: **Assignments Overview → Open Assignment → Assignment Detail / Submission**.
