import Link from "next/link"
import { notFound } from "next/navigation"

import { updateDoctor } from "@/app/admin/actions"
import { createClient } from "@/lib/supabase/server"

const field = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0F766E]"

export default async function EditDoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: doctor }, { data: specialties }] = await Promise.all([supabase.from("doctors").select("id, full_name, specialty_id, fee, bio").eq("id", id).maybeSingle(), supabase.from("specialties").select("id, name").order("name")])
  if (!doctor) notFound()
  return <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8"><Link href="/admin/doctors" className="text-sm font-semibold text-[#0F766E] hover:underline">← Doctors</Link><h1 className="mt-6 text-3xl font-semibold tracking-tight">Edit {doctor.full_name}</h1><form action={updateDoctor} className="mt-8 grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><input type="hidden" name="id" value={doctor.id} /><label className="grid gap-2 text-sm font-medium">Full name<input name="full_name" defaultValue={doctor.full_name} required className={field} /></label><label className="grid gap-2 text-sm font-medium">Specialty<select name="specialty_id" defaultValue={doctor.specialty_id ?? ""} className={field}><option value="">No specialty</option>{specialties?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Consultation fee (Rs.)<input name="fee" type="number" min="0" defaultValue={doctor.fee} required className={field} /></label><label className="grid gap-2 text-sm font-medium">Bio<textarea name="bio" defaultValue={doctor.bio ?? ""} className="min-h-28 rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#0F766E]" /></label><button className="h-10 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59]">Save doctor</button></form></main>
}
