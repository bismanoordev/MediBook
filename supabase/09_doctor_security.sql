-- =========================================
-- SCRIPT 9: DOCTOR PORTAL - SECURITY (RLS) AND PRIVATE STORAGE
-- Run after Script 8.
-- =========================================

alter table public.doctor_documents enable row level security;
alter table public.doctor_time_off enable row level security;
alter table public.doctor_profile_changes enable row level security;

-- PROFILES: a doctor can read the profile of patients who booked with them
create policy "profiles: doctor reads own patients" on public.profiles
  for select to authenticated
  using (public.is_my_patient(id));

-- DOCTORS: patients only see active AND approved doctors.
-- A doctor sees their own row. Admins see all.
drop policy if exists "doctors: read active or admin" on public.doctors;
create policy "doctors: read approved, own or admin" on public.doctors
  for select to anon, authenticated
  using (
    (is_active and approval_status = 'approved')
    or user_id = (select auth.uid())
    or public.is_admin()
  );

-- A doctor can edit their own row only before approval (onboarding).
-- After approval, edits go through doctor_profile_changes.
create policy "doctors: doctor updates own draft" on public.doctors
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and approval_status in ('draft', 'rejected', 'changes_requested')
  )
  with check (
    user_id = (select auth.uid())
    and approval_status in ('draft', 'rejected', 'changes_requested')
  );

-- DOCTOR_SCHEDULES: a doctor manages their own working hours
create policy "schedules: doctor inserts own" on public.doctor_schedules
  for insert to authenticated with check (doctor_id = public.my_doctor_id());
create policy "schedules: doctor updates own" on public.doctor_schedules
  for update to authenticated
  using (doctor_id = public.my_doctor_id()) with check (doctor_id = public.my_doctor_id());
create policy "schedules: doctor deletes own" on public.doctor_schedules
  for delete to authenticated using (doctor_id = public.my_doctor_id());

-- APPOINTMENTS: a doctor also sees their own bookings
-- (they change status with set_appointment_status)
drop policy if exists "appointments: read own or admin" on public.appointments;
create policy "appointments: read own, doctor or admin" on public.appointments
  for select to authenticated
  using (
    patient_id = (select auth.uid())
    or doctor_id = public.my_doctor_id()
    or public.is_admin()
  );

-- DOCTOR_TIME_OFF: patients' booking pages need to read it; doctor and admins manage it
create policy "time off: anyone can read" on public.doctor_time_off
  for select to anon, authenticated using (true);
create policy "time off: doctor or admin inserts" on public.doctor_time_off
  for insert to authenticated
  with check (doctor_id = public.my_doctor_id() or public.is_admin());
create policy "time off: doctor or admin updates" on public.doctor_time_off
  for update to authenticated
  using (doctor_id = public.my_doctor_id() or public.is_admin())
  with check (doctor_id = public.my_doctor_id() or public.is_admin());
create policy "time off: doctor or admin deletes" on public.doctor_time_off
  for delete to authenticated
  using (doctor_id = public.my_doctor_id() or public.is_admin());

-- DOCTOR_DOCUMENTS: private. The doctor and admins only.
create policy "documents: read own or admin" on public.doctor_documents
  for select to authenticated
  using (doctor_id = public.my_doctor_id() or public.is_admin());
create policy "documents: doctor uploads own" on public.doctor_documents
  for insert to authenticated
  with check (doctor_id = public.my_doctor_id() and status = 'pending');
-- a doctor can replace a file unless it is already verified (it goes back to pending)
create policy "documents: doctor replaces own" on public.doctor_documents
  for update to authenticated
  using (doctor_id = public.my_doctor_id() and status <> 'verified')
  with check (doctor_id = public.my_doctor_id() and status = 'pending');
create policy "documents: doctor deletes own" on public.doctor_documents
  for delete to authenticated
  using (doctor_id = public.my_doctor_id() and status <> 'verified');
create policy "documents: admins update" on public.doctor_documents
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "documents: admins delete" on public.doctor_documents
  for delete to authenticated using (public.is_admin());

-- DOCTOR_PROFILE_CHANGES: only an approved doctor can send changes.
-- Admins approve or reject with review_profile_change().
create policy "changes: read own or admin" on public.doctor_profile_changes
  for select to authenticated
  using (doctor_id = public.my_doctor_id() or public.is_admin());
create policy "changes: approved doctor sends own" on public.doctor_profile_changes
  for insert to authenticated
  with check (
    doctor_id = public.my_doctor_id()
    and status = 'pending'
    and exists (
      select 1 from public.doctors d
      where d.id = doctor_id and d.approval_status = 'approved'
    )
  );
create policy "changes: doctor withdraws own pending" on public.doctor_profile_changes
  for delete to authenticated
  using (doctor_id = public.my_doctor_id() and status = 'pending');

-- STORAGE: doctors can upload their own profile photo (public bucket, own folder)
create policy "doctor photos: doctors upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'doctor-photos'
    and public.is_doctor()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "doctor photos: doctors update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'doctor-photos'
    and public.is_doctor()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "doctor photos: doctors delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'doctor-photos'
    and public.is_doctor()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- STORAGE: PRIVATE bucket for CNIC, PMDC license and degree files (max 5 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doctor-documents',
  'doctor-documents',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do nothing;

create policy "doctor documents: read own or admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'doctor-documents'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );
create policy "doctor documents: doctors upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'doctor-documents'
    and public.is_doctor()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "doctor documents: doctors update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'doctor-documents'
    and public.is_doctor()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "doctor documents: doctors delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'doctor-documents'
    and public.is_doctor()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "doctor documents: admins delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'doctor-documents' and public.is_admin());
