"use client"

import { CalendarClock, Loader2, Pencil, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { AvailabilityDateInput, AvailabilityResult, AvailabilityUpdateInput } from "@/lib/availability"
import { cn } from "@/lib/utils"

type Override = { id: number; override_date: string; start_time: string; end_time: string; slot_minutes: number }
type Mode = "single" | "range"
type FormValues = { id?: number; date: string; from: string; to: string; weekdays: number[]; start: string; end: string; minutes: number }

export type AvailabilityActions = {
  add: (input: AvailabilityDateInput) => Promise<AvailabilityResult>
  update: (input: AvailabilityUpdateInput) => Promise<AvailabilityResult>
  remove: (id: number) => Promise<AvailabilityResult>
}

const weekdayOptions = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
]
const dateFormatter = new Intl.DateTimeFormat("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
const timeFormatter = new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit" })
const timeLabel = (time: string) => timeFormatter.format(new Date(`2000-01-01T${time}`))
const initialValues = (date: string): FormValues => ({ date, from: date, to: date, weekdays: [1, 2, 3, 4, 5], start: "09:00", end: "13:00", minutes: 30 })
const fieldClass = "h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100"

export function AvailabilityManager({
  overrides,
  minDate,
  maxDate,
  actions,
  title = "Your availability",
  description = "Choose the dates you will see patients, then set the hours. Patients can book only these dates.",
}: {
  overrides: Override[]
  minDate: string
  maxDate: string
  actions: AvailabilityActions
  title?: string
  description?: string
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("single")
  const [form, setForm] = useState<FormValues>(() => initialValues(minDate))
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const editing = form.id !== undefined
  const activeMode: Mode = editing ? "single" : mode

  function reset() {
    setError("")
    setForm(initialValues(minDate))
  }

  function toggleWeekday(day: number) {
    setForm((current) => ({ ...current, weekdays: current.weekdays.includes(day) ? current.weekdays.filter((item) => item !== day) : [...current.weekdays, day] }))
  }

  function save() {
    setError("")
    if (!form.start || !form.end || form.end <= form.start) return setError("Choose an end time that is after the start time.")
    if (activeMode === "single" && !form.date) return setError("Choose a date.")
    if (activeMode === "range" && (!form.from || !form.to)) return setError("Choose the first and last date.")
    if (activeMode === "range" && form.to < form.from) return setError("The last date must be on or after the first date.")
    if (activeMode === "range" && !form.weekdays.length) return setError("Choose at least one weekday.")

    startTransition(async () => {
      if (editing) {
        const result = await actions.update({ id: form.id as number, date: form.date, start: form.start, end: form.end, minutes: form.minutes })
        if (result.error) return setError(result.error)
        toast.success("Availability updated.")
        reset()
        router.refresh()
        return
      }

      const input: AvailabilityDateInput = activeMode === "single"
        ? { startDate: form.date, endDate: form.date, weekdays: [new Date(`${form.date}T12:00:00`).getDay()], start: form.start, end: form.end, minutes: form.minutes }
        : { startDate: form.from, endDate: form.to, weekdays: form.weekdays, start: form.start, end: form.end, minutes: form.minutes }
      const result = await actions.add(input)
      if (result.error) return setError(result.error)
      const added = result.added ?? 0
      const skipped = result.skipped ?? 0
      if (!added) setError("Those dates are already set. Edit or remove them below.")
      else {
        toast.success(`${added} date${added === 1 ? "" : "s"} added${skipped ? `, ${skipped} skipped (already set)` : ""}.`)
        reset()
        router.refresh()
      }
    })
  }

  function edit(override: Override) {
    setError("")
    setForm({ ...initialValues(minDate), id: override.id, date: override.override_date, start: override.start_time.slice(0, 5), end: override.end_time.slice(0, 5), minutes: override.slot_minutes })
  }

  function remove(id: number) {
    setError("")
    startTransition(async () => {
      const result = await actions.remove(id)
      if (result.error) return setError(result.error)
      toast.success("Availability removed.")
      if (form.id === id) reset()
      router.refresh()
    })
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="availability-title">
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-[#0F766E]"><CalendarClock className="size-5" aria-hidden="true" /></span>
      <div><h2 id="availability-title" className="text-lg font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div>
    </div>

    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
      {editing ? <p className="text-sm font-semibold text-slate-900">Edit availability</p> : (
        <div role="radiogroup" aria-label="Add one date or a range" className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {([["single", "One date"], ["range", "Date range"]] as const).map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={mode === value} disabled={pending} onClick={() => setMode(value)} className={cn("min-h-10 rounded-lg px-4 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-teal-300", mode === value ? "bg-[#0F766E] text-white shadow-sm" : "text-slate-600 hover:bg-teal-50 hover:text-[#0F766E]")}>{label}</button>)}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {activeMode === "single" ? (
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 lg:col-span-2">Date<input type="date" min={minDate} max={maxDate} value={form.date} disabled={pending} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className={fieldClass} /></label>
        ) : (
          <>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">First date<input type="date" min={minDate} max={maxDate} value={form.from} disabled={pending} onChange={(event) => setForm((current) => ({ ...current, from: event.target.value }))} className={fieldClass} /></label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">Last date<input type="date" min={form.from || minDate} max={maxDate} value={form.to} disabled={pending} onChange={(event) => setForm((current) => ({ ...current, to: event.target.value }))} className={fieldClass} /></label>
          </>
        )}
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">Start time<input type="time" value={form.start} disabled={pending} onChange={(event) => setForm((current) => ({ ...current, start: event.target.value }))} className={fieldClass} /></label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">End time<input type="time" value={form.end} disabled={pending} onChange={(event) => setForm((current) => ({ ...current, end: event.target.value }))} className={fieldClass} /></label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">Slot length<select value={form.minutes} disabled={pending} onChange={(event) => setForm((current) => ({ ...current, minutes: Number(event.target.value) }))} className={fieldClass}>{[15, 20, 30, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
      </div>

      {activeMode === "range" ? (
        <fieldset className="mt-4" disabled={pending}>
          <legend className="text-sm font-medium text-slate-700">Days of the week</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {weekdayOptions.map(({ value, label }) => {
              const selected = form.weekdays.includes(value)
              return <button key={value} type="button" aria-pressed={selected} onClick={() => toggleWeekday(value)} className={cn("min-h-10 min-w-14 rounded-xl border px-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-teal-300", selected ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-[#0F766E]")}>{label}</button>
            })}
          </div>
        </fieldset>
      ) : null}

      {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={save} className="min-h-11 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]">{pending ? <><Loader2 className="animate-spin" />Saving…</> : editing ? "Save changes" : activeMode === "range" ? "Add these dates" : "Add this date"}</Button>
        {editing ? <Button type="button" variant="outline" disabled={pending} onClick={reset} className="min-h-11 rounded-xl">Cancel edit</Button> : null}
      </div>
    </div>

    <div className="mt-7 border-t border-slate-100 pt-5">
      <h3 className="text-sm font-semibold text-slate-900">Dates open for booking</h3>
      {overrides.length ? (
        <ul className="mt-3 grid gap-3">
          {overrides.map((override) => <li key={override.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><p className="font-semibold text-slate-900">{dateFormatter.format(new Date(`${override.override_date}T12:00:00`))}</p><p className="mt-1 text-sm text-slate-600">{timeLabel(override.start_time)}–{timeLabel(override.end_time)} · {override.slot_minutes}-minute slots</p></div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={pending} onClick={() => edit(override)} className="min-h-10 rounded-xl"><Pencil className="size-4" />Edit</Button>
              <Button type="button" variant="outline" disabled={pending} onClick={() => remove(override.id)} className="min-h-10 rounded-xl border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"><Trash2 className="size-4" />Remove</Button>
            </div>
          </li>)}
        </ul>
      ) : <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No dates are open yet. Patients cannot book until you add at least one date.</p>}
    </div>
  </section>
}
