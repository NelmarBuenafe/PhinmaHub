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
alter table public.notifications enable row level security;
drop policy if exists "Users view own notifications" on public.notifications;
create policy "Users view own notifications" on public.notifications for select to authenticated using ((select auth.uid()) = recipient_id);
drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications for update to authenticated using ((select auth.uid()) = recipient_id) with check ((select auth.uid()) = recipient_id);
