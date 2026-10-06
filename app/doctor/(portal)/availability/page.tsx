import { CalendarRange } from "lucide-react"
import { redirect } from "next/navigation"

import { saveDoctorSchedule } from "@/app/doctor/actions"
import { ScheduleForm } from "@/components/admin/schedule-form"
import { DoctorTimeOffForm } from "@/components/doctor/doctor-time-off-form"
import { getDoctorRecord } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function pakistanToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "01"
  return `${value("year")}-${value("month")}-${value("day")}`
}

export default async function DoctorAvailabilityPage() {
  const doctor = await getDoctorRecord()
  if (!doctor) return <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10"><p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">We couldn&apos;t find your doctor profile. Please contact the clinic for help.</p></main>
  if (["draft", "rejected", "changes_requested"].includes(doctor.approval_status)) redirect("/doctor/onboarding")
  const supabase = await createClient()
  const today = pakistanToday()
  const [schedulesResult, timeOffResult, appointmentsResult] = await Promise.all([
    supabase.from("doctor_schedules").select("day_of_week,start_time,end_time,slot_minutes").eq("doctor_id", doctor.id),
    supabase.from("doctor_time_off").select("id,start_date,end_date").eq("doctor_id", doctor.id).gte("end_date", today).order("start_date"),
    supabase.from("appointments").select("appointment_date").eq("doctor_id", doctor.id).gte("appointment_date", today).in("status", ["pending", "confirmed"] as const).order("appointment_date"),
  ])
  const schedules = schedulesResult.data ?? []
  const timeOff = timeOffResult.data ?? []
  const bookedDays = [...new Set((appointmentsResult.data ?? []).map((appointment) => appointment.appointment_date))]
  const hasError = [schedulesResult, timeOffResult, appointmentsResult].some((result) => result.error)

  return <main className="mx-auto max-w-5xl px-5 py-7 sm:px-8 sm:py-9"><div><p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Practice availability</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Working hours and days off</h1><p className="mt-2 text-sm leading-6 text-slate-600">Set when patients can book with you and block time away from the clinic.</p></div>{hasError ? <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Some availability information couldn&apos;t be loaded. Please refresh and try again.</p> : null}<section className="mt-8"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-[#0F766E]"><CalendarRange className="size-5" /></span><div><h2 className="font-semibold text-slate-900">Weekly schedule</h2><p className="text-sm text-slate-500">Turn a day on, set the hours, choose the slot length, then save.</p></div></div><div className="mt-5 grid gap-3">{days.map((day, index) => <ScheduleForm key={day} action={saveDoctorSchedule} doctorId={doctor.id} day={day} index={index} schedule={schedules.find((schedule) => schedule.day_of_week === index)} />)}</div></section><div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"><DoctorTimeOffForm timeOff={timeOff} /><aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-900">Already booked days</h2><p className="mt-1 text-sm leading-6 text-slate-500">These future dates have pending or confirmed appointments, so they cannot be blocked as days off.</p>{bookedDays.length ? <ul className="mt-4 grid gap-2">{bookedDays.map((date) => <li key={date} className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date(`${date}T12:00:00`))}</li>)}</ul> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No future appointments are booked.</p>}</aside></div></main>
}
