import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarCheck2, CheckCircle2, Clock3, HeartPulse, Search, ShieldCheck, Stethoscope } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const benefits = [
  { icon: Clock3, title: "Book in under a minute", text: "Choose a doctor, pick a free time, and you are done." },
  { icon: CalendarCheck2, title: "Live availability", text: "Only genuine, currently available slots are shown." },
  { icon: ShieldCheck, title: "Private and secure", text: "Your profile and appointments stay visible only to you." },
]

const steps = [
  { number: "01", icon: Search, title: "Find the right care", text: "Browse qualified doctors and filter by specialty." },
  { number: "02", icon: CalendarCheck2, title: "Choose a live slot", text: "See real availability for the next seven days." },
  { number: "03", icon: CheckCircle2, title: "Book with confidence", text: "Receive a clear appointment request and manage it anytime." },
]

export default function Home() {
  return <main className="min-h-screen overflow-hidden bg-[#F8FAFC] text-slate-950">
    <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:py-6">
      <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-[#0F766E] text-white shadow-sm"><HeartPulse className="size-5" /></span>MediBook</Link>
      <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex"><Link href="/doctors" className="hover:text-[#0F766E]">Find a doctor</Link><a href="#how-it-works" className="hover:text-[#0F766E]">How it works</a><Link href="/appointments" className="hover:text-[#0F766E]">My appointments</Link></nav>
      <div className="flex items-center gap-1.5 sm:gap-2"><Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl")}>Log in</Link><Link href="/signup" className={cn(buttonVariants(), "rounded-xl bg-[#0F766E] hover:bg-[#0D5F59]")}>Create account</Link></div>
    </header>

    <section className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:gap-12 lg:pb-24 lg:pt-12">
      <div className="relative z-10"><p className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3.5 py-2 text-sm font-semibold text-[#0F766E]"><span className="size-2 rounded-full bg-[#0F766E]" />Care that works around you</p><h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-[.98] tracking-[-.055em] text-slate-950 sm:text-6xl lg:text-7xl">Healthcare made <span className="text-[#0F766E]">simpler.</span></h1><p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Find trusted doctors, see real appointment times, and book your next visit without calling or waiting.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/doctors" className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-xl bg-[#0F766E] px-5 hover:bg-[#0D5F59]")}>Find a doctor <ArrowRight className="size-4" /></Link><Link href="#how-it-works" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 rounded-xl px-5")}>See how it works</Link></div><div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600"><span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-[#0F766E]" />Live appointment slots</span><span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-[#0F766E]" />No double bookings</span></div></div>
      <div className="relative mx-auto w-full max-w-[35rem] lg:max-w-none"><div className="absolute inset-x-8 inset-y-6 rounded-[2rem] bg-[#CCFBF1]" /><div className="relative h-[31rem] overflow-hidden rounded-[2rem] bg-slate-200 shadow-[0_30px_70px_-32px_rgba(15,118,110,.55)] sm:h-[36rem]"><Image src="/images/medibook-hero-doctor.png" alt="A MediBook clinic doctor" fill priority className="object-cover object-[60%_center]" sizes="(max-width: 1024px) 100vw, 50vw" /><div className="absolute inset-0 bg-gradient-to-t from-[#073f3a]/40 via-transparent to-transparent" /><div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/40 bg-white/90 p-4 shadow-lg backdrop-blur-sm sm:left-7 sm:right-auto sm:w-72"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]"><CalendarCheck2 className="size-5" /></span><div><p className="text-xs font-medium text-slate-500">Appointments made easy</p><p className="text-sm font-semibold text-slate-900">Your time matters here.</p></div></div></div></div><div className="absolute -left-2 top-10 hidden rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl sm:block"><p className="text-xs font-semibold text-[#0F766E]">Available today</p><p className="mt-1 text-sm font-semibold">10:30 AM</p></div></div>
    </section>

    <section className="border-y border-teal-900/10 bg-[#0F766E] text-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-7 gap-y-2 px-5 py-4 text-sm font-semibold tracking-wide sm:px-8"><span>Thoughtful</span><span className="text-teal-200">•</span><span>Trusted</span><span className="text-teal-200">•</span><span>Simple</span><span className="text-teal-200">•</span><span>Patient-first</span><span className="text-teal-200">•</span><span>Secure</span></div></section>
    <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"><div className="max-w-xl"><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#0F766E]">A calmer way to book</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">From search to appointment in three clear steps.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3">{steps.map(({ number, icon: Icon, title, text }) => <article key={number} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="absolute right-6 top-5 text-sm font-semibold text-slate-300">{number}</span><span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-[#0F766E]"><Icon className="size-5" /></span><h3 className="mt-6 text-lg font-semibold">{title}</h3><p className="mt-2 leading-6 text-slate-600">{text}</p></article>)}</div></section>
    <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 sm:px-8 md:grid-cols-3">{benefits.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6"><Icon className="size-6 text-[#0F766E]" /><h2 className="mt-5 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</section>
    <section className="mx-5 mb-5 rounded-[2rem] bg-[#073F3A] px-6 py-14 text-center text-white sm:mx-8 sm:px-10 lg:mx-auto lg:mb-8 lg:max-w-7xl"><Stethoscope className="mx-auto size-7 text-teal-200" /><h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Your next appointment is only a few clicks away.</h2><p className="mx-auto mt-4 max-w-xl leading-7 text-teal-50/75">Start with a doctor you trust and a time that fits your day.</p><Link href="/doctors" className={cn(buttonVariants({ size: "lg" }), "mt-7 h-12 rounded-xl bg-white px-5 text-[#0F766E] hover:bg-teal-50")}>Browse doctors <ArrowRight className="size-4" /></Link></section>
  </main>
}
