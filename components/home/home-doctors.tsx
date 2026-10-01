import Link from "next/link"
import { ArrowRight, HeartPulse } from "lucide-react"

import { DoctorCard, type DoctorCardData } from "@/components/doctor-card"
import { DoctorPhoto } from "@/components/doctor-photo"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = { doctors: DoctorCardData[]; error: boolean }

export function HomeDoctorHero({ doctors, error }: Props) {
  const doctor = doctors[0]
  if (error) return <div className="relative grid min-h-[380px] place-items-center rounded-t-[8rem] bg-teal-100 p-8 text-center sm:min-h-[500px]"><div><HeartPulse className="mx-auto size-12 text-[#0F766E]" /><p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">We couldn’t load the doctor directory right now. Please refresh and try again.</p></div></div>
  if (!doctor) return <div className="relative grid min-h-[380px] place-items-center rounded-t-[8rem] bg-teal-100 p-8 text-center sm:min-h-[500px]"><div><HeartPulse className="mx-auto size-12 text-[#0F766E]" /><p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">Our doctor directory will be available soon.</p></div></div>

  const specialty = doctor.specialties?.name ?? "Clinic doctor"
  return <div className="relative min-h-[380px] overflow-hidden rounded-t-[8rem] bg-[#10B8AD] sm:min-h-[500px] lg:min-h-[570px]"><div aria-hidden className="absolute inset-x-[8%] bottom-0 top-0 rounded-t-[9rem] bg-white/20" /><div aria-hidden className="absolute -right-20 top-16 size-72 rounded-full border-[30px] border-white/15" /><DoctorPhoto fullName={doctor.full_name} photoUrl={doctor.photo_url} className="absolute inset-x-[8%] bottom-0 top-0 size-auto rounded-t-[9rem] text-4xl text-white shadow-[0_24px_60px_rgba(15,118,110,.18)]" sizes="(max-width: 1024px) 100vw, 55vw" priority /><div className="absolute left-0 top-10 hidden w-48 rounded-2xl bg-white p-4 shadow-xl sm:block"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#0F766E]">Meet your doctor</p><p className="mt-3 text-sm font-semibold text-slate-900">{doctor.full_name}</p><p className="mt-1 text-xs text-slate-500">{specialty}</p><Link href={`/doctors/${doctor.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#0F766E]">View profile <ArrowRight className="size-3" /></Link></div><div className="absolute inset-x-[8%] bottom-0 rounded-t-[3rem] bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent p-7 pt-28 text-white sm:p-10"><p className="text-sm font-semibold text-teal-100">{specialty}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{doctor.full_name}</p><Link href={`/doctors/${doctor.id}`} className={cn(buttonVariants({ variant: "secondary" }), "mt-4 rounded-xl bg-white text-[#0F766E] hover:bg-teal-50")}>View availability <ArrowRight className="size-4" /></Link></div></div>
}

export function HomeDoctorCards({ doctors, error }: Props) {
  return <section id="team" className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-[#0F766E]">Meet the people behind the care</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">A team ready to listen.</h2></div><Link href="/doctors" className="inline-flex items-center gap-1 text-sm font-bold text-[#0F766E]">View all doctors <ArrowRight className="size-4" /></Link></div>{error ? <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">We couldn’t load doctors right now. Please refresh and try again.</p> : doctors.length ? <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{doctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Doctors will appear here as soon as the clinic adds them.</div>}</section>
}
