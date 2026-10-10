import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { AppHeader } from "@/components/app-header"
import { getDoctorCharacter } from "@/components/doctor-card"
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
  const [{ data: doctor }, { data: schedules }, { data: timeOff }] = await Promise.all([
    supabase.from("doctors").select("id, full_name, bio, fee, photo_url, specialties(name)").eq("id", id).eq("is_active", true).eq("approval_status", "approved").maybeSingle(),
    supabase.from("doctor_schedules").select("day_of_week, start_time, end_time, slot_minutes").eq("doctor_id", id),
    supabase.from("doctor_time_off").select("start_date,end_date").eq("doctor_id", id),
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
    const dateValue = isoDate(date)
    const away = (timeOff ?? []).some((range) => range.start_date <= dateValue && range.end_date >= dateValue)

    return {
      date: dateValue,
      day: index === 0 ? "Today" : dayName.format(date),
      label: dateName.format(date),
      away,
      slots: !away && schedule
        ? generateSlots(schedule.start_time, schedule.end_time, schedule.slot_minutes).filter((time) => !taken.has(time) && (index !== 0 || Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) > nowMinutes))
        : [],
    }
  })
  const specialty = (doctor.specialties as unknown as { name: string } | null)?.name ?? "Clinic doctor"
  const fee = Number(doctor.fee)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {user ? (
        <AppHeader name={profile?.full_name} email={user.email} userId={user.id} />
      ) : (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link href="/doctors" className="font-bold text-[#0F766E]">MediBook</Link>
            <Link href={`/login?next=${encodeURIComponent(`/doctors/${id}`)}`} className={cn(buttonVariants(), "rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]")}>Log in to book</Link>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-6xl px-5 py-8 pb-28 sm:px-8 sm:py-10 lg:pb-12">
        <Link href="/doctors" className="inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-[#0F766E] transition hover:text-[#0D5F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">
          <ArrowLeft className="size-4" aria-hidden="true" />
          All doctors
        </Link>

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <DoctorPhoto fullName={doctor.full_name} photoUrl={doctor.photo_url} fallbackImageUrl={getDoctorCharacter(specialty)} fallbackAlt={`Illustrated ${specialty} clinician`} className="size-24 rounded-2xl text-xl sm:size-28" sizes="112px" priority />
            <div className="min-w-0">
              <p className="inline-flex max-w-full break-words rounded-full bg-[#CCFBF1] px-3 py-1 text-xs font-semibold text-[#0F766E]">{specialty}</p>
              <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{doctor.full_name}</h1>
              <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-600 sm:text-base">{doctor.bio ?? "Professional, patient-centered care."}</p>
            </div>
            <div className="rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3 md:text-right">
              <p className="text-xs font-medium text-slate-500">Consultation fee</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{Number.isFinite(fee) ? `Rs. ${fee.toLocaleString()}` : "Contact clinic"}</p>
            </div>
          </div>
        </section>

        {profile?.role === "doctor" || profile?.role === "admin" ? <section className="mt-8 rounded-2xl border border-teal-100 bg-teal-50/70 p-5 text-sm leading-6 text-slate-700">Booking is available for patient accounts.</section> : <DoctorBookingFlow doctorId={id} days={days} loggedIn={Boolean(user)} role={profile?.role} />}
      </main>
    </div>
  )
}
