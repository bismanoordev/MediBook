import Link from "next/link"
import { ArrowRight, CalendarCheck2, Clock3, ShieldCheck } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const benefits = [
  { icon: Clock3, title: "Book in under a minute", text: "Choose a doctor, pick a free time, and you are done." },
  { icon: CalendarCheck2, title: "Live availability", text: "Only genuine, currently available appointment slots are shown." },
  { icon: ShieldCheck, title: "Private and secure", text: "Your profile and appointments remain visible only to you." },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-[#0F766E] text-white">M</span>
          MediBook
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "rounded-full")}>Log in</Link>
          <Link href="/signup" className={cn(buttonVariants(), "rounded-full bg-[#0F766E] hover:bg-[#115E59]")}>Create account</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pt-20">
        <div>
          <p className="mb-5 inline-flex rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-[#0F766E] ring-1 ring-teal-100">
            Healthcare, without the hold music
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            The right doctor, at the right time.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Find trusted clinic doctors and book an appointment from live availability—without calling or waiting.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/doctors" className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full bg-[#0F766E] px-6 hover:bg-[#115E59]")}>
              Find a doctor <ArrowRight className="size-4" />
            </Link>
            <Link href="/appointments" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 rounded-full px-6")}>
              My appointments
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-[#0B3B38] p-5 text-white shadow-2xl shadow-teal-950/20 sm:p-8">
          <div className="absolute -right-20 -top-20 size-60 rounded-full bg-teal-300/20 blur-3xl" />
          <p className="text-sm font-medium text-teal-100">Your next visit</p>
          <div className="relative mt-5 rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-teal-50 text-lg font-bold text-[#0F766E]">AK</div>
              <div>
                <p className="font-semibold">Dr. Ayesha Khan</p>
                <p className="text-sm text-slate-500">General Physician</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-4"><span className="block text-slate-500">Date</span><strong>Monday, 28 Sep</strong></div>
              <div className="rounded-2xl bg-slate-50 p-4"><span className="block text-slate-500">Time</span><strong>10:30 AM</strong></div>
            </div>
            <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">Slot available — ready to book</div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-16 sm:px-8 md:grid-cols-3">
        {benefits.map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Icon className="size-6 text-[#0F766E]" aria-hidden="true" />
            <h2 className="mt-5 font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
