import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { LockKeyhole, Phone } from "lucide-react"

import { DoctorAppointmentActions } from "@/components/doctor/doctor-appointment-actions"
import { getDoctorRecord, requireDoctor } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const statusClass: Record<string, string> = { pending: "bg-amber-100 text-amber-800", confirmed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800", completed: "bg-slate-200 text-slate-700" }
const dateFormatter = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", weekday: "long", day: "numeric", month: "long", year: "numeric" })
const timeFormatter = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit" })
const bookedFormatter = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })

function pakistanNow() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00"
  return { date: `${value("year")}-${value("month")}-${value("day")}`, time: `${value("hour")}:${value("minute")}` }
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
  const canComplete = appointment.status === "confirmed" && (appointment.appointment_date < today || appointment.appointment_date === today && appointment.start_time <= now)
  const backHref = `/doctor/appointments?tab=${tab}&page=${page}`

  return <main className="mx-auto max-w-4xl px-5 py-7 sm:px-8 sm:py-9">
    <Link href={backHref} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[#0F766E] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">← Back to appointments</Link>
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Appointment request</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{patient?.full_name ?? "Patient"}</h1></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusClass[appointment.status]}`}>{appointment.status}</span></div>
      <dl className="mt-7 grid gap-5 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Date and time</dt><dd className="mt-1 font-semibold text-slate-900">{dateFormatter.format(new Date(`${appointment.appointment_date}T12:00:00+05:00`))} at {timeFormatter.format(new Date(`2000-01-01T${appointment.start_time}+05:00`))}</dd></div><div><dt className="text-slate-500">Booked on</dt><dd className="mt-1 font-semibold text-slate-900">{bookedFormatter.format(new Date(appointment.created_at))}</dd></div><div className="sm:col-span-2"><dt className="text-slate-500">Reason for visit</dt><dd className="mt-1 leading-6 text-slate-900">{appointment.reason ?? "No reason was provided."}</dd></div>{appointment.cancel_reason ? <div className="sm:col-span-2"><dt className="text-slate-500">Decline reason</dt><dd className="mt-1 leading-6 text-red-700">{appointment.cancel_reason}</dd></div> : null}</dl>
      <section className="mt-7 border-t border-slate-100 pt-6" aria-labelledby="patient-contact-title"><h2 id="patient-contact-title" className="text-base font-semibold text-slate-900">Patient contact</h2>{phoneVisible ? phoneProfile?.phone ? <a href={`tel:${phoneProfile.phone}`} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-50 px-4 text-sm font-semibold text-[#0F766E] hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"><Phone className="size-4" />{phoneProfile.phone}</a> : <p className="mt-2 text-sm text-slate-500">Phone number is not available.</p> : <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-500"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-[#0F766E]" />Phone number is shown after you confirm this appointment.</p>}</section>
      <section className="mt-7 border-t border-slate-100 pt-6" aria-label="Appointment actions"><DoctorAppointmentActions appointmentId={appointment.id} status={appointment.status} canComplete={canComplete} /></section>
    </section>
  </main>
}
