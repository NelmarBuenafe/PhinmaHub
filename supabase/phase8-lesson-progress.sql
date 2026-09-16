-- PhinmaHub Phase 8: persistent, monotonic student lesson progress.
-- Run after the existing schema and Phase 6 lesson-material migration.

alter table public.lesson_progress
  add column if not exists progress_percent integer not null default 0;

update public.lesson_progress
set progress_percent = 100
where is_completed and progress_percent < 100;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lesson_progress_percent_in_range'
      and conrelid = 'public.lesson_progress'::regclass
  ) then
    alter table public.lesson_progress
      add constraint lesson_progress_percent_in_range
      check (progress_percent between 0 and 100);
  end if;
end;
$$;

create or replace function private.normalize_lesson_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.progress_percent := greatest(0, least(100, coalesce(new.progress_percent, 0)));
  if tg_op = 'UPDATE' then
    new.progress_percent := greatest(old.progress_percent, new.progress_percent);
  end if;
  if new.progress_percent = 100 then
    new.is_completed := true;
  elsif tg_op = 'UPDATE' and old.is_completed then
    new.progress_percent := 100;
    new.is_completed := true;
  end if;
  if new.is_completed then
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;
