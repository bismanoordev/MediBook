import { AppHeader } from "@/components/app-header"
import { requireUser } from "@/lib/auth"
import { CancelAppointmentButton } from "@/components/patient/cancel-appointment-button"
import { createClient } from "@/lib/supabase/server"

const statusStyle = { pending: "bg-amber-100 text-amber-800", confirmed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800", completed: "bg-slate-200 text-slate-700" }
const formatTime = (time: string) => new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(new Date(`2000-01-01T${time}`))

export default async function AppointmentsPage() {
  const { user, profile } = await requireUser("/appointments")
  const supabase = await createClient()
  const { data: appointments, error } = await supabase.from("appointments").select("id, appointment_date, start_time, status, reason, doctors(full_name, specialties(name))").eq("patient_id", user.id).order("appointment_date", { ascending: false }).order("start_time", { ascending: false })

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader name={profile?.full_name} userId={user.id} />
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">My appointments</h1>
        <p className="mt-3 text-slate-600">Review upcoming care and your past visits in one place.</p>
        {error ? <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load your appointments. Please refresh and try again.</div> : appointments?.length ? <div className="mt-8 grid gap-4">{appointments.map((appointment) => { const doctor = appointment.doctors as unknown as { full_name: string; specialties: { name: string } | null } | null; const canCancel = ["pending", "confirmed"].includes(appointment.status) && new Date(`${appointment.appointment_date}T${appointment.start_time}`).getTime() - Date.now() > 2 * 60 * 60 * 1000; return <article key={appointment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-5"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{doctor?.full_name ?? "Clinic doctor"}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[appointment.status]}`}>{appointment.status}</span></div><p className="mt-2 text-sm text-[#0F766E]">{doctor?.specialties?.name ?? "Clinic appointment"}</p><p className="mt-2 text-sm text-slate-600">{new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${appointment.appointment_date}T12:00:00`))} at {formatTime(appointment.start_time)}</p>{appointment.reason ? <p className="mt-2 text-sm text-slate-500">Reason: {appointment.reason}</p> : null}</div>{canCancel ? <div className="mt-4 shrink-0 sm:mt-0"><CancelAppointmentButton appointmentId={appointment.id} /></div> : null}</article> })}</div> : <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">You don&apos;t have any appointments yet. Choose a doctor to get started.</div>}
      </main>
    </div>
  )
}
