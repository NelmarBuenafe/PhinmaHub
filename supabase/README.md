# PhinmaHub Supabase foundation

This directory contains the Phase 2 database schema and Row Level Security policies. It does not contain credentials or create authentication users.

## Apply the schema

1. Open the intended project in the Supabase Dashboard.
2. Open **SQL Editor** and create a new query.
3. Copy all of `schema.sql` into the editor.
4. Confirm that you are in the correct project, then select **Run** once.
5. Keep the complete result or error message. The script is repeatable where practical, so it can be rerun after correcting an error, provided the existing objects have not been changed incompatibly.

The script does not use `DROP` or `TRUNCATE`. It creates application tables, indexes, triggers, grants, helper functions, and RLS policies. It does not alter or remove legacy application tables.

## Verify the schema

In **Table Editor**, confirm that these tables exist in the `public` schema:

`profiles`, `student_profiles`, `teacher_profiles`, `courses`, `enrollments`, `course_modules`, `lessons`, `lesson_progress`, `assignments`, `submissions`, `submission_attachments`, `announcements`, `study_tools`, `contact_messages`, and `audit_logs`.

Open **Database > Policies** and confirm that RLS is enabled for every table. Verify that policies exist for the expected admin, teacher, student, and public operations.

You can also run this read-only check in SQL Editor:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles', 'student_profiles', 'teacher_profiles', 'courses',
    'enrollments', 'course_modules', 'lessons', 'lesson_progress',
    'assignments', 'submissions', 'submission_attachments', 'announcements', 'study_tools',
    'contact_messages', 'audit_logs'
  )
order by tablename;
```

## Bootstrap the first administrator

1. Apply `schema.sql` successfully first.
2. Sign in or register once through Supabase Authentication. The auth trigger will create a pending profile; it never grants admin and never activates the account.
3. In **Authentication > Users**, copy the UUID of the account that should become the first administrator.
4. Copy `bootstrap-admin.example.sql` into a new SQL Editor query. Replace only the first all-zero UUID, assigned to `target_user_id`, with that UUID. Leave the second all-zero UUID in the safety check unchanged; do not use Replace All.
5. Run the edited SQL in SQL Editor exactly once.
6. Confirm that exactly one profile is active with the approved role `admin`.

Do not rerun the bootstrap for Student or Teacher accounts. Verified school-email registrations activate through the protected Node server, while Admin-created users receive secure Supabase invitations.

## Credential safety

Never place a Supabase secret key or service-role key in SQL, frontend source files, screenshots, commits, or terminal output. The frontend may use only the publishable key. Keep the secret key only in the ignored `server/.env` file and use it from trusted server code.

Course join codes are intentionally excluded from direct `anon` and `authenticated` column-level `SELECT` grants. A future server endpoint should validate authorization and return or consume a join code using the server-side client.

## Phase 7 assignment submissions

Run `phase7-submission-attachments.sql` after the existing schema and Phase 6 lesson-material migration. It adds normalized `submission_attachments` metadata and the private `assignment-submissions` bucket. The Node server validates ownership, enrollment, lifecycle state, file type, MIME type, size, and link protocol before issuing signed upload or read URLs. The migration is required before Student attachment uploads can work.

## Phase 8 lesson progress

Run `phase8-lesson-progress.sql`, then `phase9-lesson-sections.sql`. Phase 9 backfills a `Lesson Content` section for every lesson, assigns existing materials to it without awarding completion, and adds `lesson_material_progress` plus `lesson_section_reading_progress`. Reading contributes 40% when a section also has required materials (or 100% for content-only sections), using persisted, time-qualified checkpoints. Simply opening a document, video, link, or Google Form never awards credit.

Required YouTube and uploaded MP4/WebM videos play inline and store compact merged watched ranges in `lesson_material_progress`; 95% unique watched coverage is required before they complete. Uploaded videos stay in the private `lesson-materials` bucket and receive a short-lived signed URL only after enrollment is checked. The server allows video files up to 100 MB (documents remain capped at 10 MB). Re-run the idempotent Phase 9 migration after pulling video-progress changes.

## Phase 9 lesson sections

Run `phase9-lesson-sections.sql` after Phase 6 and Phase 8. It adds ordered, publishable lesson sections and section-level progress without removing `lessons.content` or `lesson_materials.lesson_id`. Each existing lesson receives one **Lesson Content** section and its existing materials are attached to it. Historical materials are marked non-required because their previous use was not verifiable; newly added materials default to required metadata.

## Phase 3 authentication update

Projects that applied `schema.sql` before Phase 3 must run `phase3-auth.sql` once in SQL Editor. It makes `requested_role` optional for new Google users so the application can direct them to role selection. It does not change existing requested roles, approved roles, or account statuses.

After that, run `phase3-registration.sql` once to add the student ID, campus and optional teacher-position fields required by the role-specific registration forms. It preserves existing users and approval states. The migration is repeatable, so rerun it if you applied an earlier version before the optional position field was added.

## Phase 4 Admin Dashboard

Run `phase4-admin.sql` once before using the Admin Categories page. It creates the normalized `course_categories` table with RLS, Admin management policies and an active-user read policy. The migration is additive and does not alter or remove existing course records or their current text `category` values.
