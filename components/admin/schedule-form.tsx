"use client"

import { Loader2 } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import * as yup from "yup"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const schema = yup.object({
  start: yup.string().required("Choose a start time."),
  end: yup.string().required("Choose an end time."),
  minutes: yup.number().oneOf([15, 20, 30, 60], "Choose 15, 20, 30, or 60 minutes.").required(),
})

type Schedule = { start_time: string; end_time: string; slot_minutes: number }

const timeOptions = Array.from({ length: 288 }, (_, index) => {
  const hours = Math.floor(index / 12)
  const minutes = (index % 12) * 5
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  const period = hours < 12 ? "AM" : "PM"
  const displayHour = hours % 12 || 12
  return { value, label: `${String(displayHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}` }
})

function ScheduleTimePicker({ id, name, label, defaultValue, invalid, describedBy, disabled, onValueChange }: { id: string; name: "start_time" | "end_time"; label: string; defaultValue: string; invalid: boolean; describedBy?: string; disabled: boolean; onValueChange: () => void }) {
  const value = defaultValue.slice(0, 5)
  const options = timeOptions.some((option) => option.value === value) ? timeOptions : [{ value, label: value }, ...timeOptions]

  return <>
    <label htmlFor={id} className="sr-only">{label}</label>
    <Select name={name} defaultValue={value} items={options} disabled={disabled} onValueChange={onValueChange}>
      <SelectTrigger id={id} aria-invalid={invalid} aria-describedby={describedBy} className="h-10 min-w-[7.35rem] rounded-xl border-slate-200 bg-white px-3 text-sm shadow-sm transition-colors hover:border-teal-300 focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-teal-100">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="max-h-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
        {options.map((option) => <SelectItem key={option.value} value={option.value} className="rounded-lg px-3 py-2 text-slate-700 data-[highlighted]:bg-teal-50 data-[highlighted]:text-[#0F766E] data-[selected]:bg-teal-50 data-[selected]:font-semibold data-[selected]:text-[#0F766E]">{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </>
}

export function ScheduleForm({ action, doctorId, day, index, schedule }: { action: (data: FormData) => Promise<{ error?: string; success?: true }>; doctorId: string; day: string; index: number; schedule?: Schedule }) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const formData = new FormData(event.currentTarget)
    if (submitter?.name) formData.set(submitter.name, submitter.value)
    else formData.set("enabled", "true")
    if (submitter?.value !== "false") {
      try {
        schema.validateSync({ start: formData.get("start_time"), end: formData.get("end_time"), minutes: Number(formData.get("slot_minutes")) }, { abortEarly: false })
        if (String(formData.get("end_time")) <= String(formData.get("start_time"))) throw new yup.ValidationError("End time must be later than start time.", "", "end")
      } catch (error) {
        if (error instanceof yup.ValidationError) setErrors(Object.fromEntries((error.inner.length ? error.inner : [error]).map((issue) => [issue.path ?? "end", issue.message])))
        return
      }
    }
    setErrors({})
    startTransition(async () => {
      const result = await action(formData)
      if (result.error) { setErrors({ form: result.error }); toast.error(result.error); return }
      toast.success(submitter?.value === "false" ? `${day} hours turned off.` : `${day} hours saved.`)
      router.refresh()
    })
  }

  function clear(key: string) {
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  return (
    <form onSubmit={submit} className="grid items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(8rem,1fr)_auto_auto_auto_auto]">
      <input type="hidden" name="doctor_id" value={doctorId} />
      <input type="hidden" name="day_of_week" value={index} />
      <div>
        <p className="text-sm font-semibold text-slate-900">{day}</p>
        <p className={`mt-1 text-xs font-medium ${schedule ? "text-[#0F766E]" : "text-slate-500"}`}>{schedule ? "Available" : "Not available"}</p>
      </div>
      <div>
        <ScheduleTimePicker id={`start-time-${index}`} name="start_time" label={`Start time for ${day}`} defaultValue={schedule?.start_time ?? "09:00"} invalid={Boolean(errors.start)} describedBy={errors.start ? `start-${index}` : undefined} disabled={pending} onValueChange={() => clear("start")} />
        {errors.start ? <p id={`start-${index}`} className="mt-1 text-xs text-red-600">{errors.start}</p> : null}
      </div>
      <div>
        <ScheduleTimePicker id={`end-time-${index}`} name="end_time" label={`End time for ${day}`} defaultValue={schedule?.end_time ?? "13:00"} invalid={Boolean(errors.end)} describedBy={errors.end ? `end-${index}` : undefined} disabled={pending} onValueChange={() => clear("end")} />
        {errors.end ? <p id={`end-${index}`} className="mt-1 text-xs text-red-600">{errors.end}</p> : null}
      </div>
      <div>
        <label htmlFor={`slot-minutes-${index}`} className="sr-only">Appointment slot duration for {day}</label>
        <Select name="slot_minutes" defaultValue={String(schedule?.slot_minutes ?? 30)} items={[{ value: "15", label: "15 min" }, { value: "20", label: "20 min" }, { value: "30", label: "30 min" }, { value: "60", label: "60 min" }]} disabled={pending} onValueChange={() => clear("minutes")}>
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
        {schedule ? <button type="submit" name="enabled" value="false" formNoValidate disabled={pending} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Turn off</button> : null}
        <button type="submit" name="enabled" value="true" disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59] disabled:opacity-60">{pending ? <Loader2 className="size-4 animate-spin" /> : null}{schedule ? "Saved" : "Save hours"}</button>
      </div>
      {errors.form ? <p role="alert" className="text-sm text-red-700 sm:col-span-5">{errors.form}</p> : null}
    </form>
  )
}
