-- =========================================
-- SCRIPT 3: SECURITY (ROW LEVEL SECURITY)
-- =========================================

alter table public.profiles enable row level security;
alter table public.specialties enable row level security;
alter table public.doctors enable row level security;
alter table public.doctor_schedules enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;

create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles: update own or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

create policy "specialties: anyone can read" on public.specialties
  for select to anon, authenticated using (true);
create policy "specialties: admins insert" on public.specialties
  for insert to authenticated with check (public.is_admin());
create policy "specialties: admins update" on public.specialties
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "specialties: admins delete" on public.specialties
  for delete to authenticated using (public.is_admin());

create policy "doctors: read active or admin" on public.doctors
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "doctors: admins insert" on public.doctors
  for insert to authenticated with check (public.is_admin());
create policy "doctors: admins update" on public.doctors
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "doctors: admins delete" on public.doctors
  for delete to authenticated using (public.is_admin());

create policy "schedules: anyone can read" on public.doctor_schedules
  for select to anon, authenticated using (true);
create policy "schedules: admins insert" on public.doctor_schedules
  for insert to authenticated with check (public.is_admin());
create policy "schedules: admins update" on public.doctor_schedules
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "schedules: admins delete" on public.doctor_schedules
  for delete to authenticated using (public.is_admin());

create policy "appointments: read own or admin" on public.appointments
  for select to authenticated
  using (patient_id = (select auth.uid()) or public.is_admin());
create policy "appointments: patients book for themselves" on public.appointments
  for insert to authenticated
  with check (patient_id = (select auth.uid()) or public.is_admin());
create policy "appointments: admins update" on public.appointments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "appointments: admins delete" on public.appointments
  for delete to authenticated using (public.is_admin());

create policy "notifications: read own" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: update own" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications: delete own" on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));

revoke execute on function public.cancel_appointment(uuid) from public, anon;
grant execute on function public.cancel_appointment(uuid) to authenticated;
grant execute on function public.get_booked_slots(uuid, date) to anon, authenticated;
