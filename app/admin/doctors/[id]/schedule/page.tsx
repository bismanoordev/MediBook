import Link from "next/link"
import { notFound } from "next/navigation"

import { saveSchedule } from "@/app/admin/actions"
import { createClient } from "@/lib/supabase/server"

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const field = "h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#0F766E]"

export default async function DoctorSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: doctor }, { data: schedules }] = await Promise.all([supabase.from("doctors").select("id, full_name").eq("id", id).maybeSingle(), supabase.from("doctor_schedules").select("day_of_week, start_time, end_time, slot_minutes").eq("doctor_id", id)])
  if (!doctor) notFound()
  return <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8"><Link href="/admin/doctors" className="text-sm font-semibold text-[#0F766E] hover:underline">← Doctors</Link><p className="mt-6 text-sm font-semibold uppercase tracking-[.18em] text-[#0F766E]">Working hours</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">{doctor.full_name}</h1><p className="mt-2 text-slate-600">Turn each day on or off, then save its booking hours.</p><div className="mt-8 grid gap-3">{days.map((day, index) => { const schedule = schedules?.find((item) => item.day_of_week === index); return <form key={day} action={saveSchedule} className="grid items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto_auto_auto]"><input type="hidden" name="doctor_id" value={id} /><input type="hidden" name="day_of_week" value={index} /><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="enabled" value="true" defaultChecked={Boolean(schedule)} className="size-4 accent-[#0F766E]" />{day}</label><input name="start_time" type="time" defaultValue={schedule?.start_time.slice(0, 5) ?? "09:00"} className={field} /><input name="end_time" type="time" defaultValue={schedule?.end_time.slice(0, 5) ?? "13:00"} className={field} /><select name="slot_minutes" defaultValue={schedule?.slot_minutes ?? 30} className={field}><option value="15">15 min</option><option value="20">20 min</option><option value="30">30 min</option><option value="60">60 min</option></select><button className="h-10 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59]">Save</button></form> })}</div></main>
}
