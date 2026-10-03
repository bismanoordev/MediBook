import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowRight, MessageCircleHeart, Search, ShieldCheck } from "lucide-react"

import { LandingHeader } from "@/components/home/landing-header"
import { SiteFooter } from "@/components/site-footer"
import { SpecialtyCards, SpecialtyCardsLoading } from "@/components/home/specialty-cards"
import { HomeDoctorCards, HomeDoctorHero } from "@/components/home/home-doctors"
import { buttonVariants } from "@/components/ui/button"
import { LandingPageEffects } from "@/components/home/landing-page-effects"
import { ServicesShowcase } from "@/components/home/services-showcase"
import { createClient } from "@/lib/supabase/server"
import { getAuthState } from "@/lib/auth"
import { cn } from "@/lib/utils"

const testimonials = [
  { name: "Maya R.", initials: "MR", text: "Booking my follow-up took less than a minute. It felt calm, clear, and genuinely easy." },
  { name: "Daniel K.", initials: "DK", text: "I could see the available times right away and choose a doctor I felt good about." },
]

export default async function Home() {
  const { user, profile } = await getAuthState()
  const supabase = await createClient()
  const { data: doctors, error: doctorsError } = await supabase
    .from("doctors")
    .select("id, full_name, bio, fee, photo_url, specialties(name)")
    .eq("is_active", true)
    .order("full_name")
    .limit(3)
  const homeDoctors = (doctors ?? []).map((doctor) => ({ ...doctor, specialties: doctor.specialties as unknown as { name: string } | null }))

  return (
    <main data-landing-page className="overflow-x-clip bg-white text-slate-950">
      <section className="relative bg-[#E7F7F5]">
        <div aria-hidden className="absolute -left-28 top-28 size-80 rounded-full bg-[#B8EEE8]/70 blur-3xl" />
        <div aria-hidden className="absolute right-[8%] top-24 size-64 rounded-full border-[32px] border-white/40" />
        <LandingHeader userId={user?.id} name={profile?.full_name} email={user?.email} role={profile?.role} />
        <div className="relative z-[1] mx-auto grid max-w-7xl gap-8 px-5 pb-14 pt-10 sm:px-8 [&>div:first-child]:text-center [&>div:first-child>h1]:mx-auto [&>div:first-child>p]:mx-auto [&>div:first-child>div]:justify-center lg:grid-cols-[.88fr_1.12fr] lg:items-center lg:pb-0 lg:pt-14 lg:[&>div:first-child]:text-left lg:[&>div:first-child>h1]:mx-0 lg:[&>div:first-child>p]:mx-0 lg:[&>div:first-child>div]:justify-start">
          <div className="pb-2 lg:pb-20"><p className="text-sm font-bold uppercase tracking-[.16em] text-[#0F766E]">Healthcare made simple</p><h1 className="mt-4 max-w-xl text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-6xl">Exceptional care,<br /><span className="text-[#0F9E96]">every time.</span></h1><p className="mt-6 max-w-md text-base leading-7 text-slate-600">Discover trusted doctors, view live availability, and book your next appointment from one reassuring place.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/doctors" className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-xl bg-[#0F766E] px-5 hover:bg-[#0D5F59]")}>Book an appointment <ArrowRight className="size-4" /></Link><Link href="/doctors" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 rounded-xl border-teal-900/10 bg-white px-5 hover:bg-white")}><Search className="size-4" /> Find a doctor</Link></div><div className="mt-9 flex items-center gap-3"><div className="flex -space-x-2">{["A", "J", "L", "S"].map((person, index) => <span key={person} className={cn("grid size-8 place-items-center rounded-full border-2 border-[#E7F7F5] text-[10px] font-bold text-white", ["bg-teal-600", "bg-sky-500", "bg-amber-500", "bg-rose-500"][index])}>{person}</span>)}</div><p className="text-sm text-slate-600"><strong className="text-slate-950">12k+</strong> people book with confidence</p></div></div>
          <HomeDoctorHero doctors={homeDoctors} error={Boolean(doctorsError)} />
        </div>
      </section>
      <Suspense fallback={<SpecialtyCardsLoading />}><SpecialtyCards /></Suspense>
      <ServicesShowcase />
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28"><div className="relative overflow-hidden rounded-3xl bg-[#0F9E96] px-7 py-10 text-white sm:px-12 sm:py-12"><div aria-hidden className="absolute -right-20 -top-20 size-72 rounded-full border-[32px] border-white/10" /><div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-teal-100">Care from anywhere</p><h2 className="mt-3 max-w-md text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Talk to a doctor from the comfort of home.</h2><p className="mt-4 max-w-md text-sm leading-6 text-teal-50/85">Book an in-person visit or start with a consultation that works around your schedule.</p><Link href="/doctors" className={cn(buttonVariants({ variant: "secondary" }), "mt-7 rounded-xl bg-white text-[#0F766E] hover:bg-teal-50")}>Find a doctor</Link></div><div className="hidden md:grid size-28 place-items-center rounded-full border border-white/20 bg-white/10"><MessageCircleHeart className="size-12 text-teal-50" /></div></div></div></section>
      <section id="about" className="bg-[#F0FAF9] py-20"><div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 md:grid-cols-[.85fr_1.15fr] md:items-center"><div className="relative mx-auto h-80 w-full max-w-sm overflow-hidden rounded-3xl bg-[#CDEDEA]"><Image src="/images/care-team.png" alt="A trusted healthcare team reviewing a care plan" fill className="object-cover object-[58%_18%]" sizes="(max-width: 768px) 100vw, 35vw" /></div><div><p className="text-sm font-bold uppercase tracking-[.16em] text-[#0F766E]">Your health, on your terms</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Simple scheduling. More peace of mind.</h2><p className="mt-5 max-w-xl leading-7 text-slate-600">MediBook makes it easier to plan care without phone queues or uncertain availability. Your appointments, doctors, and next steps stay in one secure place.</p><ul className="mt-6 space-y-3">{["Live availability you can count on", "Trusted clinicians and clear appointment details", "Private, secure care management"].map((item) => <li className="flex items-center gap-3 text-sm font-medium text-slate-700" key={item}><ShieldCheck className="size-5 text-[#0F766E]" />{item}</li>)}</ul></div></div></section>
      <section className="bg-[#087D78] py-20 text-white"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="text-center"><p className="text-sm font-bold uppercase tracking-[.16em] text-teal-100">Stories from MediBook</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">What patients are saying</h2></div><div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">{testimonials.map((item) => <article className="rounded-2xl bg-white p-6 text-slate-900 shadow-lg" key={item.name}><span className="text-4xl font-serif leading-none text-[#0F9E96]">“</span><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p><div className="mt-5 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[#CCFBF1] text-xs font-bold text-[#0F766E]">{item.initials}</span><div><p className="text-sm font-bold">{item.name}</p><p className="text-xs text-slate-500">MediBook patient</p></div></div></article>)}</div></div></section>
      <HomeDoctorCards doctors={homeDoctors} error={Boolean(doctorsError)} />
      <SiteFooter authenticated={Boolean(user)} />
      <LandingPageEffects />
    </main>
  )
}
