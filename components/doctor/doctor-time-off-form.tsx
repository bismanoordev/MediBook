"use client"

import { Loader2, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { addDoctorTimeOff, removeDoctorTimeOff } from "@/app/doctor/actions"

type TimeOff = { id: number; start_date: string; end_date: string }

export function DoctorTimeOffForm({ timeOff }: { timeOff: TimeOff[] }) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  function addDaysOff() {
    setError("")
    if (!startDate || !endDate) { setError("Choose the first and last day you will be away."); return }
    startTransition(async () => {
      const result = await addDoctorTimeOff({ startDate, endDate })
      if (result.error) { setError(result.error); return }
      toast.success("Days off saved.")
      setStartDate("")
      setEndDate("")
    })
  }

  function removeDaysOff(id: number) {
    setError("")
    startTransition(async () => {
      const result = await removeDoctorTimeOff(id)
      if (result.error) { setError(result.error); return }
      toast.success("Days off removed.")
    })
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div><p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Days off</p><h2 className="mt-2 text-xl font-semibold text-slate-900">Block time away</h2><p className="mt-1 text-sm leading-6 text-slate-600">Choose a first and last day, up to 90 days. Patients will see that you are away.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><label className="grid gap-1 text-sm font-medium">First day<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" /></label><label className="grid gap-1 text-sm font-medium">Last day<input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100" /></label><button type="button" disabled={pending} onClick={addDaysOff} className="mt-6 h-10 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59] disabled:opacity-60">{pending ? <Loader2 className="animate-spin" /> : "Add days off"}</button></div>{error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}<div className="mt-6 border-t border-slate-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Your upcoming time off</h3>{timeOff.length ? <ul className="mt-3 grid gap-2">{timeOff.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"><span>{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date(`${item.start_date}T12:00:00`))} — {new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date(`${item.end_date}T12:00:00`))}</span><button type="button" disabled={pending} onClick={() => removeDaysOff(item.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"><Trash2 className="size-4" />Remove</button></li>)}</ul> : <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No days off are scheduled.</p>}</div></section>
}
