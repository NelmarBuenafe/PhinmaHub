-- Apply once after phase3-auth.sql on projects created before the registration forms.
-- Existing profile records and approval states are not changed.

alter table public.student_profiles add column if not exists student_id text;
alter table public.student_profiles add column if not exists campus text;
alter table public.teacher_profiles add column if not exists campus text;
alter table public.teacher_profiles add column if not exists position text;

create unique index if not exists student_profiles_student_id_lower_idx
  on public.student_profiles (lower(student_id))
  where student_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'student_id_not_blank'
      and conrelid = 'public.student_profiles'::regclass
  ) then
    alter table public.student_profiles
      add constraint student_id_not_blank check (student_id is null or btrim(student_id) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'student_campus_not_blank'
      and conrelid = 'public.student_profiles'::regclass
  ) then
    alter table public.student_profiles
      add constraint student_campus_not_blank check (campus is null or btrim(campus) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'teacher_campus_not_blank'
      and conrelid = 'public.teacher_profiles'::regclass
  ) then
    alter table public.teacher_profiles
      add constraint teacher_campus_not_blank check (campus is null or btrim(campus) <> '');
  end if;
end $$;
