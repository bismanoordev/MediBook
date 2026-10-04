# MediBook Doctor Portal — Build Plan

This file is the source of truth for the doctor portal. Read it fully before touching any doctor-portal task, together with `AGENTS.md`, `PRD.md`, and `design/README.md`.

## How to work with this plan

1. Do **one step at a time**, in order. Never start a step before the previous step is checked off below.
2. Before writing code, read the relevant guide in `node_modules/next/dist/docs/` (this is Next.js 16: the middleware file is `proxy.ts`).
3. After each step: run `npm run lint` and `npm run build`, fix every error, test the flow in the browser (phone and laptop width), tick the step's checkbox in this file, and commit with a clear message.
4. **Never change the database.** The SQL is finished in `supabase/07_doctor_tables.sql`, `08_doctor_functions.sql`, and `09_doctor_security.sql`. The project owner runs SQL manually in Supabase. If a step needs a database change, stop and write the exact SQL for the owner instead of changing anything.
5. Never put secret keys in client code. Never use the service-role key. Use the normal Supabase clients in `lib/supabase/`.
6. Explain what you built in simple words at the end of every step.
7. Do not redesign or break existing patient and admin pages.

Prompt the owner can paste into the coding assistant:

> Read AGENTS.md, PRD.md, design/README.md and DOCTOR_PORTAL_PLAN.md. Do only the next unchecked step of the plan. Follow it exactly, run lint and build, tick the checkbox, and commit.

## Decisions (final)

- Every new doctor needs **admin approval** before patients can see them.
- An appointment can be confirmed by the **doctor or an admin**. The first confirmation is final.
- Required documents: **CNIC** and **PMDC license**. **Degree certificate** is optional.
- Appointment requests **do not expire**.
- A doctor's **profile changes go live only after admin review**. The old profile stays visible meanwhile.
- **No verification levels.** A doctor is simply approved or not.
- Doctors set their own working hours and days off.

## Design (very important)

- Use MediBook's own theme from `design/README.md`: teal `#0F766E`, hover `#0D5F59`, soft teal `#CCFBF1`, background `#F8FAFC`, white cards, text `#0F172A`, secondary text `#64748B`, borders `#E2E8F0`, Inter font, rounded cards (~16px) and controls (~10–12px).
- **Do not use the brown/gold colors** of the reference website (umrapilot.com). It is only inspiration for structure: sidebar dashboard, multi-step onboarding with a progress ring, tab filters, and document status rows.
- Copy the layout pattern of `components/admin/admin-shell.tsx` for the doctor shell (sidebar on desktop, drawer on mobile, top bar with notification bell and account menu).
- Appointment status colors and wording must match the rest of the app: pending amber, confirmed green, cancelled red, completed grey.
- Document status badges: **Verified** (green), **Pending** (amber), **Needs action** (red), **Missing** (grey). Always show an icon and the word, never color alone.
- Every data page needs loading, empty, and error states, and must work on mobile and desktop.

## Routes

| Route | Who | Purpose |
| --- | --- | --- |
| `/signup` | public | Patient **or** doctor choice |
| `/doctor/onboarding` | doctor | 5-step registration |
| `/doctor` | doctor | Dashboard |
| `/doctor/appointments` | doctor | Pending, Upcoming, Completed, Cancelled tabs |
| `/doctor/availability` | doctor | Weekly hours and days off |
| `/doctor/profile` | doctor | Edit public profile (sent for review) |
| `/doctor/documents` | doctor | Upload and track documents |
| `/doctor/notifications` | doctor | Notification list |
| `/admin/doctors/applications` | admin | Review applications, profile changes, and documents |

Where each role lands after login or signup:

| Role / state | Destination |
| --- | --- |
| patient | `/doctors` |
| admin | `/admin` |
| doctor with status `draft`, `rejected`, or `changes_requested` | `/doctor/onboarding` |
| doctor with status `pending` or `approved` | `/doctor` |

Access rules (server-side, in layouts/pages, in addition to RLS): `/doctor/*` only for role `doctor`; `/admin/*` only for role `admin`; patients and guests are redirected away from both. Doctors cannot open patient-only pages such as `/appointments`.

## Database reference (already built, do not change)

Applied by scripts 07–09. Tables and columns:

- `profiles.role`: `'patient' | 'doctor' | 'admin'`.
- `doctors` new columns: `user_id`, `approval_status` (`draft | pending | approved | rejected | changes_requested`), `rejection_reason`, `experience_years`, `languages text[]`, `clinic_name`, `city`, `pmdc_number`, `qualifications jsonb` (array of `{ degree, institution, year }`), `onboarding_step` (1–5), `submitted_at`, `reviewed_at`. Existing doctors are `approved`.
- `doctor_documents`: `doctor_id`, `doc_type` (`cnic | pmdc_license | degree`), `file_path`, `file_name`, `status` (`pending | verified | needs_action`), `reviewer_note`, `uploaded_at`, `reviewed_at`. One row per doctor per type. A missing row means **Missing**.
- `doctor_time_off`: `doctor_id`, `start_date`, `end_date` (max 90 days). Readable by everyone.
- `doctor_profile_changes`: `doctor_id`, `changes jsonb`, `status` (`pending | approved | rejected`), `admin_note`. One pending change per doctor. Allowed keys in `changes`: `full_name`, `bio`, `fee`, `photo_url`, `specialty_id`, `experience_years`, `languages`, `clinic_name`, `city`, `qualifications`.

Signup: `supabase.auth.signUp` with `options.data = { full_name, phone, role: "doctor", specialty_id }`. A trigger creates the profile and a **draft** doctor row. Patients send no `role`.

RPC functions (call with `supabase.rpc`):

- `submit_doctor_application()` — checks required fields and documents, sets status `pending`, notifies admins.
- `set_appointment_status({ p_appointment_id, p_status, p_cancel_reason? })` — `p_status` is `confirmed | cancelled | completed`. Allowed for the appointment's doctor or an admin. Use it for **all** doctor and admin status changes so "first confirmation is final" is enforced.
- `review_profile_change({ p_change_id, p_approve, p_note? })` — admin only.
- Existing: `get_booked_slots`, `cancel_appointment`, `is_admin`.

Storage:

- `doctor-photos` (public): doctors upload to `{auth user id}/{filename}`.
- `doctor-documents` (**private**, 5 MB, jpg/png/pdf only): files at `{auth user id}/{doc_type}-{timestamp}.{ext}`. Never use public URLs. Show files with short-lived signed URLs from the server (`createSignedUrl`, about 5 minutes).

Direct table access allowed by RLS:

- Doctor updates their own `doctors` row **only while** status is `draft`, `rejected`, or `changes_requested` (onboarding). After approval, profile edits must insert into `doctor_profile_changes` instead.
- Doctor reads own appointments and the profiles (name, phone) of patients who booked them.
- Doctor manages own `doctor_schedules` and `doctor_time_off`, and inserts/replaces own `doctor_documents` unless already `verified`.
- Patients see only doctors that are `is_active = true` **and** `approval_status = 'approved'`.

Friendly messages for database errors (never show raw errors):

| Database message contains | Show |
| --- | --- |
| `already confirmed` / `already` | "This appointment was already updated. Refresh to see the latest status." |
| `only pending appointments can be confirmed` | "Only pending appointments can be confirmed." |
| `before it starts` | "You can complete an appointment only after it starts." |
| `complete all required fields` | "Please complete every required field before submitting." |
| `upload your CNIC and PMDC license` | "Please upload your CNIC and PMDC license before submitting." |
| `already submitted` | "Your application is already under review." |
| `already have appointments on these days` | "You already have appointments on these days. Cancel them first." |
| `not available on this day` | "The doctor is away on this day. Please choose another date." |
| `already reviewed` | "Someone already reviewed this. Refresh the page." |

## Steps

### Step 0 — PRD and database scripts
- [x] `PRD.md` and `design/README.md` updated with the doctor portal.
- [x] SQL scripts 07, 08, 09 written and saved in `supabase/`.
- [x] **Owner:** ran scripts 07, 08, 09 in order in the Supabase SQL Editor with no errors.

Do not start Step 1 until the owner confirms the scripts ran.

### Step 1 — Types and auth plumbing
Goal: the app knows about doctors, without any visible UI change yet.
- Update `lib/supabase/database.types.ts` for the new columns, tables, and RPC functions (use `npx supabase gen types typescript --project-id <id>` if available, otherwise edit by hand to match the SQL exactly).
- `lib/auth.ts`: `UserRole` becomes `"patient" | "doctor" | "admin"`. Add `requireDoctor()` (redirects guests to `/login?next=%2Fdoctor`, and non-doctors to `/doctors`). Add `getDoctorRecord()` (cached, returns the signed-in doctor's `doctors` row). Update `requireAdmin()` so doctors are redirected to `/doctor`.
- Add one shared helper, for example `getHomePath(role, approvalStatus)`, that implements the "where each role lands" table. Use it in `redirectAuthenticatedUser()`, `components/auth/login-form.tsx`, and `app/auth/callback/route.ts` (respect the safe `next` parameter).
- Block doctors from patient-only pages (`/appointments`, `/profile`): redirect them to `/doctor`.
Test: patient and admin logins still land where they did before; lint and build pass.

### Step 2 — Patient side shows only approved doctors
Goal: unapproved doctors never leak to patients.
- Add `.eq("is_active", true).eq("approval_status", "approved")` to every patient-facing doctor query: `app/page.tsx`, `app/doctors/page.tsx`, `app/doctors/[id]/page.tsx` (show not-found otherwise), and anywhere else doctors are listed for patients.
- Admin pages keep seeing every doctor. In `app/admin/page.tsx` the "doctors" count counts only `approved` + active doctors.
Test: existing 6 doctors still show everywhere. (Draft doctors will be tested in Step 4.)

### Step 3 — Signup: patient or doctor
Goal: `/signup` has an "I'm a patient / I'm a doctor" toggle.
- Patient flow stays exactly as it is.
- Doctor flow fields: full name, email, phone, **specialty** (select from `specialties`), password, confirm password, terms checkbox. Same validation style as the patient form (yup).
- Doctor `signUp` sends `data: { full_name, phone, role: "doctor", specialty_id }` and `emailRedirectTo` `/auth/callback?next=/doctor/onboarding`.
- If email confirmation is on, show the same "Check your email" screen. If a session is returned, go to `/doctor/onboarding`.
- Never expose an admin option anywhere.
Test: a new doctor account creates a `profiles` row with role `doctor` and a `doctors` row with status `draft`; a patient signup is unchanged.

### Step 4 — Doctor shell and route protection
Goal: `/doctor/*` pages exist inside a proper layout.
- `app/doctor/layout.tsx` uses `requireDoctor()`. Create `components/doctor/doctor-shell.tsx` modeled on `AdminShell` (teal theme): sidebar items Dashboard, Appointments, Availability, My profile, Documents, Notifications; mobile drawer; top bar with `NotificationBell` and account menu.
- The onboarding page uses a simpler layout (no sidebar) until the application is submitted.
- Show a status banner when the doctor is not yet approved: `pending` → "Your application is under review"; `rejected`/`changes_requested` → show `rejection_reason` and a button back to onboarding.
- Add `loading.tsx` and `error.tsx` for the `/doctor` segment.
Test: a patient or guest opening `/doctor` is redirected; a doctor opening `/admin` is redirected; mobile menu works.

### Step 5 — Doctor onboarding (5 steps)
Goal: `/doctor/onboarding`, with a progress ring and a step list, auto-saving each step.
Accessible only while status is `draft`, `rejected`, or `changes_requested`; otherwise redirect to `/doctor`. Resume at `onboarding_step`.

1. **Personal info** — full name, phone (saved to `profiles`), city, profile photo (square, at least 600×600, jpg/png/webp, max 5 MB, uploaded to `doctor-photos/{userId}/...`, initials fallback), short bio.
2. **Documents** — upload CNIC and PMDC license (required) and degree certificate (optional) to the private `doctor-documents` bucket; create/replace the `doctor_documents` row (status `pending`). Show file name, a replace action, and the status badge.
3. **Qualifications** — add or remove degrees (`degree`, `institution`, `year`), years of experience, and the **PMDC number**.
4. **Languages and practice** — languages (multi-select chips), specialty (prefilled from signup), clinic or hospital name.
5. **Fee and review** — consultation fee (must be greater than 0) and a read-only summary of everything. A "Submit for review" button calls `rpc('submit_doctor_application')`.

Rules: validate every step with clear inline messages; save with `update` on the doctor's own row and set `onboarding_step`; "Back" and "Continue" buttons; works on phone; friendly errors only. After a successful submit, show a success message and go to `/doctor`.
Test: documents land in the private bucket; submitting with missing fields shows a friendly message; after submit the status is `pending`; admins get a notification; a draft doctor does not appear in `/doctors`.

### Step 6 — Admin: review applications
Goal: `/admin/doctors/applications` (add "Applications" to the admin navigation and a link from `/admin/doctors`).
- List with tabs: Pending, Changes requested, Rejected, Approved (counts in tabs). Search by name.
- Detail view for one application: all fields, photo, qualifications, and each document with a **signed URL** preview or download plus a status control (Verify, Needs action with a note).
- Actions on the application: **Approve**, **Reject** (reason required), **Request changes** (note required). Update `doctors.approval_status` and `rejection_reason`. The database sends the doctor a notification and stamps `reviewed_at`.
- Add a pending-applications card to the admin dashboard.
- Server-side admin checks on every action.
Test: approving makes the doctor appear in `/doctors` (needs an active schedule to show slots); rejecting shows the reason to the doctor; the doctor gets a notification each time.

### Step 7 — Doctor dashboard
Goal: `/doctor` after approval.
- Greeting, 4 stat cards (today's appointments, pending requests, total patients, profile completeness %), today's appointments table, and a "Next appointment" card.
- Patient names and phones come from the doctor's allowed access to patients who booked them.
- Loading skeletons, empty and error states, mobile-friendly cards.
Test: numbers match the data in Supabase.

### Step 8 — Doctor appointments
Goal: `/doctor/appointments`.
- Tabs: Pending, Upcoming, Completed, Cancelled. Table (cards on mobile) with patient name, phone, date, time, reason, and status badge. Paginate 20 per page.
- Buttons: **Confirm**, **Decline** (with confirmation dialog and optional reason), **Mark completed** (only for confirmed appointments whose time has started). All through `rpc('set_appointment_status')`.
- Realtime: new bookings and status changes update the list without refresh (reuse the pattern in `components/admin/appointments-realtime.tsx`).
- Also change the admin appointments buttons to use `rpc('set_appointment_status')` so both roles follow the same rules.
Test: patient books → doctor sees it live; doctor confirms → patient sees "Confirmed" and gets a notification; confirming twice (doctor then admin) shows the friendly "already updated" message.

### Step 9 — Availability (hours and days off)
Goal: `/doctor/availability`.
- Weekly schedule form: for each weekday on/off, start, end, slot length (15/20/30/60). Reuse the logic of `components/admin/schedule-form.tsx`, but save as the signed-in doctor.
- Days off: pick first and last day (max 90 days), list with Remove. Show already booked days separately. Friendly message if the database refuses because appointments exist.
- Patient booking page (`app/doctors/[id]/page.tsx` and `components/patient/doctor-booking-flow.tsx`): read `doctor_time_off`, hide or disable those dates, and show "Doctor is away".
Test: a day off disappears from patient slots; booking a blocked day directly is refused with the friendly message.

### Step 10 — Doctor profile (changes go to review)
Goal: `/doctor/profile`.
- Form: photo, name, bio, fee, specialty, experience, languages, clinic, city, qualifications. Phone is edited directly in `profiles`.
- For an **approved** doctor, "Send for review" inserts a row in `doctor_profile_changes` containing only changed fields. Show a "Changes waiting for review" notice, with a Withdraw action. Disable the form while a change is pending.
- Public profile stays unchanged until approval.
- Admin: in `/admin/doctors/applications` add a "Profile changes" tab showing old vs new values with Approve and Reject (note) via `rpc('review_profile_change')`.
Test: the patient page keeps the old data until the admin approves; after approval it updates and the doctor is notified.

### Step 11 — Doctor documents page
Goal: `/doctor/documents`.
- Summary cards (Verified, Pending, Needs action, Missing) and a table with one row per document type: name, file, uploaded date, status badge, reviewer note, and Upload/Replace (hidden for verified files).
- Same upload rules as onboarding (jpg/png/pdf, max 5 MB). Open files only with signed URLs.
Test: a doctor can never open another doctor's file; a verified document cannot be replaced.

### Step 12 — Notifications for doctors
- `/doctor/notifications` list with "Mark all as read", using the existing notification components and realtime.
- Notification bell in the doctor top bar with a toast on new items.
Test: patient books → doctor bell +1 without refresh; admin approves → doctor bell +1; a doctor never sees someone else's notifications.

### Step 13 — Final checks
- Security review: RLS behaviour for doctor, patient, admin, and guest; no secret keys in client code; every doctor and admin action checked on the server; private documents truly private; no admin option in any browser form.
- Test all roles on phone and laptop widths: signup, onboarding, approval, booking, confirm by doctor, confirm by admin, cancel, days off, profile change review, notifications.
- No console errors. `npm run lint` and `npm run build` pass.
- Update `README.md` (doctor portal features) and tick the PRD checklist.
- Make sure the existing patient and admin features still work.

## Progress

Tick each step when it is finished and committed.

- [x] Step 0 — owner ran SQL scripts 07, 08, 09
- [ ] Step 1 — Types and auth plumbing
- [ ] Step 2 — Patient side shows only approved doctors
- [ ] Step 3 — Signup: patient or doctor
- [ ] Step 4 — Doctor shell and route protection
- [ ] Step 5 — Doctor onboarding
- [ ] Step 6 — Admin: review applications
- [ ] Step 7 — Doctor dashboard
- [ ] Step 8 — Doctor appointments
- [ ] Step 9 — Availability
- [ ] Step 10 — Doctor profile changes
- [ ] Step 11 — Doctor documents page
- [ ] Step 12 — Notifications for doctors
- [ ] Step 13 — Final checks
