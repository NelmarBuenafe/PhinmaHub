-- PhinmaHub Phase 4 Admin Dashboard support.
-- Additive and safe to rerun. No existing data is removed or rewritten.

create table if not exists public.course_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text,
  icon text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_categories_name_not_blank check (btrim(name) <> '')
);

create unique index if not exists course_categories_name_lower_idx
  on public.course_categories (lower(name));

alter table public.course_categories enable row level security;
revoke all on table public.course_categories from anon, authenticated;

drop policy if exists "Active users view course categories" on public.course_categories;
create policy "Active users view course categories"
  on public.course_categories for select to authenticated
  using (is_active and private.is_active_user());

drop policy if exists "Admins manage course categories" on public.course_categories;
create policy "Admins manage course categories"
  on public.course_categories for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

grant select on table public.course_categories to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at'
      and tgrelid = 'public.course_categories'::regclass
      and not tgisinternal
  ) then
    create trigger set_updated_at before update on public.course_categories
      for each row execute function private.set_updated_at();
  end if;
end $$;
