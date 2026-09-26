# MediBook — Product Requirements Document

## 1. Problem

Patients have to call the clinic to book an appointment. Phone lines can be busy, and appointment slots can be double-booked.

## 2. Users

### Patient

- Finds a doctor and books an appointment.

### Admin

- Manages doctors, schedules, patients, and appointments.

## 3. Goal

A patient can book an appointment in under one minute, with no double bookings.

## 4. Features (Version 1)

### Patient features

- Sign up, log in, and log out.
- See doctors and filter them by specialty.
- See available time slots for the next 7 days.
- Book an available slot.
- See and cancel their own appointments.
- Receive live notifications from the bell icon.
- Edit their profile information.

### Admin features

- Create an admin account through an invitation-code protected signup flow.
- Access an admin-only area at `/admin`.
- View a dashboard with daily statistics.
- Add, edit, activate, or hide doctors.
- Set each doctor's working hours and slot length.
- Confirm, cancel, or complete appointments.
- View and search patients.
- Receive live alerts for new bookings.

## 5. Not in Version 1

- Online payments.
- Video calls.
- Doctor login.
- Emails.

## 6. Pages

### Patient pages

| Route | Purpose |
| --- | --- |
| `/` | Home page |
| `/login` | Patient and admin login |
| `/signup` | Patient signup and invitation-only admin signup |
| `/doctors` | Doctors list and filters |
| `/doctors/[id]` | Doctor details and available slots |
| `/appointments` | Patient's appointments |
| `/profile` | Patient profile |

### Admin pages

| Route | Purpose |
| --- | --- |
| `/admin` | Admin dashboard |
| `/admin/doctors` | Manage doctors |
| `/admin/doctors/[id]/schedule` | Manage a doctor's schedule |
| `/admin/appointments` | Manage appointments |
| `/admin/patients` | View and search patients |

## 7. Data (Database Tables)

| Table | Stores |
| --- | --- |
| `profiles` | Name, phone number, and role (`patient` or `admin`) |
| `specialties` | Medical specialties such as Dentist and Cardiologist |
| `doctors` | Name, specialty, fee, photo, bio, and active status |
| `doctor_schedules` | Working day, start time, end time, and slot length |
| `appointments` | Patient, doctor, date, time, status, and reason |
| `notifications` | A message for a user and whether it has been read |

## 8. Rules

1. One appointment slot can be booked only once.
2. An appointment cannot be booked in the past.
3. Patients can see only their own appointments.
4. Patients can cancel an appointment only when it is more than 2 hours away.
5. Only admins can change doctors, schedules, and other users' bookings.
6. An appointment status change sends a notification to the patient.
7. A new booking sends a notification to admins.

## 9. Done When

MediBook is complete when all Version 1 features work on the live website, on both phone and laptop, with no errors.

## 10. Design

### Visual direction

- The experience should feel calm, trustworthy, premium, and welcoming rather than cold or overly corporate.
- Main color: teal `#0F766E`.
- Background: soft off-white `#F8FAFC`, supported by white surfaces and restrained mint or sky accents.
- Status colors: pending amber, confirmed green, cancelled red, and completed grey.
- Font: Inter, with a confident display scale for important headings.
- Rounded cards and buttons, subtle borders, soft shadows, generous whitespace, and clear visual hierarchy.
- Use refined details such as subtle gradients, small geometric or medical motifs, and polished micro-interactions to give MediBook its own recognizable character.
- Use real, warm doctor photography where appropriate. Avoid cluttered stock imagery and generic dashboard-template styling.
- Components: shadcn/ui with Tailwind CSS. Icons: lucide-react.
- Mobile first. Every page must remain attractive, readable, and easy to use on phone and laptop.
- The saved screenshots are inspiration for composition, spacing, and interaction patterns only; do not reproduce any reference exactly.

### Reference images

| File | Main inspiration |
| --- | --- |
| `design/01-home-web-reference.png` | Home page, hero, service sections, and strong editorial layout |
| `design/02-doctors-mobile-reference.png` | Doctor cards, mobile navigation, and polished healthcare presentation |
| `design/03-appointments-profile-reference.png` | Appointments, schedule, notifications, profile, and mobile states |
| `design/04-admin-dashboard-reference.png` | Admin sidebar, calendar, appointment details, and dashboard structure |
| `design/05-booking-slots-reference.png` | Booking journey, availability, authentication, and responsive web screens |
| `design/06-sign-in-reference.png` | Desktop sign-in composition, illustration, focused form, and welcoming entry point |
| `design/07-sign-up-reference.png` | Sign-up fields, sign-in state, onboarding imagery, and mobile authentication flow |

## Phase 1 Checklist

- [x] `PRD.md` is saved in the project.
- [x] The app can be explained in one minute.

## Phase 2 Checklist

- [x] The Design section is added to `PRD.md`.
- [x] Seven design references are saved in `design/`.

## Phase 3 Checklist

- [x] Next.js App Router, TypeScript, and Tailwind CSS are configured.
- [x] shadcn/ui and lucide-react are configured.
- [x] The required shadcn/ui components are installed.
- [x] `AGENTS.md` contains the permanent project rules.
- [x] The app responds successfully at `http://localhost:3000`.
- [x] `npm run lint` and `npm run build` pass.
- [x] Local Git is initialized on `main` with the `project setup` commit.
- [ ] Create the GitHub repository and push `main` (to be completed by the project owner).

## Phase 4 Checklist

- [x] Supabase database Scripts 1–5 were run successfully by the project owner.
- [x] The project has browser and server Supabase clients with session refresh.
- [x] Sign up sends `full_name` and `phone` in `options.data`.
- [x] Login, signup, forgot-password, reset-password, and logout flows are implemented.
- [x] `/appointments` and `/profile` require a logged-in user.
- [x] `/admin` is protected by a server-side admin-role check.
- [x] The approved SQL is saved in the `supabase/` folder.
- [x] Public database connectivity returns 6 doctors, 30 schedules, and 5 specialties.
- [ ] Manually test signup, login, logout, and password reset in the browser.
- [ ] Run Script 6 for the chosen admin email, then log out and back in.
- [ ] Confirm a patient cannot open `/admin` and the admin account can.
