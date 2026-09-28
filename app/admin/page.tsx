import Link from "next/link"
import { CalendarDays, Clock3, Stethoscope, Users } from "lucide-react"

import { createClient } from "@/lib/supabase/server"

export default async function AdminPage() {
  const supabase = await createClient()
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date())
  const [todayResult, pendingResult, patientsResult, doctorsResult, recentResult] = await Promise.all([
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("appointment_date", today),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "patient"),
    supabase.from("doctors").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("appointments").select("id, status, doctors(full_name), profiles(full_name)").order("created_at", { ascending: false }).limit(5),
  ])
  const cards = [
    { label: "Today’s appointments", value: todayResult.count ?? 0, icon: CalendarDays, href: "/admin/appointments" },
    { label: "Awaiting review", value: pendingResult.count ?? 0, icon: Clock3, href: "/admin/appointments" },
    { label: "Patients", value: patientsResult.count ?? 0, icon: Users, href: "/admin/patients" },
    { label: "Active doctors", value: doctorsResult.count ?? 0, icon: Stethoscope, href: "/admin/doctors" },
  ]

  return <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Admin area</p>
    <h1 className="mt-3 text-4xl font-semibold tracking-tight">Clinic dashboard</h1>
    <p className="mt-3 text-slate-600">Keep today&apos;s clinic work clear, timely, and organised.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon, href }) => <Link href={href} key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"><Icon className="size-5 text-[#0F766E]" /><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-semibold">{value}</p></Link>)}</div>
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Recent bookings</h2><p className="mt-1 text-sm text-slate-500">New requests appear here and in the notification bell.</p></div><Link href="/admin/appointments" className="text-sm font-semibold text-[#0F766E] hover:underline">View all</Link></div>{recentResult.data?.length ? <div className="mt-5 divide-y divide-slate-100">{recentResult.data.map((appointment) => { const doctor = appointment.doctors as unknown as { full_name: string } | null; const patient = appointment.profiles as unknown as { full_name: string } | null; return <div key={appointment.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span><strong>{patient?.full_name ?? "Patient"}</strong> booked {doctor?.full_name ?? "a doctor"}</span><span className="capitalize text-slate-500">{appointment.status}</span></div> })}</div> : <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No bookings yet.</p>}</section>
  </main>
}
