import { CalendarDays, HeartPulse, ShieldCheck, Sparkles } from "lucide-react"

const loadingDetails = [
  { icon: ShieldCheck, label: "Secure access" },
  { icon: CalendarDays, label: "Live schedules" },
  { icon: Sparkles, label: "Simple booking" },
]

export function MediBookLoadingScreen() {
  return (
    <main role="status" aria-live="polite" aria-busy="true" className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#073F3A] text-white">
      <div aria-hidden="true" className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at center, transparent 21px, rgba(153,246,228,0.18) 22px, transparent 23px)", backgroundSize: "54px 54px" }} />
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300/15 blur-[110px] sm:size-[46rem]" />
      <div aria-hidden="true" className="absolute -left-28 -top-28 size-72 rounded-full border border-teal-100/10" />
      <div aria-hidden="true" className="absolute -bottom-40 -right-32 size-96 rounded-full border border-teal-100/10" />

      <header className="relative flex items-center justify-center px-6 py-5 sm:justify-start sm:px-10 sm:py-7">
        <div className="flex items-center gap-3 text-base font-semibold tracking-tight"><span className="grid size-10 place-items-center rounded-2xl bg-white text-[#0F766E] shadow-lg shadow-black/10"><HeartPulse className="size-5" aria-hidden="true" /></span>MediBook</div>
      </header>

      <section className="relative flex flex-1 items-center justify-center px-5 pb-10 pt-0 sm:px-8 sm:pb-16 sm:pt-6">
        <div className="w-full max-w-xl text-center">
          <div className="relative mx-auto grid size-40 place-items-center sm:size-52">
            <span aria-hidden="true" className="absolute inset-0 rounded-full border border-teal-100/15" />
            <span aria-hidden="true" className="absolute inset-4 rounded-full border border-dashed border-teal-100/30 motion-safe:animate-[spin_12s_linear_infinite]" />
            <span aria-hidden="true" className="absolute inset-9 rounded-full bg-teal-200/10 motion-safe:animate-pulse" />
            <span aria-hidden="true" className="absolute left-2 top-1/2 size-3 -translate-y-1/2 rounded-full bg-teal-200 shadow-[0_0_22px_rgba(153,246,228,0.85)] motion-safe:animate-pulse" />
            <span aria-hidden="true" className="absolute right-8 top-5 grid size-9 place-items-center rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm motion-safe:animate-bounce"><CalendarDays className="size-4 text-teal-100" /></span>
            <span className="relative grid size-24 place-items-center rounded-[1.75rem] border border-white/70 bg-white text-[#0F766E] shadow-[0_24px_60px_-18px_rgba(0,0,0,0.45)] sm:size-28"><HeartPulse className="size-11 sm:size-12" aria-hidden="true" /><span aria-hidden="true" className="absolute -right-1 -top-1 size-4 rounded-full border-[3px] border-white bg-emerald-400 motion-safe:animate-pulse" /></span>
          </div>

          <div className="mt-5 sm:mt-7">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-teal-100/15 bg-white/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-100 backdrop-blur-sm"><Sparkles className="size-3.5" aria-hidden="true" />Getting things ready</p>
            <h1 className="mx-auto mt-5 max-w-md text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">Your care is coming into focus.</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-teal-50/70 sm:text-base">We&apos;re preparing a calm, secure appointment experience for you.</p>
          </div>

          <div className="mx-auto mt-8 max-w-sm"><div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-black/20 ring-1 ring-white/10"><span className="block h-full w-2/5 rounded-full bg-gradient-to-r from-teal-200 via-white to-teal-200 motion-safe:animate-[medibook-loading-progress_3.4s_ease-in-out_infinite]" /></div><p className="mt-3 text-xs font-medium text-teal-50/55">This will only take a moment</p></div>

          <div className="mx-auto mt-8 grid max-w-lg grid-cols-3 gap-2 sm:mt-10 sm:gap-3">
            {loadingDetails.map(({ icon: Icon, label }) => <div key={label} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-2 py-3 text-[11px] font-medium text-teal-50/70 backdrop-blur-sm sm:flex-row sm:text-xs"><Icon className="size-4 shrink-0 text-teal-200" aria-hidden="true" />{label}</div>)}
          </div>
          <span className="sr-only">Loading MediBook, please wait.</span>
        </div>
      </section>
    </main>
  )
}
