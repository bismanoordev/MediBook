"use client"

export default function AppointmentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-4xl px-5 py-12 text-center sm:px-8"><section className="rounded-2xl border border-red-200 bg-white p-7 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[.16em] text-[#0F766E]">Appointment unavailable</p><h1 className="mt-3 text-2xl font-semibold text-slate-900">We couldn&apos;t load this appointment.</h1><p className="mt-2 text-sm leading-6 text-slate-600">Please try again.</p><button type="button" onClick={reset} className="mt-6 min-h-11 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white hover:bg-[#0D5F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">Try again</button></section></main>
}
