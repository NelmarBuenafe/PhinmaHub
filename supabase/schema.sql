-- PhinmaHub Phase 2 database foundation.
-- Safe to rerun on a database where these objects have not been changed incompatibly.
-- This script never creates users and contains no credentials.

create schema if not exists private;
revoke all on schema private from public;

do $$
begin
  create type public.ph_app_role as enum ('admin', 'teacher', 'student');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ph_account_status as enum ('pending', 'active', 'suspended', 'rejected');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ph_course_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ph_enrollment_status as enum ('active', 'completed', 'removed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ph_submission_status as enum ('draft', 'submitted', 'late', 'graded');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ph_course_visibility as enum ('public', 'private', 'unlisted');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ph_announcement_audience as enum ('all', 'teachers', 'students', 'course');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  middle_name text,
  last_name text,
  avatar_url text,
  school_id text,
  requested_role public.ph_app_role,
  approved_role public.ph_app_role,
  account_status public.ph_account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_requested_role_not_admin check (requested_role is null or requested_role <> 'admin'),
  constraint profiles_email_not_blank check (btrim(email) <> ''),
  constraint profiles_school_id_not_blank check (school_id is null or btrim(school_id) <> '')
);

create table if not exists public.student_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  student_id text,
  campus text,
  program text,
  year_level text,
  section text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_id_not_blank check (student_id is null or btrim(student_id) <> ''),
  constraint student_campus_not_blank check (campus is null or btrim(campus) <> '')
);

create table if not exists public.teacher_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  campus text,
  department text,
  position text,
  employee_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_employee_id_not_blank check (employee_id is null or btrim(employee_id) <> ''),
  constraint teacher_campus_not_blank check (campus is null or btrim(campus) <> '')
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  course_code text not null,
  title text not null,
  description text,
  category text,
  difficulty text,
  thumbnail_url text,
  visibility public.ph_course_visibility not null default 'private',
  join_code text not null unique,
  status public.ph_course_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_code_not_blank check (btrim(course_code) <> ''),
  constraint courses_title_not_blank check (btrim(title) <> ''),
  constraint courses_join_code_length check (char_length(join_code) between 6 and 32),
  constraint courses_difficulty_valid check (
    difficulty is null or difficulty in ('beginner', 'intermediate', 'advanced')
  ),
  constraint courses_teacher_code_unique unique (teacher_id, course_code)
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.ph_enrollment_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enrollments_course_student_unique unique (course_id, student_id)
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  display_position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modules_title_not_blank check (btrim(title) <> ''),
  constraint modules_position_nonnegative check (display_position >= 0),
  constraint modules_course_position_unique unique (course_id, display_position)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  content text,
  learning_objectives text,
  code_example text,
  display_position integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_title_not_blank check (btrim(title) <> ''),
  constraint lessons_position_nonnegative check (display_position >= 0),
  constraint lessons_module_position_unique unique (module_id, display_position)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_progress_student_lesson_unique unique (student_id, lesson_id),
  constraint lesson_progress_completion_consistent check (
    (is_completed and completed_at is not null)
    or (not is_completed and completed_at is null)
  )
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  instructions text,
  total_points numeric(10, 2) not null default 100,
  due_at timestamptz,
  allow_late_submissions boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignments_title_not_blank check (btrim(title) <> ''),
  constraint assignments_points_positive check (total_points > 0)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  written_answer text,
  attachment_url text,
  status public.ph_submission_status not null default 'draft',
  submitted_at timestamptz,
  score numeric(10, 2),
  feedback text,
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submissions_assignment_student_unique unique (assignment_id, student_id),
  constraint submissions_score_nonnegative check (score is null or score >= 0),
  constraint submissions_grading_consistent check (
    (status = 'graded' and score is not null and graded_by is not null and graded_at is not null)
    or (status <> 'graded')
  )
);

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

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  course_id uuid references public.courses(id) on delete cascade,
  audience public.ph_announcement_audience not null default 'all',
  title text not null,
  body text not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_title_not_blank check (btrim(title) <> ''),
  constraint announcements_body_not_blank check (btrim(body) <> ''),
  constraint announcements_course_audience_consistent check (
    audience <> 'course' or course_id is not null
  )
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'announcement',
  title text not null,
  message text not null,
  source_type text not null,
  source_id uuid not null,
  course_id uuid references public.courses(id) on delete cascade,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_valid check (type in ('announcement')),
  constraint notifications_source_valid check (source_type in ('announcement')),
  constraint notifications_read_consistent check ((is_read and read_at is not null) or (not is_read and read_at is null)),
  constraint notifications_recipient_source_unique unique (recipient_id, source_type, source_id)
);
create index if not exists notifications_recipient_unread_idx on public.notifications (recipient_id, is_read, created_at desc);

create table if not exists public.study_tools (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  tool_type text not null,
  url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_tools_title_not_blank check (btrim(title) <> ''),
  constraint study_tools_type_not_blank check (btrim(tool_type) <> ''),
  constraint study_tools_url_not_blank check (btrim(url) <> '')
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null,
  sender_email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_sender_name_not_blank check (btrim(sender_name) <> ''),
  constraint contact_sender_email_not_blank check (btrim(sender_email) <> ''),
  constraint contact_subject_not_blank check (btrim(subject) <> ''),
  constraint contact_message_not_blank check (btrim(message) <> ''),
  constraint contact_status_valid check (status in ('new', 'in_progress', 'resolved', 'spam'))
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_action_not_blank check (btrim(action) <> ''),
  constraint audit_entity_type_not_blank check (btrim(entity_type) <> ''),
  constraint audit_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists profiles_email_lower_idx on public.profiles (lower(email));
create unique index if not exists profiles_school_id_lower_idx
  on public.profiles (lower(school_id)) where school_id is not null;
create unique index if not exists student_profiles_student_id_lower_idx
  on public.student_profiles (lower(student_id)) where student_id is not null;
create index if not exists courses_teacher_idx on public.courses (teacher_id);
create index if not exists courses_public_listing_idx
  on public.courses (status, visibility, created_at desc);
create index if not exists enrollments_student_status_idx
  on public.enrollments (student_id, status);
create index if not exists course_modules_course_idx on public.course_modules (course_id);
create index if not exists lessons_module_published_idx
  on public.lessons (module_id, is_published);
create index if not exists lesson_progress_student_idx on public.lesson_progress (student_id);
create index if not exists assignments_course_published_idx
  on public.assignments (course_id, is_published);
create index if not exists submissions_student_idx on public.submissions (student_id);
create index if not exists submissions_assignment_status_idx
  on public.submissions (assignment_id, status);
create index if not exists announcements_course_published_idx
  on public.announcements (course_id, published_at desc);
create index if not exists study_tools_creator_idx on public.study_tools (creator_id);
create index if not exists contact_messages_status_created_idx
  on public.contact_messages (status, created_at desc);
create index if not exists audit_logs_actor_created_idx
  on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and account_status = 'active'
  );
$$;

create or replace function private.has_role(required_role public.ph_app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and approved_role = required_role
      and account_status = 'active'
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('admin'::public.ph_app_role);
$$;

create or replace function private.owns_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('teacher'::public.ph_app_role)
    and exists (
      select 1 from public.courses
      where id = target_course_id and teacher_id = (select auth.uid())
    );
$$;

create or replace function private.is_enrolled(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('student'::public.ph_app_role)
    and exists (
      select 1 from public.enrollments
      where course_id = target_course_id
        and student_id = (select auth.uid())
        and status in ('active', 'completed')
    );
$$;

create or replace function private.owns_module(target_module_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.course_modules
    where id = target_module_id and private.owns_course(course_id)
  );
$$;

create or replace function private.owns_assignment(target_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.assignments
    where id = target_assignment_id and private.owns_course(course_id)
  );
$$;

create or replace function private.is_enrolled_in_lesson(target_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
    where l.id = target_lesson_id and private.is_enrolled(m.course_id)
  );
$$;

create or replace function private.is_enrolled_in_assignment(target_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.assignments
    where id = target_assignment_id
      and is_published
      and private.is_enrolled(course_id)
  );
$$;

create or replace function private.protect_profile_security_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and (select auth.uid()) = old.id then
    if new.id is distinct from old.id
      or new.approved_role is distinct from old.approved_role
      or new.account_status is distinct from old.account_status then
      raise exception 'Users cannot change their own approved role or account status';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.normalize_lesson_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_completed then
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create or replace function private.protect_submission_grading_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_is_student_owner boolean := caller_id is not null and caller_id = new.student_id;
begin
  if caller_is_student_owner
    and not private.is_admin()
    and not private.owns_assignment(new.assignment_id) then
    if new.status = 'graded'
      or new.score is not null
      or new.feedback is not null
      or new.graded_by is not null
      or new.graded_at is not null then
      raise exception 'Students cannot set grading fields';
    end if;

    if tg_op = 'UPDATE' and (
      new.assignment_id is distinct from old.assignment_id
      or new.student_id is distinct from old.student_id
      or new.submitted_at is distinct from old.submitted_at
    ) then
      raise exception 'Students cannot change submission ownership or timestamps';
    end if;

    if new.status in ('submitted', 'late') then
      if tg_op = 'INSERT' or new.status is distinct from old.status then
        new.submitted_at := now();
      end if;
    else
      new.submitted_at := null;
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  safe_requested_role public.ph_app_role;
begin
  safe_requested_role := case lower(coalesce(new.raw_user_meta_data ->> 'requested_role', ''))
    when 'teacher' then 'teacher'::public.ph_app_role
    when 'student' then 'student'::public.ph_app_role
    else null
  end;

  insert into public.profiles (
    id, email, first_name, middle_name, last_name, avatar_url,
    requested_role, approved_role, account_status
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'given_name'),
    new.raw_user_meta_data ->> 'middle_name',
    coalesce(new.raw_user_meta_data ->> 'last_name', new.raw_user_meta_data ->> 'family_name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    safe_requested_role,
    null,
    'pending'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'student_profiles', 'teacher_profiles', 'courses', 'enrollments',
    'course_modules', 'lessons', 'lesson_progress', 'assignments', 'submissions', 'submission_attachments',
    'announcements', 'study_tools', 'contact_messages'
  ] loop
    if not exists (
      select 1 from pg_trigger
      where tgname = 'set_updated_at'
        and tgrelid = format('public.%I', table_name)::regclass
        and not tgisinternal
    ) then
      execute format(
        'create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()',
        table_name
      );
    end if;
  end loop;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'protect_profile_security_fields'
      and tgrelid = 'public.profiles'::regclass
      and not tgisinternal
  ) then
    create trigger protect_profile_security_fields
      before update on public.profiles
      for each row execute function private.protect_profile_security_fields();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'normalize_lesson_progress'
      and tgrelid = 'public.lesson_progress'::regclass
      and not tgisinternal
  ) then
    create trigger normalize_lesson_progress
      before insert or update on public.lesson_progress
      for each row execute function private.normalize_lesson_progress();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'protect_submission_grading_fields'
      and tgrelid = 'public.submissions'::regclass
      and not tgisinternal
  ) then
    create trigger protect_submission_grading_fields
      before insert or update on public.submissions
      for each row execute function private.protect_submission_grading_fields();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
      and not tgisinternal
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function private.handle_new_user();
  end if;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'student_profiles', 'teacher_profiles', 'courses', 'enrollments',
    'course_modules', 'lessons', 'lesson_progress', 'assignments', 'submissions',
    'announcements', 'study_tools', 'contact_messages', 'audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

revoke all on table
  public.profiles, public.student_profiles, public.teacher_profiles, public.courses,
  public.enrollments, public.course_modules, public.lessons, public.lesson_progress,
  public.assignments, public.submissions, public.submission_attachments, public.announcements, public.study_tools,
  public.contact_messages, public.audit_logs
from anon, authenticated;

grant select, insert, update, delete on table
  public.profiles, public.student_profiles, public.teacher_profiles,
  public.enrollments, public.course_modules, public.lessons, public.lesson_progress,
  public.assignments, public.submissions, public.submission_attachments, public.announcements, public.study_tools
to authenticated;

grant insert, update, delete on table public.courses to authenticated;
grant select (
  id, teacher_id, course_code, title, description, category, difficulty,
  thumbnail_url, visibility, status, created_at, updated_at
) on public.courses to anon, authenticated;

grant insert (sender_name, sender_email, subject, message)
  on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant select on public.audit_logs to authenticated;

grant usage on schema private to authenticated;
grant usage on type
  public.ph_app_role, public.ph_account_status, public.ph_course_status,
  public.ph_enrollment_status, public.ph_submission_status,
  public.ph_course_visibility, public.ph_announcement_audience
to authenticated;

revoke execute on all functions in schema private from public, anon;
grant execute on function private.is_active_user() to authenticated;
grant execute on function private.has_role(public.ph_app_role) to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.owns_course(uuid) to authenticated;
grant execute on function private.is_enrolled(uuid) to authenticated;
grant execute on function private.owns_module(uuid) to authenticated;
grant execute on function private.owns_assignment(uuid) to authenticated;
grant execute on function private.is_enrolled_in_lesson(uuid) to authenticated;
grant execute on function private.is_enrolled_in_assignment(uuid) to authenticated;

do $$
declare
  policy_definition record;
  using_clause text;
  check_clause text;
begin
  for policy_definition in
    select * from (values
      ('Admins manage profiles', 'profiles', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Users view own profile', 'profiles', 'select', 'authenticated', '(select auth.uid()) = id', null),
      ('Users update own profile', 'profiles', 'update', 'authenticated', '(select auth.uid()) = id', '(select auth.uid()) = id and (requested_role is null or requested_role <> ''admin'')'),

      ('Admins manage student profiles', 'student_profiles', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Students view own student profile', 'student_profiles', 'select', 'authenticated', '(select auth.uid()) = user_id', null),
      ('Students insert own student profile', 'student_profiles', 'insert', 'authenticated', null, '(select auth.uid()) = user_id and private.has_role(''student'')'),
      ('Students update own student profile', 'student_profiles', 'update', 'authenticated', '(select auth.uid()) = user_id and private.has_role(''student'')', '(select auth.uid()) = user_id and private.has_role(''student'')'),

      ('Admins manage teacher profiles', 'teacher_profiles', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Teachers view own teacher profile', 'teacher_profiles', 'select', 'authenticated', '(select auth.uid()) = user_id', null),
      ('Teachers insert own teacher profile', 'teacher_profiles', 'insert', 'authenticated', null, '(select auth.uid()) = user_id and private.has_role(''teacher'')'),
      ('Teachers update own teacher profile', 'teacher_profiles', 'update', 'authenticated', '(select auth.uid()) = user_id and private.has_role(''teacher'')', '(select auth.uid()) = user_id and private.has_role(''teacher'')'),

      ('Admins manage courses', 'courses', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Teachers manage owned courses', 'courses', 'all', 'authenticated', 'private.owns_course(id)', 'teacher_id = (select auth.uid()) and private.has_role(''teacher'')'),
      ('Visitors view published public courses', 'courses', 'select', 'anon, authenticated', 'status = ''published'' and visibility = ''public''', null),
      ('Students view enrolled courses', 'courses', 'select', 'authenticated', 'private.is_enrolled(id)', null),

      ('Admins manage enrollments', 'enrollments', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Teachers view owned course enrollments', 'enrollments', 'select', 'authenticated', 'private.owns_course(course_id)', null),
      ('Students view own enrollments', 'enrollments', 'select', 'authenticated', '(select auth.uid()) = student_id', null),

      ('Admins manage course modules', 'course_modules', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Teachers manage owned course modules', 'course_modules', 'all', 'authenticated', 'private.owns_course(course_id)', 'private.owns_course(course_id)'),
      ('Enrolled students view course modules', 'course_modules', 'select', 'authenticated', 'private.is_enrolled(course_id)', null),

      ('Admins manage lessons', 'lessons', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Teachers manage owned lessons', 'lessons', 'all', 'authenticated', 'private.owns_module(module_id)', 'private.owns_module(module_id)'),
      ('Enrolled students view published lessons', 'lessons', 'select', 'authenticated', 'is_published and private.is_enrolled_in_lesson(id)', null),

      ('Admins manage lesson progress', 'lesson_progress', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Teachers view progress in owned courses', 'lesson_progress', 'select', 'authenticated', 'private.owns_module((select module_id from public.lessons where id = lesson_id))', null),
      ('Students view own lesson progress', 'lesson_progress', 'select', 'authenticated', '(select auth.uid()) = student_id', null),
      ('Students insert own lesson progress', 'lesson_progress', 'insert', 'authenticated', null, '(select auth.uid()) = student_id and private.is_enrolled_in_lesson(lesson_id)'),
      ('Students update own lesson progress', 'lesson_progress', 'update', 'authenticated', '(select auth.uid()) = student_id', '(select auth.uid()) = student_id and private.is_enrolled_in_lesson(lesson_id)'),

      ('Admins manage assignments', 'assignments', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Teachers manage owned assignments', 'assignments', 'all', 'authenticated', 'private.owns_course(course_id)', 'private.owns_course(course_id)'),
      ('Enrolled students view published assignments', 'assignments', 'select', 'authenticated', 'is_published and private.is_enrolled(course_id)', null),

      ('Admins manage submissions', 'submissions', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Teachers manage owned course submissions', 'submissions', 'all', 'authenticated', 'private.owns_assignment(assignment_id)', 'private.owns_assignment(assignment_id)'),
      ('Students view own submissions', 'submissions', 'select', 'authenticated', '(select auth.uid()) = student_id', null),
      ('Students insert own submissions', 'submissions', 'insert', 'authenticated', null, '(select auth.uid()) = student_id and status <> ''graded'' and private.is_enrolled_in_assignment(assignment_id)'),
      ('Students update own submissions', 'submissions', 'update', 'authenticated', '(select auth.uid()) = student_id and status <> ''graded''', '(select auth.uid()) = student_id and status <> ''graded'' and private.is_enrolled_in_assignment(assignment_id)'),

      ('Admins manage submission attachments', 'submission_attachments', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Teachers view owned submission attachments', 'submission_attachments', 'select', 'authenticated', 'private.owns_assignment(assignment_id)', null),
      ('Students view own submission attachments', 'submission_attachments', 'select', 'authenticated', '(select auth.uid()) = student_id and private.is_enrolled_in_assignment(assignment_id)', null),
      ('Students insert own submission attachments', 'submission_attachments', 'insert', 'authenticated', null, '(select auth.uid()) = student_id and private.is_enrolled_in_assignment(assignment_id) and exists (select 1 from public.submissions s where s.id = submission_id and s.assignment_id = public.submission_attachments.assignment_id and s.student_id = (select auth.uid()) and s.status <> ''graded'')'),
      ('Students delete own submission attachments', 'submission_attachments', 'delete', 'authenticated', '(select auth.uid()) = student_id and private.is_enrolled_in_assignment(assignment_id) and exists (select 1 from public.submissions s where s.id = submission_id and s.status <> ''graded'')', null),

      ('Admins manage announcements', 'announcements', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Teachers manage owned course announcements', 'announcements', 'all', 'authenticated', 'author_id = (select auth.uid()) and course_id is not null and private.owns_course(course_id)', 'author_id = (select auth.uid()) and course_id is not null and private.owns_course(course_id)'),
      ('Active users view relevant announcements', 'announcements', 'select', 'authenticated', 'published_at is not null and published_at <= now() and private.is_active_user() and (audience = ''all'' or (audience = ''teachers'' and private.has_role(''teacher'')) or (audience = ''students'' and private.has_role(''student'')) or (audience = ''course'' and private.is_enrolled(course_id)))', null),

      ('Admins manage study tools', 'study_tools', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Users manage own study tools', 'study_tools', 'all', 'authenticated', 'creator_id = (select auth.uid()) and private.is_active_user()', 'creator_id = (select auth.uid()) and private.is_active_user()'),
      ('Active users view active study tools', 'study_tools', 'select', 'authenticated', 'is_active and private.is_active_user()', null),

      ('Admins manage contact messages', 'contact_messages', 'all', 'authenticated', 'private.is_admin()', 'private.is_admin()'),
      ('Visitors submit contact messages', 'contact_messages', 'insert', 'anon, authenticated', null, 'status = ''new'''),

      ('Admins read audit logs', 'audit_logs', 'select', 'authenticated', 'private.is_admin()', null)
    ) as definitions(policy_name, table_name, command_name, role_names, using_expression, check_expression)
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = policy_definition.table_name
        and policyname = policy_definition.policy_name
    ) then
      using_clause := case when policy_definition.using_expression is null
        then '' else ' using (' || policy_definition.using_expression || ')' end;
      check_clause := case when policy_definition.check_expression is null
        then '' else ' with check (' || policy_definition.check_expression || ')' end;

      execute format(
        'create policy %I on public.%I for %s to %s%s%s',
        policy_definition.policy_name,
        policy_definition.table_name,
        policy_definition.command_name,
        policy_definition.role_names,
        using_clause,
        check_clause
      );
    end if;
  end loop;
end $$;

-- Assignment submissions are private. The server is the only upload/read path
-- and returns short-lived signed URLs after authorization checks.
insert into storage.buckets (id, name, public, file_size_limit)
values ('assignment-submissions', 'assignment-submissions', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

-- Profile photos remain private. Upload and display URLs are created only by
-- the authenticated server after validating the currently signed-in user.
insert into storage.buckets (id, name, public, file_size_limit)
values ('profile-avatars', 'profile-avatars', false, 2097152)
on conflict (id) do update set public = false, file_size_limit = 2097152;
