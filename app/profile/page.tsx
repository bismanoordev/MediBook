import { ProfileForm } from "@/components/patient/profile-form"
import { PasswordSecurityCard } from "@/components/patient/password-security-card"
import { AppHeader } from "@/components/app-header"
import { LogoutButton } from "@/components/auth/logout-button"
import { requireUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Bell, CalendarDays, CheckCircle2, Clock3, Stethoscope, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

function getInitials(fullName: string) {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")

  return initials.toUpperCase() || "P"
}

export default async function ProfilePage() {
  const { user, profile } = await requireUser("/profile")
  if (profile?.role === "doctor") redirect("/doctor")
  if (profile?.role === "admin") redirect("/admin")
  const fullName = profile?.full_name?.trim() ?? ""
  const phone = profile?.phone?.trim() ?? ""
  const needsDetails = !fullName || !phone
  const supabase = await createClient()
  const [{ data: appointments, error: appointmentsError }, { count: unreadCount, error: notificationsError }, { data: profileMeta }] = await Promise.all([
    supabase.from("appointments").select("id, appointment_date, start_time, status, doctors(full_name)").eq("patient_id", user.id).order("appointment_date", { ascending: true }).order("start_time", { ascending: true }),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
    supabase.from("profiles").select("created_at").eq("id", user.id).maybeSingle(),
  ])
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date())
  const appointmentList = appointments ?? []
  const upcoming = appointmentList.filter((item) => item.appointment_date >= today && ["pending", "confirmed"].includes(item.status))
  const nextAppointment = upcoming[0]
  const stats = [{ label: "Upcoming", value: upcoming.length, icon: Clock3, color: "text-amber-700 bg-amber-50" }, { label: "Completed", value: appointmentList.filter((item) => item.status === "completed").length, icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50" }, { label: "Cancelled", value: appointmentList.filter((item) => item.status === "cancelled").length, icon: XCircle, color: "text-red-700 bg-red-50" }]
  const completeness = [fullName, phone].filter(Boolean).length * 50
  const memberSince = profileMeta?.created_at ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(profileMeta.created_at)) : null
  const statusClass: Record<string, string> = { pending: "bg-amber-100 text-amber-800", confirmed: "bg-emerald-100 text-emerald-800", cancelled: "bg-red-100 text-red-800", completed: "bg-slate-200 text-slate-700" }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader name={fullName || undefined} email={user.email} userId={user.id} />

      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Account settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Your profile</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Keep your contact details current so the clinic can support your appointments.</p>
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-labelledby="account-summary-title">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[#0F766E] text-lg font-semibold text-white shadow-sm" aria-hidden="true">{getInitials(fullName)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0F766E]">Patient account</p>
              <h2 id="account-summary-title" className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-900">{fullName || "Complete your profile"}</h2>
              <p className="mt-1 truncate text-sm text-slate-600">{user.email ?? "Your account email"}</p>
            </div>
            <div className="flex flex-wrap gap-2"><span className="w-fit rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-[#0F766E]">Private account</span>{user.email_confirmed_at ? <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Email verified</span> : null}</div>
          </div>
          {needsDetails ? <div className="border-t border-teal-100 bg-teal-50/70 px-5 py-3 text-sm leading-6 text-slate-700 sm:px-7"><div className="flex items-center justify-between gap-3"><span>Profile {completeness}% complete — add your {!fullName ? "name" : "phone number"}.</span><span className="h-2 w-24 overflow-hidden rounded-full bg-teal-100"><span className="block h-full bg-[#0F766E]" style={{ width: `${completeness}%` }} /></span></div></div> : null}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(15rem,.65fr)]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-900">Your care activity</h2><p className="mt-1 text-sm text-slate-600">A quick view of your appointments.</p></div><CalendarDays className="size-5 text-[#0F766E]" /></div>{appointmentsError ? <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">Your appointment summary couldn’t load. Please refresh and try again.</p> : <><div className="mt-5 grid grid-cols-3 gap-3">{stats.map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-2xl bg-slate-50 p-3"><span className={`grid size-8 place-items-center rounded-xl ${color}`}><Icon className="size-4" /></span><p className="mt-3 text-xl font-semibold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}</div><div className="mt-5 rounded-2xl border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-900">Next appointment</p>{nextAppointment ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">{(nextAppointment.doctors as unknown as { full_name: string } | null)?.full_name ?? "Clinic doctor"}</p><p className="mt-1 text-sm text-slate-600">{new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${nextAppointment.appointment_date}T12:00:00`))} at {new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(new Date(`2000-01-01T${nextAppointment.start_time}`))}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[nextAppointment.status]}`}>{nextAppointment.status}</span></div> : <div className="mt-3"><p className="text-sm text-slate-600">No upcoming appointment yet.</p><Link href="/doctors" className="mt-3 inline-flex h-10 items-center rounded-xl bg-[#0F766E] px-3 text-sm font-semibold text-white hover:bg-[#0D5F59]">Find a doctor</Link></div>}</div></>}</div>
          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="text-xl font-semibold text-slate-900">Quick actions</h2><p className="mt-1 text-sm text-slate-600">Everything you need, close at hand.</p><div className="mt-5 grid gap-2"><Link href="/doctors" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-800 hover:bg-teal-50 hover:text-[#0F766E]"><Stethoscope className="size-4" />Book a new appointment</Link><Link href="/appointments" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-800 hover:bg-teal-50 hover:text-[#0F766E]"><CalendarDays className="size-4" />My appointments</Link><Link href="/notifications" className="flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-semibold text-slate-800 hover:bg-teal-50 hover:text-[#0F766E]"><span className="flex items-center gap-3"><Bell className="size-4" />Notifications</span>{notificationsError ? null : unreadCount ? <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs text-[#0F766E]">{unreadCount}</span> : null}</Link></div></aside>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="personal-details-title">
          <div>
            <h2 id="personal-details-title" className="text-xl font-semibold tracking-tight text-slate-900">Personal details</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Only your name and phone number can be updated here. Your sign-in email stays read-only.</p>
          </div>
          <ProfileForm userId={user.id} fullName={fullName} phone={phone} />
        </section>

        <div className="mt-6"><PasswordSecurityCard email={user.email} /></div>
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="text-xl font-semibold text-slate-900">Account details</h2><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Member since</dt><dd className="mt-1 font-semibold text-slate-900">{memberSince ?? "Not available"}</dd></div><div><dt className="text-slate-500">Email status</dt><dd className="mt-1 font-semibold text-slate-900">{user.email_confirmed_at ? "Verified" : "Not verified"}</dd></div></dl><div className="mt-6 border-t border-slate-100 pt-5"><LogoutButton className="h-11 rounded-xl border-red-200 text-red-700 hover:bg-red-50" /></div></section>
      </main>
    </div>
  )
}
