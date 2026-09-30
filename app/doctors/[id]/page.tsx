import Link from "next/link"
import { notFound } from "next/navigation"

import { AppHeader } from "@/components/app-header"
import { BookingForm } from "@/components/patient/booking-form"
import { buttonVariants } from "@/components/ui/button"
import { getAuthState } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

type DoctorPageProps = { params: Promise<{ id: string }> }
const dayName = new Intl.DateTimeFormat("en-PK", { weekday: "long" })
const shortDate = new Intl.DateTimeFormat("en-PK", { weekday: "short", day: "numeric", month: "short" })
const timeLabel = (time: string) => new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(new Date(`2000-01-01T${time}`))

function pakistanToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date())
  const part = (name: string) => parts.find((item) => item.type === name)?.value ?? "01"
  return new Date(`${part("year")}-${part("month")}-${part("day")}T12:00:00`)
}
function pakistanMinutesNow() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date())
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0")
  return value("hour") * 60 + value("minute")
}
function isoDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` }
function slotTimes(start: string, end: string, minutes: number) {
  const [startHour, startMinute] = start.slice(0, 5).split(":").map(Number)
  const [endHour, endMinute] = end.slice(0, 5).split(":").map(Number)
  const result: string[] = []
  for (let value = startHour * 60 + startMinute; value + minutes <= endHour * 60 + endMinute; value += minutes) result.push(`${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}:00`)
  return result
}

export default async function DoctorPage({ params }: DoctorPageProps) {
  const { id } = await params
  const { user, profile } = await getAuthState()
  const supabase = await createClient()
  const [{ data: doctor }, { data: schedules }] = await Promise.all([
    supabase.from("doctors").select("id, full_name, bio, fee, specialties(name)").eq("id", id).maybeSingle(),
    supabase.from("doctor_schedules").select("day_of_week, start_time, end_time, slot_minutes").eq("doctor_id", id),
  ])
  if (!doctor) notFound()
  const today = pakistanToday()
  const currentMinutes = pakistanMinutesNow()
  const days = Array.from({ length: 7 }, (_, offset) => { const date = new Date(today); date.setDate(today.getDate() + offset); return date })
  const bookedRequests = days.map((date) => supabase.rpc("get_booked_slots", { p_doctor_id: id, p_date: isoDate(date) }))
  const bookedResponses = await Promise.all(bookedRequests)
  const specialty = (doctor.specialties as unknown as { name: string } | null)?.name

  return <div className="min-h-screen bg-[#F8FAFC]">
    {user ? <AppHeader name={profile?.full_name} userId={user.id} /> : <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-5 sm:px-8"><Link href="/doctors" className="font-bold text-[#0F766E]">MediBook</Link><Link href={`/login?next=/doctors/${id}`} className={cn(buttonVariants(), "rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]")}>Log in to book</Link></div></header>}
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <Link href="/doctors" className="text-sm font-semibold text-[#0F766E] hover:underline">← All doctors</Link>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-[#0F766E]">{specialty ?? "Clinic doctor"}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{doctor.full_name}</h1><p className="mt-3 max-w-2xl leading-6 text-slate-600">{doctor.bio ?? "Professional, patient-centered care."}</p><p className="mt-5 text-sm font-semibold text-slate-700">Consultation fee: Rs. {Number(doctor.fee).toLocaleString()}</p></section>
      <section className="mt-8"><h2 className="text-2xl font-semibold tracking-tight">Available times</h2><p className="mt-2 text-slate-600">Choose a time within the next 7 days. Times are shown in Pakistan Standard Time.</p><div className="mt-5 grid gap-4">{days.map((date, index) => { const schedule = schedules?.find((item) => item.day_of_week === date.getDay()); const booked = new Set((bookedResponses[index].data ?? []).map((item) => item.start_time)); const slots = schedule ? slotTimes(schedule.start_time, schedule.end_time, schedule.slot_minutes).filter((time) => !booked.has(time) && (index !== 0 || Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) > currentMinutes)) : []; return <article key={isoDate(date)} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold text-slate-900">{index === 0 ? "Today" : dayName.format(date)} <span className="font-normal text-slate-500">· {shortDate.format(date)}</span></h3>{!schedule ? <p className="mt-3 text-sm text-slate-500">This doctor is not scheduled on this day.</p> : slots.length ? <div className="mt-4 flex flex-wrap gap-2">{slots.map((time) => <details key={time} className="group"><summary className="cursor-pointer list-none rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-[#0F766E] hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]">{timeLabel(time)}</summary><div className="mt-3 w-[min(22rem,calc(100vw-4rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-lg"><p className="text-sm font-semibold">Book {shortDate.format(date)} at {timeLabel(time)}</p>{user ? <BookingForm doctorId={id} date={isoDate(date)} time={time} /> : <Link href={`/login?next=${encodeURIComponent(`/doctors/${id}`)}`} className={cn(buttonVariants(), "mt-4 h-10 w-full rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]")}>Log in to book</Link>}</div></details>)}</div> : <p className="mt-3 text-sm text-slate-500">{index === 0 ? "There are no remaining times today." : "All times are booked for this day."}</p>}</article> })}</div></section>
    </main>
  </div>
}
