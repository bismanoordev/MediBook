import Link from "next/link"
import { ArrowUpRight, CalendarDays, Clock3, Stethoscope, Users } from "lucide-react"

import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const statusClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-slate-200 text-slate-700",
}
const dayFormatter = new Intl.DateTimeFormat("en-PK", { weekday: "short" })
const timeFormatter = new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" })
const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

function pakistanToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date())
  const part = (name: string) => parts.find((item) => item.type === name)?.value ?? "01"
  return new Date(`${part("year")}-${part("month")}-${part("day")}T12:00:00`)
}

export default async function AdminPage() {
  await requireAdmin()
  const supabase = await createClient()
  const todayDate = pakistanToday()
  const today = isoDate(todayDate)
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayDate)
    date.setDate(todayDate.getDate() - 6 + index)
    return date
  })
  const [todayResult, pendingResult, patientsResult, doctorsResult, appointmentsResult, chartResult] = await Promise.all([
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("appointment_date", today),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "patient"),
    supabase.from("doctors").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("appointments").select("id, start_time, status, doctors(full_name), profiles!appointments_patient_id_fkey(full_name)").eq("appointment_date", today).order("start_time"),
    supabase.from("appointments").select("appointment_date").gte("appointment_date", isoDate(dates[0])).lte("appointment_date", today),
  ])
  const cards = [
    { label: "Today’s appointments", value: todayResult.count ?? 0, icon: CalendarDays, href: "/admin/appointments", hint: "Scheduled visits" },
    { label: "Pending appointments", value: pendingResult.count ?? 0, icon: Clock3, href: "/admin/appointments?status=pending", hint: "Need review" },
    { label: "Total patients", value: patientsResult.count ?? 0, icon: Users, href: "/admin/patients", hint: "Registered patients" },
    { label: "Active doctors", value: doctorsResult.count ?? 0, icon: Stethoscope, href: "/admin/doctors", hint: "Visible in directory" },
  ]
  const chart = dates.map((date) => ({ date: isoDate(date), label: dayFormatter.format(date), count: (chartResult.data ?? []).filter((item) => item.appointment_date === isoDate(date)).length }))
  const max = Math.max(1, ...chart.map((item) => item.count))
  const hasError = [todayResult, pendingResult, patientsResult, doctorsResult, appointmentsResult, chartResult].some((item) => item.error)

  return (
    <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Clinic overview</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Keep today’s care schedule clear, timely, and organised.</p>
        </div>
        <Link href="/admin/appointments" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D5F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">
          View appointments <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {hasError ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Some dashboard information couldn&apos;t be loaded. Please refresh and try again.</div> : null}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Clinic statistics">
        {cards.map(({ label, value, icon: Icon, href, hint }) => (
          <Link key={label} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">
            <div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-[#0F766E]"><Icon className="size-5" /></span><ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-[#0F766E]" aria-hidden="true" /></div>
            <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{hint}</p>
          </Link>
        ))}
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.8fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-slate-900">Today’s appointments</h2><p className="mt-1 text-sm text-slate-500">Patient, clinician, time, and booking status.</p></div>
            <Link href="/admin/appointments" className="rounded-lg px-2 py-1 text-sm font-semibold text-[#0F766E] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]">View all</Link>
          </div>
          {appointmentsResult.error ? (
            <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">Today’s appointments couldn&apos;t be loaded. Please refresh and try again.</p>
          ) : appointmentsResult.data?.length ? (
            <div className="mt-5 divide-y divide-slate-100">
              {appointmentsResult.data.map((appointment) => {
                const patient = appointment.profiles as unknown as { full_name: string } | null
                const doctor = appointment.doctors as unknown as { full_name: string } | null
                return <article key={appointment.id} className="grid gap-2 py-4 text-sm sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4"><div className="min-w-0"><h3 className="truncate font-semibold text-slate-900">{patient?.full_name ?? "Patient"}</h3><p className="mt-1 truncate text-xs text-slate-500">{doctor?.full_name ?? "Clinic doctor"}</p></div><span className="text-slate-600 sm:hidden">{doctor?.full_name ?? "Clinic doctor"}</span><span className="font-medium text-slate-700 sm:font-normal sm:text-slate-600">{timeFormatter.format(new Date(`2000-01-01T${appointment.start_time}`))}</span><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[appointment.status]}`}>{appointment.status}</span></article>
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center text-sm text-slate-500">No appointments are scheduled for today.</div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div><h2 className="text-lg font-semibold text-slate-900">Bookings over 7 days</h2><p className="mt-1 text-sm text-slate-500">Appointments by scheduled date.</p></div>
          {chartResult.error ? (
            <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">Booking activity couldn&apos;t be loaded. Please refresh and try again.</p>
          ) : (
            <div className="mt-8 grid h-48 grid-cols-7 items-end gap-2" aria-label="Bookings over the last 7 days">
              {chart.map((item) => <div key={item.date} className="flex h-full min-w-0 flex-col justify-end text-center"><span className="mb-2 text-xs font-semibold text-slate-600">{item.count}</span><div className="min-h-1 rounded-t-lg bg-[#0F766E] transition-[height]" style={{ height: `${Math.max(4, Math.round((item.count / max) * 100))}%` }} title={`${item.count} bookings`} /><span className="mt-2 text-[11px] text-slate-500">{item.label}</span></div>)}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
