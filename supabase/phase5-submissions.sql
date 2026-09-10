-- Submission trigger permissions fix.
-- Run this once for databases created before the trigger was marked SECURITY DEFINER.

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

revoke all on function private.protect_submission_grading_fields() from public;
