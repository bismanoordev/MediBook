import Link from "next/link"

export default function AppointmentNotFound() {
  return <main className="mx-auto max-w-4xl px-5 py-12 text-center sm:px-8"><section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Appointment unavailable</p><h1 className="mt-3 text-2xl font-semibold text-slate-900">We couldn&apos;t find that appointment.</h1><p className="mt-2 text-sm leading-6 text-slate-600">It may not belong to your account or may no longer be available.</p><Link href="/doctor/appointments" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">Back to appointments</Link></section></main>
}
