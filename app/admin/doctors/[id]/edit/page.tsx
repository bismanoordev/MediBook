import Link from "next/link"
import { notFound } from "next/navigation"
import { updateDoctor } from "@/app/admin/actions"
import { DoctorForm } from "@/components/admin/doctor-form"
import { createClient } from "@/lib/supabase/server"
export default async function EditDoctorPage({params}:{params:Promise<{id:string}>}) { const {id}=await params; const supabase=await createClient(); const [{data:doctor},{data:specialties}]=await Promise.all([supabase.from("doctors").select("id, full_name, specialty_id, fee, bio").eq("id",id).maybeSingle(),supabase.from("specialties").select("id,name").order("name")]); if(!doctor)notFound(); return <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8"><Link href="/admin/doctors" className="text-sm font-semibold text-[#0F766E] hover:underline">← Doctors</Link><h1 className="mt-6 text-3xl font-semibold tracking-tight">Edit {doctor.full_name}</h1><DoctorForm action={updateDoctor} doctor={doctor} specialties={specialties??[]}/></main> }
