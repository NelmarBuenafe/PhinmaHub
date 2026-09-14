-- PhinmaHub Phase 7: multi-format Student assignment submissions.
-- Run after schema.sql. The backend remains the authorization boundary for uploads
-- and signed reads; this table also has defense-in-depth RLS for direct clients.

create table if not exists public.submission_attachments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  type text not null,
  file_name text,
  storage_path text,
  mime_type text,
  file_size bigint,
  external_url text,
  created_at timestamptz not null default now(),
  constraint submission_attachments_type_valid check (type in ('image', 'document', 'video', 'link')),
  constraint submission_attachments_file_size_nonnegative check (file_size is null or file_size > 0),
  constraint submission_attachments_source_valid check (
    (type = 'link' and external_url is not null and storage_path is null and file_name is null and mime_type is null and file_size is null)
    or
    (type in ('image', 'document', 'video') and external_url is null and storage_path is not null and file_name is not null and mime_type is not null and file_size is not null)
  )
);

create index if not exists submission_attachments_submission_idx
  on public.submission_attachments (submission_id, created_at);
create index if not exists submission_attachments_assignment_student_idx
  on public.submission_attachments (assignment_id, student_id);

alter table public.submission_attachments enable row level security;

drop policy if exists submission_attachments_admin_manage on public.submission_attachments;
create policy submission_attachments_admin_manage
on public.submission_attachments for all to authenticated
using (private.is_admin()) with check (private.is_admin());

drop policy if exists submission_attachments_teacher_read on public.submission_attachments;
create policy submission_attachments_teacher_read
on public.submission_attachments for select to authenticated
using (private.owns_assignment(assignment_id));

drop policy if exists submission_attachments_student_read on public.submission_attachments;
create policy submission_attachments_student_read
on public.submission_attachments for select to authenticated
using ((select auth.uid()) = student_id and private.is_enrolled_in_assignment(assignment_id));

drop policy if exists submission_attachments_student_insert on public.submission_attachments;
create policy submission_attachments_student_insert
on public.submission_attachments for insert to authenticated
with check (
  (select auth.uid()) = student_id
  and private.is_enrolled_in_assignment(assignment_id)
  and exists (select 1 from public.submissions s where s.id = submission_id and s.assignment_id = public.submission_attachments.assignment_id and s.student_id = (select auth.uid()) and s.status <> 'graded')
);

drop policy if exists submission_attachments_student_delete on public.submission_attachments;
create policy submission_attachments_student_delete
on public.submission_attachments for delete to authenticated
using (
  (select auth.uid()) = student_id
  and private.is_enrolled_in_assignment(assignment_id)
  and exists (select 1 from public.submissions s where s.id = submission_id and s.status <> 'graded')
);

-- Private bucket. The server enforces 10 MB for images/documents and 50 MB for
-- videos; the bucket ceiling is the larger video limit.
insert into storage.buckets (id, name, public, file_size_limit)
values ('assignment-submissions', 'assignment-submissions', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;
