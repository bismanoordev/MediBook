-- =========================================
-- SCRIPT 1: TABLES
-- =========================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'patient' check (role in ('patient', 'admin')),
  created_at timestamptz not null default now()
);

create table public.specialties (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  specialty_id bigint references public.specialties(id) on delete set null,
  bio text,
  fee numeric(10,2) not null default 0 check (fee >= 0),
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.doctor_schedules (
  id bigint generated always as identity primary key,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_minutes smallint not null default 30 check (slot_minutes in (15, 20, 30, 60)),
  check (end_time > start_time),
  unique (doctor_id, day_of_week)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  appointment_date date not null,
  start_time time not null,
  end_time time,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  reason text,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index appointments_no_double_booking
  on public.appointments (doctor_id, appointment_date, start_time)
  where status <> 'cancelled';

create index appointments_patient_idx on public.appointments (patient_id);
create index appointments_doctor_date_idx on public.appointments (doctor_id, appointment_date);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
