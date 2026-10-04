-- =========================================
-- SCRIPT 8: DOCTOR PORTAL - FUNCTIONS AND TRIGGERS
-- Run after Script 7. The clinic time zone is Asia/Karachi.
-- =========================================

-- A) Sign up: patients stay patients; "doctor" also creates a draft doctor row.
--    The role can never be "admin" from the browser.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  new_role text;
begin
  new_role := case when new.raw_user_meta_data ->> 'role' = 'doctor' then 'doctor' else 'patient' end;

  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new_role
  );

  if new_role = 'doctor' then
    insert into public.doctors (user_id, full_name, specialty_id, approval_status)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'New doctor'),
      (select s.id from public.specialties s where s.id::text = new.raw_user_meta_data ->> 'specialty_id'),
      'draft'
    );
  end if;

  return new;
end;
$$;

-- B) Booking checks: doctor must be active AND approved, and not on time off
create or replace function public.validate_appointment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  s public.doctor_schedules%rowtype;
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

-- C) New booking: notify all admins AND the doctor
create or replace function public.notify_admins_new_booking()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  patient_name text;
  doctor_name text;
  doctor_user uuid;
  booking_text text;
begin
  select full_name into patient_name from public.profiles where id = new.patient_id;
  select full_name, user_id into doctor_name, doctor_user from public.doctors where id = new.doctor_id;

  booking_text := coalesce(patient_name, 'A patient') || ' booked ' || doctor_name || ' on '
    || to_char(new.appointment_date, 'DD Mon') || ' at ' || to_char(new.start_time, 'HH12:MI AM');

  insert into public.notifications (user_id, title, message)
  select p.id, 'New booking', booking_text
  from public.profiles p
  where p.role = 'admin';

  if doctor_user is not null then
    insert into public.notifications (user_id, title, message)
    values (doctor_user, 'New booking', booking_text);
  end if;

  return new;
end;
$$;

-- D) Status change: notify the patient, and the doctor if someone else made the change
create or replace function public.notify_patient_status_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  doctor_name text;
  doctor_user uuid;
  patient_name text;
begin
  if new.status is distinct from old.status then
    select full_name, user_id into doctor_name, doctor_user from public.doctors where id = new.doctor_id;
    select full_name into patient_name from public.profiles where id = new.patient_id;

    insert into public.notifications (user_id, title, message)
    values (
      new.patient_id,
      'Appointment ' || new.status,
      'Your appointment with ' || doctor_name || ' on '
        || to_char(new.appointment_date, 'DD Mon') || ' at ' || to_char(new.start_time, 'HH12:MI AM')
        || ' is now ' || new.status || '.'
    );

    if doctor_user is not null and doctor_user is distinct from auth.uid() then
      insert into public.notifications (user_id, title, message)
      values (
        doctor_user,
        'Appointment ' || new.status,
        'The appointment with ' || coalesce(patient_name, 'a patient') || ' on '
          || to_char(new.appointment_date, 'DD Mon') || ' at ' || to_char(new.start_time, 'HH12:MI AM')
          || ' is now ' || new.status || '.'
      );
    end if;
  end if;
  return new;
end;
$$;

-- E) Doctor or admin changes an appointment status (first confirmation is final)
create or replace function public.set_appointment_status(
  p_appointment_id uuid,
  p_status text,
  p_cancel_reason text default null
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  a public.appointments%rowtype;
  my_doc uuid := public.my_doctor_id();
  by_admin boolean := public.is_admin();
begin
  select * into a from public.appointments where id = p_appointment_id for update;

  if not found then
    raise exception 'Appointment not found';
  end if;
  if not (by_admin or (my_doc is not null and a.doctor_id = my_doc)) then
    raise exception 'You cannot change this appointment';
  end if;
  if p_status not in ('confirmed', 'cancelled', 'completed') then
    raise exception 'Invalid status';
  end if;
  if p_status = a.status then
    raise exception 'This appointment is already %', a.status;
  end if;
  if p_status = 'confirmed' and a.status <> 'pending' then
    raise exception 'Only pending appointments can be confirmed';
  end if;
  if p_status = 'cancelled' and a.status not in ('pending', 'confirmed') then
    raise exception 'This appointment cannot be cancelled';
  end if;
  if p_status = 'completed' then
    if a.status <> 'confirmed' then
      raise exception 'Only confirmed appointments can be completed';
    end if;
    if (a.appointment_date + a.start_time) > (now() at time zone 'Asia/Karachi') then
      raise exception 'You cannot complete an appointment before it starts';
    end if;
  end if;

  update public.appointments
  set status = p_status,
      cancel_reason = case
        when p_status = 'cancelled'
          then coalesce(nullif(trim(p_cancel_reason), ''), case when by_admin then 'Cancelled by admin' else 'Cancelled by doctor' end)
        else cancel_reason
      end
  where id = p_appointment_id;
end;
$$;

-- F) Block days off that already have active appointments
create or replace function public.check_time_off()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from public.appointments a
    where a.doctor_id = new.doctor_id
      and a.appointment_date between new.start_date and new.end_date
      and a.status in ('pending', 'confirmed')
  ) then
    raise exception 'You already have appointments on these days. Cancel them first.';
  end if;
  return new;
end;
$$;

drop trigger if exists doctor_time_off_check on public.doctor_time_off;
create trigger doctor_time_off_check
  before insert or update on public.doctor_time_off
  for each row execute function public.check_time_off();

-- G) Doctor sends the finished application for review
create or replace function public.submit_doctor_application()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  d public.doctors%rowtype;
begin
  select * into d from public.doctors where user_id = auth.uid();

  if not found then
    raise exception 'Doctor profile not found';
  end if;
  if d.approval_status not in ('draft', 'rejected', 'changes_requested') then
    raise exception 'This application was already submitted';
  end if;
  if d.specialty_id is null
     or coalesce(trim(d.bio), '') = ''
     or d.fee <= 0
     or d.experience_years is null
     or coalesce(trim(d.pmdc_number), '') = ''
     or coalesce(array_length(d.languages, 1), 0) = 0 then
    raise exception 'Please complete all required fields before submitting';
  end if;
  if not exists (select 1 from public.doctor_documents where doctor_id = d.id and doc_type = 'cnic')
     or not exists (select 1 from public.doctor_documents where doctor_id = d.id and doc_type = 'pmdc_license') then
    raise exception 'Please upload your CNIC and PMDC license before submitting';
  end if;

  update public.doctors
  set approval_status = 'pending', submitted_at = now(), rejection_reason = null
  where id = d.id;

  insert into public.notifications (user_id, title, message)
  select p.id, 'New doctor application', d.full_name || ' submitted an application for review.'
  from public.profiles p
  where p.role = 'admin';
end;
$$;

-- H) Stamp the review time, and tell the doctor about the decision
create or replace function public.doctors_stamp_review()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.approval_status is distinct from old.approval_status
     and new.approval_status in ('approved', 'rejected', 'changes_requested') then
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists doctors_stamp_review on public.doctors;
create trigger doctors_stamp_review
  before update on public.doctors
  for each row execute function public.doctors_stamp_review();

create or replace function public.doctors_notify_review()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.user_id is not null
     and old.approval_status = 'pending'
     and new.approval_status in ('approved', 'rejected', 'changes_requested') then
    insert into public.notifications (user_id, title, message)
    values (
      new.user_id,
      case new.approval_status
        when 'approved' then 'Application approved'
        when 'rejected' then 'Application rejected'
        else 'Changes requested'
      end,
      case new.approval_status
        when 'approved' then 'Welcome to MediBook! Your profile is now visible to patients.'
        when 'rejected' then 'Your application was not approved.' || coalesce(' Reason: ' || new.rejection_reason, '')
        else 'Please update your application and submit it again.' || coalesce(' Note: ' || new.rejection_reason, '')
      end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists doctors_notify_review on public.doctors;
create trigger doctors_notify_review
  after update on public.doctors
  for each row execute function public.doctors_notify_review();

-- I) Admin approves or rejects a profile change from an approved doctor
create or replace function public.review_profile_change(
  p_change_id uuid,
  p_approve boolean,
  p_note text default null
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  ch public.doctor_profile_changes%rowtype;
  c jsonb;
  doctor_user uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review changes';
  end if;

  select * into ch from public.doctor_profile_changes where id = p_change_id for update;
  if not found or ch.status <> 'pending' then
    raise exception 'This change was already reviewed';
  end if;

  if p_approve then
    c := ch.changes;
    update public.doctors d
    set full_name = coalesce(nullif(c ->> 'full_name', ''), d.full_name),
        bio = case when c ? 'bio' then c ->> 'bio' else d.bio end,
        fee = coalesce((c ->> 'fee')::numeric, d.fee),
        photo_url = case when c ? 'photo_url' then c ->> 'photo_url' else d.photo_url end,
        specialty_id = coalesce((c ->> 'specialty_id')::bigint, d.specialty_id),
        experience_years = coalesce((c ->> 'experience_years')::smallint, d.experience_years),
        languages = case
          when c ? 'languages' then array(select jsonb_array_elements_text(c -> 'languages'))
          else d.languages
        end,
        clinic_name = case when c ? 'clinic_name' then c ->> 'clinic_name' else d.clinic_name end,
        city = case when c ? 'city' then c ->> 'city' else d.city end,
        qualifications = coalesce(c -> 'qualifications', d.qualifications)
    where d.id = ch.doctor_id;
  end if;

  update public.doctor_profile_changes
  set status = case when p_approve then 'approved' else 'rejected' end,
      admin_note = p_note,
      reviewed_at = now()
  where id = p_change_id;

  select user_id into doctor_user from public.doctors where id = ch.doctor_id;
  if doctor_user is not null then
    insert into public.notifications (user_id, title, message)
    values (
      doctor_user,
      case when p_approve then 'Profile changes approved' else 'Profile changes rejected' end,
      case when p_approve then 'Your profile changes are now live.'
           else 'Your profile changes were not approved.' || coalesce(' Note: ' || p_note, '')
      end
    );
  end if;
end;
$$;

-- J) Tell the doctor when a document is verified or needs action
create or replace function public.notify_document_review()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  doctor_user uuid;
  doc_label text;
begin
  if new.status is distinct from old.status and new.status in ('verified', 'needs_action') then
    select user_id into doctor_user from public.doctors where id = new.doctor_id;
    doc_label := case new.doc_type
      when 'cnic' then 'CNIC'
      when 'pmdc_license' then 'PMDC license'
      else 'Degree certificate'
    end;

    if doctor_user is not null then
      insert into public.notifications (user_id, title, message)
      values (
        doctor_user,
        case when new.status = 'verified' then 'Document verified' else 'Document needs action' end,
        case when new.status = 'verified' then 'Your ' || doc_label || ' was verified.'
             else 'Your ' || doc_label || ' needs a new upload.' || coalesce(' Note: ' || new.reviewer_note, '')
        end
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists doctor_documents_notify on public.doctor_documents;
create trigger doctor_documents_notify
  after update on public.doctor_documents
  for each row execute function public.notify_document_review();

-- K) Who can call the new functions from the app
revoke execute on function public.submit_doctor_application() from public, anon;
grant execute on function public.submit_doctor_application() to authenticated;

revoke execute on function public.set_appointment_status(uuid, text, text) from public, anon;
grant execute on function public.set_appointment_status(uuid, text, text) to authenticated;

revoke execute on function public.review_profile_change(uuid, boolean, text) from public, anon;
grant execute on function public.review_profile_change(uuid, boolean, text) to authenticated;
