"use client"

export default function ProfileError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[50vh] place-items-center bg-[#F8FAFC] px-5 py-12">
      <section className="max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Profile unavailable</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">We couldn&apos;t load your profile.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Please try again. If the problem continues, return later.</p>
        <button type="button" onClick={reset} className="mt-6 h-11 rounded-xl bg-[#0F766E] px-5 text-sm font-semibold text-white transition hover:bg-[#0D5F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">Try again</button>
      </section>
    </main>
  )
}
