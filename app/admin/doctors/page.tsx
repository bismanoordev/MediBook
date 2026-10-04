import Link from "next/link"

import { createDoctor, toggleDoctor } from "@/app/admin/actions"
import { DoctorForm } from "@/components/admin/doctor-form"
import { createClient } from "@/lib/supabase/server"

export default async function AdminDoctorsPage() {
  const supabase = await createClient()
  const [{ data: doctors, error }, { data: specialties }] = await Promise.all([
    supabase.from("doctors").select("id,full_name,fee,is_active,specialties(name)").order("full_name"),
    supabase.from("specialties").select("id,name").order("name"),
  ])

  return <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#0F766E]">Directory management</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Doctors</h1><p className="mt-2 text-slate-600">Add clinicians, manage schedules, and control patient visibility.</p></div><Link href="/admin/doctors/applications" className="rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0D5F59]">Review applications</Link></div>
    <DoctorForm action={createDoctor} specialties={specialties ?? []} compact />
    {error ? <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load doctors. Please refresh and try again.</p> : doctors?.length ? <div className="mt-6 grid gap-3">{doctors.map((doctor) => { const specialty = doctor.specialties as unknown as { name: string } | null; return <article key={doctor.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><h2 className="font-semibold">{doctor.full_name}</h2><p className="mt-1 text-sm text-slate-500">{specialty?.name ?? "No specialty"} · Rs. {Number(doctor.fee).toLocaleString()}</p></div><div className="flex gap-3"><Link href={`/admin/doctors/${doctor.id}/edit`} className="text-sm font-semibold text-[#0F766E] hover:underline">Edit</Link><Link href={`/admin/doctors/${doctor.id}/schedule`} className="text-sm font-semibold text-[#0F766E] hover:underline">Manage schedule</Link><form action={toggleDoctor}><input type="hidden" name="id" value={doctor.id} /><input type="hidden" name="is_active" value={String(!doctor.is_active)} /><button className="text-sm font-semibold text-slate-600 hover:text-[#0F766E]">{doctor.is_active ? "Hide doctor" : "Make visible"}</button></form></div></article> })}</div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No doctors have been added yet.</div>}
  </main>
}
