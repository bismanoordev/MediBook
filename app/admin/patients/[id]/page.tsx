import Link from "next/link"
import { notFound } from "next/navigation"

import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const statusClass: Record<string, string> = { pending: "bg-amber-100 text-amber-800", confirmed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800", completed: "bg-slate-200 text-slate-700" }
const dateFormatter = new Intl.DateTimeFormat("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
const timeFormatter = new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" })

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()
  const [{ data: patient, error: patientError }, { data: appointments, error: appointmentsError }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone, created_at").eq("id", id).eq("role", "patient").maybeSingle(),
    supabase.from("appointments").select("id, appointment_date, start_time, status, reason, doctors(full_name)").eq("patient_id", id).order("appointment_date", { ascending: false }).order("start_time", { ascending: false }),
  ])
  if (patientError) return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><Link href="/admin/patients" className="text-sm font-semibold text-[#0F766E] hover:underline">← Back to patients</Link><div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">We couldn’t load this patient. Please refresh and try again.</div></main>
  if (!patient) notFound()
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><Link href="/admin/patients" className="text-sm font-semibold text-[#0F766E] hover:underline">← Back to patients</Link><section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#0F766E]">Patient profile</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">{patient.full_name ?? "Name not added"}</h1><dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Phone number</dt><dd className="mt-1 font-medium text-slate-900">{patient.phone ?? "Not provided"}</dd></div><div><dt className="text-slate-500">Joined</dt><dd className="mt-1 font-medium text-slate-900">{dateFormatter.format(new Date(patient.created_at))}</dd></div></dl></section><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><h2 className="text-xl font-semibold">Appointment history</h2><p className="mt-1 text-sm text-slate-500">Most recent appointments are shown first.</p></div>{appointmentsError ? <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">Appointment history couldn’t be loaded. Please refresh and try again.</div> : appointments?.length ? <div className="mt-5 divide-y divide-slate-100">{appointments.map((appointment) => { const doctor = appointment.doctors as unknown as { full_name: string } | null; return <article key={appointment.id} className="py-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-slate-900">{doctor?.full_name ?? "Clinic doctor"}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[appointment.status]}`}>{appointment.status}</span></div><p className="mt-2 text-sm text-slate-600">{dateFormatter.format(new Date(`${appointment.appointment_date}T12:00:00`))} at {timeFormatter.format(new Date(`2000-01-01T${appointment.start_time}`))}</p>{appointment.reason ? <p className="mt-2 text-sm text-slate-500">Reason: {appointment.reason}</p> : null}</article> })}</div> : <div className="mt-5 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">This patient has no appointments yet.</div>}</section></main>
}
