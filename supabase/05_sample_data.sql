-- =========================================
-- SCRIPT 5: SAMPLE DATA
-- =========================================

insert into public.specialties (name) values
  ('General Physician'), ('Dentist'), ('Cardiologist'), ('Dermatologist'), ('Pediatrician');

insert into public.doctors (full_name, specialty_id, bio, fee) values
  ('Dr. Ayesha Khan',  (select id from public.specialties where name = 'General Physician'), '10 years in family medicine.', 1500),
  ('Dr. Usman Ali',    (select id from public.specialties where name = 'Dentist'),           'Cosmetic and general dentistry.', 2000),
  ('Dr. Sara Ahmed',   (select id from public.specialties where name = 'Cardiologist'),      'Heart health and ECG reviews.', 3500),
  ('Dr. Hamza Raza',   (select id from public.specialties where name = 'Dermatologist'),     'Skin, hair and allergy care.', 2500),
  ('Dr. Fatima Noor',  (select id from public.specialties where name = 'Pediatrician'),      'Child health and vaccines.', 1800),
  ('Dr. Bilal Hassan', (select id from public.specialties where name = 'General Physician'), 'Walk-in and follow-up care.', 1200);

insert into public.doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_minutes)
select d.id, day, '09:00', '13:00', 30
from public.doctors d
cross join generate_series(1, 5) as day;
