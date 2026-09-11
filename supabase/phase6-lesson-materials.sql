-- PhinmaHub Phase 6: lesson materials and protected document storage.
-- Run this migration once after the existing schema migrations.

create table if not exists public.lesson_materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  material_type text not null,
  title text not null,
  description text,
  storage_path text,
  external_url text,
  file_name text,
  mime_type text,
  file_size bigint,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_materials_type_valid check (
    material_type in ('document', 'video', 'external_link', 'google_form')
  ),
  constraint lesson_materials_title_not_blank check (btrim(title) <> ''),
  constraint lesson_materials_sort_order_nonnegative check (sort_order >= 0),
  constraint lesson_materials_file_size_nonnegative check (
    file_size is null or file_size >= 0
  ),
  constraint lesson_materials_source_valid check (
    (material_type = 'document'
      and storage_path is not null
      and file_name is not null
      and mime_type is not null
      and file_size is not null
      and external_url is null)
    or
    (material_type in ('video', 'external_link', 'google_form')
      and external_url is not null
      and storage_path is null)
  )
);

create index if not exists lesson_materials_lesson_sort_idx
  on public.lesson_materials (lesson_id, sort_order, created_at);

create or replace function private.owns_lesson(target_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lessons
    where id = target_lesson_id
      and private.owns_module(module_id)
  );
$$;

revoke all on function private.owns_lesson(uuid) from public, anon;
grant execute on function private.owns_lesson(uuid) to authenticated;

drop trigger if exists set_updated_at on public.lesson_materials;
create trigger set_updated_at
before update on public.lesson_materials
for each row execute function private.set_updated_at();

alter table public.lesson_materials enable row level security;

drop policy if exists lesson_materials_teacher_manage on public.lesson_materials;
create policy lesson_materials_teacher_manage
on public.lesson_materials
for all
to authenticated
using (private.owns_lesson(lesson_id))
with check (private.owns_lesson(lesson_id));

drop policy if exists lesson_materials_enrolled_student_read on public.lesson_materials;
create policy lesson_materials_enrolled_student_read
on public.lesson_materials
for select
to authenticated
using (
  exists (
    select 1
    from public.lessons
    where lessons.id = lesson_materials.lesson_id
      and lessons.is_published
      and private.is_enrolled_in_lesson(lessons.id)
  )
);

-- The bucket is private. There are intentionally no broad storage.objects policies:
-- documents are served only through backend-generated, short-lived signed URLs
-- after teacher ownership or student enrollment has been checked.
insert into storage.buckets (id, name, public, file_size_limit)
values ('lesson-materials', 'lesson-materials', false, 10485760)
on conflict (id) do nothing;
