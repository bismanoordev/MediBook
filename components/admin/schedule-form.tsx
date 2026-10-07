"use client"

import { useState } from "react"
import * as yup from "yup"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const schema = yup.object({
  start: yup.string().required("Choose a start time."),
  end: yup.string().required("Choose an end time."),
  minutes: yup.number().oneOf([15, 20, 30, 60], "Choose 15, 20, 30, or 60 minutes.").required(),
})

type Schedule = { start_time: string; end_time: string; slot_minutes: number }

export function ScheduleForm({ action, doctorId, day, index, schedule }: { action: (data: FormData) => void | Promise<void>; doctorId: string; day: string; index: number; schedule?: Schedule }) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    if (submitter?.value === "false") return

    const formData = new FormData(event.currentTarget)
    try {
      await schema.validate({ start: formData.get("start_time"), end: formData.get("end_time"), minutes: Number(formData.get("slot_minutes")) }, { abortEarly: false })
      if (String(formData.get("end_time")) <= String(formData.get("start_time"))) throw new yup.ValidationError("End time must be later than start time.", "", "end")
      setErrors({})
    } catch (error) {
      event.preventDefault()
      if (error instanceof yup.ValidationError) setErrors(Object.fromEntries((error.inner.length ? error.inner : [error]).map((issue) => [issue.path ?? "end", issue.message])))
    }
  }

  function clear(key: string) {
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  return (
    <form action={action} onSubmit={submit} className="grid items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(8rem,1fr)_auto_auto_auto_auto]">
      <input type="hidden" name="doctor_id" value={doctorId} />
      <input type="hidden" name="day_of_week" value={index} />
      <div>
        <p className="text-sm font-semibold text-slate-900">{day}</p>
        <p className={`mt-1 text-xs font-medium ${schedule ? "text-[#0F766E]" : "text-slate-500"}`}>{schedule ? "Available" : "Not available"}</p>
      </div>
      <div>
        <input name="start_time" type="time" defaultValue={schedule?.start_time.slice(0, 5) ?? "09:00"} onChange={() => clear("start")} aria-invalid={Boolean(errors.start)} aria-describedby={errors.start ? `start-${index}` : undefined} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm" />
        {errors.start ? <p id={`start-${index}`} className="mt-1 text-xs text-red-600">{errors.start}</p> : null}
      </div>
      <div>
        <input name="end_time" type="time" defaultValue={schedule?.end_time.slice(0, 5) ?? "13:00"} onChange={() => clear("end")} aria-invalid={Boolean(errors.end)} aria-describedby={errors.end ? `end-${index}` : undefined} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm" />
        {errors.end ? <p id={`end-${index}`} className="mt-1 text-xs text-red-600">{errors.end}</p> : null}
      </div>
      <div>
        <label htmlFor={`slot-minutes-${index}`} className="sr-only">Appointment slot duration for {day}</label>
        <Select name="slot_minutes" defaultValue={String(schedule?.slot_minutes ?? 30)} items={[{ value: "15", label: "15 min" }, { value: "20", label: "20 min" }, { value: "30", label: "30 min" }, { value: "60", label: "60 min" }]} onValueChange={() => clear("minutes")}>
          <SelectTrigger id={`slot-minutes-${index}`} aria-invalid={Boolean(errors.minutes)} aria-describedby={errors.minutes ? `minutes-${index}` : undefined} className="h-10 min-w-24 rounded-xl border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-teal-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            {[15, 20, 30, 60].map((minutes) => <SelectItem key={minutes} value={String(minutes)} className="rounded-lg px-3 py-2.5 text-slate-700 data-[highlighted]:bg-teal-50 data-[highlighted]:text-[#0F766E] data-[selected]:bg-teal-50 data-[selected]:font-semibold data-[selected]:text-[#0F766E]">{minutes} min</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.minutes ? <p id={`minutes-${index}`} className="mt-1 text-xs text-red-600">{errors.minutes}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {schedule ? <button type="submit" name="enabled" value="false" formNoValidate className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Turn off</button> : null}
        <button type="submit" name="enabled" value="true" className="h-10 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59]">{schedule ? "Save" : "Save hours"}</button>
      </div>
    </form>
  )
}
