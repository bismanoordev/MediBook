"use client"

import { CalendarClock, Clock3, Loader2, Pencil, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { removeDoctorAvailabilityOverride, saveDoctorAvailabilityOverride } from "@/app/doctor/actions"
import { Button } from "@/components/ui/button"

type Override = { id: number; override_date: string; start_time: string; end_time: string; slot_minutes: number }
type FormValues = { id?: number; date: string; start: string; end: string; minutes: number }

const dateFormatter = new Intl.DateTimeFormat("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
const timeFormatter = new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" })
const initialValues = (date: string): FormValues => ({ date, start: "09:00", end: "17:00", minutes: 30 })
const timeLabel = (time: string) => timeFormatter.format(new Date(`2000-01-01T${time}`))

export function DoctorSpecificAvailability({ overrides, minDate, maxDate }: { overrides: Override[]; minDate: string; maxDate: string }) {
  const router = useRouter()
  const [form, setForm] = useState<FormValues>(() => initialValues(minDate))
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  function reset() {
    setError("")
    setForm(initialValues(minDate))
  }

  function save() {
    setError("")
    startTransition(async () => {
      const result = await saveDoctorAvailabilityOverride(form)
      if (result.error) {
        setError(result.error)
        return
      }
      toast.success(form.id ? "Specific hours updated." : "Specific hours saved.")
      reset()
      router.refresh()
    })
  }

  function edit(override: Override) {
    setError("")
    setForm({ id: override.id, date: override.override_date, start: override.start_time.slice(0, 5), end: override.end_time.slice(0, 5), minutes: override.slot_minutes })
  }

  function remove(id: number) {
    setError("")
    startTransition(async () => {
      const result = await removeDoctorAvailabilityOverride(id)
      if (result.error) {
        setError(result.error)
        return
      }
      toast.success("Specific hours removed.")
      if (form.id === id) reset()
      router.refresh()
    })
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="specific-dates-title">
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#0F766E]"><CalendarClock className="size-5" aria-hidden="true" /></span>
      <div><h2 id="specific-dates-title" className="text-lg font-semibold text-slate-900">Special dates</h2><p className="mt-1 text-sm leading-6 text-slate-600">Open an extra day or use different hours on one date. These hours replace your regular hours for that date only.</p></div>
    </div>

    <div className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">Date<input type="date" min={minDate} max={maxDate} value={form.date} disabled={pending} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60" /></label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">Start time<input type="time" value={form.start} disabled={pending} onChange={(event) => setForm((current) => ({ ...current, start: event.target.value }))} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60" /></label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">End time<input type="time" value={form.end} disabled={pending} onChange={(event) => setForm((current) => ({ ...current, end: event.target.value }))} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60" /></label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">Slot length<select value={form.minutes} disabled={pending} onChange={(event) => setForm((current) => ({ ...current, minutes: Number(event.target.value) }))} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-60"><option value={15}>15 minutes</option><option value={20}>20 minutes</option><option value={30}>30 minutes</option><option value={60}>60 minutes</option></select></label>
    </div>
    <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#0F766E]"><Clock3 className="size-3.5" aria-hidden="true" />Replaces your weekly hours on this date.</p>
    {error ? <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
    <div className="mt-4 flex flex-wrap gap-2"><Button type="button" disabled={pending} onClick={save} className="min-h-11 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]">{pending ? <><Loader2 className="animate-spin" />Saving…</> : form.id ? "Save changes" : "Save specific hours"}</Button>{form.id ? <Button type="button" variant="outline" disabled={pending} onClick={reset} className="min-h-11 rounded-xl">Cancel edit</Button> : null}</div>

    <div className="mt-7 border-t border-slate-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Upcoming specific dates</h3>{overrides.length ? <ul className="mt-3 grid gap-3">{overrides.map((override) => <li key={override.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold text-slate-900">{dateFormatter.format(new Date(`${override.override_date}T12:00:00`))}</p><p className="mt-1 text-sm text-slate-600">{timeLabel(override.start_time)}–{timeLabel(override.end_time)} · {override.slot_minutes}-minute slots</p><p className="mt-1 text-xs font-medium text-[#0F766E]">Replaces your weekly hours on this date</p></div><div className="flex gap-2"><Button type="button" variant="outline" disabled={pending} onClick={() => edit(override)} className="min-h-10 rounded-xl"><Pencil className="size-4" />Edit</Button><Button type="button" variant="outline" disabled={pending} onClick={() => remove(override.id)} className="min-h-10 rounded-xl border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"><Trash2 className="size-4" />Remove</Button></div></li>)}</ul> : <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No specific dates are set. Your weekly schedule is being used.</p>}</div>
  </section>
}
