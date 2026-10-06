import Link from "next/link"

import { updateAppointmentStatus } from "@/app/admin/actions"
import { AppointmentsRealtime } from "@/components/admin/appointments-realtime"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const pageSize = 20
const statusClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-slate-200 text-slate-700",
}

type Search = { q?: string; date?: string; doctor?: string; status?: string; page?: string }

const visitDateFormatter = new Intl.DateTimeFormat("en-PK", {
  timeZone: "Asia/Karachi",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
})

const visitTimeFormatter = new Intl.DateTimeFormat("en-PK", {
  timeZone: "Asia/Karachi",
  hour: "numeric",
  minute: "2-digit",
})

const activityTimeFormatter = new Intl.DateTimeFormat("en-PK", {
  timeZone: "Asia/Karachi",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

function formatVisitDate(date: string) {
  return visitDateFormatter.format(new Date(`${date}T12:00:00+05:00`))
}

function formatVisitTime(time: string) {
  return visitTimeFormatter.format(new Date(`2000-01-01T${time}+05:00`))
}

function formatActivityTime(timestamp: string) {
  return activityTimeFormatter.format(new Date(timestamp))
}

function href(params: Search, page: number) {
  const next = new URLSearchParams()
  Object.entries({ ...params, page: String(page) }).forEach(([key, value]) => {
    if (value) next.set(key, value)
  })
  return `/admin/appointments?${next}`
}

export default async function AdminAppointmentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin()

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const supabase = await createClient()
  const { data: doctors } = await supabase.from("doctors").select("id, full_name").order("full_name")
  let query = supabase
    .from("appointments")
    .select(
      "id, appointment_date, start_time, status, reason, created_at, updated_at, doctors(full_name), profiles!appointments_patient_id_fkey(full_name, phone)",
      { count: "exact" },
    )
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false })

  if (params.date) query = query.eq("appointment_date", params.date)
  if (params.doctor) query = query.eq("doctor_id", params.doctor)
  if (["pending", "confirmed", "cancelled", "completed"].includes(params.status ?? "")) {
    query = query.eq("status", params.status as "pending" | "confirmed" | "cancelled" | "completed")
  }
  if (params.q?.trim()) query = query.ilike("profiles.full_name", `%${params.q.trim().replace(/[,%]/g, "")}%`)

  const { data: appointments, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1)
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize))
  const currentPage = Math.min(page, totalPages)
  const hasFilters = Boolean(params.q || params.date || params.doctor || params.status)

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <AppointmentsRealtime />
      <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#0F766E]">Booking management</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Appointments</h1>
      <p className="mt-2 text-slate-600">Review and update clinic bookings securely.</p>

      <form className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
        <input name="q" defaultValue={params.q} placeholder="Search patient name" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#0F766E]" />
        <input name="date" type="date" defaultValue={params.date} className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#0F766E]" />
        <select name="doctor" defaultValue={params.doctor} className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#0F766E]">
          <option value="">All doctors</option>
          {doctors?.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>)}
        </select>
        <select name="status" defaultValue={params.status} className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#0F766E]">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <div className="flex gap-2">
          <button className="h-10 flex-1 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59]">Apply filters</button>
          {hasFilters ? <Link href="/admin/appointments" className="grid h-10 place-items-center rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">Clear</Link> : null}
        </div>
      </form>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load appointments right now. Please refresh and try again.</div>
      ) : appointments?.length ? (
        <>
          <div className="mt-4 text-sm text-slate-500">Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, count ?? 0)} of {count ?? 0} appointments.</div>
          <div className="mt-4 grid gap-3">
            {appointments.map((appointment) => {
              const doctor = appointment.doctors as unknown as { full_name: string } | null
              const patient = appointment.profiles as unknown as { full_name: string; phone: string | null } | null
              const hasStatusUpdate = appointment.updated_at !== appointment.created_at

              return (
                <article key={appointment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{patient?.full_name ?? "Patient"}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[appointment.status]}`}>{appointment.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-[#0F766E]">{doctor?.full_name ?? "Clinic doctor"}</p>
                    <p className="mt-1 text-sm text-slate-600">Visit: {formatVisitDate(appointment.appointment_date)} at {formatVisitTime(appointment.start_time)}{patient?.phone ? ` · ${patient.phone}` : ""}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Booked: {formatActivityTime(appointment.created_at)}
                      {hasStatusUpdate ? ` · Status updated: ${formatActivityTime(appointment.updated_at)}` : ""}
                    </p>
                    {appointment.reason ? <p className="mt-2 text-sm text-slate-500">Reason: {appointment.reason}</p> : null}
                  </div>

                  <form action={updateAppointmentStatus} className="mt-4 flex flex-wrap gap-2 sm:mt-0">
                    <input type="hidden" name="id" value={appointment.id} />
                    {appointment.status === "pending" ? <button name="status" value="confirmed" className="h-10 rounded-xl bg-[#0F766E] px-3 text-sm font-semibold text-white hover:bg-[#0D5F59]">Confirm</button> : null}
                    {!["cancelled", "completed"].includes(appointment.status) ? <button name="status" value="cancelled" className="h-10 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50">Cancel</button> : null}
                    {appointment.status === "confirmed" ? <button name="status" value="completed" className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Mark completed</button> : null}
                  </form>
                </article>
              )
            })}
          </div>

          <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Appointment pages">
            <span className="text-sm text-slate-500">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              {currentPage > 1 ? <Link href={href(params, currentPage - 1)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Previous</Link> : null}
              {currentPage < totalPages ? <Link href={href(params, currentPage + 1)} className="rounded-xl bg-[#0F766E] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0D5F59]">Next</Link> : null}
            </div>
          </nav>
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{hasFilters ? "No appointments match these filters." : "No appointments have been made yet."}</div>
      )}
    </main>
  )
}
