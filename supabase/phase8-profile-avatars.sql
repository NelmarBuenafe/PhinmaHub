-- PhinmaHub Phase 8: private profile-avatar storage.
-- profiles.avatar_url already exists and stores either an identity-provider URL
-- or a private Storage object path for a user-uploaded profile photo.
-- Run once after the existing schema migrations.

insert into storage.buckets (id, name, public, file_size_limit)
values ('profile-avatars', 'profile-avatars', false, 2097152)
on conflict (id) do update set public = false, file_size_limit = 2097152;

-- There are intentionally no broad storage.objects policies. The API creates
-- short-lived signed upload/display URLs only after checking the authenticated
-- profile. User-uploaded paths are restricted server-side to <auth.uid>/<uuid>.
