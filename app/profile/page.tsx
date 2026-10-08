import { AppHeader } from "@/components/app-header"
import { LogoutButton } from "@/components/auth/logout-button"
import { PasswordSecurityCard } from "@/components/patient/password-security-card"
import { ProfileForm } from "@/components/patient/profile-form"
import { ProfilePhotoUpload } from "@/components/patient/profile-photo-upload"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import {
  Activity,
  BadgeCheck,
  Bell,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  IdCard,
  LayoutGrid,
  LockKeyhole,
  Mail,
  Stethoscope,
  UserRound,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const { user, profile } = await requireUser("/profile")
  if (profile?.role === "doctor") redirect("/doctor")
  if (profile?.role === "admin") redirect("/admin")

  const fullName = profile?.full_name?.trim() ?? ""
  const phone = profile?.phone?.trim() ?? ""
  const needsDetails = !fullName || !phone
  const supabase = await createClient()
  const [
    { data: appointments, error: appointmentsError },
    { count: unreadCount, error: notificationsError },
    { data: profileMeta },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, appointment_date, start_time, status, doctors(full_name)")
      .eq("patient_id", user.id)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
    supabase.from("profiles").select("created_at").eq("id", user.id).maybeSingle(),
  ])

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date())
  const appointmentList = appointments ?? []
  const upcoming = appointmentList.filter(
    (item) => item.appointment_date >= today && ["pending", "confirmed"].includes(item.status),
  )
  const nextAppointment = upcoming[0]
  const stats = [
    { label: "Upcoming", value: upcoming.length, icon: Clock3, color: "bg-amber-50 text-amber-700" },
    {
      label: "Completed",
      value: appointmentList.filter((item) => item.status === "completed").length,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Cancelled",
      value: appointmentList.filter((item) => item.status === "cancelled").length,
      icon: XCircle,
      color: "bg-red-50 text-red-700",
    },
  ]
  const completeness = [fullName, phone].filter(Boolean).length * 50
  const memberSince = profileMeta?.created_at
    ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(profileMeta.created_at))
    : null
  const statusClass: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-slate-200 text-slate-700",
  }
  const nextDoctor =
    (nextAppointment?.doctors as unknown as { full_name: string } | null)?.full_name ?? "Clinic doctor"

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader name={fullName || undefined} email={user.email} userId={user.id} />
      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Account settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Your profile</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Keep your contact details current so the clinic can support your appointments.
          </p>
        </div>

        <section className="relative mt-8 overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-sm" aria-labelledby="account-summary-title">
          <div aria-hidden="true" className="absolute -right-16 -top-16 size-40 rounded-full bg-teal-50" />
          <div className="relative p-5 sm:p-7">
            <ProfilePhotoUpload userId={user.id} name={fullName} avatarUrl={profile?.avatar_url}>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="inline-flex whitespace-nowrap rounded-full bg-[#CCFBF1] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#0F766E]">Patient account</p>
                <h2 id="account-summary-title" className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-900">{fullName || "Complete your profile"}</h2>
                <p className="mt-2 flex items-start justify-center gap-2 break-all text-sm text-slate-600 sm:justify-start sm:break-normal"><Mail className="mt-0.5 size-4 shrink-0 text-[#0F766E]" aria-hidden="true" />{user.email ?? "Your account email"}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-[#0F766E]"><LockKeyhole className="size-3.5" />Private account</span>
                  {user.email_confirmed_at ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><BadgeCheck className="size-3.5" />Email verified</span> : null}
                </div>
              </div>
            </ProfilePhotoUpload>
          </div>
          {needsDetails ? <div className="border-t border-teal-100 bg-teal-50/70 px-5 py-3 text-sm leading-6 text-slate-700 sm:px-7"><div className="flex items-center justify-between gap-3"><span>Profile {completeness}% complete - add your {!fullName ? "name" : "phone number"}.</span><span className="h-2 w-24 overflow-hidden rounded-full bg-teal-100"><span className="block h-full bg-[#0F766E]" style={{ width: `${completeness}%` }} /></span></div></div> : null}
        </section>

        <section className="mt-6 flex flex-col gap-6 lg:flex-row" aria-label="Profile details">
          <div className="contents lg:flex lg:min-w-0 lg:flex-[1.35] lg:flex-col lg:gap-6">
            <section className="order-1 relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7" aria-labelledby="care-activity-title">
              <div aria-hidden="true" className="absolute -right-12 -top-16 size-40 rounded-full bg-teal-50/70" />
              <div className="relative">
                <CardHeader icon={Activity} title="Your care activity" description="A quick view of your appointments." id="care-activity-title" />
                {appointmentsError ? (
                  <p className="mt-6 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-800">Your appointment summary could not load. Please refresh and try again.</p>
                ) : (
                  <>
                    <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3" aria-label="Appointment summary">
                      {stats.map(({ label, value, icon: Icon, color }) => <article key={label} className="min-w-0 rounded-2xl bg-slate-50 p-3 sm:p-4"><span className={`grid size-9 place-items-center rounded-full ${color}`}><Icon className="size-4" aria-hidden="true" /></span><p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{value}</p><p className="mt-1 truncate text-xs font-medium text-slate-600 sm:text-sm">{label}</p></article>)}
                    </div>

                    <section className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5" aria-labelledby="next-appointment-title">
                      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#0F766E]"><CalendarDays className="size-5" aria-hidden="true" /></span><div><h3 id="next-appointment-title" className="text-sm font-semibold text-slate-900">Next appointment</h3><p className="mt-0.5 text-xs text-slate-500">Your next planned visit</p></div></div>{nextAppointment ? <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[nextAppointment.status]}`}>{nextAppointment.status}</span> : null}</div>
                      {nextAppointment ? (
                        <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><div className="min-w-0"><p className="truncate text-base font-semibold text-slate-900">{nextDoctor}</p><p className="mt-1 text-sm text-slate-500">Clinic appointment</p><p className="mt-3 text-sm leading-6 text-slate-600">{new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${nextAppointment.appointment_date}T12:00:00`))} at {new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(new Date(`2000-01-01T${nextAppointment.start_time}`))}</p></div><Link href="/appointments" className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white transition-colors motion-reduce:transition-none hover:bg-[#0D5F59] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-teal-600/30 sm:w-auto">View appointment</Link></div>
                      ) : (
                        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-base font-semibold text-slate-900">No upcoming appointment</p><p className="mt-1 text-sm leading-6 text-slate-600">Book your next visit with a trusted doctor.</p></div><Link href="/doctors" className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white transition-colors motion-reduce:transition-none hover:bg-[#0D5F59] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-teal-600/30 sm:w-auto">Find a doctor</Link></div>
                      )}
                    </section>
                  </>
                )}
              </div>
            </section>
            <section className="order-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="personal-details-title"><CardHeader icon={UserRound} title="Personal details" description="Keep your name and phone number up to date." id="personal-details-title" /><ProfileForm userId={user.id} fullName={fullName} phone={phone} /></section>
            <section className="order-4"><PasswordSecurityCard email={user.email} /></section>
          </div>
          <div className="contents lg:flex lg:min-w-[18rem] lg:flex-[.65] lg:flex-col lg:gap-6">
            <aside className="order-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="quick-actions-title"><CardHeader icon={LayoutGrid} title="Quick actions" description="Common tasks, close at hand." id="quick-actions-title" /><div className="mt-6 grid gap-2"><QuickAction href="/doctors" icon={Stethoscope} label="Book appointment" description="Find a doctor" /><QuickAction href="/appointments" icon={CalendarDays} label="My appointments" description="View your bookings" /><QuickAction href="/notifications" icon={Bell} label="Notifications" description="See your updates" badge={notificationsError || !unreadCount ? undefined : String(unreadCount)} /></div></aside>
            <section className="order-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="account-details-title"><CardHeader icon={IdCard} title="Account details" description="Your membership and email status." id="account-details-title" /><dl className="mt-6 grid gap-3"><div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><span className="grid size-9 place-items-center rounded-xl bg-white text-[#0F766E] shadow-sm"><Calendar className="size-4" aria-hidden="true" /></span><div><dt className="text-xs font-medium text-slate-500">Member since</dt><dd className="mt-0.5 text-sm font-semibold text-slate-900">{memberSince ?? "Not available"}</dd></div></div><div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><span className="grid size-9 place-items-center rounded-xl bg-white text-[#0F766E] shadow-sm"><Mail className="size-4" aria-hidden="true" /></span><div><dt className="text-xs font-medium text-slate-500">Email status</dt><dd className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">{user.email_confirmed_at ? <><BadgeCheck className="size-4" aria-hidden="true" />Verified</> : "Not verified"}</dd></div></div></dl><div className="mt-6 border-t border-slate-200 pt-5"><LogoutButton className="h-11 w-full rounded-xl border-red-200 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:ring-red-500/30" /></div></section>
          </div>
        </section>
      </main>
    </div>
  )
}

function CardHeader({ icon: Icon, title, description, id }: { icon: typeof Activity; title: string; description: string; id: string }) {
  return <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#0F766E]"><Icon className="size-5" aria-hidden="true" /></span><div><h2 id={id} className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div></div>
}

function QuickAction({ href, icon: Icon, label, description, badge }: { href: string; icon: typeof Stethoscope; label: string; description: string; badge?: string }) {
  return <Link href={href} className="group flex min-h-14 items-center gap-3 rounded-2xl p-2 transition-colors motion-reduce:transition-none hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-teal-600/30"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#0F766E] transition-colors group-hover:bg-[#CCFBF1]"><Icon className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{label}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{description}</span></span>{badge ? <span className="rounded-full bg-[#CCFBF1] px-2 py-0.5 text-xs font-semibold text-[#0F766E]">{badge}</span> : null}<ChevronRight className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" /></Link>
}
