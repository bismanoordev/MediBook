-- =========================================
-- SCRIPT 7: DOCTOR PORTAL - TABLES
-- Run after Scripts 1-5. Safe for existing data:
-- every doctor that already exists stays 'approved'.
-- =========================================

-- 1) profiles can now have the 'doctor' role
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('patient', 'doctor', 'admin'));

-- 2) doctors: link to a login user, approval status and onboarding details
alter table public.doctors
  add column user_id uuid unique references public.profiles(id) on delete set null,
  add column approval_status text not null default 'approved'
    check (approval_status in ('draft', 'pending', 'approved', 'rejected', 'changes_requested')),
  add column rejection_reason text,
  add column experience_years smallint check (experience_years between 0 and 70),
  add column languages text[] not null default '{}',
  add column clinic_name text,
  add column city text,
  add column pmdc_number text,
  add column qualifications jsonb not null default '[]'::jsonb,
  add column onboarding_step smallint not null default 1 check (onboarding_step between 1 and 5),
  add column submitted_at timestamptz,
  add column reviewed_at timestamptz;

create index doctors_approval_status_idx on public.doctors (approval_status);

-- 3) doctor_documents: CNIC, PMDC license (required) and degree (optional)
create table public.doctor_documents (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  doc_type text not null check (doc_type in ('cnic', 'pmdc_license', 'degree')),
  file_path text not null,
  file_name text not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'needs_action')),
  reviewer_note text,
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (doctor_id, doc_type)
);

-- 4) doctor_time_off: days a doctor is away (up to 90 days at a time)
create table public.doctor_time_off (
  id bigint generated always as identity primary key,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (end_date - start_date <= 90)
);

create index doctor_time_off_doctor_idx on public.doctor_time_off (doctor_id, start_date);

-- 5) doctor_profile_changes: profile edits waiting for admin review
create table public.doctor_profile_changes (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  changes jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- only one pending change per doctor
create unique index doctor_profile_changes_one_pending
  on public.doctor_profile_changes (doctor_id)
  where status = 'pending';

-- 6) Helper functions used by the security rules and the app
create or replace function public.is_doctor()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'doctor'
  );
$$;

create or replace function public.my_doctor_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select id from public.doctors where user_id = auth.uid();
$$;

create or replace function public.is_my_patient(p_patient_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.appointments a
    where a.patient_id = p_patient_id
      and a.doctor_id = public.my_doctor_id()
  );
$$;
