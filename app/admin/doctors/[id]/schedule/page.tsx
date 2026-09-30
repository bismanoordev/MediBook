import Link from "next/link"
import { notFound } from "next/navigation"
import { saveSchedule } from "@/app/admin/actions"
import { ScheduleForm } from "@/components/admin/schedule-form"
import { createClient } from "@/lib/supabase/server"
const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
export default async function DoctorSchedulePage({params}:{params:Promise<{id:string}>}){const{id}=await params;const supabase=await createClient();const[{data:doctor},{data:schedules}]=await Promise.all([supabase.from("doctors").select("id,full_name").eq("id",id).maybeSingle(),supabase.from("doctor_schedules").select("day_of_week,start_time,end_time,slot_minutes").eq("doctor_id",id)]);if(!doctor)notFound();return <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8"><Link href="/admin/doctors" className="text-sm font-semibold text-[#0F766E] hover:underline">← Doctors</Link><p className="mt-6 text-sm font-semibold uppercase tracking-[.18em] text-[#0F766E]">Working hours</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">{doctor.full_name}</h1><p className="mt-2 text-slate-600">Turn each day on or off, then save its booking hours.</p><div className="mt-8 grid gap-3">{days.map((day,index)=><ScheduleForm key={day} action={saveSchedule} doctorId={id} day={day} index={index} schedule={schedules?.find(s=>s.day_of_week===index)}/>)}</div></main>}
