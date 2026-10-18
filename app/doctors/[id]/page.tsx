import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BriefcaseBusiness, Check, Languages, MapPin } from "lucide-react"

import { AppHeader } from "@/components/app-header"
import { getDoctorCharacter } from "@/components/doctor-card"
import { DoctorPhoto } from "@/components/doctor-photo"
import { DoctorBookingFlow } from "@/components/patient/doctor-booking-flow"
import { buttonVariants } from "@/components/ui/button"
import { getAuthState } from "@/lib/auth"
import { BOOKING_WINDOW_DAYS, generateSlots, isoDate, pakistanBookingWindowEnd, pakistanMinutesNow, pakistanToday, workingHoursForDate } from "@/lib/slots"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

const dayName = new Intl.DateTimeFormat("en-PK", { weekday: "short" })
const dateName = new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short" })

export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, profile } = await getAuthState()
  const supabase = await createClient()
  const today = pakistanToday()
  const windowEnd = isoDate(pakistanBookingWindowEnd())
  const [{ data: doctor, error: doctorError }, { data: schedules, error: schedulesError }, { data: timeOff, error: timeOffError }, { data: overrides, error: overridesError }] = await Promise.all([
    supabase.from("doctors").select("id, full_name, bio, fee, photo_url, experience_years, languages, city, clinic_name, qualifications, specialties(name)").eq("id", id).eq("is_active", true).eq("approval_status", "approved").maybeSingle(),
    supabase.from("doctor_schedules").select("day_of_week, start_time, end_time, slot_minutes").eq("doctor_id", id),
    supabase.from("doctor_time_off").select("start_date,end_date").eq("doctor_id", id),
    supabase.from("doctor_availability_overrides").select("override_date,start_time,end_time,slot_minutes").eq("doctor_id", id).gte("override_date", isoDate(today)).lte("override_date", windowEnd),
  ])
  if (doctorError || schedulesError || timeOffError || overridesError) throw new Error("Doctor booking details could not be loaded.")
  if (!doctor) notFound()

  const nowMinutes = pakistanMinutesNow()
  const dates = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)
    return date
  })
  const booked = await Promise.all(dates.map((date) => supabase.rpc("get_booked_slots", { p_doctor_id: id, p_date: isoDate(date) })))
  const days = dates.map((date, index) => {
    const dateValue = isoDate(date)
    const schedule = workingHoursForDate(dateValue, schedules ?? [], overrides ?? [])
    const taken = new Set((booked[index].data ?? []).map((item) => item.start_time))
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
  const locationLabel = [doctor.city, doctor.clinic_name].filter((value): value is string => Boolean(value?.trim())).join(" · ")

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

      <main className="mx-auto max-w-[1260px] px-5 py-8 pb-16 sm:px-8 sm:py-10">
        <Link href="/doctors" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-[#0F766E] transition hover:bg-teal-50 hover:text-[#0D5F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">
          <ArrowLeft className="size-4" aria-hidden="true" />
          All doctors
        </Link>

        <section className="mt-5 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Book your visit</p>
          <h1 className="mt-2 max-w-full break-words text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Choose a time that works for you</h1>
          <p className="mt-3 max-w-full break-words text-base leading-7 text-slate-600">Review the doctor, select a visit time, then send your appointment request.</p>
        </section>

        <section className="mt-7 overflow-hidden rounded-[22px] border border-teal-100 bg-gradient-to-br from-[#ECFDF5] to-[#DDF8F3] shadow-[0_14px_35px_rgba(15,118,110,0.08)]">
          <div className="grid min-w-0 gap-5 p-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6 sm:p-7 lg:grid-cols-[10rem_minmax(0,1fr)_14rem] lg:items-center">
            <DoctorPhoto fullName={doctor.full_name} photoUrl={doctor.photo_url} fallbackImageUrl={getDoctorCharacter(specialty)} fallbackAlt={`Illustrated ${specialty} clinician`} className="h-[166px] w-40 rounded-2xl text-lg" sizes="160px" priority />
            <div className="min-w-0"><p className="inline-flex max-w-full break-words rounded-full bg-[#CCFBF1] px-3 py-1 text-xs font-semibold text-[#0F766E]">{specialty}</p><h2 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{doctor.full_name}</h2><p className="mt-2 text-sm text-slate-600">Consultant {specialty.toLowerCase()} {doctor.city ? `· ${doctor.city}` : ""}</p><div className="mt-5 flex flex-wrap gap-2">{typeof doctor.experience_years === "number" ? <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-sm text-slate-700"><BriefcaseBusiness className="size-4 shrink-0 text-[#0F766E]" aria-hidden="true" />{doctor.experience_years} years experience</span> : null}{doctor.languages?.length ? <span title={doctor.languages.join(", ")} className="inline-flex min-w-0 max-w-full basis-full items-center gap-1.5 rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-sm text-slate-700 sm:basis-auto sm:flex-1"><Languages className="size-4 shrink-0 text-[#0F766E]" aria-hidden="true" /><span className="truncate">{doctor.languages.join(", ")}</span></span> : null}{locationLabel ? <span title={locationLabel} className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-sm text-slate-700"><MapPin className="size-4 shrink-0 text-[#0F766E]" aria-hidden="true" /><span className="truncate">{locationLabel}</span></span> : null}</div></div>
            <div className="w-full rounded-2xl border border-white bg-white p-5 shadow-sm lg:w-56"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0F766E]">Consultation fee</p><p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{Number.isFinite(fee) ? `Rs. ${fee.toLocaleString()}` : "Contact clinic"}</p><div className="my-4 border-t border-slate-100" /><p className="flex items-center gap-2 text-sm font-medium text-slate-600"><Check className="size-4 text-[#0F766E]" aria-hidden="true" />Pay at the clinic</p></div>
          </div>
        </section>

        {profile?.role === "doctor" || profile?.role === "admin" ? <section className="mt-8 rounded-2xl border border-teal-100 bg-teal-50/70 p-5 text-sm leading-6 text-slate-700">Booking is available for patient accounts.</section> : <DoctorBookingFlow doctorId={id} doctor={{ name: doctor.full_name, specialty, location: locationLabel || null, fee: Number.isFinite(fee) ? fee : null }} days={days} schedules={schedules ?? []} overrides={overrides ?? []} timeOff={timeOff ?? []} windowStart={isoDate(today)} windowEnd={windowEnd} bookingWindowDays={BOOKING_WINDOW_DAYS} loggedIn={Boolean(user)} role={profile?.role} />}
      </main>
    </div>
  )
}
