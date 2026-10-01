import Link from "next/link"
import { notFound } from "next/navigation"

import { AppHeader } from "@/components/app-header"
import { DoctorPhoto } from "@/components/doctor-photo"
import { DoctorBookingFlow } from "@/components/patient/doctor-booking-flow"
import { buttonVariants } from "@/components/ui/button"
import { getAuthState } from "@/lib/auth"
import { generateSlots, isoDate, pakistanMinutesNow, pakistanToday } from "@/lib/slots"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

const dayName = new Intl.DateTimeFormat("en-PK", { weekday: "short" })
const dateName = new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short" })

export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, profile } = await getAuthState()
  const supabase = await createClient()
  const [{ data: doctor }, { data: schedules }] = await Promise.all([
    supabase.from("doctors").select("id, full_name, bio, fee, photo_url, specialties(name)").eq("id", id).maybeSingle(),
    supabase.from("doctor_schedules").select("day_of_week, start_time, end_time, slot_minutes").eq("doctor_id", id),
  ])
  if (!doctor) notFound()

  const today = pakistanToday()
  const nowMinutes = pakistanMinutesNow()
  const dates = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)
    return date
  })
  const booked = await Promise.all(dates.map((date) => supabase.rpc("get_booked_slots", { p_doctor_id: id, p_date: isoDate(date) })))
  const days = dates.map((date, index) => {
    const schedule = schedules?.find((item) => item.day_of_week === date.getDay())
    const taken = new Set((booked[index].data ?? []).map((item) => item.start_time))
    return {
      date: isoDate(date),
      day: index === 0 ? "Today" : dayName.format(date),
      label: dateName.format(date),
      slots: schedule
        ? generateSlots(schedule.start_time, schedule.end_time, schedule.slot_minutes).filter((time) => !taken.has(time) && (index !== 0 || Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) > nowMinutes))
        : [],
    }
  })
  const specialty = (doctor.specialties as unknown as { name: string } | null)?.name

  return <div className="min-h-screen bg-[#F8FAFC]">{user ? <AppHeader name={profile?.full_name} userId={user.id} /> : <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-5 sm:px-8"><Link href="/doctors" className="font-bold text-[#0F766E]">MediBook</Link><Link href={`/login?next=${encodeURIComponent(`/doctors/${id}`)}`} className={cn(buttonVariants(), "rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]")}>Log in to book</Link></div></header>}<main className="mx-auto max-w-5xl px-5 py-10 pb-28 sm:px-8 lg:pb-10"><Link href="/doctors" className="text-sm font-semibold text-[#0F766E] hover:underline">← All doctors</Link><section className="mt-5 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start"><DoctorPhoto fullName={doctor.full_name} photoUrl={doctor.photo_url} className="size-24 rounded-2xl" sizes="96px" priority /><div><p className="text-sm font-semibold text-[#0F766E]">{specialty ?? "Clinic doctor"}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{doctor.full_name}</h1><p className="mt-3 max-w-2xl leading-6 text-slate-600">{doctor.bio ?? "Professional, patient-centered care."}</p><p className="mt-5 text-sm font-semibold text-slate-700">Consultation fee: Rs. {Number(doctor.fee).toLocaleString()}</p></div></section><DoctorBookingFlow doctorId={id} days={days} loggedIn={Boolean(user)} /></main></div>
}
