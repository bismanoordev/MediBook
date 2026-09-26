-- Run this only after signing up in the MediBook app.
-- Replace the placeholder email with your own email, then log out and log in again.

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'your-email@example.com');
