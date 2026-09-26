# MediBook database

These files are the project copy of the approved Supabase scripts.

- Scripts 01–05 have already been run in the Supabase SQL Editor.
- Do not run them again unless the database is intentionally being rebuilt.
- `06_make_admin.sql` remains available for manually promoting an existing patient account.
- Patient auth uses only the public/publishable key. Never add the service-role secret to browser code.

## Invite-only admin signup

The `/signup` admin form is handled by a server-only route. Add these values to
`.env.local` for local development and to the deployment environment in production:

```text
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
ADMIN_SIGNUP_CODE=use-a-long-random-private-code
```

The service-role key must remain server-only (do not prefix it with `NEXT_PUBLIC_`).
Share the admin signup code privately and rotate it when needed.
