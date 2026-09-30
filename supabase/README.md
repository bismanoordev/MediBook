# MediBook database

These files are the project copy of the approved Supabase scripts.

- Scripts 01–05 have already been run in the Supabase SQL Editor.
- Do not run them again unless the database is intentionally being rebuilt.
- `06_make_admin.sql` remains available for manually promoting an existing patient account; this is the approved way to provision an admin.
- Patient auth uses only the public/publishable key. Never add the service-role secret to browser code.

## Admin provisioning

Create the person as a normal patient through `/signup`, then run `06_make_admin.sql`
in the Supabase SQL Editor with that person’s email. The public app has no admin
signup form or admin-signup API route.
