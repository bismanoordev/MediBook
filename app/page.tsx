import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  HeartPulse,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const carePoints = [
  "See genuine available times",
  "Book in under one minute",
  "Manage every visit in one place",
]

const benefits = [
  { icon: Clock3, title: "Your time, respected", text: "Book appointments when it suits you, without waiting on a call." },
  { icon: CalendarCheck2, title: "Availability you can trust", text: "Every available slot is checked before you can book it." },
  { icon: ShieldCheck, title: "Care with privacy", text: "Your profile and appointment history remain securely yours." },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-950">
      <section className="px-3 py-3 sm:px-6 sm:py-6">
        <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[2rem] bg-[#E5F2F7] px-5 pb-0 pt-5 sm:px-9 sm:pt-7 lg:min-h-[650px] lg:px-12">
          <div aria-hidden="true" className="absolute -left-20 top-12 size-64 rounded-full bg-white/45 blur-3xl" />
          <div aria-hidden="true" className="absolute right-0 top-0 h-full w-[45%] opacity-50 [background-image:radial-gradient(#0F766E_1px,transparent_1px)] [background-size:22px_22px]" />
          <div aria-hidden="true" className="absolute -right-24 bottom-24 size-72 rounded-full border-[28px] border-[#0F766E]/10" />

          <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
              <span className="grid size-9 place-items-center rounded-xl bg-[#0F766E] text-white shadow-sm"><HeartPulse className="size-5" /></span>
              MediBook
            </Link>
            <nav className="hidden items-center gap-6 text-xs font-semibold text-slate-700 lg:flex">
              <Link href="/doctors" className="hover:text-[#0F766E]">Doctors</Link>
              <a href="#why-medibook" className="hover:text-[#0F766E]">Why MediBook</a>
              <a href="#how-it-works" className="hover:text-[#0F766E]">How it works</a>
            </nav>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl")}>Log in</Link>
              <Link href="/signup" className={cn(buttonVariants(), "rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]")}>Get started</Link>
            </div>
          </header>

          <div className="relative z-10 mx-auto grid max-w-7xl gap-3 pt-14 lg:grid-cols-[.92fr_1.08fr] lg:pt-20">
            <div className="pb-14 lg:pb-24">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-[#0F766E] shadow-sm ring-1 ring-white"><Sparkles className="size-3.5" />Simple, reliable clinic care</p>
              <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-6xl xl:text-7xl">Care that fits your <span className="text-[#0F766E]">life.</span></h1>
              <p className="mt-6 max-w-md text-base leading-7 text-slate-600">Choose a doctor, see live appointment times, and organise your visits with a calmer, clearer experience.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/doctors" className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-xl bg-[#0F766E] px-5 hover:bg-[#0D5F59]")}>Book an appointment <ArrowRight className="size-4" /></Link>
                <Link href="/doctors" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 rounded-xl border-white bg-white/70 px-5 hover:bg-white")}>Browse doctors</Link>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-700">{carePoints.map((point) => <span key={point} className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-[#0F766E]" />{point}</span>)}</div>
            </div>

            <div className="relative min-h-[360px] sm:min-h-[470px] lg:min-h-[540px]">
              <div className="absolute bottom-0 left-1/2 h-[92%] w-[min(31rem,90%)] -translate-x-1/2 overflow-hidden rounded-t-[9rem] bg-[#C9E7EB]" />
              <Image src="/images/medibook-hero-doctor.png" alt="A MediBook clinic doctor" fill priority className="object-cover object-[62%_31%] [clip-path:inset(0_4%_0_4%_round_9rem_9rem_0_0)]" sizes="(max-width: 1024px) 100vw, 55vw" />
              <div className="absolute bottom-7 left-2 right-2 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-xl backdrop-blur-sm sm:bottom-9 sm:left-8 sm:right-auto sm:w-72"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]"><CalendarCheck2 className="size-5" /></span><div><p className="text-xs text-slate-500">Next available time</p><p className="text-sm font-semibold">Today at 10:30 AM</p></div></div></div>
              <div className="absolute right-1 top-8 hidden rounded-2xl bg-[#0F766E] px-4 py-3 text-white shadow-xl sm:block"><p className="text-xs text-teal-100">Live schedule</p><p className="mt-0.5 text-sm font-semibold">Slots updated</p></div>
            </div>
          </div>
          <div className="relative z-20 -mx-5 flex min-h-12 items-center overflow-hidden bg-[#0F766E] px-5 text-sm font-semibold text-white sm:-mx-9 sm:px-9 lg:-mx-12 lg:px-12"><div className="flex min-w-max items-center gap-6 sm:gap-9"><span>Thoughtful care</span><span className="text-teal-200">✦</span><span>Trusted doctors</span><span className="text-teal-200">✦</span><span>Live availability</span><span className="text-teal-200">✦</span><span>Private by design</span></div></div>
        </div>
      </section>

      <section id="why-medibook" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1fr] lg:items-center lg:gap-20 lg:py-28">
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] bg-[#DDF3F3]"><Image src="/images/medibook-hero-doctor.png" alt="" width={1024} height={1536} className="aspect-[.82] object-cover object-[55%_30%]" /><div className="absolute inset-x-5 bottom-5 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur"><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#0F766E]">Care, simplified</p><p className="mt-1 text-sm font-medium text-slate-800">Everything you need before your visit.</p></div></div>
        <div><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#0F766E]">Designed around your day</p><h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-.04em] sm:text-4xl">A more reassuring way to stay on top of your health.</h2><p className="mt-5 max-w-xl leading-7 text-slate-600">MediBook brings appointment discovery, availability, and visit management into one welcoming place—so looking after yourself feels a little easier.</p><div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2"><div className="border-r-0 border-slate-200 sm:border-r"><p className="text-4xl font-semibold tracking-[-.05em] text-[#0F766E]">7 days</p><p className="mt-2 text-sm text-slate-600">of forward availability</p></div><div><p className="text-4xl font-semibold tracking-[-.05em] text-[#0F766E]">1 place</p><p className="mt-2 text-sm text-slate-600">to manage your appointments</p></div></div><Link href="/doctors" className={cn(buttonVariants({ variant: "outline" }), "mt-8 h-11 rounded-xl")}>Find your doctor <ArrowRight className="size-4" /></Link></div>
      </section>

      <section id="how-it-works" className="bg-white py-20"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="max-w-xl"><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#0F766E]">How it works</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Three simple steps to your next visit.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3">{benefits.map(({ icon: Icon, title, text }, index) => <article key={title} className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6"><span className="text-sm font-bold text-slate-300">0{index + 1}</span><span className="mt-6 grid size-11 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]"><Icon className="size-5" /></span><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 leading-6 text-slate-600">{text}</p></article>)}</div></div></section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#0F766E]">Ready when you are</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Find care that works with your schedule.</h2></div><Link href="/doctors" className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-xl bg-[#0F766E] px-5 hover:bg-[#0D5F59]")}>Explore doctors <ArrowRight className="size-4" /></Link></section>
    </main>
  )
}
