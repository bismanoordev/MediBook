import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BadgeCheck } from "lucide-react"

import { DoctorCard, type DoctorCardData } from "@/components/doctor-card"

type Props = { doctors: DoctorCardData[]; error: boolean }

export function HomeDoctorHero({ doctors, error }: Props) {
  return (
    <div className="relative min-h-[380px] overflow-visible sm:min-h-[500px] lg:min-h-[570px]">
      <div aria-hidden className="absolute inset-0 rounded-t-[9rem] bg-[#10B8AD]" />
      <Image
        src="/images/landing-hero-doctor.png"
        alt="A MediBook doctor ready to help patients"
        fill
        className="rounded-t-[9rem] object-cover object-[80%_center]"
        sizes="(max-width: 1024px) 100vw, 55vw"
        priority
      />
      <div className="motion-float absolute left-0 top-8 z-10 hidden w-44 rounded-2xl bg-white p-3 shadow-xl sm:-left-6 sm:block">
        <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#0F766E]">Meet your doctor</p>
        {doctors.length ? (
          <div className="mt-2 space-y-2">
            {doctors.slice(0, 3).map((item) => <div className="flex items-center gap-2" key={item.id}><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#CCFBF1] text-[10px] font-bold text-[#0F766E]">+</span><span className="truncate text-[10px] font-medium text-slate-800">{item.full_name}</span></div>)}
          </div>
        ) : <p className="mt-2 text-[10px] leading-4 text-slate-600">Compassionate care, made simple.</p>}
        <Link href="/doctors" className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#0F766E]">Find a doctor <ArrowRight className="size-3" /></Link>
      </div>
      <div className="motion-float motion-float-later absolute bottom-10 right-0 z-10 hidden rounded-2xl bg-white p-3 shadow-xl sm:-right-12 sm:block"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]"><BadgeCheck className="size-4" /></span><div><p className="text-xs font-bold text-slate-900">Care you can trust</p><p className="text-[10px] text-slate-500">Verified clinicians</p></div></div></div>
      {error ? <p className="sr-only">The doctor directory could not be loaded.</p> : null}
    </div>
  )
}

export function HomeDoctorCards({ doctors, error }: Props) {
  return <section id="team" className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-[#0F766E]">Meet the people behind the care</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">A team ready to listen.</h2></div><Link href="/doctors" className="inline-flex items-center gap-1 text-sm font-bold text-[#0F766E]">View all doctors <ArrowRight className="size-4" /></Link></div>{error ? <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t load doctors right now. Please refresh and try again.</p> : doctors.length ? <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{doctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Doctors will appear here as soon as the clinic adds them.</div>}</section>
}
