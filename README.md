# MediBook

MediBook is a responsive healthcare appointment platform for finding doctors, viewing live availability, booking appointments, and managing clinic operations.

## Features

- Patient sign-up, login, password reset, profile management, and safe return redirects.
- Doctor discovery by specialty and name, with doctor photos and accessible initials fallbacks.
- Seven-day availability, protected booking, duplicate-slot handling, and patient appointment cancellation more than two hours before a visit.
- Patient and admin notifications with Supabase Realtime.
- Admin dashboard, doctor directory, photo upload, schedules, appointments, and patient history.
- Doctor signup and a five-step onboarding flow for professional details, private credentials, qualifications, practice details, and fee review.
- Doctor workspace with an approval status banner, dashboard, appointment management, weekly availability and days off, profile-change review, private document management, and realtime notifications.
- Doctor application, profile-change, and document review tools for clinic administrators.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and lucide-react.
- Supabase Auth, Postgres, Storage, Row Level Security, and Realtime.

## Screenshots

Add deployment screenshots here when available:

- `docs/screenshots/home.png` — home and specialty discovery.
- `docs/screenshots/doctors.png` — doctor cards and availability.
- `docs/screenshots/booking.png` — booking confirmation dialog.
- `docs/screenshots/admin.png` — admin dashboard and doctor management.

## Local setup

1. Install Node.js 20 or newer.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env.local` with public Supabase configuration:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
   # Or, for older Supabase projects only:
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

   # Server-only booking email delivery (Resend)
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=re_your_resend_api_key
   EMAIL_FROM="MediBook <bookings@your-domain.com>"
   NEXT_PUBLIC_SITE_URL=https://your-production-domain.com

   # Optional: safe email delivery during local development
   EMAIL_TEST_MODE=false
   EMAIL_TEST_RECIPIENT=your-safe-test-inbox@example.com
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Database setup

The approved SQL scripts are in [`supabase/`](./supabase). They define the tables, RLS policies, booking validation, triggers, Realtime publication, and `doctor-photos` bucket.

Scripts `01` through `05` are intended to be run once for a new project. Do not rerun them against an existing production database. Create an admin by signing up normally, then use `06_make_admin.sql` in the Supabase SQL Editor. Scripts `07` through `09` add the doctor portal schema, functions, policies, and private document storage; they are also one-time scripts and must not be changed or rerun against an existing deployment.

## Quality checks

```bash
npm run lint
npm run build
```

## Security notes

- Never commit `.env.local`, service-role secrets, or admin invitation codes.
- The browser uses only the public Supabase publishable/anon key.
- RLS limits patients to their own appointments and notifications; admin actions verify the role on the server.
- Doctor photo uploads use the existing `doctor-photos` bucket. Storage policies limit uploads to authenticated admins and doctors within their own folders.
- Doctor documents use a private storage bucket. Doctors and administrators can access them only through short-lived signed URLs, and RLS limits doctors to their own records, schedules, profile changes, appointments, and notifications.
- Doctor and administrator appointment status changes use the same protected database function, so the first confirmation remains final.
- Configure only trusted local and production redirect URLs in Supabase Auth before deployment.

## Deployment

Deploy to Vercel and configure the same public environment variable names from the setup section. Add the deployed URL to Supabase Auth redirect URLs, then test signup, login, booking, cancellation, doctor onboarding and approval, availability, private document access, profile-change review, and realtime notifications with separate patient, doctor, and admin accounts.
