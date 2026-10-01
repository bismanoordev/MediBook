import { HeartPulse, Hospital, Stethoscope, Syringe } from "lucide-react"

import { createClient } from "@/lib/supabase/server"

const icons = [Syringe, HeartPulse, Hospital, Stethoscope]
const descriptions = [
  "Find preventive care and guidance for every stage of life.",
  "Book a clear next step with a clinician who listens.",
  "Browse care options and choose a time that suits you.",
  "Connect with experienced specialists for focused support.",
]

export function SpecialtyCardsLoading() {
  return <section className="bg-[#0F9E96] py-16 text-white sm:py-20"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="text-center"><p className="text-sm font-bold uppercase tracking-[.16em] text-teal-100">Your next visit, simplified</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Easily book your doctor</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-teal-50/80">Loading available specialties…</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-2xl border border-white/15 bg-white/10" />)}</div></div></section>
}

export async function SpecialtyCards() {
  const supabase = await createClient()
  const { data: specialties, error } = await supabase.from("specialties").select("id, name").order("name")

  return <section className="bg-[#0F9E96] py-16 text-white sm:py-20"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="text-center"><p className="text-sm font-bold uppercase tracking-[.16em] text-teal-100">Your next visit, simplified</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Easily book your doctor</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-teal-50/80">Choose the type of care you need, then select a time that works for you.</p></div>{error ? <p className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/20 bg-white/10 p-4 text-center text-sm text-teal-50">Specialties couldn’t load right now. Please refresh and try again.</p> : specialties?.length ? <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{specialties.map((specialty, index) => { const Icon = icons[index % icons.length]; return <article key={specialty.id} className="cursor-pointer rounded-2xl border border-white/15 bg-white/10 p-5 transition hover:-translate-y-1 hover:bg-white/20"><span className="grid size-11 place-items-center rounded-full bg-white text-[#0F9E96]"><Icon className="size-5" /></span><h3 className="mt-5 text-lg font-semibold">{specialty.name}</h3><p className="mt-2 text-sm leading-6 text-teal-50/80">{descriptions[index % descriptions.length]}</p></article> })}</div> : <p className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/20 bg-white/10 p-4 text-center text-sm text-teal-50">Specialties will appear here as soon as the clinic adds them.</p>}</div></section>
}
