-- =========================================
-- SCRIPT 4: REALTIME + PHOTO STORAGE
-- =========================================

alter publication supabase_realtime add table public.notifications, public.appointments;

insert into storage.buckets (id, name, public)
values ('doctor-photos', 'doctor-photos', true)
on conflict (id) do nothing;

create policy "doctor photos: anyone can view" on storage.objects
  for select to anon, authenticated using (bucket_id = 'doctor-photos');
create policy "doctor photos: admins upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'doctor-photos' and public.is_admin());
create policy "doctor photos: admins update" on storage.objects
  for update to authenticated using (bucket_id = 'doctor-photos' and public.is_admin());
create policy "doctor photos: admins delete" on storage.objects
  for delete to authenticated using (bucket_id = 'doctor-photos' and public.is_admin());
