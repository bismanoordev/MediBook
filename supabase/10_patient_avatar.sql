-- =========================================
-- SCRIPT 10: PATIENT PROFILE PHOTO
-- Run after Script 9. Adds a photo column and a storage bucket.
-- =========================================

-- 1) Where the photo link is saved (patients already can update their own profile row)
alter table public.profiles add column avatar_url text;

-- 2) Storage bucket for profile photos (max 2 MB, images only).
--    Public so the photo can show in the navbar and on the doctor's and admin's screens.
--    Files live in the owner's folder with a random name: {user id}/avatar-{time}.{ext}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-avatars',
  'patient-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 3) Security: anyone can view; each user can only add, replace or delete files in their own folder
create policy "patient avatars: anyone can view" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'patient-avatars');

create policy "patient avatars: users upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'patient-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "patient avatars: users update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'patient-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "patient avatars: users delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'patient-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
