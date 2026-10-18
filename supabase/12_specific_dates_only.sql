-- =========================================
-- SCRIPT 12: BOOKING ONLY ON DATES THE DOCTOR OPENED
-- Run after Script 11.
-- From now on a patient can book a doctor only on dates that have a row in
-- doctor_availability_overrides (the "specific dates"). The old weekly schedule
-- table (doctor_schedules) is no longer used for booking. It is kept, not deleted.
-- Days off (doctor_time_off) still block a date.
-- =========================================

-- 1) Booking check: only specific dates, no weekly fallback
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

-- 2) A date cannot be removed while it still has pending or confirmed appointments
create or replace function public.block_override_delete_with_appointments()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from public.appointments a
    where a.doctor_id = old.doctor_id
      and a.appointment_date = old.override_date
      and a.status in ('pending', 'confirmed')
  ) then
    raise exception 'You already have appointments on this date. Cancel them first.';
  end if;
  return old;
end;
$$;

drop trigger if exists doctor_availability_overrides_no_delete on public.doctor_availability_overrides;
create trigger doctor_availability_overrides_no_delete
  before delete on public.doctor_availability_overrides
  for each row execute function public.block_override_delete_with_appointments();
