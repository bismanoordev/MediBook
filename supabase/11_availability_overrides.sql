-- =========================================
-- SCRIPT 11: DATE-SPECIFIC AVAILABILITY (OPTIONAL)
-- Run after Script 10.
-- Lets a doctor open a specific date (for example one extra Saturday)
-- or use different hours on one date. The weekly schedule stays the default.
-- A date in doctor_time_off (day off) always wins over an override.
-- =========================================

create table public.doctor_availability_overrides (
  id bigint generated always as identity primary key,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  override_date date not null,
  start_time time not null,
  end_time time not null,
  slot_minutes smallint not null default 30 check (slot_minutes in (15, 20, 30, 60)),
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  unique (doctor_id, override_date)
);

create index doctor_availability_overrides_doctor_idx
  on public.doctor_availability_overrides (doctor_id, override_date);

alter table public.doctor_availability_overrides enable row level security;

-- Patients' booking pages must read it. A doctor (or an admin) manages their own rows.
create policy "overrides: anyone can read" on public.doctor_availability_overrides
  for select to anon, authenticated using (true);
create policy "overrides: doctor or admin inserts" on public.doctor_availability_overrides
  for insert to authenticated
  with check (doctor_id = public.my_doctor_id() or public.is_admin());
create policy "overrides: doctor or admin updates" on public.doctor_availability_overrides
  for update to authenticated
  using (doctor_id = public.my_doctor_id() or public.is_admin())
  with check (doctor_id = public.my_doctor_id() or public.is_admin());
create policy "overrides: doctor or admin deletes" on public.doctor_availability_overrides
  for delete to authenticated
  using (doctor_id = public.my_doctor_id() or public.is_admin());

-- Guard: no past dates, and existing active appointments must still fit the new hours
create or replace function public.check_availability_override()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.override_date < (now() at time zone 'Asia/Karachi')::date then
    raise exception 'You cannot change availability for a past date';
  end if;

  if exists (
    select 1 from public.appointments a
    where a.doctor_id = new.doctor_id
      and a.appointment_date = new.override_date
      and a.status in ('pending', 'confirmed')
      and (
        a.start_time < new.start_time
        or (extract(epoch from a.start_time) / 60)::int + new.slot_minutes > (extract(epoch from new.end_time) / 60)::int
        or ((extract(epoch from (a.start_time - new.start_time)) / 60)::int % new.slot_minutes) <> 0
      )
  ) then
    raise exception 'You already have appointments that do not fit these hours. Cancel them first.';
  end if;

  return new;
end;
$$;

drop trigger if exists doctor_availability_overrides_check on public.doctor_availability_overrides;
create trigger doctor_availability_overrides_check
  before insert or update on public.doctor_availability_overrides
  for each row execute function public.check_availability_override();

-- Booking check now uses the date-specific hours when they exist, otherwise the weekly schedule
create or replace function public.validate_appointment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  s_start time;
  s_end time;
  s_minutes smallint;
  start_min int;
begin
  if not exists (
    select 1 from public.doctors
    where id = new.doctor_id and is_active and approval_status = 'approved'
  ) then
    raise exception 'This doctor is not available';
  end if;

  if exists (
    select 1 from public.doctor_time_off t
    where t.doctor_id = new.doctor_id
      and new.appointment_date between t.start_date and t.end_date
  ) then
    raise exception 'This doctor is not available on this day';
  end if;

  select o.start_time, o.end_time, o.slot_minutes
    into s_start, s_end, s_minutes
  from public.doctor_availability_overrides o
  where o.doctor_id = new.doctor_id and o.override_date = new.appointment_date;

  if not found then
    select w.start_time, w.end_time, w.slot_minutes
      into s_start, s_end, s_minutes
    from public.doctor_schedules w
    where w.doctor_id = new.doctor_id
      and w.day_of_week = extract(dow from new.appointment_date);
  end if;

  if s_start is null then
    raise exception 'The doctor does not work on this day';
  end if;

  start_min := (extract(epoch from new.start_time) / 60)::int;

  if new.start_time < s_start
     or start_min + s_minutes > (extract(epoch from s_end) / 60)::int
     or (start_min - (extract(epoch from s_start) / 60)::int) % s_minutes <> 0 then
    raise exception 'This time is not a valid slot';
  end if;

  if (new.appointment_date + new.start_time) <= (now() at time zone 'Asia/Karachi') then
    raise exception 'You cannot book a time in the past';
  end if;

  new.end_time := new.start_time + make_interval(mins => s_minutes);

  if not public.is_admin() then
    new.status := 'pending';
  end if;

  return new;
end;
$$;
