"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarDays, Check, Clock3, Loader2, MapPin, RotateCcw, ShieldCheck, Stethoscope, WalletCards } from "lucide-react"
import { toast } from "sonner"
import * as yup from "yup"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Day = { date: string; label: string; day: string; slots: string[]; away?: boolean }
type Schedule = { day_of_week: number; start_time: string; end_time: string; slot_minutes: number }
type TimeOff = { start_date: string; end_date: string }
type Availability = Record<string, number>
type BookingDoctor = { name: string; specialty: string; location?: string | null; fee?: number | null }

const reasonSchema = yup.object({ reason: yup.string().max(300, "Reason for visit must be 300 characters or fewer.") })
const timeFormatter = new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" })
const fullDateFormatter = new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
const shortDateFormatter = new Intl.DateTimeFormat("en-PK", { weekday: "short", day: "numeric", month: "short" })
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
const parseDate = (value: string) => new Date(`${value}T12:00:00`)
const formatTime = (time: string) => timeFormatter.format(new Date(`2000-01-01T${time}`))
const formatDate = (value: string) => fullDateFormatter.format(parseDate(value))
const formatShortDate = (value: string) => shortDateFormatter.format(parseDate(value))

export function DoctorBookingFlow({ doctorId, doctor, days, schedules, timeOff, windowStart, windowEnd, bookingWindowDays, loggedIn, role }: { doctorId: string; doctor: BookingDoctor; days: Day[]; schedules: Schedule[]; timeOff: TimeOff[]; windowStart: string; windowEnd: string; bookingWindowDays: number; loggedIn: boolean; role?: "patient" | "doctor" | "admin" | null }) {
  const router = useRouter()
  const availableSection = useRef<HTMLDivElement>(null)
  const initialSlots = useMemo(() => Object.fromEntries(days.map((item) => [item.date, item.slots])), [days])
  const initialAvailability = useMemo(() => Object.fromEntries(days.map((item) => [item.date, item.slots.length])), [days])
  const [selectedDate, setSelectedDate] = useState(() => days.find((item) => item.slots.length > 0)?.date ?? windowStart)
  const [slotsByDate, setSlotsByDate] = useState<Record<string, string[]>>(initialSlots)
  const [availability, setAvailability] = useState<Availability>(initialAvailability)
  const [availabilityLoading, setAvailabilityLoading] = useState(true)
  const [availabilityError, setAvailabilityError] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [reasonError, setReasonError] = useState("")
  const [month, setMonth] = useState(() => parseDate(windowStart))
  const slots = slotsByDate[selectedDate] ?? []

  const isAway = (date: string) => timeOff.some((range) => range.start_date <= date && range.end_date >= date)
  const hasSchedule = (date: string) => schedules.some((item) => item.day_of_week === parseDate(date).getDay())
  const disabledReason = (date: string) => {
    if (date < windowStart || date > windowEnd) return "Outside the booking window"
    if (!hasSchedule(date)) return "Doctor does not work on this day"
    if (isAway(date)) return "Doctor is away"
    if (Object.prototype.hasOwnProperty.call(availability, date) && availability[date] === 0) return "No availability"
    return ""
  }

  const loadAvailability = useCallback(async () => {
    const cursor = parseDate(windowStart)
    cursor.setDate(cursor.getDate() + 7)
    const from = iso(cursor)
    if (from > windowEnd) { setAvailabilityLoading(false); return }
    setAvailabilityLoading(true); setAvailabilityError(false)
    try {
      const response = await fetch(`/api/doctors/${doctorId}/availability?from=${from}&to=${windowEnd}`)
      const payload = await response.json() as { availability?: { date: string; freeSlots: number }[] }
      if (!response.ok) throw new Error("Availability request failed")
      setAvailability((current) => ({ ...current, ...Object.fromEntries((payload.availability ?? []).map((item) => [item.date, item.freeSlots])) }))
    } catch { setAvailabilityError(true) } finally { setAvailabilityLoading(false) }
  }, [doctorId, windowEnd, windowStart])

  useEffect(() => {
    const request = window.setTimeout(() => { void loadAvailability() }, 0)
    return () => window.clearTimeout(request)
  }, [loadAvailability])
  useEffect(() => {
    if (slotsByDate[selectedDate]) return
    let active = true
    const request = window.setTimeout(() => {
      setSlotsLoading(true); setSlotsError(false)
      fetch(`/api/doctors/${doctorId}/availability?date=${selectedDate}`).then(async (response) => {
        const payload = await response.json() as { slots?: string[]; freeSlots?: number }
        if (!response.ok) throw new Error("Slots request failed")
        if (!active) return
        const nextSlots = payload.slots ?? []
        setSlotsByDate((current) => ({ ...current, [selectedDate]: nextSlots }))
        setAvailability((current) => ({ ...current, [selectedDate]: payload.freeSlots ?? nextSlots.length }))
      }).catch(() => { if (active) setSlotsError(true) }).finally(() => { if (active) setSlotsLoading(false) })
    }, 0)
    return () => { active = false; window.clearTimeout(request) }
  }, [doctorId, selectedDate, slotsByDate])

  function selectDate(date: string) {
    if (disabledReason(date)) return
    setSelectedDate(date); setSelectedTime(null)
    window.setTimeout(() => availableSection.current?.focus(), 0)
  }
  function continueBooking() {
    if (!selectedTime) return
    if (role && role !== "patient") { toast.error("Booking is available for patient accounts."); return }
    if (!loggedIn) { router.push(`/login?next=${encodeURIComponent(`/doctors/${doctorId}`)}`); return }
    setDialogOpen(true)
  }
  async function confirmBooking() {
    if (!selectedTime) return
    try { await reasonSchema.validate({ reason }) } catch (error) { setReasonError(error instanceof yup.ValidationError ? error.message : "Check your reason for visit."); return }
    setLoading(true)
    try {
      const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctorId, date: selectedDate, time: selectedTime, reason }) })
      const result = await response.json().catch(() => ({ error: "We could not save your appointment. Please try again." })) as { error?: string }
      if (response.status === 401) { router.push(`/login?next=${encodeURIComponent(`/doctors/${doctorId}`)}`); return }
      if (response.status === 403) { toast.error("Booking is available for patient accounts."); return }
      if (!response.ok) { toast.error(result.error ?? "We could not save your appointment. Please try again."); if (response.status === 409 || response.status === 400) { setDialogOpen(false); setSelectedTime(null); router.refresh() }; return }
      toast.success("Appointment booked. Opening your appointments…"); router.replace("/appointments"); router.refresh()
    } catch { toast.error("We could not reach the booking service. Please check your connection and try again.") } finally { setLoading(false) }
  }

  const nextAvailable = Object.entries(availability).filter(([date, count]) => date > selectedDate && count > 0).sort(([a], [b]) => a.localeCompare(b))[0]?.[0]
  const availableDates = Object.entries(availability).filter(([, count]) => count > 0).map(([date]) => parseDate(date))
  const feeLabel = typeof doctor.fee === "number" && Number.isFinite(doctor.fee) ? `Rs. ${doctor.fee.toLocaleString()}` : null

  return <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
    <div className="min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#CCFBF1] text-xs font-bold text-[#0F766E]">01</span><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0F766E]">Select a date</p><p className="mt-1 text-sm leading-6 text-slate-500">Choose a convenient day within the next {bookingWindowDays} days.</p></div></div>
      <div className="mt-5 -mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0" role="radiogroup" aria-label="Quick appointment dates"><div className="flex min-w-max gap-2">{days.map((item) => { const disabled = Boolean(disabledReason(item.date)); return <button key={item.date} type="button" role="radio" aria-checked={selectedDate === item.date} aria-label={`${item.day}, ${item.label}${disabled ? `: ${disabledReason(item.date)}` : `: ${item.slots.length} times available`}`} disabled={disabled} onClick={() => selectDate(item.date)} className={`min-h-16 min-w-[76px] rounded-xl border px-3 text-center text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 ${selectedDate === item.date && !disabled ? "border-[#0F766E] bg-[#0F766E] text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50"}`}><span className="block text-[11px] font-medium uppercase tracking-wide opacity-80">{item.day}</span><span className="mt-1 block">{item.label}</span></button> })}</div></div>
      <div className="mt-7 border-t border-slate-100 pt-6" aria-busy={availabilityLoading}><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold text-slate-800">Or choose another day</p><p className="mt-1 text-xs text-slate-500">Teal dots mark dates with available times.</p></div>{availabilityLoading ? <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Loader2 className="size-3.5 animate-spin" /> Checking dates</span> : null}</div>{availabilityError ? <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><span>We could not refresh all available dates. You can still choose from the dates shown above.</span><Button type="button" variant="ghost" onClick={() => void loadAvailability()} className="h-10 text-[#0F766E] hover:bg-white"><RotateCcw className="size-4" /> Retry</Button></div> : null}<Calendar mode="single" selected={parseDate(selectedDate)} onSelect={(date) => date && selectDate(iso(date))} month={month} onMonthChange={setMonth} startMonth={parseDate(windowStart)} endMonth={parseDate(windowEnd)} disabled={(date) => Boolean(disabledReason(iso(date)))} modifiers={{ available: availableDates }} modifiersClassNames={{ available: "after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-[#0F766E] data-[selected-single=true]:after:bg-white" }} labels={{ labelDayButton: (date) => { const key = iso(date); return `${formatDate(key)}. ${disabledReason(key) || (availability[key] === undefined ? "Checking availability" : availability[key] ? `${availability[key]} times available` : "No availability")}` } }} className="mt-4 w-full justify-center rounded-2xl border border-slate-100 bg-slate-50/70 p-3 [--cell-size:2.55rem] sm:[--cell-size:2.8rem]" classNames={{ root: "w-full", months: "w-full", month: "w-full", month_grid: "w-full", selected: "[&>button]:bg-[#0F766E] [&>button]:text-white", today: "[&>button]:border [&>button]:border-[#0F766E]" }} /><p className="mt-3 text-xs leading-5 text-slate-500">Unavailable dates include days off, non-working days, and fully booked times.</p></div>
      <div ref={availableSection} tabIndex={-1} className="mt-7 scroll-mt-6 border-t border-slate-100 pt-6 focus:outline-none"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#CCFBF1] text-xs font-bold text-[#0F766E]">02</span><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0F766E]">Choose a time</p><h2 className="mt-1 font-semibold text-slate-900">Available times for {formatShortDate(selectedDate)}</h2></div></div>{slotsLoading ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-label="Loading available times">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div> : slotsError ? <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">We could not load times for this date. <button type="button" onClick={() => { setSlotsByDate((current) => { const next = { ...current }; delete next[selectedDate]; return next }) }} className="font-semibold underline underline-offset-2">Try again</button></div> : slots.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" role="radiogroup" aria-label="Appointment time">{slots.map((time) => <button key={time} type="button" role="radio" aria-checked={selectedTime === time} onClick={() => setSelectedTime(time)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] ${selectedTime === time ? "border-[#0F766E] bg-[#0F766E] text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"}`}>{selectedTime === time ? <Check className="size-4" aria-hidden="true" /> : null}{formatTime(time)}</button>)}</div> : <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><p className="font-medium text-slate-800">No times are available for this day.</p>{nextAvailable ? <Button type="button" variant="ghost" onClick={() => selectDate(nextAvailable)} className="mt-2 h-11 px-0 font-semibold text-[#0F766E] hover:bg-transparent hover:text-[#0D5F59]">View next available day ({formatShortDate(nextAvailable)}) <ArrowRight className="size-4" /></Button> : !availabilityLoading ? <p className="mt-1">There are no available appointments in the next {bookingWindowDays} days. Please check again later.</p> : null}</div>}</div>
    </div>
    <aside className="space-y-4 lg:sticky lg:top-6"><section className="rounded-[22px] border border-teal-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]"><CalendarDays className="size-5" aria-hidden="true" /></span><div><h2 className="font-semibold text-slate-900">Your appointment</h2><p className="text-xs text-slate-500">Review before you continue</p></div></div>{selectedTime ? <div className="mt-6 space-y-4 text-sm"><SummaryRow icon={<CalendarDays className="size-4" />} label="Date" value={formatDate(selectedDate)} /><SummaryRow icon={<Clock3 className="size-4" />} label="Time" value={formatTime(selectedTime)} /><SummaryRow icon={<Stethoscope className="size-4" />} label="Doctor" value={doctor.name} /><SummaryRow label="Specialty" value={doctor.specialty} />{doctor.location ? <SummaryRow icon={<MapPin className="size-4" />} label="Clinic" value={doctor.location} /> : null}{feeLabel ? <SummaryRow icon={<WalletCards className="size-4" />} label="Consultation fee" value={feeLabel} /> : null}</div> : <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600"><p className="font-medium text-slate-800">Pick a date and time</p><p className="mt-1">Your visit details will appear here when you make a selection.</p></div>}<Button type="button" disabled={!selectedTime} onClick={continueBooking} className="mt-6 min-h-12 w-full rounded-xl bg-[#0F766E] font-semibold hover:bg-[#0D5F59]">Continue to details <ArrowRight className="size-4" /></Button></section><section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#0F766E] shadow-sm"><ShieldCheck className="size-4" aria-hidden="true" /></span><div><h2 className="text-sm font-semibold text-slate-900">Plans change?</h2><p className="mt-1 text-sm leading-5 text-slate-600">You can cancel up to 2 hours before your visit.</p></div></div></section></aside>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="rounded-2xl p-6 sm:max-w-md"><DialogHeader><DialogTitle>Confirm your booking</DialogTitle><DialogDescription>{formatDate(selectedDate)} at {selectedTime ? formatTime(selectedTime) : "your selected time"}. You can add an optional note for the doctor.</DialogDescription></DialogHeader><label className="grid gap-2 text-sm font-medium">Reason for visit <span className="font-normal text-slate-500">(optional)</span><textarea value={reason} onChange={(event) => { setReason(event.target.value); setReasonError("") }} aria-invalid={Boolean(reasonError)} aria-describedby="booking-reason-hint booking-reason-error" maxLength={300} rows={4} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" placeholder="Briefly tell the doctor how they can help." /><span id="booking-reason-hint" className="text-xs font-normal text-slate-500">{300 - reason.length} characters remaining</span>{reasonError ? <span id="booking-reason-error" className="text-sm font-normal text-red-600">{reasonError}</span> : null}</label><DialogFooter><Button type="button" disabled={loading} onClick={confirmBooking} className="h-11 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]">{loading ? <><Loader2 className="animate-spin" />Booking…</> : "Confirm booking"}</Button></DialogFooter></DialogContent></Dialog>
  </section>
}

function SummaryRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return <div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-teal-50 text-[#0F766E]" aria-hidden="true">{icon}</span><div className="min-w-0"><p className="text-xs text-slate-500">{label}</p><p className="mt-0.5 break-words font-semibold leading-5 text-slate-900">{value}</p></div></div>
}
