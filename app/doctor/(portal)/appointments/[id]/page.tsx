import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, CheckCheck, CheckCircle2, Clock, Clock3, LockKeyhole, XCircle } from "lucide-react"

import { DoctorAppointmentActions } from "@/components/doctor/doctor-appointment-actions"
import { DoctorAppointmentContact } from "@/components/doctor/doctor-appointment-contact"
import { getDoctorRecord, requireDoctor } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const statusClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-slate-200 text-slate-700",
}
const dateFormat = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", weekday: "long", day: "numeric", month: "long", year: "numeric" })
const timeFormat = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit" })
const bookedFormat = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })

function pakistanNow() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00"
  return { date: `${value("year")}-${value("month")}-${value("day")}`, time: `${value("hour")}:${value("minute")}` }
}

function initials(name: string | null | undefined) {
  return (name ?? "Patient").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}

function relative(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  if (Math.abs(seconds) < 3600) return `${Math.max(1, Math.round(Math.abs(seconds) / 60))} minutes ago`
  if (Math.abs(seconds) < 86400) return `${Math.round(Math.abs(seconds) / 3600)} hours ago`
  return `${Math.round(Math.abs(seconds) / 86400)} days ago`
}

function StatusBadge({ status }: { status: string }) {
  const Icon = status === "pending" ? Clock3 : status === "confirmed" ? CheckCircle2 : status === "completed" ? CheckCheck : XCircle
  return <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[status]}`}><Icon className="size-3.5" aria-hidden="true" />{status}</span>
}

function DateContextBadge({ date, today }: { date: string; today: string }) {
  const tomorrowDate = new Date(`${today}T12:00:00+05:00`)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(tomorrowDate)
  const label = date === today ? "Today" : date === tomorrow ? "Tomorrow" : date < today ? "Past" : null
  return label ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{label}</span> : null
}

function Progress({ status }: { status: string }) {
  const current = status === "pending" || status === "cancelled" ? 1 : 2
  const labels = ["Requested", "Your reply", "Done"]
  return <ol className="mt-5 flex items-start" aria-label="Appointment progress">{labels.map((label, index) => {
    const isCurrent = index === current
    const isDone = index < current
    const isCancelled = status === "cancelled" && isCurrent
    return <li key={label} aria-current={isCurrent ? "step" : undefined} className="relative min-w-0 flex-1 text-center">
      {index > 0 ? <span aria-hidden="true" className={`absolute right-1/2 top-2 h-px w-full ${isDone ? "bg-[#0F766E]" : "bg-slate-200"}`} /> : null}
      <span className={`relative z-10 mx-auto grid size-4 place-items-center rounded-full border-2 bg-white text-[9px] font-bold ${isCancelled ? "border-red-500 bg-red-50 text-red-700" : isDone ? "border-[#0F766E] bg-[#0F766E] text-white" : isCurrent ? "border-amber-500 bg-amber-100 text-amber-800" : "border-slate-300 text-slate-500"}`}>{isDone ? "✓" : index + 1}</span>
      <span className={`mt-2 block px-1 text-xs leading-4 ${isCurrent ? "font-semibold text-slate-900" : "text-slate-500"}`}>{isCurrent && status === "pending" ? "Waiting for your response" : label}</span>
    </li>
  })}</ol>
}

export default async function DoctorAppointmentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; page?: string }> }) {
  await requireDoctor()
  const doctor = await getDoctorRecord()
  if (!doctor) notFound()
  if (["draft", "rejected", "changes_requested"].includes(doctor.approval_status)) redirect("/doctor/onboarding")

  const [{ id }, query] = await Promise.all([params, searchParams])
  const tab = ["pending", "upcoming", "completed", "cancelled"].includes(query.tab ?? "") ? query.tab! : "pending"
  const page = Math.max(1, Number(query.page) || 1)
  const supabase = await createClient()
  const { data: appointment } = await supabase.from("appointments").select("id,patient_id,appointment_date,start_time,status,reason,cancel_reason,created_at,profiles!appointments_patient_id_fkey(full_name)").eq("id", id).eq("doctor_id", doctor.id).maybeSingle()
  if (!appointment) notFound()

  const patient = appointment.profiles as unknown as { full_name: string | null } | null
  const phoneVisible = appointment.status === "confirmed" || appointment.status === "completed"
  const { data: phoneProfile } = phoneVisible ? await supabase.from("profiles").select("phone").eq("id", appointment.patient_id).maybeSingle() : { data: null }
  const { date: today, time: now } = pakistanNow()
  const canComplete = appointment.status === "confirmed" && (appointment.appointment_date < today || (appointment.appointment_date === today && appointment.start_time <= now))
  const showResponse = appointment.status === "pending" || (appointment.status === "confirmed" && canComplete)
  const visit = new Date(`${appointment.appointment_date}T12:00:00+05:00`)
  const stateLabel = appointment.status === "pending" ? "Appointment request" : appointment.status === "confirmed" ? "Confirmed appointment" : appointment.status === "completed" ? "Completed appointment" : "Cancelled appointment"

  return <main className="mx-auto max-w-5xl px-5 py-7 pb-36 sm:px-8 sm:py-9 lg:pb-9">
    <Link href={`/doctor/appointments?tab=${tab}&page=${page}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#0F766E] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"><ArrowLeft className="size-4" aria-hidden="true" />Back to appointments</Link>
    <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex min-w-0 items-start gap-3 p-5 sm:p-6"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#CCFBF1] text-sm font-bold text-[#0F766E]">{initials(patient?.full_name)}</span><div className="min-w-0 flex-1"><h1 className="break-words text-xl font-semibold tracking-tight text-slate-900">{patient?.full_name ?? "Patient"}</h1><p title={bookedFormat.format(new Date(appointment.created_at))} className="mt-1 text-sm text-slate-500">{stateLabel} · booked {relative(appointment.created_at)}</p></div><StatusBadge status={appointment.status} /></header>
        <section className="border-t border-slate-100 p-5 sm:p-6" aria-labelledby="appointment-time"><div className="flex min-w-0 items-center gap-4"><div aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-xl bg-[#CCFBF1] text-center text-[#0F766E]"><span className="text-[10px] font-bold uppercase">{new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", month: "short" }).format(visit)}</span><span className="-my-1 text-xl font-medium">{new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", day: "numeric" }).format(visit)}</span><span className="text-[10px]">{new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", weekday: "short" }).format(visit)}</span></div><div className="min-w-0"><h2 id="appointment-time" className="break-words text-base font-medium text-slate-900">{dateFormat.format(visit)}</h2><div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600"><span className="inline-flex items-center gap-1.5"><Clock className="size-4 text-[#0F766E]" aria-hidden="true" />{timeFormat.format(new Date(`2000-01-01T${appointment.start_time}+05:00`))}</span><DateContextBadge date={appointment.appointment_date} today={today} /></div></div></div></section>
        <section className="border-t border-slate-100 p-5 sm:p-6" aria-labelledby="reason-heading"><h2 id="reason-heading" className="text-xs font-semibold uppercase tracking-[.14em] text-slate-500">Reason for visit</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{appointment.reason ?? "No reason provided"}</p>{appointment.cancel_reason ? <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4"><p className="text-sm font-semibold text-red-800">Decline reason</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-red-700">{appointment.cancel_reason}</p></div> : null}</section>
        <section className="border-t border-slate-100 p-5 sm:p-6" aria-labelledby="contact-heading"><h2 id="contact-heading" className="text-xs font-semibold uppercase tracking-[.14em] text-slate-500">Patient contact</h2>{phoneVisible ? phoneProfile?.phone ? <DoctorAppointmentContact phone={phoneProfile.phone} /> : <p className="mt-3 text-sm text-slate-500">Phone number is not available.</p> : <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600"><LockKeyhole className="size-4 shrink-0 text-[#0F766E]" aria-hidden="true" />Phone number unlocks after you confirm.</p>}</section>
      </section>
      <aside className="min-w-0 lg:sticky lg:top-24"><section className="hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block"><h2 className="text-lg font-semibold text-slate-900">{showResponse ? "Respond to this request" : "Appointment response"}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{showResponse ? "The patient is notified by email." : appointment.status === "completed" ? "This appointment has been marked completed." : appointment.status === "confirmed" ? "This appointment is confirmed. It can be marked completed after the scheduled time." : "This appointment was cancelled and no further response is needed."}</p>{showResponse ? <div className="mt-4"><DoctorAppointmentActions appointmentId={appointment.id} status={appointment.status} canComplete={canComplete} /></div> : null}<div className="mt-5 border-t border-slate-100 pt-1"><Progress status={appointment.status} /></div></section></aside>
    </div>
    {showResponse ? <div className="sticky bottom-0 z-20 -mx-5 mt-6 border-t border-slate-200 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:-mx-8 sm:px-8 lg:hidden"><DoctorAppointmentActions appointmentId={appointment.id} status={appointment.status} canComplete={canComplete} mobile /></div> : null}
  </main>
}
