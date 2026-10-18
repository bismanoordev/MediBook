import { CalendarDays, CalendarRange } from "lucide-react"
import { redirect } from "next/navigation"

import { saveDoctorSchedule } from "@/app/doctor/actions"
import { ScheduleForm } from "@/components/admin/schedule-form"
import { DoctorSpecificAvailability } from "@/components/doctor/doctor-specific-availability"
import { DoctorTimeOffForm } from "@/components/doctor/doctor-time-off-form"
import { getDoctorRecord } from "@/lib/auth"
import { isoDate, pakistanBookingWindowEnd, pakistanToday, workingHoursForDate } from "@/lib/slots"
import { createClient } from "@/lib/supabase/server"

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const dateFormatter = new Intl.DateTimeFormat("en-PK", { weekday: "short", day: "numeric", month: "short" })

export default async function DoctorAvailabilityPage() {
  const doctor = await getDoctorRecord()
  if (!doctor) return <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10"><p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">We couldn&apos;t find your doctor profile. Please contact the clinic for help.</p></main>
  if (["draft", "rejected", "changes_requested"].includes(doctor.approval_status)) redirect("/doctor/onboarding")

  const supabase = await createClient()
  const todayDate = pakistanToday()
  const today = isoDate(todayDate)
  const maxDate = isoDate(pakistanBookingWindowEnd())
  const firstSpecificDate = new Date(todayDate)
  firstSpecificDate.setDate(firstSpecificDate.getDate() + 1)
  const minDate = isoDate(firstSpecificDate)
  const [schedulesResult, timeOffResult, overridesResult, appointmentsResult] = await Promise.all([
    supabase.from("doctor_schedules").select("day_of_week,start_time,end_time,slot_minutes").eq("doctor_id", doctor.id),
    supabase.from("doctor_time_off").select("id,start_date,end_date").eq("doctor_id", doctor.id).gte("end_date", today).order("start_date"),
    supabase.from("doctor_availability_overrides").select("id,override_date,start_time,end_time,slot_minutes").eq("doctor_id", doctor.id).gte("override_date", today).lte("override_date", maxDate).order("override_date"),
    supabase.from("appointments").select("appointment_date").eq("doctor_id", doctor.id).gte("appointment_date", today).in("status", ["pending", "confirmed"] as const).order("appointment_date"),
  ])
  const schedules = schedulesResult.data ?? []
  const timeOff = timeOffResult.data ?? []
  const overrides = overridesResult.data ?? []
  const appointments = appointmentsResult.data ?? []
  const appointmentsByDate = new Map<string, number>()
  for (const appointment of appointments) appointmentsByDate.set(appointment.appointment_date, (appointmentsByDate.get(appointment.appointment_date) ?? 0) + 1)
  const bookedDays = [...new Set(appointments.map((appointment) => appointment.appointment_date))]
  const overview = Array.from({ length: 30 }, (_, offset) => {
    const date = new Date(todayDate)
    date.setDate(date.getDate() + offset)
    const value = isoDate(date)
    const dayOff = timeOff.some((range) => range.start_date <= value && range.end_date >= value)
    const override = overrides.find((item) => item.override_date === value)
    return { value, dayOff, override, hours: workingHoursForDate(value, schedules, overrides), appointments: appointmentsByDate.get(value) ?? 0 }
  })
  const hasError = [schedulesResult, timeOffResult, overridesResult, appointmentsResult].some((result) => result.error)

  return <main className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-9"><div><p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Practice availability</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Working hours and days off</h1><p className="mt-2 text-sm leading-6 text-slate-600">Set regular hours, make one-off changes, and block time away from the clinic.</p></div>{hasError ? <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Some availability information couldn&apos;t be loaded. Please refresh and try again.</p> : null}
    <section className="mt-8"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-[#0F766E]"><CalendarRange className="size-5" /></span><div><h2 className="font-semibold text-slate-900">Weekly schedule</h2><p className="text-sm text-slate-500">Turn a day on, set the hours, choose the slot length, then save.</p></div></div><div className="mt-5 grid gap-3">{days.map((day, index) => <ScheduleForm key={day} action={saveDoctorSchedule} doctorId={doctor.id} day={day} index={index} schedule={schedules.find((schedule) => schedule.day_of_week === index)} />)}</div></section>
    <section className="mt-8"><DoctorSpecificAvailability overrides={overrides.filter((override) => override.override_date >= minDate)} minDate={minDate} maxDate={maxDate} /></section>
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="upcoming-overview-title"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#0F766E]"><CalendarDays className="size-5" aria-hidden="true" /></span><div><h2 id="upcoming-overview-title" className="text-lg font-semibold text-slate-900">Next 30 days</h2><p className="mt-1 text-sm text-slate-600">A quick view of regular hours, specific dates, days off, and active appointments.</p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{overview.map((day) => { const status = day.dayOff ? "Day off" : day.override ? "Specific hours" : day.hours ? "Working day" : "Not working"; const tone = day.dayOff ? "bg-red-50 text-red-800" : day.override ? "bg-teal-50 text-[#0F766E]" : day.hours ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"; return <article key={day.value} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-2"><p className="font-semibold text-slate-900">{dateFormatter.format(new Date(`${day.value}T12:00:00`))}</p><span className={`rounded-full px-2 py-1 text-xs font-semibold ${tone}`}>{status}</span></div><p className="mt-2 text-sm text-slate-600">{day.dayOff ? "Bookings blocked" : day.hours ? `${day.hours.start_time.slice(0, 5)}–${day.hours.end_time.slice(0, 5)} · ${day.hours.slot_minutes}-minute slots` : "No hours set"}</p><p className="mt-1 text-xs font-medium text-slate-500">{day.appointments} active appointment{day.appointments === 1 ? "" : "s"}</p></article> })}</div></section>
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"><DoctorTimeOffForm timeOff={timeOff} /><aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-900">Already booked days</h2><p className="mt-1 text-sm leading-6 text-slate-500">These future dates have pending or confirmed appointments, so they cannot be blocked as days off.</p>{bookedDays.length ? <ul className="mt-4 grid gap-2">{bookedDays.map((date) => <li key={date} className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date(`${date}T12:00:00`))}</li>)}</ul> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No future appointments are booked.</p>}</aside></div>
  </main>
}
