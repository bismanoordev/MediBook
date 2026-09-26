-- =========================================
-- SCRIPT 2: FUNCTIONS AND TRIGGERS
-- =========================================

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_role()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_role();

create or replace function public.validate_appointment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  s public.doctor_schedules%rowtype;
begin
  if not exists (select 1 from public.doctors where id = new.doctor_id and is_active) then
    raise exception 'This doctor is not available';
  end if;

  select * into s from public.doctor_schedules
  where doctor_id = new.doctor_id
    and day_of_week = extract(dow from new.appointment_date);
  if not found then
    raise exception 'The doctor does not work on this day';
  end if;

  if new.start_time < s.start_time
     or new.start_time + make_interval(mins => s.slot_minutes) > s.end_time
     or (extract(epoch from (new.start_time - s.start_time)) / 60)::int % s.slot_minutes <> 0 then
    raise exception 'This time is not a valid slot';
  end if;

  if (new.appointment_date + new.start_time) <= (now() at time zone 'Asia/Karachi') then
    raise exception 'You cannot book a time in the past';
  end if;

  new.end_time := new.start_time + make_interval(mins => s.slot_minutes);

  if not public.is_admin() then
    new.status := 'pending';
  end if;

  return new;
end;
$$;

create trigger appointments_validate
  before insert on public.appointments
  for each row execute function public.validate_appointment();

create or replace function public.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

create or replace function public.get_booked_slots(p_doctor_id uuid, p_date date)
returns table (start_time time)
language sql stable security definer set search_path = ''
as $$
  select a.start_time from public.appointments a
  where a.doctor_id = p_doctor_id
    and a.appointment_date = p_date
    and a.status <> 'cancelled';
$$;

create or replace function public.cancel_appointment(p_appointment_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  a public.appointments%rowtype;
begin
  select * into a from public.appointments
  where id = p_appointment_id and patient_id = auth.uid();

  if not found then
    raise exception 'Appointment not found';
  end if;
  if a.status not in ('pending', 'confirmed') then
    raise exception 'This appointment cannot be cancelled';
  end if;
  if (a.appointment_date + a.start_time) - (now() at time zone 'Asia/Karachi') < interval '2 hours' then
    raise exception 'You can only cancel up to 2 hours before';
  end if;

  update public.appointments
  set status = 'cancelled', cancel_reason = 'Cancelled by patient'
  where id = p_appointment_id;
end;
$$;

create or replace function public.notify_admins_new_booking()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  patient_name text;
  doctor_name text;
begin
  select full_name into patient_name from public.profiles where id = new.patient_id;
  select full_name into doctor_name from public.doctors where id = new.doctor_id;

  insert into public.notifications (user_id, title, message)
  select p.id,
         'New booking',
         coalesce(patient_name, 'A patient') || ' booked ' || doctor_name || ' on '
           || to_char(new.appointment_date, 'DD Mon') || ' at ' || to_char(new.start_time, 'HH12:MI AM')
  from public.profiles p
  where p.role = 'admin';

  return new;
end;
$$;

create trigger appointments_notify_admins
  after insert on public.appointments
  for each row execute function public.notify_admins_new_booking();

create or replace function public.notify_patient_status_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  doctor_name text;
begin
  if new.status is distinct from old.status then
    select full_name into doctor_name from public.doctors where id = new.doctor_id;

    insert into public.notifications (user_id, title, message)
    values (
      new.patient_id,
      'Appointment ' || new.status,
      'Your appointment with ' || doctor_name || ' on '
        || to_char(new.appointment_date, 'DD Mon') || ' at ' || to_char(new.start_time, 'HH12:MI AM')
        || ' is now ' || new.status || '.'
    );
  end if;
  return new;
end;
$$;

create trigger appointments_notify_patient
  after update on public.appointments
  for each row execute function public.notify_patient_status_change();
