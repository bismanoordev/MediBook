"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Loader2, MapPin, RotateCcw, ShieldCheck, Stethoscope, WalletCards } from "lucide-react"
import { toast } from "sonner"
import * as yup from "yup"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { workingHoursForDate } from "@/lib/slots"

type Day = { date: string; label: string; day: string; slots: string[]; away?: boolean }
type Schedule = { day_of_week: number; start_time: string; end_time: string; slot_minutes: number }
type AvailabilityOverride = { override_date: string; start_time: string; end_time: string; slot_minutes: number }
type TimeOff = { start_date: string; end_date: string }
type Availability = Record<string, number>
type BookingDoctor = { name: string; specialty: string; location?: string | null; fee?: number | null }

const reasonSchema = yup.object({ reason: yup.string().max(300, "Reason for visit must be 300 characters or fewer.") })
const timeFormatter = new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" })
const fullDateFormatter = new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
const visitDateFormatter = new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "long" })
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
const parseDate = (value: string) => new Date(`${value}T12:00:00`)
const formatTime = (time: string) => timeFormatter.format(new Date(`2000-01-01T${time}`))
const formatDate = (value: string) => fullDateFormatter.format(parseDate(value))
const formatVisitDate = (value: string) => visitDateFormatter.format(parseDate(value))
const monthFormatter = new Intl.DateTimeFormat("en-PK", { month: "long", year: "numeric" })
const shortDateFormatter = new Intl.DateTimeFormat("en-PK", { weekday: "short", day: "numeric", month: "short" })

function datesBetween(from: string, to: string) {
  const dates: string[] = []
  const cursor = parseDate(from)
  const end = parseDate(to)
  while (cursor <= end) {
    dates.push(iso(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

function monthRange(month: Date, windowStart: string, windowEnd: string) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12)
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12)
  return {
    from: iso(first) < windowStart ? windowStart : iso(first),
    to: iso(last) > windowEnd ? windowEnd : iso(last),
  }
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12)
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

function monthsBetween(start: Date, end: Date) {
  const months: Date[] = []
  const cursor = startOfMonth(start)
  const lastMonth = startOfMonth(end)
  while (cursor <= lastMonth) {
    months.push(new Date(cursor))
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return months
}

export function DoctorBookingFlow({ doctorId, doctor, days, schedules, overrides, timeOff, windowStart, windowEnd, bookingWindowDays, loggedIn, role }: { doctorId: string; doctor: BookingDoctor; days: Day[]; schedules: Schedule[]; overrides: AvailabilityOverride[]; timeOff: TimeOff[]; windowStart: string; windowEnd: string; bookingWindowDays: number; loggedIn: boolean; role?: "patient" | "doctor" | "admin" | null }) {
  const router = useRouter()
  const availableSection = useRef<HTMLDivElement>(null)
  const initialSlots = useMemo(() => Object.fromEntries(days.map((item) => [item.date, item.slots])), [days])
  const initialAvailability = useMemo(() => Object.fromEntries(days.map((item) => [item.date, item.slots.length])), [days])
  const [selectedDate, setSelectedDate] = useState(() => days.find((item) => item.slots.length > 0)?.date ?? windowStart)
  const [slotsByDate, setSlotsByDate] = useState<Record<string, string[]>>(initialSlots)
  const [availability, setAvailability] = useState<Availability>(initialAvailability)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [reasonError, setReasonError] = useState("")
  const [month, setMonth] = useState(() => parseDate(windowStart))
  const [calendarOpen, setCalendarOpen] = useState(false)
  const availabilityRequestId = useRef(0)
  const slots = slotsByDate[selectedDate] ?? []
  const visibleMonth = useMemo(() => monthRange(month, windowStart, windowEnd), [month, windowEnd, windowStart])
  const visibleMonthDates = useMemo(() => datesBetween(visibleMonth.from, visibleMonth.to), [visibleMonth.from, visibleMonth.to])
  const bookingMonths = useMemo(() => monthsBetween(parseDate(windowStart), parseDate(windowEnd)), [windowEnd, windowStart])
  const firstBookingMonth = bookingMonths[0] ?? startOfMonth(parseDate(windowStart))
  const lastBookingMonth = bookingMonths[bookingMonths.length - 1] ?? startOfMonth(parseDate(windowEnd))

  const isAway = (date: string) => timeOff.some((range) => range.start_date <= date && range.end_date >= date)
  const hasSchedule = (date: string) => Boolean(workingHoursForDate(date, schedules, overrides))
  const disabledReason = (date: string) => {
    if (date < windowStart || date > windowEnd) return "Outside the booking window"
    if (isAway(date)) return "Doctor is away"
    if (!hasSchedule(date)) return "Doctor does not work on this day"
    if (Object.prototype.hasOwnProperty.call(availability, date) && availability[date] === 0) return "No availability"
    return ""
  }

  const loadAvailability = useCallback(async () => {
    if (visibleMonthDates.every((date) => Object.prototype.hasOwnProperty.call(availability, date))) {
      setAvailabilityLoading(false)
      return
    }
    const requestId = ++availabilityRequestId.current
    setAvailabilityLoading(true)
    setAvailabilityError(false)
    try {
      const response = await fetch(`/api/doctors/${doctorId}/availability?from=${visibleMonth.from}&to=${visibleMonth.to}`)
      const payload = await response.json() as { availability?: { date: string; freeSlots: number }[] }
      if (!response.ok) throw new Error("Availability request failed")
      if (requestId !== availabilityRequestId.current) return
      setAvailability((current) => ({ ...current, ...Object.fromEntries((payload.availability ?? []).map((item) => [item.date, item.freeSlots])) }))
    } catch {
      if (requestId === availabilityRequestId.current) setAvailabilityError(true)
    } finally {
      if (requestId === availabilityRequestId.current) setAvailabilityLoading(false)
    }
  }, [availability, doctorId, visibleMonth, visibleMonthDates])

  useEffect(() => {
    if (!calendarOpen) return
    const request = window.setTimeout(() => { void loadAvailability() }, 0)
    return () => window.clearTimeout(request)
  }, [calendarOpen, loadAvailability])

  useEffect(() => {
    if (slotsByDate[selectedDate]) return
    let active = true
    const request = window.setTimeout(() => {
      setSlotsLoading(true)
      setSlotsError(false)
      fetch(`/api/doctors/${doctorId}/availability?date=${selectedDate}`).then(async (response) => {
        const payload = await response.json() as { slots?: string[]; freeSlots?: number }
        if (!response.ok) throw new Error("Slots request failed")
        if (!active) return
        const nextSlots = payload.slots ?? []
        setSlotsByDate((current) => ({ ...current, [selectedDate]: nextSlots }))
        setAvailability((current) => ({ ...current, [selectedDate]: payload.freeSlots ?? nextSlots.length }))
      }).catch(() => {
        if (active) setSlotsError(true)
      }).finally(() => {
        if (active) setSlotsLoading(false)
      })
    }, 0)
    return () => { active = false; window.clearTimeout(request) }
  }, [doctorId, selectedDate, slotsByDate])

  function selectDate(date: string) {
    if (disabledReason(date)) return
    setSelectedDate(date)
    setSelectedTime(null)
    window.setTimeout(() => availableSection.current?.focus(), 0)
  }

  function changeMonth(offset: number) {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1, 12)
    if (nextMonth < firstBookingMonth || nextMonth > lastBookingMonth) return
    setMonth(nextMonth)
  }

  function continueBooking() {
    if (!selectedTime) return
    if (role && role !== "patient") { toast.error("Booking is available for patient accounts."); return }
    if (!loggedIn) { router.push(`/login?next=${encodeURIComponent(`/doctors/${doctorId}`)}`); return }
    setDialogOpen(true)
  }

  async function confirmBooking() {
    if (!selectedTime) return
    try {
      await reasonSchema.validate({ reason })
    } catch (error) {
      setReasonError(error instanceof yup.ValidationError ? error.message : "Check your reason for visit.")
      return
    }
    setLoading(true)
    try {
      const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctorId, date: selectedDate, time: selectedTime, reason }) })
      const result = await response.json().catch(() => ({ error: "We could not save your appointment. Please try again." })) as { error?: string }
      if (response.status === 401) { router.push(`/login?next=${encodeURIComponent(`/doctors/${doctorId}`)}`); return }
      if (response.status === 403) { toast.error("Booking is available for patient accounts."); return }
      if (!response.ok) {
        toast.error(result.error ?? "We could not save your appointment. Please try again.")
        if (response.status === 409 || response.status === 400) { setDialogOpen(false); setSelectedTime(null); router.refresh() }
        return
      }
      toast.success("Appointment booked. Opening your appointments…")
      router.replace("/appointments")
      router.refresh()
    } catch {
      toast.error("We could not reach the booking service. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const nextAvailable = Object.entries(availability).filter(([date, count]) => date > selectedDate && count > 0).sort(([a], [b]) => a.localeCompare(b))[0]?.[0]
  const availableDates = Object.entries(availability).filter(([, count]) => count > 0).map(([date]) => parseDate(date))
  const visibleMonthLoaded = visibleMonthDates.every((date) => Object.prototype.hasOwnProperty.call(availability, date))
  const visibleMonthHasAvailability = visibleMonthDates.some((date) => (availability[date] ?? 0) > 0)
  const nextAvailableInVisibleMonth = visibleMonthDates.find((date) => (availability[date] ?? 0) > 0)
  const isFirstBookingMonth = monthKey(month) === monthKey(firstBookingMonth)
  const isLastBookingMonth = monthKey(month) === monthKey(lastBookingMonth)
  const feeLabel = typeof doctor.fee === "number" && Number.isFinite(doctor.fee) ? `Rs. ${doctor.fee.toLocaleString()}` : "Contact clinic"

  return <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,838px)_minmax(320px,389px)] lg:items-start lg:gap-8">
    <div className="min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] sm:p-7">
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0F766E]"><span className="mr-2">01</span> Select a date</p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">When would you like to visit?</h2>
        <p className="mt-1 text-sm text-slate-500">Available appointments over the next {bookingWindowDays} days.</p>

        <div className="mt-5 -mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0" role="radiogroup" aria-label="Quick appointment dates">
          <div className="grid min-w-[616px] grid-cols-7 gap-2">
            {days.map((item) => {
              const disabled = Boolean(disabledReason(item.date))
              return <button key={item.date} type="button" role="radio" aria-checked={selectedDate === item.date} aria-label={`${item.day}, ${item.label}${disabled ? `: ${disabledReason(item.date)}` : `: ${item.slots.length} times available`}`} disabled={disabled} onClick={() => selectDate(item.date)} className={`min-h-[66px] rounded-xl border px-2 text-center text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 ${selectedDate === item.date && !disabled ? "border-[#0F766E] bg-[#0F766E] text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"}`}><span className="block text-[10px] font-bold uppercase tracking-wide opacity-70">{item.day}</span><span className="mt-1 block">{item.label}</span></button>
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2" aria-busy={availabilityLoading}>
          <button type="button" aria-expanded={calendarOpen} aria-controls="full-booking-calendar" onClick={() => setCalendarOpen((open) => !open)} className="min-h-11 rounded-xl px-2 text-sm font-semibold text-[#0F766E] transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">{calendarOpen ? "Hide calendar" : "Choose another date"}</button>
          {availabilityLoading ? <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Loader2 className="size-3.5 animate-spin" /> Checking availability</span> : null}
        </div>
        {availabilityError ? <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><span>We could not refresh this month&apos;s availability. Please try again.</span><Button type="button" variant="ghost" onClick={() => void loadAvailability()} className="h-10 text-[#0F766E] hover:bg-white"><RotateCcw className="size-4" /> Retry</Button></div> : null}
        {calendarOpen ? <div id="full-booking-calendar" className="mt-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4" aria-busy={availabilityLoading}>
          <div className="flex items-center justify-between gap-2">
            <button type="button" aria-label="Previous month" disabled={isFirstBookingMonth} onClick={() => changeMonth(-1)} className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-5" aria-hidden="true" /></button>
            <div className="min-w-0 text-center"><p className="truncate text-base font-semibold text-slate-900">{monthFormatter.format(month)}</p>{availabilityLoading ? <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500"><Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Updating availability</span> : null}</div>
            <button type="button" aria-label="Next month" disabled={isLastBookingMonth} onClick={() => changeMonth(1)} className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-5" aria-hidden="true" /></button>
          </div>
          <div className="mt-3 -mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Booking months">
            <div className="flex min-w-max gap-2">
              {bookingMonths.map((bookingMonth) => {
                const active = monthKey(bookingMonth) === monthKey(month)
                return <button key={monthKey(bookingMonth)} type="button" role="tab" aria-selected={active} onClick={() => setMonth(bookingMonth)} className={`min-h-11 rounded-xl border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 ${active ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"}`}>{bookingMonth.toLocaleString("en-PK", { month: "short" })}</button>
              })}
            </div>
          </div>
          <Calendar mode="single" selected={parseDate(selectedDate)} onSelect={(date) => date && selectDate(iso(date))} month={month} onMonthChange={setMonth} startMonth={parseDate(windowStart)} endMonth={parseDate(windowEnd)} disabled={(date) => Boolean(disabledReason(iso(date)))} modifiers={{ available: availableDates }} modifiersClassNames={{ available: "after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-[#0F766E] data-[selected-single=true]:after:bg-white" }} labels={{ labelDayButton: (date) => { const key = iso(date); return `${formatDate(key)}. ${disabledReason(key) || (availability[key] === undefined ? "Checking availability" : availability[key] ? `${availability[key]} times available` : "No availability")}` } }} className="mt-3 w-full justify-center p-0 [--cell-size:min(2.5rem,calc((100vw-5rem)/7))] sm:[--cell-size:2.75rem]" classNames={{ root: "w-full", months: "w-full", month: "w-full gap-2", nav: "hidden", month_caption: "hidden", month_grid: "w-full table-fixed border-separate border-spacing-y-1", weekdays: "h-7", weekday: "w-[14.285%] text-center text-[11px] font-medium text-slate-500", week: "h-[var(--cell-size)]", day: "relative h-[var(--cell-size)] w-[14.285%] p-0 text-center", selected: "[&>button]:bg-[#0F766E] [&>button]:text-white", today: "[&>button]:border [&>button]:border-[#0F766E] [&>button]:bg-transparent", disabled: "[&>button]:text-slate-400 [&>button]:opacity-45", outside: "invisible", }} />
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500" aria-label="Calendar legend"><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#0F766E]" aria-hidden="true" /> Times available</span><span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-slate-300 bg-slate-100" aria-hidden="true" /> Not available</span></div>
          {visibleMonthLoaded ? visibleMonthHasAvailability && nextAvailableInVisibleMonth ? <button type="button" onClick={() => selectDate(nextAvailableInVisibleMonth)} className="mt-2 inline-flex min-h-11 items-center rounded-xl px-1 text-sm font-semibold text-[#0F766E] transition hover:text-[#0D5F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">Next available: {shortDateFormatter.format(parseDate(nextAvailableInVisibleMonth))}<ArrowRight className="ml-1 size-4" aria-hidden="true" /></button> : <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600"><span>No availability this month.</span>{!isLastBookingMonth ? <button type="button" onClick={() => changeMonth(1)} className="min-h-11 rounded-xl px-2 font-semibold text-[#0F766E] hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">Go to next month</button> : null}</div> : null}
          <p className="mt-2 text-xs leading-5 text-slate-500">Unavailable dates include days off, non-working days, and fully booked times.</p>
        </div> : null}
      </section>

      <section ref={availableSection} tabIndex={-1} className="mt-6 scroll-mt-6 border-t border-slate-100 pt-6 focus:outline-none">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0F766E]"><span className="mr-2">02</span> Choose a time</p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">{formatVisitDate(selectedDate)}</h2>
        <p className="mt-1 text-sm text-slate-500">All times are shown in Pakistan Standard Time.</p>
        {slotsLoading ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[55px] animate-pulse rounded-xl bg-slate-100" />)}</div> : slotsError ? <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">We could not load times for this date. <button type="button" onClick={() => setSlotsByDate((current) => { const next = { ...current }; delete next[selectedDate]; return next })} className="font-semibold underline underline-offset-2">Try again</button></div> : slots.length ? <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" role="radiogroup" aria-label="Appointment time">{slots.map((time) => <button key={time} type="button" role="radio" aria-checked={selectedTime === time} onClick={() => setSelectedTime(time)} className={`flex h-[55px] items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] ${selectedTime === time ? "border-[#0F766E] bg-[#0F766E] text-white shadow-sm" : "border-slate-200 bg-white text-slate-800 hover:border-teal-300 hover:bg-teal-50"}`}>{selectedTime === time ? <Check className="size-4" aria-hidden="true" /> : null}{formatTime(time)}</button>)}</div> : <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><p className="font-medium text-slate-800">No times are available for this day.</p>{nextAvailable ? <Button type="button" variant="ghost" onClick={() => selectDate(nextAvailable)} className="mt-2 h-11 px-0 font-semibold text-[#0F766E] hover:bg-transparent hover:text-[#0D5F59]">View next available day <ArrowRight className="size-4" /></Button> : <p className="mt-1">Choose another date to see its available times.</p>}</div>}
        <button type="button" aria-expanded={calendarOpen} aria-controls="full-booking-calendar" onClick={() => setCalendarOpen((open) => !open)} className="mt-5 inline-flex min-h-11 items-center gap-1 rounded-xl px-1 text-sm font-semibold text-[#0F766E] transition hover:text-[#0D5F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">{calendarOpen ? "View less available times" : "View more available times"} <ArrowRight className={`size-4 transition-transform ${calendarOpen ? "rotate-90" : ""}`} /></button>
      </section>
    </div>

    <aside className="space-y-4 lg:sticky lg:top-6">
      <section className="rounded-[22px] border border-teal-100 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0F766E]">Your appointment</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Almost there</h2>
        {selectedTime ? <><div className="mt-5 rounded-xl bg-[#ECFDF5] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0F766E]">{formatVisitDate(selectedDate)}</p><p className="mt-1 text-xl font-bold text-slate-900">{formatTime(selectedTime)}</p><p className="mt-2 text-xs text-slate-600">{doctor.name}</p></div><div className="mt-5 space-y-4 text-sm"><DetailLine icon={<Stethoscope className="size-4" />} label={`${doctor.specialty} consultation`} value={doctor.location ?? "Clinic location confirmed after booking"} />{doctor.location ? <DetailLine icon={<MapPin className="size-4" />} label="Clinic" value={doctor.location} /> : null}<DetailLine icon={<WalletCards className="size-4" />} label={`${feeLabel} consultation fee`} value="Payment happens at the clinic" /></div></> : <div className="mt-5 rounded-xl bg-[#ECFDF5] p-4 text-sm leading-6 text-slate-600"><CalendarDays className="size-5 text-[#0F766E]" aria-hidden="true" /><p className="mt-3 font-semibold text-slate-900">Select a date and time</p><p className="mt-1">Your appointment details will appear here before you continue.</p></div>}
        <Button type="button" disabled={!selectedTime} onClick={continueBooking} className="mt-6 min-h-12 w-full rounded-xl bg-[#0F766E] font-semibold hover:bg-[#0D5F59]">Continue to details <ArrowRight className="size-4" /></Button>
      </section>
      <section className="rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-[#ECFDF5] p-4"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#CCFBF1] text-[#0F766E]"><ShieldCheck className="size-4" aria-hidden="true" /></span><div><h2 className="text-sm font-semibold text-slate-900">Plans change?</h2><p className="mt-1 text-sm leading-5 text-slate-600">You can cancel up to 2 hours before your visit.</p></div></div></section>
    </aside>

    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="rounded-2xl p-6 sm:max-w-md"><DialogHeader><DialogTitle>Confirm your booking</DialogTitle><DialogDescription>{formatDate(selectedDate)} at {selectedTime ? formatTime(selectedTime) : "your selected time"}. You can add an optional note for the doctor.</DialogDescription></DialogHeader><label className="grid gap-2 text-sm font-medium">Reason for visit <span className="font-normal text-slate-500">(optional)</span><textarea value={reason} onChange={(event) => { setReason(event.target.value); setReasonError("") }} aria-invalid={Boolean(reasonError)} aria-describedby="booking-reason-hint booking-reason-error" maxLength={300} rows={4} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" placeholder="Briefly tell the doctor how they can help." /><span id="booking-reason-hint" className="text-xs font-normal text-slate-500">{300 - reason.length} characters remaining</span>{reasonError ? <span id="booking-reason-error" className="text-sm font-normal text-red-600">{reasonError}</span> : null}</label><DialogFooter><Button type="button" disabled={loading} onClick={confirmBooking} className="h-11 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]">{loading ? <><Loader2 className="animate-spin" />Booking…</> : "Confirm booking"}</Button></DialogFooter></DialogContent></Dialog>
  </section>
}

function DetailLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex gap-3"><span className="mt-0.5 text-[#0F766E]" aria-hidden="true">{icon}</span><div className="min-w-0"><p className="font-medium text-slate-800">{label}</p><p className="mt-0.5 break-words text-xs text-slate-500">{value}</p></div></div>
}
