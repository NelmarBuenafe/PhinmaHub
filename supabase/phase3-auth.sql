-- Apply once to projects that already ran schema.sql before Phase 3.
-- This lets new users choose student or teacher after Google sign-in.

alter table public.profiles alter column requested_role drop not null;
alter table public.profiles alter column requested_role drop default;

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
