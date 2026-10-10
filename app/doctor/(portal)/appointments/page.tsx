import Link from "next/link"
import { redirect } from "next/navigation"

import { DoctorAppointmentsRealtime } from "@/components/doctor/doctor-appointments-realtime"
import { getDoctorRecord } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const pageSize = 20
const tabs = ["pending", "upcoming", "completed", "cancelled"] as const
type Tab = typeof tabs[number]
type Search = { tab?: string; page?: string }
const statusClass: Record<string, string> = { pending: "bg-amber-100 text-amber-800", confirmed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800", completed: "bg-slate-200 text-slate-700" }
const dateFormatter = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", weekday: "short", day: "numeric", month: "short", year: "numeric" })
const timeFormatter = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit" })
function formatDate(value: string) { return dateFormatter.format(new Date(`${value}T12:00:00+05:00`)) }
function formatTime(value: string) { return timeFormatter.format(new Date(`2000-01-01T${value}+05:00`)) }
function href(tab: Tab, page = 1) { return `/doctor/appointments?tab=${tab}&page=${page}` }
function detailHref(id: string, tab: Tab, page: number) { return `/doctor/appointments/${id}?tab=${tab}&page=${page}` }

function pakistanToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00"
  return `${value("year")}-${value("month")}-${value("day")}`
}

export default async function DoctorAppointmentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const doctor = await getDoctorRecord()
  if (!doctor) return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"><p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">We couldn&apos;t find your doctor profile. Please contact the clinic for help.</p></main>
  if (["draft", "rejected", "changes_requested"].includes(doctor.approval_status)) redirect("/doctor/onboarding")

  const params = await searchParams
  const tab: Tab = tabs.includes(params.tab as Tab) ? params.tab as Tab : "pending"
  const requestedPage = Math.max(1, Number(params.page) || 1)
  const supabase = await createClient()
  const patientFields = tab === "upcoming" || tab === "completed" ? "full_name,phone" : "full_name"
  let query = supabase.from("appointments").select(`id,appointment_date,start_time,status,reason,cancel_reason,profiles!appointments_patient_id_fkey(${patientFields})`, { count: "exact" }).eq("doctor_id", doctor.id)
  if (tab === "pending") query = query.eq("status", "pending").order("appointment_date").order("start_time")
  if (tab === "upcoming") query = query.eq("status", "confirmed").gte("appointment_date", pakistanToday()).order("appointment_date").order("start_time")
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
    {error ? <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load appointments. Please refresh and try again.</p> : list.length ? <><p className="mt-5 text-sm text-slate-500">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, count ?? 0)} of {count ?? 0} appointments.</p><div className="mt-4 grid gap-3 md:hidden">{list.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} href={detailHref(appointment.id, tab, page)} />)}</div><div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Patient</th><th className="px-5 py-3 font-semibold">Date and time</th><th className="px-5 py-3 font-semibold">Reason</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold"><span className="sr-only">Details</span></th></tr></thead><tbody className="divide-y divide-slate-100">{list.map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment} href={detailHref(appointment.id, tab, page)} />)}</tbody></table></div><nav className="mt-6 flex items-center justify-between gap-4" aria-label="Appointment pages"><span className="text-sm text-slate-500">Page {page} of {totalPages}</span><div className="flex gap-2">{page > 1 ? <Link href={href(tab, page - 1)} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]">Previous</Link> : null}{page < totalPages ? <Link href={href(tab, page + 1)} className="inline-flex min-h-11 items-center rounded-xl bg-[#0F766E] px-3 text-sm font-semibold text-white hover:bg-[#0D5F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">Next</Link> : null}</div></nav></> : <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No {tab === "upcoming" ? "upcoming" : tab} appointments to show.</div>}
  </main>
}

type ListAppointment = { id: string; appointment_date: string; start_time: string; status: string; reason: string | null; cancel_reason: string | null; profiles: unknown }
function patientFor(appointment: ListAppointment) { return appointment.profiles as { full_name: string | null; phone?: string | null } | null }

function AppointmentCard({ appointment, href: detailUrl }: { appointment: ListAppointment; href: string }) {
  const patient = patientFor(appointment)
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-slate-900">{patient?.full_name ?? "Patient"}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[appointment.status]}`}>{appointment.status}</span></div><p className="mt-2 text-sm text-slate-600">{formatDate(appointment.appointment_date)} · {formatTime(appointment.start_time)}</p>{patient?.phone ? <p className="mt-1 text-sm text-slate-500">{patient.phone}</p> : null}{appointment.reason ? <p className="mt-2 text-sm text-slate-500">Reason: {appointment.reason}</p> : null}{appointment.cancel_reason ? <p className="mt-2 text-sm text-red-700">Decline reason: {appointment.cancel_reason}</p> : null}<Link href={detailUrl} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-teal-200 px-4 text-sm font-semibold text-[#0F766E] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">View details</Link></article>
}

function AppointmentRow({ appointment, href: detailUrl }: { appointment: ListAppointment; href: string }) {
  const patient = patientFor(appointment)
  return <tr><td className="px-5 py-4"><p className="font-semibold text-slate-900">{patient?.full_name ?? "Patient"}</p>{patient?.phone ? <p className="mt-1 text-xs text-slate-500">{patient.phone}</p> : null}</td><td className="px-5 py-4 text-slate-600">{formatDate(appointment.appointment_date)}<br />{formatTime(appointment.start_time)}</td><td className="max-w-52 px-5 py-4 text-slate-600">{appointment.reason ?? "—"}{appointment.cancel_reason ? <p className="mt-1 text-xs text-red-700">Declined: {appointment.cancel_reason}</p> : null}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[appointment.status]}`}>{appointment.status}</span></td><td className="px-5 py-4"><Link href={detailUrl} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#0F766E] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">View details</Link></td></tr>
}
