import Link from "next/link"

import { DoctorPhoto } from "@/components/doctor-photo"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type DoctorCardData = {
  id: string
  full_name: string
  bio: string | null
  fee: number
  photo_url: string | null
  specialties: { name: string } | null
}

export function DoctorCard({ doctor, sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" }: { doctor: DoctorCardData; sizes?: string }) {
  const specialty = doctor.specialties?.name ?? "Clinic doctor"
  return <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-900/10"><div className="relative aspect-[4/3] overflow-hidden bg-teal-50"><DoctorPhoto fullName={doctor.full_name} photoUrl={doctor.photo_url} className="size-full rounded-none text-lg" sizes={sizes} /><div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/20 to-transparent" /></div><div className="flex flex-1 flex-col p-5"><p className="text-sm font-semibold text-[#0F766E]">{specialty}</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{doctor.full_name}</h2><p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{doctor.bio ?? "Professional care tailored to your needs."}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="text-sm font-semibold text-slate-700">Rs. {Number(doctor.fee).toLocaleString()}</span><Link href={`/doctors/${doctor.id}`} className={cn(buttonVariants(), "shrink-0 rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]")}>View availability</Link></div></div></article>
}
