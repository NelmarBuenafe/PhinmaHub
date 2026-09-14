# PHINMAHUB REAL ANNOUNCEMENT NOTIFICATION SYSTEM

Implemented a persistent announcement notification flow.

Follow-up fix: corrected an accidental controller placement that called notification generation from the teacher announcement list endpoint (`values` was undefined), which caused the 500 shown while opening the course announcement panel. Notifications now run only after a new publication or a draft-to-published update. Publication fan-out failures now roll back the newly created announcement (or restore a draft's unpublished state), eliminating the previous partial-success state.

- Added `notifications` persistence with recipient ownership, read state, timestamps, source identifiers, and a uniqueness constraint to prevent duplicates.
- Added `phase9-notifications.sql` with indexes and RLS policies; the same table is included in `supabase/schema.sql`.
- Added authenticated endpoints for listing notifications, unread count, marking one read, and marking all read.
- Teacher course announcements notify active enrolled Students only when first published.
- Admin announcements notify active Students, Teachers, or both according to the existing audience field when published.
- Draft saves create zero notifications; republishing an already-notified announcement is idempotent.
- Replaced the announcement preview bell with one shared NotificationMenu for Student, Teacher, and Admin headers.
- Added unread badge (capped at `99+`), accessible labels, optimistic read updates, mark-all-read, destination navigation, and 60-second count refresh.
- No localStorage read state or frontend-supplied recipient IDs are used.

Validation: frontend lint/build passed (one existing-style set-state-in-effect warning in the polling effect), all 50 backend tests passed, and `git diff --check` reported no whitespace errors. Run `supabase/phase9-notifications.sql` before testing against the remote project.
