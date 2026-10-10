import Link from "next/link"
import { redirect } from "next/navigation"

import { AppHeader } from "@/components/app-header"
import { CancelAppointmentButton } from "@/components/patient/cancel-appointment-button"
import { AppointmentReason } from "@/components/patient/appointment-reason"
import { requireUser } from "@/lib/auth"
import { isCancellationAllowed } from "@/lib/slots"
import { createClient } from "@/lib/supabase/server"

const statusStyle = { pending: "bg-amber-100 text-amber-800", confirmed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800", completed: "bg-slate-200 text-slate-700" }
const formatTime = (time: string) => new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(new Date(`2000-01-01T${time}`))
const pakistanToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date())

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const activeTab = tab === "past" ? "past" : "upcoming"
  const { user, profile } = await requireUser("/appointments")
  if (profile?.role === "doctor") redirect("/doctor")
  if (profile?.role === "admin") redirect("/admin")
  const supabase = await createClient()
  const { data: appointments, error } = await supabase.from("appointments").select("id, appointment_date, start_time, status, reason, doctors(full_name, specialties(name))").eq("patient_id", user.id).order("appointment_date", { ascending: activeTab === "upcoming" }).order("start_time", { ascending: activeTab === "upcoming" })
  const today = pakistanToday()
  const visibleAppointments = (appointments ?? []).filter((appointment) => activeTab === "upcoming" ? appointment.appointment_date >= today && !["cancelled", "completed"].includes(appointment.status) : appointment.appointment_date < today || ["cancelled", "completed"].includes(appointment.status))

  return <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#F8FAFC]"><AppHeader name={profile?.full_name} userId={user.id} /><main className="mx-auto min-w-0 max-w-7xl px-5 py-12 sm:px-8"><h1 className="text-3xl font-semibold tracking-tight">My appointments</h1><p className="mt-3 text-slate-600">Review upcoming care and your past visits in one place.</p><div className="mt-7 flex max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1"><Link href="/appointments" className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === "upcoming" ? "bg-white text-[#0F766E] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Upcoming</Link><Link href="/appointments?tab=past" className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === "past" ? "bg-white text-[#0F766E] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Past</Link></div>{error ? <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load your appointments. Please refresh and try again.</div> : visibleAppointments.length ? <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4">{visibleAppointments.map((appointment) => { const doctor = appointment.doctors as unknown as { full_name: string; specialties: { name: string } | null } | null; const cancellableStatus = activeTab === "upcoming" && ["pending", "confirmed"].includes(appointment.status); const canCancel = cancellableStatus && isCancellationAllowed(appointment.appointment_date, appointment.start_time); return <article key={appointment.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-5"><div className="min-w-0"><div className="flex min-w-0 flex-wrap items-center gap-2"><h2 className="min-w-0 break-words font-semibold text-slate-900">{doctor?.full_name ?? "Clinic doctor"}</h2><span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[appointment.status]}`}>{appointment.status}</span></div><p className="mt-2 break-words text-sm text-[#0F766E]">{doctor?.specialties?.name ?? "Clinic appointment"}</p><p className="mt-2 break-words text-sm text-slate-600">{new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${appointment.appointment_date}T12:00:00`))} at {formatTime(appointment.start_time)}</p>{appointment.reason ? <AppointmentReason reason={appointment.reason} /> : null}</div>{cancellableStatus ? <div className="mt-4 w-full shrink-0 sm:mt-0 sm:w-auto">{canCancel ? <CancelAppointmentButton appointmentId={appointment.id} /> : <p className="max-w-56 break-words text-sm leading-5 text-slate-500">Online cancellation closes within two hours of your appointment.</p>}</div> : null}</article> })}</div> : <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{activeTab === "upcoming" ? "You don’t have any upcoming appointments yet." : "You don’t have any past appointments yet."}</div>}</main></div>
}
