import Link from "next/link"
import { ArrowUpRight, CalendarDays, Clock3, Users, UserRoundCheck } from "lucide-react"

import { getAuthState, getDoctorRecord } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const statusClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-slate-200 text-slate-700",
}

function pakistanDateParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00"
  return { date: `${value("year")}-${value("month")}-${value("day")}`, time: `${value("hour")}:${value("minute")}` }
}

const dateFormatter = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", weekday: "short", day: "numeric", month: "short" })
const timeFormatter = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit" })

function formatDate(date: string) { return dateFormatter.format(new Date(`${date}T12:00:00+05:00`)) }
function formatTime(time: string) { return timeFormatter.format(new Date(`2000-01-01T${time}+05:00`)) }

export default async function DoctorDashboardPage() {
  const [{ profile }, doctor] = await Promise.all([getAuthState(), getDoctorRecord()])
  if (!doctor) return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"><div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">We couldn&apos;t find your doctor profile. Please contact the clinic for help.</div></main>

  const { date: today, time: now } = pakistanDateParts()
  const supabase = await createClient()
  const [todayResult, pendingResult, patientsResult, futureResult] = await Promise.all([
    supabase.from("appointments").select("id,appointment_date,start_time,status,reason,profiles!appointments_patient_id_fkey(full_name,phone)").eq("doctor_id", doctor.id).eq("appointment_date", today).order("start_time"),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("doctor_id", doctor.id).eq("status", "pending"),
    supabase.from("appointments").select("patient_id").eq("doctor_id", doctor.id),
    supabase.from("appointments").select("id,appointment_date,start_time,status,reason,profiles!appointments_patient_id_fkey(full_name,phone)").eq("doctor_id", doctor.id).in("status", ["pending", "confirmed"]).gte("appointment_date", today).order("appointment_date").order("start_time"),
  ])
  const todayAppointments = todayResult.data ?? []
  const nextAppointment = (futureResult.data ?? []).find((appointment) => appointment.appointment_date > today || appointment.start_time >= now)
  const totalPatients = new Set((patientsResult.data ?? []).map((appointment) => appointment.patient_id)).size
  const completeness = [doctor.full_name, doctor.bio, doctor.photo_url, doctor.specialty_id, doctor.fee > 0, doctor.experience_years !== null, doctor.languages.length > 0, doctor.clinic_name, doctor.city, doctor.pmdc_number, Array.isArray(doctor.qualifications) && doctor.qualifications.length > 0].filter(Boolean).length
  const completenessPercent = Math.round((completeness / 11) * 100)
  const hasError = [todayResult, pendingResult, patientsResult, futureResult].some((result) => result.error)
  const firstName = (profile?.full_name || doctor.full_name).trim().split(/\s+/)[0] || "Doctor"
  const cards = [
    { label: "Today’s appointments", value: todayAppointments.length, hint: "Scheduled visits", icon: CalendarDays, href: "/doctor/appointments" },
    { label: "Pending requests", value: pendingResult.count ?? 0, hint: "Awaiting your response", icon: Clock3, href: "/doctor/appointments?status=pending" },
    { label: "Total patients", value: totalPatients, hint: "Patients you have seen", icon: Users, href: "/doctor/appointments" },
    { label: "Profile completeness", value: `${completenessPercent}%`, hint: "Keep your profile current", icon: UserRoundCheck, href: "/doctor/profile" },
  ]

  return <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Doctor dashboard</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Good day, Dr. {firstName}</h1><p className="mt-2 text-sm leading-6 text-slate-600">Here&apos;s a clear view of your care schedule and practice today.</p></div><Link href="/doctor/appointments" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D5F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">View appointments <ArrowUpRight className="size-4" /></Link></div>
    {hasError ? <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Some dashboard information couldn&apos;t be loaded. Please refresh and try again.</p> : null}

    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Doctor statistics">{cards.map(({ label, value, hint, icon: Icon, href }) => <Link key={label} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"><div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-[#0F766E]"><Icon className="size-5" /></span><ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-[#0F766E]" /></div><p className="mt-5 text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</p><p className="mt-2 text-xs text-slate-500">{hint}</p></Link>)}</section>

    <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,.75fr)]"><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Today&apos;s appointments</h2><p className="mt-1 text-sm text-slate-500">Patient details and visit times for {formatDate(today)}.</p></div><Link href="/doctor/appointments" className="rounded-lg px-2 py-1 text-sm font-semibold text-[#0F766E] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]">View all</Link></div>{todayResult.error ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">Today&apos;s appointments couldn&apos;t be loaded. Please refresh and try again.</p> : todayAppointments.length ? <div className="mt-5 divide-y divide-slate-100">{todayAppointments.map((appointment) => { const patient = appointment.profiles as unknown as { full_name: string | null; phone: string | null } | null; return <article key={appointment.id} className="grid gap-2 py-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4"><div className="min-w-0"><h3 className="truncate font-semibold text-slate-900">{patient?.full_name ?? "Patient"}</h3><p className="mt-1 text-xs text-slate-500">{patient?.phone ?? "Phone not available"}{appointment.reason ? ` · ${appointment.reason}` : ""}</p></div><span className="font-medium text-slate-700 sm:font-normal sm:text-slate-600">{formatTime(appointment.start_time)}</span><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[appointment.status]}`}>{appointment.status}</span></article> })}</div> : <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center text-sm text-slate-500">No appointments are scheduled for today.</div>}</article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-semibold text-slate-900">Next appointment</h2><p className="mt-1 text-sm text-slate-500">Your next pending or confirmed visit.</p>{futureResult.error ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load your next appointment. Please refresh and try again.</p> : nextAppointment ? (() => { const patient = nextAppointment.profiles as unknown as { full_name: string | null; phone: string | null } | null; return <div className="mt-6 rounded-xl bg-teal-50 p-4"><p className="text-sm font-semibold text-[#0F766E]">{formatDate(nextAppointment.appointment_date)} · {formatTime(nextAppointment.start_time)}</p><h3 className="mt-4 text-xl font-semibold text-slate-900">{patient?.full_name ?? "Patient"}</h3><p className="mt-1 text-sm text-slate-600">{patient?.phone ?? "Phone not available"}</p>{nextAppointment.reason ? <p className="mt-3 border-t border-teal-100 pt-3 text-sm text-slate-600">Reason: {nextAppointment.reason}</p> : null}<Link href="/doctor/appointments" className="mt-4 inline-flex text-sm font-semibold text-[#0F766E] hover:underline">Open appointments <ArrowUpRight className="ml-1 size-4" /></Link></div> })() : <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center text-sm text-slate-500">You have no upcoming appointments.</div>}</article></section>
  </main>
}
