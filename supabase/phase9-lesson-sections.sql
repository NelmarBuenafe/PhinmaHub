-- PhinmaHub Phase 9: lesson sections.
-- Run after schema.sql, Phase 6 lesson materials, and Phase 8 lesson progress.
-- This migration is additive.  It keeps lessons.content and lesson_materials.lesson_id
-- so pre-section courses and existing URLs continue to work.

create table if not exists public.lesson_sections (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  content text,
  display_position integer not null default 0,
  is_required boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_sections_title_not_blank check (btrim(title) <> ''),
  constraint lesson_sections_position_nonnegative check (display_position >= 0),
  constraint lesson_sections_lesson_position_unique unique (lesson_id, display_position)
);

alter table public.lesson_materials
  add column if not exists section_id uuid references public.lesson_sections(id) on delete cascade,
  add column if not exists is_required boolean not null default true;

-- Uploaded MP4/WebM files use the same private bucket as documents. Existing
-- externally hosted (YouTube) videos remain valid, while a material can have
-- only one source.
alter table public.lesson_materials
  drop constraint if exists lesson_materials_source_valid;
alter table public.lesson_materials
  add constraint lesson_materials_source_valid check (
    (material_type = 'document'
      and storage_path is not null and file_name is not null and mime_type is not null and file_size is not null
      and external_url is null)
    or
    (material_type = 'video'
      and ((storage_path is not null and file_name is not null and mime_type is not null and file_size is not null and external_url is null)
        or (external_url is not null and storage_path is null and file_name is null and mime_type is null and file_size is null)))
    or
    (material_type in ('external_link', 'google_form')
      and external_url is not null and storage_path is null and file_name is null and mime_type is null and file_size is null)
  );

-- Phase 6 originally capped the bucket at the document limit. Video files are
-- separately validated by the server, with a larger 100 MB cap.
update storage.buckets
set file_size_limit = 104857600
where id = 'lesson-materials' and file_size_limit < 104857600;


create index if not exists lesson_sections_lesson_sort_idx
  on public.lesson_sections (lesson_id, display_position, created_at);
create index if not exists lesson_materials_section_sort_idx
  on public.lesson_materials (section_id, sort_order, created_at);

-- Every established lesson receives a published default section.  Existing materials
-- are explicitly non-required because their historical viewing completion was never
-- verifiable; newly created materials retain the column default of required.
insert into public.lesson_sections (lesson_id, title, content, display_position, is_required, is_published)
select l.id, 'Lesson Content', l.content, 0, true, l.is_published
from public.lessons l
where not exists (
  select 1 from public.lesson_sections s where s.lesson_id = l.id
);

update public.lesson_materials m
set section_id = s.id,
    is_required = false
from public.lesson_sections s
where s.lesson_id = m.lesson_id
  and m.section_id is null;

create or replace function private.assert_material_section_matches_lesson()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  section_lesson_id uuid;
begin
  if new.section_id is null then
    return new;
  end if;
  select lesson_id into section_lesson_id
  from public.lesson_sections
  where id = new.section_id;
  if section_lesson_id is null or section_lesson_id <> new.lesson_id then
    raise exception 'A material section must belong to the same lesson.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists lesson_material_section_matches_lesson on public.lesson_materials;
create trigger lesson_material_section_matches_lesson
before insert or update of lesson_id, section_id on public.lesson_materials
for each row execute function private.assert_material_section_matches_lesson();

-- Completion is stored per material.  Section and lesson completion are derived
-- by the API; students never write a section or lesson percentage directly.
create table if not exists public.lesson_material_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid not null references public.lesson_materials(id) on delete cascade,
  progress_percent integer not null default 0,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_material_progress_student_material_unique unique (student_id, material_id),
  constraint lesson_material_progress_percent_in_range check (progress_percent between 0 and 100),
  constraint lesson_material_progress_completion_consistent check (
    (is_completed and completed_at is not null)
    or (not is_completed and completed_at is null)  
  )
);

alter table public.lesson_material_progress
  add column if not exists watched_ranges jsonb not null default '[]'::jsonb,
  add column if not exists last_position_seconds numeric;

create index if not exists lesson_material_progress_student_idx
  on public.lesson_material_progress (student_id, material_id);

create table if not exists public.lesson_section_reading_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  section_id uuid not null references public.lesson_sections(id) on delete cascade,
  progress_percent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_section_reading_progress_student_section_unique unique (student_id, section_id),
  constraint lesson_section_reading_progress_percent_in_range check (progress_percent between 0 and 100)
);

create index if not exists lesson_section_reading_progress_student_idx
  on public.lesson_section_reading_progress (student_id, section_id);

create or replace function private.normalize_lesson_material_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.progress_percent := greatest(0, least(100, coalesce(new.progress_percent, 0)));
  if tg_op = 'UPDATE' then
    new.progress_percent := greatest(old.progress_percent, new.progress_percent);
  end if;
  new.is_completed := new.progress_percent = 100
    or (tg_op = 'UPDATE' and old.is_completed);
  if new.is_completed then
    new.progress_percent := 100;
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create or replace function private.normalize_lesson_section_reading_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.progress_percent := greatest(0, least(100, coalesce(new.progress_percent, 0)));
  if tg_op = 'UPDATE' then
    new.progress_percent := greatest(old.progress_percent, new.progress_percent);
  end if;
  return new;
end;
$$;

-- Lesson totals are derived from the current required material set, so they may
-- legitimately fall when a teacher changes that structure. Do not retain the
-- old monotonic reading-progress behavior here.
create or replace function private.normalize_lesson_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.progress_percent := greatest(0, least(100, coalesce(new.progress_percent, 0)));
  new.is_completed := new.progress_percent = 100;
  new.completed_at := case when new.is_completed then coalesce(new.completed_at, now()) else null end;
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.lesson_sections;
create trigger set_updated_at before update on public.lesson_sections
for each row execute function private.set_updated_at();
drop trigger if exists normalize_lesson_material_progress on public.lesson_material_progress;
create trigger normalize_lesson_material_progress before insert or update on public.lesson_material_progress
for each row execute function private.normalize_lesson_material_progress();
drop trigger if exists normalize_lesson_section_reading_progress on public.lesson_section_reading_progress;
create trigger normalize_lesson_section_reading_progress before insert or update on public.lesson_section_reading_progress
for each row execute function private.normalize_lesson_section_reading_progress();
drop trigger if exists set_updated_at on public.lesson_section_reading_progress;
create trigger set_updated_at before update on public.lesson_section_reading_progress
for each row execute function private.set_updated_at();
drop trigger if exists normalize_lesson_progress on public.lesson_progress;
create trigger normalize_lesson_progress before insert or update on public.lesson_progress
for each row execute function private.normalize_lesson_progress();
drop trigger if exists set_updated_at on public.lesson_material_progress;
create trigger set_updated_at before update on public.lesson_material_progress
for each row execute function private.set_updated_at();

alter table public.lesson_sections enable row level security;
alter table public.lesson_material_progress enable row level security;
alter table public.lesson_section_reading_progress enable row level security;
grant select, insert, update, delete on public.lesson_sections, public.lesson_material_progress to authenticated;
grant select, insert, update, delete on public.lesson_section_reading_progress to authenticated;

drop policy if exists lesson_sections_teacher_manage on public.lesson_sections;
create policy lesson_sections_teacher_manage on public.lesson_sections
for all to authenticated
using (private.owns_lesson(lesson_id))
with check (private.owns_lesson(lesson_id));
drop policy if exists lesson_sections_student_read on public.lesson_sections;
create policy lesson_sections_student_read on public.lesson_sections
for select to authenticated
using (is_published and private.is_enrolled_in_lesson(lesson_id));

drop policy if exists lesson_material_progress_student_read on public.lesson_material_progress;
create policy lesson_material_progress_student_read on public.lesson_material_progress
for select to authenticated
using ((select auth.uid()) = student_id);
drop policy if exists lesson_material_progress_teacher_read on public.lesson_material_progress;
create policy lesson_material_progress_teacher_read on public.lesson_material_progress
for select to authenticated
using (private.owns_lesson((select lesson_id from public.lesson_materials where id = material_id)));

drop policy if exists lesson_section_reading_progress_student_read on public.lesson_section_reading_progress;
create policy lesson_section_reading_progress_student_read on public.lesson_section_reading_progress
for select to authenticated
using ((select auth.uid()) = student_id);
drop policy if exists lesson_section_reading_progress_teacher_read on public.lesson_section_reading_progress;
create policy lesson_section_reading_progress_teacher_read on public.lesson_section_reading_progress
for select to authenticated
using (private.owns_lesson((select lesson_id from public.lesson_sections where id = section_id)));
