"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, Clock3, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Day = { date: string; label: string; day: string; slots: string[] }

export function DoctorBookingFlow({ doctorId, days, loggedIn }: { doctorId: string; days: Day[]; loggedIn: boolean }) {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const day = days[selectedDay]

  function selectDay(index: number) { setSelectedDay(index); setSelectedTime(null) }
  function continueBooking() {
    if (!selectedTime) return
    if (!loggedIn) { router.push(`/login?next=${encodeURIComponent(`/doctors/${doctorId}`)}`); return }
    setDialogOpen(true)
  }
  async function confirmBooking() {
    if (!selectedTime) return
    setLoading(true)
    const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctorId, date: day.date, time: selectedTime, reason }) })
    const result = await response.json().catch(() => ({ error: "We could not save your appointment. Please try again." })) as { error?: string }
    setLoading(false)
    if (response.status === 401) { router.push(`/login?next=${encodeURIComponent(`/doctors/${doctorId}`)}`); return }
    if (!response.ok) {
      toast.error(result.error ?? "We could not save your appointment. Please try again.")
      if (response.status === 409 || response.status === 400) { setDialogOpen(false); setSelectedTime(null); router.refresh() }
      return
    }
    toast.success("Appointment booked. Opening your appointments…")
    router.replace("/appointments")
    router.refresh()
  }

  return <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><h2 className="text-2xl font-semibold tracking-tight">Choose a time</h2><p className="mt-2 text-sm text-slate-600">Select a day, then choose one available time.</p></div><div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7" role="radiogroup" aria-label="Appointment date">{days.map((item, index) => <button key={item.date} type="button" role="radio" aria-checked={selectedDay === index} onClick={() => selectDay(index)} className={`min-h-16 rounded-xl border px-2 text-center text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] ${selectedDay === index ? "border-[#0F766E] bg-teal-50 text-[#0F766E]" : "border-slate-200 text-slate-600 hover:border-teal-200 hover:bg-slate-50"}`}><span className="block text-xs font-medium">{item.day}</span><span className="mt-1 block">{item.label}</span></button>)}</div><div className="mt-6 border-t border-slate-100 pt-5"><h3 className="font-semibold text-slate-900">{day.day}, {day.label}</h3>{day.slots.length ? <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Appointment time">{day.slots.map((time) => <button key={time} type="button" role="radio" aria-checked={selectedTime === time} onClick={() => setSelectedTime(time)} className={`h-10 rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] ${selectedTime === time ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-teal-200 bg-teal-50 text-[#0F766E] hover:bg-teal-100"}`}>{new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(new Date(`2000-01-01T${time}`))}</button>)}</div> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No available times for this day. Please choose another date.</p>}</div></div><aside className="rounded-2xl border border-teal-100 bg-teal-50/60 p-5 shadow-sm lg:sticky lg:top-6 lg:h-fit"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Booking summary</p>{selectedTime ? <div className="mt-5 space-y-3 text-sm text-slate-700"><p className="flex gap-2"><CalendarDays className="mt-0.5 size-4 text-[#0F766E]" />{day.day}, {day.label}</p><p className="flex gap-2"><Clock3 className="mt-0.5 size-4 text-[#0F766E]" />{new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" }).format(new Date(`2000-01-01T${selectedTime}`))}</p></div> : <p className="mt-5 text-sm leading-6 text-slate-500">Select a date and time to see your appointment summary.</p>}<Button type="button" disabled={!selectedTime} onClick={continueBooking} className="mt-6 h-11 w-full rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]">Continue</Button></aside><div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-4 backdrop-blur lg:hidden"><Button type="button" disabled={!selectedTime} onClick={continueBooking} className="h-11 w-full rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]">Continue{selectedTime ? ` · ${selectedTime.slice(0, 5)}` : ""}</Button></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>Confirm your booking</DialogTitle><DialogDescription>{day.day}, {day.label} at {selectedTime?.slice(0, 5)}. You can add an optional note for the doctor.</DialogDescription></DialogHeader><label className="grid gap-2 text-sm font-medium">Reason for visit <span className="font-normal text-slate-500">(optional)</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} rows={4} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" placeholder="Briefly tell the doctor how they can help." /></label><DialogFooter><Button type="button" disabled={loading} onClick={confirmBooking} className="h-10 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]">{loading ? <><Loader2 className="animate-spin" />Booking…</> : "Confirm booking"}</Button></DialogFooter></DialogContent></Dialog></section>
}
