"use client"

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8"><section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-700">Something went wrong</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">We couldn&apos;t open your doctor workspace</h1><p className="mt-3 text-sm leading-6 text-slate-600">Please try again. If the problem continues, refresh the page or contact the clinic.</p><button type="button" onClick={retry} className="mt-6 rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0D5F59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2">Try again</button></section></main>
}
