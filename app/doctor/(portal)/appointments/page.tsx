import Link from "next/link"
import { redirect } from "next/navigation"

import { DoctorAppointmentActions } from "@/components/doctor/doctor-appointment-actions"
import { DoctorAppointmentsRealtime } from "@/components/doctor/doctor-appointments-realtime"
import { getDoctorRecord } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const pageSize = 20
const tabs = ["pending", "upcoming", "completed", "cancelled"] as const
type Tab = typeof tabs[number]
type Search = { tab?: string; page?: string }
const statusClass: Record<string, string> = { pending: "bg-amber-100 text-amber-800", confirmed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800", completed: "bg-slate-200 text-slate-700" }

function pakistanNow() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00"
  return { date: `${value("year")}-${value("month")}-${value("day")}`, time: `${value("hour")}:${value("minute")}` }
}

const dateFormatter = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", weekday: "short", day: "numeric", month: "short", year: "numeric" })
const timeFormatter = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit" })
function formatDate(value: string) { return dateFormatter.format(new Date(`${value}T12:00:00+05:00`)) }
function formatTime(value: string) { return timeFormatter.format(new Date(`2000-01-01T${value}+05:00`)) }
function href(tab: Tab, page = 1) { return `/doctor/appointments?tab=${tab}&page=${page}` }

export default async function DoctorAppointmentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const doctor = await getDoctorRecord()
  if (!doctor) return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"><p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">We couldn&apos;t find your doctor profile. Please contact the clinic for help.</p></main>
  if (["draft", "rejected", "changes_requested"].includes(doctor.approval_status)) redirect("/doctor/onboarding")

  const params = await searchParams
  const tab: Tab = tabs.includes(params.tab as Tab) ? params.tab as Tab : "pending"
  const requestedPage = Math.max(1, Number(params.page) || 1)
  const { date: today, time: now } = pakistanNow()
  const supabase = await createClient()
  let query = supabase.from("appointments").select("id,appointment_date,start_time,status,reason,cancel_reason,profiles!appointments_patient_id_fkey(full_name,phone)", { count: "exact" }).eq("doctor_id", doctor.id)
  if (tab === "pending") query = query.eq("status", "pending").order("appointment_date").order("start_time")
  if (tab === "upcoming") query = query.eq("status", "confirmed").gte("appointment_date", today).order("appointment_date").order("start_time")
  if (tab === "completed") query = query.eq("status", "completed").order("appointment_date", { ascending: false }).order("start_time", { ascending: false })
  if (tab === "cancelled") query = query.eq("status", "cancelled").order("appointment_date", { ascending: false }).order("start_time", { ascending: false })
  const { data: appointments, error, count } = await query.range((requestedPage - 1) * pageSize, requestedPage * pageSize - 1)
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const list = appointments ?? []

  return <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9">
    <DoctorAppointmentsRealtime doctorId={doctor.id} />
    <p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Care schedule</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Appointments</h1><p className="mt-2 text-sm text-slate-600">Review requests and keep your patients informed.</p>
    <nav className="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Appointment status filters">{tabs.map((item) => <Link key={item} href={href(item)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold ${tab === item ? "bg-[#0F766E] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-teal-50 hover:text-[#0F766E]"}`}>{item === "upcoming" ? "Upcoming" : item[0].toUpperCase() + item.slice(1)}</Link>)}</nav>
    {error ? <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load appointments. Please refresh and try again.</p> : list.length ? <><p className="mt-5 text-sm text-slate-500">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, count ?? 0)} of {count ?? 0} appointments.</p><div className="mt-4 grid gap-3 sm:hidden">{list.map((appointment) => { const patient = appointment.profiles as unknown as { full_name: string | null; phone: string | null } | null; const canComplete = appointment.status === "confirmed" && (appointment.appointment_date < today || appointment.appointment_date === today && appointment.start_time <= now); return <article key={appointment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-slate-900">{patient?.full_name ?? "Patient"}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[appointment.status]}`}>{appointment.status}</span></div><p className="mt-2 text-sm text-slate-600">{formatDate(appointment.appointment_date)} · {formatTime(appointment.start_time)}</p><p className="mt-1 text-sm text-slate-500">{patient?.phone ?? "Phone not available"}</p>{appointment.reason ? <p className="mt-2 text-sm text-slate-500">Reason: {appointment.reason}</p> : null}{appointment.cancel_reason ? <p className="mt-2 text-sm text-red-700">Decline reason: {appointment.cancel_reason}</p> : null}<div className="mt-4"><DoctorAppointmentActions appointmentId={appointment.id} status={appointment.status} canComplete={canComplete} /></div></article> })}</div><div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm sm:block"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Patient</th><th className="px-5 py-3 font-semibold">Date and time</th><th className="px-5 py-3 font-semibold">Reason</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{list.map((appointment) => { const patient = appointment.profiles as unknown as { full_name: string | null; phone: string | null } | null; const canComplete = appointment.status === "confirmed" && (appointment.appointment_date < today || appointment.appointment_date === today && appointment.start_time <= now); return <tr key={appointment.id}><td className="px-5 py-4"><p className="font-semibold text-slate-900">{patient?.full_name ?? "Patient"}</p><p className="mt-1 text-xs text-slate-500">{patient?.phone ?? "Phone not available"}</p></td><td className="px-5 py-4 text-slate-600">{formatDate(appointment.appointment_date)}<br />{formatTime(appointment.start_time)}</td><td className="max-w-52 px-5 py-4 text-slate-600">{appointment.reason ?? "—"}{appointment.cancel_reason ? <p className="mt-1 text-xs text-red-700">Declined: {appointment.cancel_reason}</p> : null}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[appointment.status]}`}>{appointment.status}</span></td><td className="px-5 py-4"><DoctorAppointmentActions appointmentId={appointment.id} status={appointment.status} canComplete={canComplete} /></td></tr> })}</tbody></table></div><nav className="mt-6 flex items-center justify-between gap-4" aria-label="Appointment pages"><span className="text-sm text-slate-500">Page {page} of {totalPages}</span><div className="flex gap-2">{page > 1 ? <Link href={href(tab, page - 1)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Previous</Link> : null}{page < totalPages ? <Link href={href(tab, page + 1)} className="rounded-xl bg-[#0F766E] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0D5F59]">Next</Link> : null}</div></nav></> : <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No {tab === "upcoming" ? "upcoming" : tab} appointments to show.</div>}
  </main>
}
