-- Run this once, manually, after the first intended administrator has signed in.
-- Replace only the first all-zero UUID, assigned to target_user_id, with the user's UUID.
-- Leave the second all-zero UUID in the safety check unchanged.
-- This script deliberately refuses to run while the placeholder remains unchanged.

do $$
declare
  target_user_id uuid := '00000000-0000-0000-0000-000000000000';
  changed_rows integer;
begin
  if target_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'Replace the target_user_id placeholder before running this bootstrap';
  end if;

  update public.profiles
  set approved_role = 'admin',
      account_status = 'active'
  where id = target_user_id;

  get diagnostics changed_rows = row_count;

  if changed_rows <> 1 then
    raise exception 'Expected exactly one existing profile; changed % rows', changed_rows;
  end if;
end $$;
