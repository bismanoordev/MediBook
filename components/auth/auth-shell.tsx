import type { ReactNode } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  HeartPulse,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

type AuthShellProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
  showBackHome?: boolean
  hideHeader?: boolean
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  showBackHome = false,
  hideHeader = false,
}: AuthShellProps) {
  return (
    <main className="min-h-[100dvh] bg-[#F8FAFC] lg:grid lg:grid-cols-[minmax(34rem,1.12fr)_minmax(0,0.88fr)]">
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-white px-5 py-10 sm:px-10 lg:order-2 lg:px-12 xl:px-20">
        <div
          aria-hidden="true"
          className="absolute -left-24 -top-24 size-64 rounded-full bg-teal-100/60 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-28 -right-24 size-72 rounded-full bg-sky-100/55 blur-3xl"
        />

        <div className="relative w-full max-w-md">
          <Link
            href="/"
            className="mb-10 flex w-fit items-center gap-2.5 text-lg font-semibold tracking-tight text-slate-950"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-[#0F766E] text-white shadow-sm">
              <HeartPulse className="size-5" aria-hidden="true" />
            </span>
            MediBook
          </Link>

          {showBackHome ? (
            <Link
              href="/"
              className="mb-7 inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-medium text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to home
            </Link>
          ) : null}

          {!hideHeader ? (
            <div className="mb-8 space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0F766E]">
                {eyebrow}
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                {title}
              </h1>
              <p className="max-w-sm text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>
          ) : null}

          {children}

          {footer ? (
            <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
              {footer}
            </div>
          ) : null}
        </div>
      </section>

      <section
        aria-hidden="true"
        className="relative hidden min-h-[100dvh] overflow-hidden bg-[#073F3A] px-12 py-10 text-white lg:order-1 lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-12"
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, transparent 28px, rgba(153,246,228,0.14) 29px, transparent 30px)",
            backgroundSize: "70px 70px",
          }}
        />
        <div className="absolute -right-32 -top-32 size-96 rounded-full border border-white/10" />
        <div className="absolute -right-16 -top-16 size-64 rounded-full border border-white/10" />
        <div className="absolute -bottom-44 -left-36 size-[30rem] rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex items-center justify-between text-sm text-teal-50/70">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 backdrop-blur-sm">
            <ShieldCheck className="size-4 text-teal-200" />
            Private and secure
          </span>
          <span>Clinic care, simplified</span>
        </div>

        <div className="relative mx-auto w-full max-w-2xl py-10">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">
            <Sparkles className="size-4" />
            One calm workspace
          </p>
          <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-5xl">
            Appointments and clinic work, beautifully in sync.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-teal-50/70">
            Live schedules, secure patient access, and a clearer day for everyone at the clinic.
          </p>

          <div className="relative mt-10 rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-2 shadow-[0_32px_80px_-28px_rgba(0,0,0,0.55)] backdrop-blur-sm">
            <div className="rounded-[1.3rem] bg-white p-6 text-slate-950 xl:p-7">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0F766E]">
                  Your next visit
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Confirmed
                </span>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#CCFBF1] text-lg font-semibold text-[#0F766E]">
                  AK
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">Dr. Ayesha Khan</h3>
                  <p className="mt-1 text-sm text-slate-500">General physician</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 border-y border-slate-100 py-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-slate-50 text-[#0F766E]">
                    <CalendarDays className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="mt-0.5 text-sm font-semibold">Thursday</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-slate-50 text-[#0F766E]">
                    <Clock3 className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-500">Time</p>
                    <p className="mt-0.5 text-sm font-semibold">10:30 AM</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#F0FDFA] px-4 py-3 text-sm text-[#115E59]">
                <MapPin className="size-4 shrink-0" />
                <p>Everything you need for a smoother clinic visit.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-sm text-teal-50/55">
          Thoughtful scheduling for patients and clinics.
        </p>
      </section>
    </main>
  )
}
