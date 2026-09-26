import type { ReactNode } from "react"
import Link from "next/link"
import { CalendarCheck2, Clock3, HeartPulse, ShieldCheck } from "lucide-react"

type AuthShellProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

const benefits = [
  {
    icon: Clock3,
    title: "Book in under a minute",
    description: "Find the right doctor and choose a live available time.",
  },
  {
    icon: ShieldCheck,
    title: "Your information stays private",
    description: "Secure access keeps your health appointments personal.",
  },
  {
    icon: CalendarCheck2,
    title: "Everything in one place",
    description: "Review, manage, and follow every appointment with ease.",
  },
]

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.10),transparent_30%)]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8">
        <section className="hidden overflow-hidden py-8 lg:flex">
          <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground shadow-2xl shadow-teal-950/15">
            <div className="absolute -right-28 -top-28 size-80 rounded-full border border-white/15" />
            <div className="absolute -right-10 top-10 size-44 rounded-full border border-white/15" />
            <div className="absolute bottom-14 left-10 size-20 rounded-full bg-white/5" />

            <Link
              href="/"
              className="relative flex w-fit items-center gap-3 text-lg font-semibold tracking-tight"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-white text-primary shadow-lg shadow-teal-950/20">
                <HeartPulse className="size-5" aria-hidden="true" />
              </span>
              MediBook
            </Link>

            <div className="relative max-w-xl space-y-8 py-10">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-100">
                  Care made simple
                </p>
                <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
                  Better care starts with an easier appointment.
                </h2>
                <p className="max-w-lg text-base leading-7 text-teal-50/80">
                  MediBook brings trusted doctors, clear availability, and your
                  appointments together in one calm experience.
                </p>
              </div>

              <div className="grid gap-4">
                {benefits.map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
                  <div
                    key={itemTitle}
                    className="flex gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-semibold">{itemTitle}</p>
                      <p className="mt-1 text-sm leading-6 text-teal-50/75">
                        {itemDescription}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="relative text-sm text-teal-50/65">
              Thoughtful scheduling for patients and clinics.
            </p>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:min-h-0 lg:px-6">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-10 flex w-fit items-center gap-2 text-lg font-semibold tracking-tight lg:hidden"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <HeartPulse className="size-5" aria-hidden="true" />
              </span>
              MediBook
            </Link>

            <div className="rounded-3xl border bg-card p-6 shadow-xl shadow-slate-900/5 sm:p-8">
              <div className="mb-8 space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                  {eyebrow}
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-card-foreground">
                  {title}
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>

              {children}

              {footer ? (
                <div className="mt-7 border-t pt-6 text-center text-sm text-muted-foreground">
                  {footer}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
