"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, Check, Clock3, Loader2 } from "lucide-react"
import { toast } from "sonner"
import * as yup from "yup"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Day = { date: string; label: string; day: string; slots: string[]; away?: boolean }
const reasonSchema = yup.object({ reason: yup.string().max(300, "Reason for visit must be 300 characters or fewer.") })
const timeFormatter = new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" })

function formatTime(time: string) {
  return timeFormatter.format(new Date(`2000-01-01T${time}`))
}

export function DoctorBookingFlow({ doctorId, days, loggedIn, role }: { doctorId: string; days: Day[]; loggedIn: boolean; role?: "patient" | "doctor" | "admin" | null }) {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState(() => Math.max(0, days.findIndex((item) => !item.away)))
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [reasonError, setReasonError] = useState("")
  const day = days[selectedDay]

  function selectDay(index: number) {
    if (days[index].away) return
    setSelectedDay(index)
    setSelectedTime(null)
  }

  function continueBooking() {
    if (!selectedTime) return
    if (role && role !== "patient") {
      toast.error("Booking is available for patient accounts.")
      return
    }
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/doctors/${doctorId}`)}`)
      return
    }
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

    let response: Response
    let result: { error?: string }

    try {
      response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, date: day.date, time: selectedTime, reason }),
      })
      result = await response.json().catch(() => ({ error: "We could not save your appointment. Please try again." })) as { error?: string }
    } catch {
      setLoading(false)
      toast.error("We could not reach the booking service. Please check your connection and try again.")
      return
    }

    setLoading(false)

    if (response.status === 401) {
      router.push(`/login?next=${encodeURIComponent(`/doctors/${doctorId}`)}`)
      return
    }

    if (response.status === 403) {
      toast.error("Booking is available for patient accounts.")
      return
    }

    if (!response.ok) {
      toast.error(result.error ?? "We could not save your appointment. Please try again.")
      if (response.status === 409 || response.status === 400) {
        setDialogOpen(false)
        setSelectedTime(null)
        router.refresh()
      }
      return
    }

    toast.success("Appointment booked. Opening your appointments…")
    router.replace("/appointments")
    router.refresh()
  }

  return (
    <section className="mt-8 grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:pb-0">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Choose your visit</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Select a date and time</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Choose one of the next seven days, then select an available time.</p>
          </div>
          {selectedTime ? <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-[#0F766E]"><Check className="size-3.5" /> Time selected</span> : null}
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-7" role="radiogroup" aria-label="Appointment date">
          {days.map((item, index) => (
            <button
              key={item.date}
              type="button"
              role="radio"
              aria-checked={selectedDay === index}
              aria-disabled={item.away}
              disabled={item.away}
              onClick={() => selectDay(index)}
              className={`min-h-16 rounded-xl border px-2 text-center text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 ${selectedDay === index && !item.away ? "border-[#0F766E] bg-[#0F766E] text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50"}`}
            >
              <span className="block text-[11px] font-medium uppercase tracking-wide opacity-80">{item.day}</span>
              <span className="mt-1 block text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-7 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-[#0F766E]" aria-hidden="true" />
            <h3 className="font-semibold text-slate-900">Available times for {day.day}, {day.label}</h3>
          </div>
          {day.away ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">Doctor is away on this day. Please choose another date.</p> : day.slots.length ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4" role="radiogroup" aria-label="Appointment time">
              {day.slots.map((time) => (
                <button
                  key={time}
                  type="button"
                  role="radio"
                  aria-checked={selectedTime === time}
                  onClick={() => setSelectedTime(time)}
                  className={`h-11 rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] ${selectedTime === time ? "border-[#0F766E] bg-[#0F766E] text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"}`}
                >
                  {formatTime(time)}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">No available times for this day. Please choose another date.</p>
          )}
        </div>
      </div>

      <aside className="hidden rounded-2xl border border-teal-100 bg-teal-50/70 p-5 shadow-sm lg:sticky lg:top-6 lg:block lg:h-fit">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Booking summary</p>
        {selectedTime ? (
          <div className="mt-5 space-y-4 text-sm text-slate-700">
            <div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-[#0F766E]"><CalendarDays className="size-4" /></span><div><p className="text-xs text-slate-500">Date</p><p className="mt-0.5 font-semibold text-slate-900">{day.day}, {day.label}</p></div></div>
            <div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-[#0F766E]"><Clock3 className="size-4" /></span><div><p className="text-xs text-slate-500">Time</p><p className="mt-0.5 font-semibold text-slate-900">{formatTime(selectedTime)}</p></div></div>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-500">Select a date and time to review your appointment before continuing.</p>
        )}
        <Button type="button" disabled={!selectedTime} onClick={continueBooking} className="mt-6 h-11 w-full rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]">Continue</Button>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {selectedTime ? <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-500">{day.day}, {day.label}</p><p className="font-semibold text-slate-900">{formatTime(selectedTime)}</p></div> : <p className="flex-1 text-sm text-slate-500">Select a time to continue</p>}
          <Button type="button" disabled={!selectedTime} onClick={continueBooking} className="h-11 shrink-0 rounded-xl bg-[#0F766E] px-5 hover:bg-[#0D5F59]">Continue</Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm your booking</DialogTitle>
            <DialogDescription>{day.day}, {day.label} at {selectedTime ? formatTime(selectedTime) : "your selected time"}. You can add an optional note for the doctor.</DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-sm font-medium">
            Reason for visit <span className="font-normal text-slate-500">(optional)</span>
            <textarea value={reason} onChange={(event) => { setReason(event.target.value); setReasonError("") }} aria-invalid={Boolean(reasonError)} aria-describedby="booking-reason-hint booking-reason-error" maxLength={300} rows={4} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" placeholder="Briefly tell the doctor how they can help." />
            <span id="booking-reason-hint" className="text-xs font-normal text-slate-500">{300 - reason.length} characters remaining</span>
            {reasonError ? <span id="booking-reason-error" className="text-sm font-normal text-red-600">{reasonError}</span> : null}
          </label>
          <DialogFooter>
            <Button type="button" disabled={loading} onClick={confirmBooking} className="h-10 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]">{loading ? <><Loader2 className="animate-spin" />Booking…</> : "Confirm booking"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
