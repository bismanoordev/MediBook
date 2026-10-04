import type { LucideIcon } from "lucide-react"

export function DoctorPagePlaceholder({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"><section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><span className="grid size-12 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]"><Icon className="size-6" aria-hidden="true" /></span><p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Doctor workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{description}</p><div className="mt-7 rounded-xl border border-dashed border-teal-200 bg-teal-50/60 p-4 text-sm text-slate-700">This area is ready for its next doctor-portal step.</div></section></main>
}
